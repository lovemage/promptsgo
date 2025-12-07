<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1if0pIJACXCIkRFXfbX--GbQ-zFSp9Yrt

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Supabase & Google OAuth Configuration

To enable Google Login, you need to configure your Google Cloud Platform (GCP) project and Supabase.

### 1. Google Cloud Console (GCP)

Go to **APIs & Services > Credentials** and create/edit your OAuth 2.0 Client ID.

*   **Authorized JavaScript Origins** (Sources):
    *   `http://localhost:3000` (for local development)
    *   `https://promptsgo-mu.vercel.app` (your production domain)
    *   `https://gkeednjfvxscfnkdcfrh.supabase.co` (your Supabase project domain)
    *   *Note: Do NOT include paths like `/auth/v1/callback` here. It must be domain only.*

*   **Authorized Redirect URIs**:
    *   `https://gkeednjfvxscfnkdcfrh.supabase.co/auth/v1/callback`
    *   *Note: This must match the Callback URL provided in your Supabase Dashboard.*

### 2. Supabase Dashboard

Go to **Authentication > Providers > Google**.

*   Enable Google.
*   Enter your **Client ID** and **Client Secret** from GCP.
*   **Redirect URL**: Copy this URL (e.g., `https://gkeednjfvxscfnkdcfrh.supabase.co/auth/v1/callback`) and paste it into the "Authorized Redirect URIs" in GCP.

### 3. Supabase URL Configuration

Go to **Authentication > URL Configuration**.

*   **Site URL**: Set to your production URL: `https://promptsgo-mu.vercel.app`
*   **Redirect URLs**: Add `http://localhost:3000` to the whitelist for local development.
