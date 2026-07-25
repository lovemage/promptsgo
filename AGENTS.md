# Repository Guidelines

## Project Structure & Module Organization

PromptsGo is a Vite-powered React and TypeScript application. `index.tsx` is the browser entry point, while `App.tsx` coordinates the main UI and application state. Reusable views and dialogs belong in `components/`; integrations and persistence logic belong in `services/`; shared helpers live in `utils/`. Keep cross-cutting types in `types.ts` and shared data or translations in `constants.ts`. Serverless handlers are under `api/`, maintenance utilities under `scripts/`, and static images, SEO files, and other browser-served assets under `public/`.

## Build, Test, and Development Commands

- `npm install` installs the locked dependencies from `package-lock.json`.
- `npm run dev` starts Vite on `http://localhost:3000`.
- `npm run build` regenerates the sitemap and creates the production bundle in `dist/`.
- `npm run preview` serves the production bundle for local verification.
- `npm run import:global:zhTW:dry` previews the Traditional Chinese prompt import without writing data.
- `node scripts/verify-seo.js` checks generated SEO resources.

No automated test command is currently configured. Before submitting changes, run `npm run build` and manually exercise affected flows in both desktop and mobile layouts.

## Coding Style & Naming Conventions

Follow the existing TypeScript/React style: semicolons, single quotes, and two-space indentation in new code. Use `PascalCase` for components and their files (`PromptModal.tsx`), `camelCase` for functions and variables, and descriptive `*Service.ts` names for integrations. Prefer typed props and shared interfaces over `any`. Use the `@/` alias for root-level imports when it improves readability. For selected or active UI states, use a restrained background fill, stronger text, or a thin underline; do not add left accent borders.

## Testing Guidelines

When adding a test framework, place tests beside the implementation as `*.test.ts` or `*.test.tsx`. Prioritize prompt CRUD, authentication callbacks, Supabase operations, localization, and responsive modal behavior. Until then, document manual verification steps in the pull request.

## Commit & Pull Request Guidelines

Recent history primarily follows Conventional Commits, such as `feat: add ...` and `fix: correct ...`. Keep commits focused and use an imperative, concise subject. Pull requests should explain the user-visible impact, list validation performed, link relevant issues, and include screenshots or recordings for UI changes. Call out migrations, new environment variables, or deployment considerations explicitly.

## Security & Configuration

Store local credentials in `.env.local`; never commit API keys or service-role credentials. Common settings include `GEMINI_API_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`. Treat `SUPABASE_SERVICE_ROLE_KEY` as server-only.
