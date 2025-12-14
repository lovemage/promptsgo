export const refinePromptWithAI = async (originalPrompt: string): Promise<string> => {
  try {
    const resp = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'refine', prompt: originalPrompt }),
    });

    if (!resp.ok) return originalPrompt;
    const data = await resp.json();
    return (typeof data?.refined === 'string' && data.refined.trim()) ? data.refined.trim() : originalPrompt;
  } catch (error) {
    console.error("Gemini refinement failed:", error);
    return originalPrompt;
  }
};

export const generateShareMetaWithAI = async (promptText: string, language?: string): Promise<{ title: string; description: string } | null> => {
  try {
    const resp = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'share_meta', prompt: promptText, language }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const title = typeof data?.title === 'string' ? data.title : '';
    const description = typeof data?.description === 'string' ? data.description : '';
    return { title, description };
  } catch (error) {
    console.error('Gemini share meta generation failed:', error);
    return null;
  }
};