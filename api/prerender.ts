import { createClient } from '@supabase/supabase-js';

// ── Types ──────────────────────────────────────────────────────────────────────

interface DbGlobalPrompt {
  id: string;
  title: string;
  description: string | null;
  positive: string;
  negative: string | null;
  tags: string[];
  model_tags: string[];
  image: string | null;
  views: number;
  rating: number;
  rating_count: number;
  author_name: string;
  created_at: string;
  updated_at: string;
}

interface PageMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  type: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const BASE_URL = 'https://promptsgo.cc';
const DEFAULT_IMAGE = `${BASE_URL}/ComfyUI_00048_.PNG`;
const SITE_NAME = 'PromptsGo';

// ── Supabase Client (lazy init) ────────────────────────────────────────────────

let _supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (_supabase) return _supabase;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _supabase = createClient(url, key);
  return _supabase;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildDescription(prompt: DbGlobalPrompt): string {
  const parts: string[] = [];
  if (prompt.description) {
    parts.push(prompt.description);
  }
  if (prompt.positive) {
    parts.push(prompt.positive);
  }
  const raw = parts.join(' — ');
  return truncate(raw.replace(/\s+/g, ' ').trim(), 160);
}

// ── Fetch Prompt by ID ─────────────────────────────────────────────────────────

async function fetchPrompt(id: string): Promise<DbGlobalPrompt | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('global_prompts')
    .select('id,title,description,positive,negative,tags,model_tags,image,views,rating,rating_count,author_name,created_at,updated_at')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as DbGlobalPrompt;
}

// ── Resolve Page Meta ──────────────────────────────────────────────────────────

async function resolvePageMeta(path: string): Promise<PageMeta> {
  // /prompt/:id
  const promptMatch = path.match(/^\/prompt\/([^/?#]+)/);
  if (promptMatch) {
    const prompt = await fetchPrompt(promptMatch[1]);
    if (prompt) {
      return {
        title: `${prompt.title} | ${SITE_NAME}`,
        description: buildDescription(prompt),
        url: `${BASE_URL}/prompt/${prompt.id}`,
        image: prompt.image || DEFAULT_IMAGE,
        type: 'article',
      };
    }
    // Prompt not found — fallback
    return {
      title: `Prompt Not Found | ${SITE_NAME}`,
      description: 'This prompt may have been removed or does not exist.',
      url: `${BASE_URL}${path}`,
      image: DEFAULT_IMAGE,
      type: 'website',
    };
  }

  // /global
  if (path === '/global' || path === '/global/') {
    return {
      title: `Global Prompts | ${SITE_NAME}`,
      description: 'Discover and explore community-shared AI prompts. Browse high-quality prompts for Stable Diffusion, Midjourney, ChatGPT, Claude, and more.',
      url: `${BASE_URL}/global`,
      image: DEFAULT_IMAGE,
      type: 'website',
    };
  }

  // Default / homepage
  return {
    title: `${SITE_NAME} | Share & Save your prompts Easily`,
    description: 'Discover, share, and save AI prompts with ease. Join the community of prompt creators and level up your AI interactions.',
    url: BASE_URL,
    image: DEFAULT_IMAGE,
    type: 'website',
  };
}

// ── Build HTML ─────────────────────────────────────────────────────────────────

function buildHtml(meta: PageMeta): string {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const u = escapeHtml(meta.url);
  const img = escapeHtml(meta.image);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${t}</title>

    <!-- SEO -->
    <meta name="description" content="${d}" />
    <meta name="keywords" content="AI prompts, prompt sharing, prompt engineering, AI tools, ChatGPT prompts, Claude prompts, Gemini prompts" />
    <meta name="author" content="${SITE_NAME}" />
    <link rel="canonical" href="${u}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${escapeHtml(meta.type)}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:url" content="${u}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${t}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${u}" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${img}" />

    <!-- Alternate languages -->
    <link rel="alternate" hreflang="en" href="${u}" />
    <link rel="alternate" hreflang="zh-Hant" href="${u}?lang=zh-TW" />
    <link rel="alternate" hreflang="x-default" href="${u}" />

    <link rel="icon" type="image/png" href="/gp-logo.png" />
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Segoe UI', system-ui, sans-serif;
        margin: 0;
        padding: 0;
      }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.5); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.7); }
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    </style>
    <link rel="sitemap" type="application/xml" href="/sitemap.xml">
    <script type="importmap">
{
  "imports": {
    "react/": "https://aistudiocdn.com/react@^19.2.1/",
    "react": "https://aistudiocdn.com/react@^19.2.1",
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.1/",
    "lucide-react": "https://aistudiocdn.com/lucide-react@^0.556.0",
    "@google/genai": "https://aistudiocdn.com/@google/genai@^1.31.0"
  }
}
</script>
    <link rel="stylesheet" href="/index.css">
    <link rel="stylesheet" href="/loader.css">
  </head>
  <body>
    <div id="root"></div>
    <noscript>
      <div style="padding:2rem;text-align:center;font-family:system-ui,sans-serif;">
        <h1>${t}</h1>
        <p>${d}</p>
        <p>This site requires JavaScript to function. Please enable JavaScript in your browser.</p>
        <a href="${u}">${u}</a>
      </div>
    </noscript>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>`;
}

// ── Handler ────────────────────────────────────────────────────────────────────

export default async function handler(req: any, res: any) {
  const path = typeof req.query?.path === 'string' ? req.query.path : '/';

  try {
    const meta = await resolvePageMeta(path);
    const html = buildHtml(meta);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(html);
  } catch (e: any) {
    // On error, return a basic fallback so crawlers still get something
    const fallbackMeta: PageMeta = {
      title: `${SITE_NAME} | Share & Save your prompts Easily`,
      description: 'Discover, share, and save AI prompts with ease.',
      url: `${BASE_URL}${path}`,
      image: DEFAULT_IMAGE,
      type: 'website',
    };
    const html = buildHtml(fallbackMeta);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  }
}
