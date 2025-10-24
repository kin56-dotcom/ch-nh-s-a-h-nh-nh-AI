import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Helper to generate a single image
const generateSingleImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string | null> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64ImageData, mimeType: mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            const newBase64Data = part.inlineData.data;
            const newMimeType = part.inlineData.mimeType;
            return `data:${newMimeType};base64,${newBase64Data}`;
        }
    }
    return null;
};

export const editImage = async (base64ImageData: string, mimeType: string, prompt: string, numberOfImages: number = 1): Promise<string[] | null> => {
  try {
    if (numberOfImages <= 1) {
      const result = await generateSingleImage(base64ImageData, mimeType, prompt);
      return result ? [result] : null;
    }

    const prompts = [
      prompt,
      `${prompt} Sử dụng chính xác cùng một người mẫu (nếu có) và cùng một bối cảnh. Tất cả các chi tiết nền, ánh sáng và môi trường phải giống hệt nhau. Chỉ thay đổi một chút tư thế của người mẫu hoặc góc của sản phẩm để tạo ra một kiểu dáng khác.`
    ];
    
    const imagePrompts = prompts.slice(0, numberOfImages);

    const promises = imagePrompts.map(p => generateSingleImage(base64ImageData, mimeType, p));
    const results = await Promise.all(promises);

    const successfulResults = results.filter((r): r is string => r !== null);

    if (successfulResults.length === 0) {
      throw new Error("Mô hình không trả về bất kỳ hình ảnh nào.");
    }

    return successfulResults;
  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error("Failed to generate image due to an unknown error.");
  }
};