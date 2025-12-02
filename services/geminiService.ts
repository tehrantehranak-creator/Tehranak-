

import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AppContext, Property, AIKeyConfig, AIModelType, AIStudio } from "../types";
import { getSystemSettings, updateSystemSetting } from "./dataService";

// Helper to check if a paid API key is selected via AI Studio's dialog
declare global {
    interface Window {
        aistudio: AIStudio;
    }
}

const TEXT_MODEL_FREE = 'gemini-2.5-flash';
const TEXT_MODEL_PAID = 'gemini-3-pro-preview'; // For advanced text tasks
const IMAGE_MODEL_FREE = 'gemini-2.5-flash-image';
const IMAGE_MODEL_PAID = 'gemini-3-pro-image-preview'; // For high-quality image tasks

const DEFAULT_TEXT_CONFIG: AIKeyConfig = { apiKey: '', model: TEXT_MODEL_FREE, isValid: false, error: null };
const DEFAULT_IMAGE_CONFIG: AIKeyConfig = { apiKey: '', model: IMAGE_MODEL_FREE, isValid: false, error: null };

// --- Internal Helper for AI Instance ---
const _createGenAIInstance = (apiKey: string) => {
    return new GoogleGenAI({ apiKey: apiKey.trim() });
};

// --- API Key Retrieval & Model Selection Logic ---
const _getAIConfig = async (modelType: AIModelType): Promise<AIKeyConfig> => {
    const settings = await getSystemSettings();
    let config: AIKeyConfig;

    if (modelType === AIModelType.TEXT_CHAT) {
        config = settings['gemini_text_config'] || DEFAULT_TEXT_CONFIG;
        if (!config.apiKey) return { ...config, error: 'کلید API متن تنظیم نشده است.' };
    } else { // IMAGE_GENERATION or VIRTUAL_STAGING
        config = settings['gemini_image_config'] || DEFAULT_IMAGE_CONFIG;
        if (!config.apiKey) return { ...config, error: 'کلید API تصویر تنظیم نشده است.' };
    }

    // Determine the actual model to use based on AI Studio key selection (for potentially higher-tier models)
    let hasPaidKeySelected = false;
    try {
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
            hasPaidKeySelected = await window.aistudio.hasSelectedApiKey();
        }
    } catch (e) {
        console.warn("Error checking AI Studio API key selection:", e);
        // Assume false if error
    }

    let selectedModel = config.model;
    if (modelType === AIModelType.TEXT_CHAT) {
        selectedModel = hasPaidKeySelected ? TEXT_MODEL_PAID : TEXT_MODEL_FREE;
    } else { // Image related
        selectedModel = hasPaidKeySelected ? IMAGE_MODEL_PAID : IMAGE_MODEL_FREE;
    }
    
    return { ...config, model: selectedModel };
};

// --- API Key Validation ---
export const validateApiKey = async (apiKey: string, modelType: AIModelType): Promise<{ isValid: boolean; model: string | null; error: string | null; }> => {
    if (!apiKey.trim()) {
        return { isValid: false, model: null, error: 'کلید API نمی‌تواند خالی باشد.' };
    }

    const ai = _createGenAIInstance(apiKey);
    let effectiveModel = '';

    // Determine the best model to test based on potential paid key status
    let hasPaidKeySelected = false;
    try {
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
            hasPaidKeySelected = await window.aistudio.hasSelectedApiKey();
        }
    } catch (e) {
        console.warn("Error checking AI Studio API key selection for validation:", e);
    }

    try {
        if (modelType === AIModelType.TEXT_CHAT) {
            effectiveModel = hasPaidKeySelected ? TEXT_MODEL_PAID : TEXT_MODEL_FREE;
            await ai.models.generateContent({ model: effectiveModel, contents: 'سلام' });
        } else { // IMAGE_GENERATION or VIRTUAL_STAGING
            effectiveModel = hasPaidKeySelected ? IMAGE_MODEL_PAID : IMAGE_MODEL_FREE;
            const imagePart = {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // 1x1 black pixel
                },
            };
            await ai.models.generateContent({ model: effectiveModel, contents: { parts: [imagePart, { text: 'test' }] } });
        }
        return { isValid: true, model: effectiveModel, error: null };
    } catch (error: any) {
        console.error("API Key validation error:", error);
        let errorMessage = 'خطای نامشخص در اتصال به هوش مصنوعی.';
        if (error.status === 403) {
            errorMessage = 'کلید API نامعتبر است یا دسترسی مسدود شده. (محدودیت دامنه/سیاست)';
        } else if (error.status === 429) {
            errorMessage = `محدودیت سهمیه (Quota) یا تعداد درخواست بیش از حد. لطفا ${error.details?.[0]?.retryDelay || 'چند دقیقه'} دیگر تلاش کنید.`;
        } else if (error.message.includes("API_KEY_INVALID")) {
            errorMessage = "کلید API معتبر نیست.";
        } else if (error.message.includes("Requested entity was not found.")) {
             errorMessage = "این مدل هوش مصنوعی با کلید API فعلی شما قابل دسترسی نیست. (احتمالا نیاز به کلید API پولی دارید)";
        }
        return { isValid: false, model: effectiveModel, error: errorMessage };
    }
};

// --- Generalized AI Call Executor ---
async function _executeAICall<T>(
    modelType: AIModelType,
    aiCall: (ai: GoogleGenAI, model: string) => Promise<T>,
): Promise<T> {
    const config = await _getAIConfig(modelType);

    if (!config.apiKey || !config.isValid) {
        throw new Error(config.error || `کلید API برای ${modelType === AIModelType.TEXT_CHAT ? 'متن' : 'تصویر'} تنظیم نشده یا نامعتبر است.`);
    }

    const ai = _createGenAIInstance(config.apiKey);
    return aiCall(ai, config.model);
}


export const searchPropertiesWithAI = async (query: string) => {
  try {
    return await _executeAICall(AIModelType.TEXT_CHAT, async (ai, model) => {
        const prompt = `
          Act as a real estate database assistant for 'Persian Estate AI'. The user is searching for properties with the following description: "${query}".
          Generate 3 realistic but fictional property listings in Persian (Farsi) that match this criteria.
          The 'price' should be in Tomans or Dollars as appropriate for the Iranian market context, formatted nicely.
          Keep descriptions concise.
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    price: { type: Type.STRING },
                    location: { type: Type.STRING },
                    features: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["id", "title", "price", "location", "features"]
                }
              },
            temperature: 0.7,
          },
        });

        const text = response.text;
        if (!text) return [];
        
        return JSON.parse(text);
    });
  } catch (error: any) {
    console.error("Gemini API Error (searchPropertiesWithAI):", error.message);
    alert(`خطا در جستجوی هوشمند: ${error.message}`);
    return [];
  }
};

export const generateDivarAdText = async (property: Property) => {
    try {
        return await _executeAICall(AIModelType.TEXT_CHAT, async (ai, model) => {
            const featuresList = [
                ...(property.features || []),
                ...(property.facilities || []),
                property.hasElevator ? 'آسانسور' : '',
                property.hasParking ? 'پارکینگ' : '',
                property.hasStorage ? 'انباری' : ''
            ].filter(Boolean).join('، ');

            const priceText = property.transactionType === 'sale' 
                ? `قیمت کل: ${property.priceTotal?.toLocaleString() || 'توافقی'}` 
                : `رهن: ${property.priceDeposit?.toLocaleString()} / اجاره: ${property.priceRent?.toLocaleString()}`;

            const prompt = `
                به عنوان یک کپی‌رایتر ارشد املاک با تخصص در روانشناسی فروش، یک متن آگهی دیوار فوق‌العاده حرفه‌ای و "میخکوب‌کننده" بنویس.
                
                **خروجی فقط متن نهایی** باشد (بدون توضیحات اضافه).
                از ایموجی‌های جذاب استفاده کن.
                
                اطلاعات ملک:
                عنوان: ${property.title}
                آدرس: ${property.address}
                قیمت: ${priceText}
                امکانات: ${featuresList}
                توضیحات: ${property.description}
            `;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model,
                contents: prompt,
                config: { temperature: 0.9 }
            });

            return response.text;
        });
    } catch (error: any) {
        console.error("Divar Ad Gen Error:", error.message);
        alert(`خطا در تولید متن آگهی: ${error.message}`);
        return "خطا در اتصال به هوش مصنوعی.";
    }
};

export const generateVirtualStaging = async (imageInput: string, stylePrompt: string): Promise<string | null> => {
    try {
        return await _executeAICall(AIModelType.VIRTUAL_STAGING, async (ai, model) => {
            let base64Data = '';
            let mimeType = 'image/jpeg';

            if (imageInput.startsWith('http') || imageInput.startsWith('blob:')) {
                try {
                    const response = await fetch(imageInput);
                    const blob = await response.blob();
                    mimeType = blob.type;
                    const reader = new FileReader();
                    base64Data = await new Promise((resolve) => {
                        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                        reader.readAsDataURL(blob);
                    });
                } catch (error) {
                    throw new Error("Failed to fetch or convert image URL.");
                }
            } else {
                base64Data = imageInput.includes(',') ? imageInput.split(',')[1] : imageInput;
            }

            const prompt = `Virtual Staging. Style: ${stylePrompt}. Keep architecture.`;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: model,
                contents: {
                    parts: [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }]
                }
            });

            if (response.candidates && response.candidates.length > 0) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
            return null;
        });
    } catch (error: any) {
        console.error("Virtual Staging Error:", error.message);
        alert(`خطا در چیدمان مجازی: ${error.message}`);
        return null;
    }
};

export const chatWithAlexa = async (message: string, history: string[], appContext: AppContext) => {
  try {
    return await _executeAICall(AIModelType.TEXT_CHAT, async (ai, model) => {
        const dataSummary = `
          User: ${appContext.currentUser?.name || 'مهمان'}
          تعداد املاک: ${appContext.properties.length}, تعداد مشتریان: ${appContext.clients.length}
        `;

        const systemInstruction = `شما الکسا (دستیار املاک) هستید. ${dataSummary}. هدف شما کمک به کاربر در مدیریت املاک است.`;

        const response: GenerateContentResponse = await ai.models.generateContent({
          model,
          contents: message,
          config: { systemInstruction: systemInstruction }
        });
        return response.text;
    });
  } catch (error: any) {
    console.error("Alexa Chat Error:", error.message);
    alert(`خطا در گفتگوی الکسا: ${error.message}`);
    return "مشکلی پیش اومده عزیزم. لطفا کلید API متن رو بررسی کن.";
  }
}

export const suggestTaskSchedule = async (title: string, priority: string) => {
  try {
    return await _executeAICall(AIModelType.TEXT_CHAT, async (ai, model) => {
        const prompt = `یک تاریخ و زمان بهینه فارسی برای وظیفه زیر پیشنهاد بده: "${title}" با اولویت "${priority}". خروجی به صورت JSON باشد: {date: "YYYY/MM/DD", time: "HH:MM", reason: "دلیل پیشنهاد به فارسی"}`;

        const response: GenerateContentResponse = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { date: { type: Type.STRING }, time: { type: Type.STRING }, reason: { type: Type.STRING } },
                required: ["date", "time", "reason"]
            }
          },
        });
        return JSON.parse(response.text!);
    });
  } catch (error: any) {
    console.error("Task Suggestion Error:", error.message);
    alert(`خطا در پیشنهاد زمان‌بندی هوشمند: ${error.message}`);
    return null;
  }
};