import { HfInference } from "@huggingface/inference";

// Инициализация клиента Hugging Face
// ВАЖНО: Используйте серверную переменную без NEXT_PUBLIC_ префикса
// Для полного доступа нужен токен: https://huggingface.co/settings/tokens
const hf = new HfInference(
  process.env.HUGGINGFACE_API_KEY || undefined
);

// Модели и Spaces с реальными inference endpoints для 3D генерации
export const THREED_MODELS = {
  // Text-to-3D через Spaces API (работают через inference endpoints)
  SHAP_E_SPACE: "openxai/shap-e", // Space с API
  POINT_E_SPACE: "openxai/point-e", // Space с API
  
  // Image-to-3D через Spaces
  ZERO123_SPACE: "ashawkey/stable-zero123", // Space с inference
  
  // Альтернативные варианты через прямые API вызовы
  // Используем модели, которые точно имеют inference endpoints
  SHAP_E_DIRECT: "openai/shap-e",
  
  // Через Spaces API (более надежный способ)
  THREEDY: "lucataco/threedy", // Популярный Space для 3D
} as const;

export type ModelType = keyof typeof THREED_MODELS;

export interface Generate3DParams {
  prompt?: string;
  image?: string; // base64 или URL
  model?: ModelType;
  numInferenceSteps?: number;
  guidanceScale?: number;
}

export interface Generate3DResponse {
  success: boolean;
  data?: {
    model: string;
    output?: any;
    error?: string;
  };
}

/**
 * Генерация 3D модели из текста через Hugging Face Inference API
 * Использует правильный формат согласно документации HF
 */
export async function generate3DFromText(
  prompt: string,
  model: ModelType = "SHAP_E_DIRECT"
): Promise<Generate3DResponse> {
  try {
    const modelId = THREED_MODELS[model];
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    // Согласно документации HF, используем router.huggingface.co/hf-inference
    // Формат: POST https://router.huggingface.co/hf-inference/models/{model}
    const apiUrl = `https://router.huggingface.co/hf-inference/models/${modelId}`;
    
    // Правильный формат запроса согласно HF Inference API
    const requestBody = {
      inputs: prompt,
      parameters: {
        num_inference_steps: 20,
        guidance_scale: 7.5,
      },
    };
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    
    const httpResponse = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });
    
    if (!httpResponse.ok) {
      let errorMessage = `HTTP ${httpResponse.status}`;
      let errorData: any = {};
      
      try {
        const contentType = httpResponse.headers.get("Content-Type");
        if (contentType?.includes("application/json")) {
          errorData = await httpResponse.json();
          errorMessage = errorData.error || errorData.message || errorData.detail || errorMessage;
        } else {
          errorMessage = await httpResponse.text() || errorMessage;
        }
      } catch {
        errorMessage = `HTTP ${httpResponse.status}: ${httpResponse.statusText}`;
      }
      
      // Специальная обработка для разных статусов
      if (httpResponse.status === 404) {
        throw new Error(`Model "${modelId}" not found or doesn't have an inference endpoint. ${errorMessage}`);
      }
      if (httpResponse.status === 503) {
        throw new Error(`Model "${modelId}" is currently loading. Please try again in a few moments. ${errorMessage}`);
      }
      if (httpResponse.status === 429) {
        throw new Error(`Rate limit exceeded. Please wait before trying again. ${errorMessage}`);
      }
      
      throw new Error(errorMessage);
    }
    
    // Проверяем тип ответа
    const contentType = httpResponse.headers.get("Content-Type");
    let response: any;
    
    if (contentType?.includes("application/json")) {
      response = await httpResponse.json();
    } else if (contentType?.startsWith("image/")) {
      // Если ответ - изображение, конвертируем в base64
      const blob = await httpResponse.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      response = {
        image: `data:${contentType};base64,${base64}`,
      };
    } else {
      // Для других типов (например, бинарные данные 3D моделей)
      const blob = await httpResponse.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      response = {
        data: `data:${contentType || "application/octet-stream"};base64,${base64}`,
      };
    }

    return {
      success: true,
      data: {
        model: modelId,
        output: response,
      },
    };
  } catch (error: any) {
    console.error("Error generating 3D from text:", error);
    return {
      success: false,
      data: {
        model: THREED_MODELS[model],
        error: error.message || "Unknown error. Model may not have inference endpoint.",
      },
    };
  }
}

/**
 * Генерация 3D модели из изображения
 */
export async function generate3DFromImage(
  imageUrl: string,
  prompt?: string,
  model: ModelType = "ZERO123_SPACE"
): Promise<Generate3DResponse> {
  try {
    const modelId = THREED_MODELS[model];
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    // Загружаем изображение
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    
    // Конвертируем blob в base64 для HTTP запроса
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    
    // Определяем MIME тип изображения
    const contentType = imageBlob.type || "image/jpeg";
    
    // Используем правильный формат согласно HF Inference API
    const apiUrl = `https://router.huggingface.co/hf-inference/models/${modelId}`;
    
    const requestBody = {
      inputs: `data:${contentType};base64,${base64}`,
      parameters: {
        prompt: prompt || "Generate 3D model",
        num_inference_steps: 20,
      },
    };
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    
    const httpResponse = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });
    
    if (!httpResponse.ok) {
      let errorMessage = `HTTP ${httpResponse.status}`;
      let errorData: any = {};
      
      try {
        const responseContentType = httpResponse.headers.get("Content-Type");
        if (responseContentType?.includes("application/json")) {
          errorData = await httpResponse.json();
          errorMessage = errorData.error || errorData.message || errorData.detail || errorMessage;
        } else {
          errorMessage = await httpResponse.text() || errorMessage;
        }
      } catch {
        errorMessage = `HTTP ${httpResponse.status}: ${httpResponse.statusText}`;
      }
      
      if (httpResponse.status === 404) {
        throw new Error(`Model "${modelId}" not found or doesn't support image-to-3D. ${errorMessage}`);
      }
      if (httpResponse.status === 503) {
        throw new Error(`Model "${modelId}" is currently loading. Please try again in a few moments. ${errorMessage}`);
      }
      if (httpResponse.status === 429) {
        throw new Error(`Rate limit exceeded. Please wait before trying again. ${errorMessage}`);
      }
      
      throw new Error(errorMessage);
    }
    
    // Обрабатываем ответ
    const responseContentType = httpResponse.headers.get("Content-Type");
    let response: any;
    
    if (responseContentType?.includes("application/json")) {
      response = await httpResponse.json();
    } else if (responseContentType?.startsWith("image/")) {
      const blob = await httpResponse.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64Response = Buffer.from(arrayBuffer).toString("base64");
      response = {
        image: `data:${responseContentType};base64,${base64Response}`,
      };
    } else {
      // Для бинарных данных (3D модели)
      const blob = await httpResponse.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64Response = Buffer.from(arrayBuffer).toString("base64");
      response = {
        data: `data:${responseContentType || "application/octet-stream"};base64,${base64Response}`,
      };
    }
    
    return {
      success: true,
      data: {
        model: modelId,
        output: response,
      },
    };
  } catch (error: any) {
    console.error("Error generating 3D from image:", error);
    return {
      success: false,
      data: {
        model: THREED_MODELS[model],
        error: error.message || "Unknown error. Model may not support image-to-3D.",
      },
    };
  }
}

/**
 * Проверка доступности модели
 */
export async function checkModelAvailability(
  model: ModelType
): Promise<boolean> {
  try {
    const modelId = THREED_MODELS[model];
    // Простая проверка через API
    await hf.model(modelId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Получение списка доступных моделей
 */
export async function getAvailableModels(): Promise<ModelType[]> {
  const available: ModelType[] = [];
  
  for (const model of Object.keys(THREED_MODELS) as ModelType[]) {
    const isAvailable = await checkModelAvailability(model);
    if (isAvailable) {
      available.push(model);
    }
  }
  
  return available;
}

