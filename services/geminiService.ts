import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a new room design based on a style preset.
 * Uses gemini-2.5-flash-image
 */
export const generateRoomStyle = async (
  imageBase64: string,
  style: string
): Promise<string> => {
  try {
    // Remove header if present for processing
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

    const prompt = `Redesign this room in a ${style} interior design style. Keep the structural layout, windows, and perspective exactly the same. Replace furniture and decor to match the ${style} aesthetic. High quality, photorealistic, interior design photography.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Error generating style:", error);
    throw error;
  }
};

/**
 * Edits an image based on a specific user text prompt (Nano Banana feature).
 * Uses gemini-2.5-flash-image
 */
export const editRoomImage = async (
  imageBase64: string,
  userPrompt: string
): Promise<string> => {
  try {
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

    const prompt = `Edit this image. Instruction: ${userPrompt}. Maintain photorealism and perspective.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};

/**
 * Chat with the AI assistant.
 * Uses gemini-3-pro-preview
 */
export const sendChatMessage = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
      config: {
        systemInstruction: "You are an expert Interior Design Consultant. Help users refine their room designs, suggest furniture, color palettes, and provide shopping advice. Be concise, helpful, and enthusiastic.",
      }
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Sorry, I'm having trouble connecting right now.";
  }
};

// Helper to extract image data from response
const extractImageFromResponse = (response: GenerateContentResponse): string => {
  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/jpeg;base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error("No image generated.");
};
