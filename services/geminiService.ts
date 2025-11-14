
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from '../types';

export const processUserInput = async (userInput: string): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

  const systemInstruction = `
    You are an intelligent sales assistant for a small business. Your task is to process user input related to sales transactions.
    The current date is ${today}.

    You must respond in a valid JSON format only. Do not include any text, notes, or markdown formatting outside of the JSON object.
    Based on the user's message, determine the user's intent and respond with one of the following JSON structures:

    1. For a new sale entry:
        - Extract date, item name, quantity, and unit price.
        - The date can be relative (e.g., "today", "yesterday"). Convert it to 'YYYY-MM-DD' format.
        - If any information is missing or invalid (e.g., non-numeric quantity), respond with an 'error' type.
        - JSON structure:
          { "type": "sale_entry", "data": { "date": "YYYY-MM-DD", "itemName": "string", "quantity": number, "unitPrice": number } }

    2. For a request for a sales summary:
        - Identify if the user wants a 'daily' or 'monthly' summary.
        - JSON structure:
          { "type": "summary_request", "data": { "period": "daily" | "monthly" } }

    3. If the input is invalid or a sale entry is incomplete:
        - Provide a clear error message explaining what is wrong or missing.
        - JSON structure:
          { "type": "error", "data": { "text": "Your helpful error message." } }

    4. For any other greeting or general question:
        - Respond with a friendly, helpful message.
        - JSON structure:
          { "type": "message", "data": { "text": "Your helpful response." } }
  `;
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ['sale_entry', 'summary_request', 'error', 'message'] },
      data: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: "Date of sale in YYYY-MM-DD format." },
          itemName: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unitPrice: { type: Type.NUMBER },
          period: { type: Type.STRING, enum: ['daily', 'monthly'] },
          text: { type: Type.STRING },
        },
      },
    },
    required: ['type', 'data'],
  };

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userInput,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as GeminiResponse;
  } catch (e) {
    console.error("Gemini API call failed:", e);
    return {
      type: 'error',
      data: { text: "Sorry, I'm having trouble understanding. Could you please try rephrasing?" }
    };
  }
};
