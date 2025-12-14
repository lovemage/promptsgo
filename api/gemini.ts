type Task = 'refine' | 'share_meta';

const MODEL = 'gemini-2.5-flash';

const json = (res: any, status: number, body: any) => {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(body));
};

const extractText = (data: any): string | null => {
  const t = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof t === 'string' ? t : null;
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

  let instruction = '';
  if (safeTask === 'refine') {
    instruction = `You are an expert prompt engineer for generative AI (Stable Diffusion, Midjourney, LLMs).
Refine and improve the following prompt to be more descriptive, detailed, and effective.
Only return the improved prompt text. Do not add explanations.
Language for output: ${lang}.

Original prompt:
${safePrompt}`;
  } else {
    instruction = `You are helping a user publish a prompt to a community feed.
Based on the user's prompt below, generate a concise Title and a short Description.
Return ONLY valid JSON with exactly these keys: {"title": string, "description": string}.
Language for output: ${lang}.

User prompt:
${safePrompt}`;
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
          maxOutputTokens: safeTask === 'refine' ? 1024 : 256,
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
      return json(res, 500, { error: 'No text returned from Gemini' });
    }

    if (safeTask === 'refine') {
      return json(res, 200, { refined: text.trim() });
    }

    // share_meta
    const trimmed = text.trim();
    try {
      const parsed = JSON.parse(trimmed);
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
