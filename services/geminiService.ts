import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { MemoryPalace, AnchorType, AnchorValue, Scene, QuickRecapItem } from '../types';
import { secureSystemInstruction, buildUserPrompt, buildRegenerationUserPrompt } from '../prompts';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const textContentSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The title of the memory palace, in the format 'Memory Palace: <ANCHOR NAME>'." },
    imagePrompt: { 
      type: Type.STRING, 
      description: "A single, detailed prompt for an image generation model to create a photorealistic, first-person point-of-view image of the entire memory palace, as if viewed through a wide-angle lens. It should feel immersive and three-dimensional. It must describe the anchor, the logical route, core style features, and the visual mnemonic for each item, referencing the exact bolded words. If the user provided an image, the prompt should describe how to edit that image to include the mnemonics." 
    },
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          locus: { type: Type.STRING, description: "The specific location (locus) within the anchor." },
          description: { type: Type.STRING, description: "A 1-2 sentence explanation of the mnemonic scene, with the target words/phrases wrapped in double asterisks for bolding (e.g., **Item 1**)." }
        },
        required: ["locus", "description"]
      }
    },
    quickRecap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING, description: "The exact word/phrase to remember, wrapped in double asterisks." },
          locusHint: { type: Type.STRING, description: "A brief hint about the location of the item." }
        },
        required: ["item", "locusHint"]
      }
    }
  },
  required: ["title", "imagePrompt", "scenes", "quickRecap"]
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

const generateTextContent = async (anchorType: AnchorType, anchorValue: AnchorValue, list: string[]) => {
  const listToMemorize = list.map(item => `- ${item}`).join('\n');
  let anchorDetails: string;
  const modelParts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];

  if (anchorType === 'upload' && anchorValue instanceof File) {
    anchorDetails = "The user's provided photograph.";
    const base64Data = await fileToBase64(anchorValue);
    modelParts.push({
      inlineData: {
        mimeType: anchorValue.type,
        data: base64Data,
      },
    });
  } else {
    anchorDetails = anchorValue as string;
  }

  const userPrompt = buildUserPrompt(anchorType, anchorDetails, listToMemorize);

  modelParts.push({ text: userPrompt });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts: modelParts },
    config: {
      systemInstruction: secureSystemInstruction,
      responseMimeType: "application/json",
      responseSchema: textContentSchema,
    },
  });

  const jsonString = response.text.trim();
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse JSON response:", jsonString);
    throw new Error("The AI returned an invalid response. Please try again.");
  }
};

const generateImages = async (anchorType: AnchorType, anchorValue: AnchorValue, prompt: string): Promise<string[]> => {
  const generateOneImage = async (): Promise<string> => {
    const modelParts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];

    if (anchorType === 'upload' && anchorValue instanceof File) {
      const base64Data = await fileToBase64(anchorValue);
      modelParts.push({
        inlineData: {
          data: base64Data,
          mimeType: anchorValue.type,
        },
      });
      modelParts.push({ text: prompt });
    } else {
      modelParts.push({ text: `${prompt}. Style: photorealistic 3D render, first-person POV, wide-angle, immersive, high detail.` });
    }
  
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: modelParts,
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
      
    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (imagePart?.inlineData) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }
    
    const textResponse = response.candidates?.[0]?.content?.parts.find(part => part.text)?.text;
    console.error("Image generation failed. Model response:", textResponse);
    throw new Error("Failed to generate or edit the image. The model may have returned text instead.");
  };

  const imagePromises = Array(4).fill(0).map(() => generateOneImage());
  return Promise.all(imagePromises);
};

export const generateMemoryPalace = async (anchorType: AnchorType, anchorValue: AnchorValue, list: string[]): Promise<MemoryPalace> => {
  const textContent = await generateTextContent(anchorType, anchorValue, list);
  const imageUrls = await generateImages(anchorType, anchorValue, textContent.imagePrompt);

  return {
    ...textContent,
    imageGenerations: [imageUrls],
  };
};

const dataUrlToBase64 = (dataUrl: string): { mimeType: string, data: string } => {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  if (!mimeMatch || !mimeMatch[1] || !parts[1]) {
    throw new Error("Invalid data URL format");
  }
  const mimeType = mimeMatch[1];
  const data = parts[1];
  return { mimeType, data };
};

const editAndGenerateImages = async (baseImageUrl: string, prompt: string): Promise<string[]> => {
    const { mimeType, data: base64Data } = dataUrlToBase64(baseImageUrl);

    const editOneImage = async (): Promise<string> => {
        const modelParts = [
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            },
            { text: prompt },
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: modelParts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }
        
        const textResponse = response.candidates?.[0]?.content?.parts.find(part => part.text)?.text;
        console.error("Image editing failed. Model response:", textResponse);
        throw new Error("Failed to edit the image. The model may have returned text instead.");
    };

    const imagePromises = Array(4).fill(0).map(() => editOneImage());
    return Promise.all(imagePromises);
};

const regenerateTextContent = async (base64Image: { mimeType: string; data: string }, list: string[]): Promise<{title: string, imagePrompt: string, scenes: Scene[], quickRecap: QuickRecapItem[]}> => {
  const listToMemorize = list.map(item => `- ${item}`).join('\n');
  const modelParts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];
  
  modelParts.push({
    inlineData: {
      mimeType: base64Image.mimeType,
      data: base64Image.data,
    },
  });

  const userPrompt = buildRegenerationUserPrompt(listToMemorize);

  modelParts.push({ text: userPrompt });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts: modelParts },
    config: {
      systemInstruction: secureSystemInstruction,
      responseMimeType: "application/json",
      responseSchema: textContentSchema,
    },
  });

  const jsonString = response.text.trim();
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse JSON response for regeneration:", jsonString);
    throw new Error("The AI returned an invalid response during text regeneration. Please try again.");
  }
};

export const regeneratePalace = async (baseImageUrl: string, editPrompt: string, list: string[]): Promise<Partial<MemoryPalace>> => {
  const newImageUrls = await editAndGenerateImages(baseImageUrl, editPrompt);
  
  if (!newImageUrls || newImageUrls.length === 0) {
      throw new Error("Failed to generate new images during regeneration step.");
  }

  const referenceImageUrl = newImageUrls[0];
  const { mimeType, data } = dataUrlToBase64(referenceImageUrl);

  const newTextContent = await regenerateTextContent({ mimeType, data }, list);

  return {
    ...newTextContent,
    imageGenerations: [newImageUrls],
  };
};