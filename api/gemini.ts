type Task = 'refine' | 'share_meta';

const MODEL = 'gemini-2.5-flash';

const json = (res: any, status: number, body: any) => {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(body));
};

const extractText = (data: any): string | null => {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return null;
  const texts = parts
    .map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
    .filter((s: string) => s.trim());
  if (texts.length === 0) return null;
  return texts.join('');
};

const summarizeGeminiResponse = (data: any) => {
  const pf = data?.promptFeedback;
  const cand0 = data?.candidates?.[0];
  const safety = cand0?.safetyRatings;
  return {
    promptFeedback: pf,
    candidate0FinishReason: cand0?.finishReason,
    candidate0SafetyRatings: safety,
    candidatesCount: Array.isArray(data?.candidates) ? data.candidates.length : 0,
  };
};

const stripCodeFences = (s: string) => {
  // Remove ```json ... ``` or ``` ... ``` wrappers
  return s
    .replace(/^```[a-zA-Z]*\s*/m, '')
    .replace(/\s*```$/m, '')
    .trim();
};

const extractFirstJsonObject = (s: string): string | null => {
  // Balanced-brace scan to avoid grabbing an incomplete JSON object.
  const start = s.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let i = start; i < s.length; i++) {
    const ch = s[i];

    if (inString) {
      if (escaping) {
        escaping = false;
        continue;
      }
      if (ch === '\\') {
        escaping = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') depth++;
    if (ch === '}') depth--;

    if (depth === 0) {
      return s.slice(start, i + 1);
    }
  }

  return null;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json(res, 500, { error: 'Missing GEMINI_API_KEY' });
  }

  const { task, prompt, language } = (req.body || {}) as {
    task?: Task;
    prompt?: string;
    language?: string;
  };

  const safeTask: Task = task === 'share_meta' ? 'share_meta' : 'refine';
  const safePrompt = typeof prompt === 'string' ? prompt.trim() : '';

  if (!safePrompt) {
    return json(res, 400, { error: 'Missing prompt' });
  }

  const lang = typeof language === 'string' && language.trim() ? language.trim() : 'en';

  // Avoid sending extremely long prompts that can cause truncation or empty responses.
  const clippedPrompt = safePrompt.length > 4000 ? safePrompt.slice(0, 4000) : safePrompt;

  let instruction = '';
  if (safeTask === 'refine') {
    instruction = `You are an expert prompt engineer for generative AI (Stable Diffusion, Midjourney, LLMs).
Refine and improve the following prompt to be more descriptive, detailed, and effective.
Only return the improved prompt text. Do not add explanations.
Language for output: ${lang}.

Original prompt:
${clippedPrompt}`;
  } else {
    instruction = `Return ONLY valid JSON: {"title":"...","description":"..."}.
Rules:
- Language: ${lang}
- title: <= 60 chars
- description: <= 120 chars
- No markdown, no code fences, no extra keys.

Prompt:
${clippedPrompt}`;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: instruction }] }],
        generationConfig: {
          temperature: safeTask === 'refine' ? 0.6 : 0.4,
          maxOutputTokens: safeTask === 'refine' ? 1024 : 512,
          ...(safeTask === 'share_meta' ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      return json(res, 500, { error: 'Gemini request failed', details: errText.slice(0, 1000) });
    }

    const data = await resp.json();
    const text = extractText(data);
    if (!text) {
      return json(res, 500, {
        error: 'No text returned from Gemini',
        debug: summarizeGeminiResponse(data),
      });
    }

    if (safeTask === 'refine') {
      return json(res, 200, { refined: text.trim() });
    }

    // share_meta
    const trimmed = stripCodeFences(text.trim());
    try {
      const jsonCandidate = extractFirstJsonObject(trimmed) || trimmed;
      const parsed = JSON.parse(jsonCandidate);
      const title = typeof parsed?.title === 'string' ? parsed.title.trim() : '';
      const description = typeof parsed?.description === 'string' ? parsed.description.trim() : '';
      return json(res, 200, { title, description });
    } catch {
      // fallback: best-effort parsing
      return json(res, 200, { title: '', description: trimmed });
    }
  } catch (e: any) {
    return json(res, 500, { error: 'Unexpected error', details: String(e?.message || e) });
  }
}
