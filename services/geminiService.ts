import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const refinePromptWithAI = async (originalPrompt: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key is missing for Gemini");
    return originalPrompt + " (AI unavailable: No API Key)";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert prompt engineer for generative AI (Stable Diffusion, Midjourney, LLMs). 
      Refine and improve the following prompt to be more descriptive, detailed, and effective. 
      Only return the improved prompt text, no explanations.
      
      Original prompt: "${originalPrompt}"`,
    });
    
    return response.text?.trim() || originalPrompt;
  } catch (error) {
    console.error("Gemini refinement failed:", error);
    return originalPrompt;
  }
};