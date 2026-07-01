
import { GoogleGenAI } from "@google/genai";

export class AIService {
  private ai: GoogleGenAI;

  constructor() {
    // Fixed: Use process.env.API_KEY directly and ensure named parameter for initialization
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateProductDescription(productName: string): Promise<string> {
    try {
      // Fixed: Directly calling ai.models.generateContent with model and prompt as per guidelines
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a short, energetic, urban-style marketing description in Spanish for a sports product named: ${productName}. Keep it under 50 words.`
      });
      // Fixed: Accessing the .text property directly (not calling it as a function)
      return response.text || "Descripción generada automáticamente para este producto de élite.";
    } catch (error) {
      console.error("AI Description Error:", error);
      return "Producto de alta calidad diseñado para el máximo rendimiento deportivo.";
    }
  }
}

export const aiService = new AIService();
