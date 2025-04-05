import { fal } from '@fal-ai/client';
import type { HistoryItem } from '@/lib/types';

/**
 * Initialize the Fal.ai client with proxy URL instead of API key.
 * This configuration allows the client to communicate with the Fal.ai API
 * through a proxy endpoint, avoiding direct exposure of API keys.
 */
fal.config({
  proxyUrl: '/api/fal/proxy',
});

/**
 * Available model endpoints for different AI generation tasks.
 * Each category contains specific model variants optimized for different use cases.
 */
export const MODELS = {
  textToImage: {
    FLUX1_1_PRO_ultra: 'fal-ai/flux-pro/v1.1-ultra',
    FLUX1_1_PRO: 'fal-ai/flux-pro/v1.1',
    STABLE_DIFFUSION_XL: 'fal-ai/stable-diffusion-xl',
    KANDINSKY: 'fal-ai/kandinsky-2.2',
    OPENJOURNEY: 'fal-ai/openjourney'
  },
  textToVideo: {
    WAN_T2V: 'fal-ai/wan-t2v',
    WAN_T2V_1_3B: 'fal-ai/wan/v2.1/1.3b/text-to-video',
    MODELSCOPE: 'fal-ai/modelscope-text-to-video',
    ZEROSCOPE: 'fal-ai/zeroscope-v2-xl'
  },
  imageToImage: {
    STABLE_DIFFUSION: 'fal-ai/stable-diffusion-img2img',
    IP_ADAPTER: 'fal-ai/ip-adapter',
    CONTROLNET: 'fal-ai/controlnet'
  },
  imageToVideo: {
    STABLE_DIFFUSION: 'fal-ai/stable-diffusion-video',
    ANIMATEDIFF: 'fal-ai/animatediff',
    SVD: 'fal-ai/stable-video-diffusion'
  },
};

/**
 * Supported output image formats.
 * @typedef {'jpeg' | 'png' | 'webp'} OutputFormat
 */
export type OutputFormat = 'jpeg' | 'png' | 'webp';
export type ImageAspectRatio = '21:9' | '16:9' | '4:3' | '3:2' | '1:1' | '2:3' | '3:4' | '9:16' | '9:21';
export type VideoAspectRatio = '16:9' | '9:16' | '1:1';
export type VideoResolution = '480p' | '580p' | '720p' | '1080p';
export type SafetyTolerance = '1' | '2' | '3' | '4' | '5' | '6';

// Новые типы для расширенных параметров моделей
export type QualityPreset = 'draft' | 'normal' | 'high' | 'extreme';
export type StylePreset = 'anime' | 'photographic' | 'digital-art' | 'comic' | 'fantasy';
export type ControlNetMode = 'canny' | 'depth' | 'pose' | 'scribble';
export type InterpolationMethod = 'linear' | 'cubic' | 'film';

// Интерфейсы для специфичных параметров моделей
export interface AdvancedImageOptions {
  quality_preset?: QualityPreset;
  style_preset?: StylePreset;
  negative_prompt?: string;
  guidance_scale?: number;
  controlnet_mode?: ControlNetMode;
  controlnet_conditioning_scale?: number;
}

export interface AdvancedVideoOptions {
  interpolation_method?: InterpolationMethod;
  motion_bucket_id?: number;
  noise_aug_strength?: number;
  min_cfg?: number;
  max_cfg?: number;
  frame_interpolation_factor?: number;
}

// Types for the API responses
export interface ImageGenerationResult {
  images: {
    url: string;
    width: number;
    height: number;
    content_type?: string;
  }[];
  seed?: number;
  timings?: object;
  has_nsfw_concepts?: boolean[];
  prompt?: string;
}

export interface VideoGenerationResult {
  video: {
    url: string;
    content_type?: string;
    file_name?: string;
    file_size?: number;
  };
  seed?: number;
  prompt?: string;
}

// Interface for fal.ai API response
interface FalApiResponse<T> {
  data: T;
  requestId: string;
  status?: string;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Generates images from text prompts using specified AI models.
 * @param {string} prompt - The text description to generate image from
 * @param {string} [modelId] - The ID of the model to use (defaults to FLUX1_1_PRO_ultra)
 * @param {number} [seed] - Optional seed for reproducible generation
 * @param {Object} [options] - Additional generation options
 * @param {number} [options.num_images] - Number of images to generate
 * @param {boolean} [options.enable_safety_checker] - Enable content safety checking
 * @param {SafetyTolerance} [options.safety_tolerance] - Safety check tolerance level
 * @param {OutputFormat} [options.output_format] - Output image format
 * @param {ImageAspectRatio} [options.aspect_ratio] - Output image aspect ratio
 * @param {QualityPreset} [options.quality_preset] - Quality level preset
 * @param {StylePreset} [options.style_preset] - Visual style preset
 * @returns {Promise<ImageGenerationResult>} Generated image results
 */
export interface ImageGenerationOptions extends AdvancedImageOptions {
  num_images?: number;
  enable_safety_checker?: boolean;
  safety_tolerance?: SafetyTolerance;
  output_format?: OutputFormat;
  aspect_ratio?: ImageAspectRatio;
  raw?: boolean;
  sync_mode?: boolean;
}

export async function generateImage(
  prompt: string,
  modelId: string = MODELS.textToImage.FLUX1_1_PRO_ultra,
  seed?: number,
  options: ImageGenerationOptions = {
} = {}): Promise<ImageGenerationResult> {
  try {
    console.log("Requesting image with format:", options.output_format ?? 'jpeg');

    console.log("seed:", seed);
    
    const response = await fal.subscribe(modelId, {
      input: {
        prompt,
        seed,
        // Add additional parameters from API schema
        num_images: options.num_images ?? 1,
        enable_safety_checker: options.enable_safety_checker ?? false,
        safety_tolerance: options.safety_tolerance ?? '6',
        output_format: options.output_format ?? 'jpeg',
        aspect_ratio: options.aspect_ratio,
        raw: options.raw,
        sync_mode: options.sync_mode,
        // Advanced parameters for new models
        quality_preset: options.quality_preset,
        style_preset: options.style_preset,
        negative_prompt: options.negative_prompt,
        guidance_scale: options.guidance_scale,
        controlnet_mode: options.controlnet_mode,
        controlnet_conditioning_scale: options.controlnet_conditioning_scale,
      },
    });
    
    console.log("API raw response:", JSON.stringify(response));
    
    // APIレスポンスがimagesを直接持っている場合と、data.imagesの形式の場合の両方に対応
    let result: ImageGenerationResult;
    
    if ('data' in response && response.data && typeof response.data === 'object') {
      // API returns { data: { images: [...] } }
      const data = response.data as Partial<ImageGenerationResult>;
      if (!data.images || !Array.isArray(data.images)) {
        throw new Error('Invalid API response: missing or invalid images array');
      }
      result = data as ImageGenerationResult;
    } else if ('images' in response && Array.isArray(response.images)) {
      // API returns { images: [...] } directly
      result = response as ImageGenerationResult;
    } else {
      throw new Error('Unexpected API response format: images not found');
    }
    
    // Type guard to ensure the result has the expected structure
    if (!result.images || !Array.isArray(result.images)) {
      throw new Error('Unexpected API response format: invalid images format');
    }
    
    // 返される画像のURLをログ出力
    console.log("Generated image URLs:", result.images.map(img => img.url));
    if (result.images[0].content_type) {
      console.log("Image content type:", result.images[0].content_type);
    }
    
    return result;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

/**
 * Generates videos from text prompts using specified AI models.
 * @param {string} prompt - The text description to generate video from
 * @param {string} [modelId] - The ID of the model to use (defaults to WAN_T2V)
 * @param {number} [seed] - Optional seed for reproducible generation
 * @param {Object} [options] - Additional generation options
 * @param {VideoResolution} [options.resolution] - Output video resolution
 * @param {VideoAspectRatio} [options.aspect_ratio] - Output video aspect ratio
 * @param {number} [options.inference_steps] - Number of inference steps
 * @param {InterpolationMethod} [options.interpolation_method] - Frame interpolation method
 * @returns {Promise<VideoGenerationResult>} Generated video results
 */
export interface VideoGenerationOptions extends AdvancedVideoOptions {
  num_frames?: number;
  fps?: number;
  cond_aug?: number;
  decoding_t?: number;
  output_format?: string;
  aspect_ratio?: VideoAspectRatio;
  resolution?: VideoResolution;
  inference_steps?: number;
  enable_safety_checker?: boolean;
  enable_prompt_expansion?: boolean;
  seed?: number;
}

export async function generateVideo(
  prompt: string,
  modelId: string = MODELS.textToVideo.WAN_T2V,
  seed?: number,
  options: VideoGenerationOptions = {}
): Promise<VideoGenerationResult> {
  try {
    const response = await fal.subscribe(modelId, {
      input: {
        prompt,
        seed,
        // Add additional parameters from API schema
        resolution: options.resolution ?? '720p',
        aspect_ratio: options.aspect_ratio ?? '16:9',
        inference_steps: options.inference_steps ?? 30,
        enable_safety_checker: options.enable_safety_checker,
        enable_prompt_expansion: options.enable_prompt_expansion,
        // Advanced video generation parameters
        interpolation_method: options.interpolation_method,
        motion_bucket_id: options.motion_bucket_id,
        noise_aug_strength: options.noise_aug_strength,
        min_cfg: options.min_cfg,
        max_cfg: options.max_cfg,
        frame_interpolation_factor: options.frame_interpolation_factor,
      },
    });
    
    const apiResponse = response as FalApiResponse<VideoGenerationResult>;
    
    // Type guard to ensure the response structure
    if (!apiResponse?.data?.video?.url) {
      throw new Error('Неверный формат ответа от API');
    }
    
    return apiResponse.data;
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
}


export class FalClient {
  // Получение истории генераций
  static async getHistory(): Promise<HistoryItem[]> {
    try {
      const response = await fetch('/api/history');
      if (!response.ok) throw new Error('Ошибка сервера');
      return await response.json();
    } catch (error) {
      console.error('Ошибка получения истории:', error);
      throw new Error('Не удалось загрузить историю');
    }
  }

  // Удаление элемента истории
  static async deleteHistoryItem(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Ошибка сервера');
    } catch (error) {
      console.error('Ошибка удаления:', error);
      throw new Error('Не удалось удалить запись');
    }
  }

  constructor(private apiKey?: string) {
    if (apiKey) {
      fal.config({
        credentials: apiKey
      });
    }
  }

  async generateImage(
    prompt: string,
    modelId: string = MODELS.textToImage.FLUX1_1_PRO_ultra,
    options: {
      num_images?: number;
      enable_safety_checker?: boolean;
      safety_tolerance?: SafetyTolerance;
      output_format?: OutputFormat;
      aspect_ratio?: ImageAspectRatio;
      raw?: boolean;
      sync_mode?: boolean;
      quality_preset?: QualityPreset;
      style_preset?: StylePreset;
      negative_prompt?: string;
      guidance_scale?: number;
      controlnet_mode?: ControlNetMode;
      controlnet_conditioning_scale?: number;
    } = {}
  ): Promise<ImageGenerationResult> {
    if (!prompt) throw new Error('Prompt is required');
    return generateImage(prompt, modelId, undefined, options);
  }

  async generateVideo(
    prompt: string,
    modelId: string = MODELS.textToVideo.WAN_T2V,
    options: VideoGenerationOptions = {}
  ): Promise<VideoGenerationResult> {
    if (!prompt) throw new Error('Требуется текстовый запрос');
    try {
      const response = await fal.subscribe(modelId, {
        input: {
          prompt,
          seed: options.seed,
          resolution: options.resolution ?? '720p',
          aspect_ratio: options.aspect_ratio ?? '16:9',
          ...options
        }
      });

      const apiResponse = response as FalApiResponse<VideoGenerationResult>;
      if (!apiResponse?.data?.video?.url) {
        throw new Error('Неверный формат ответа от API');
      }
      return apiResponse.data;
    } catch (error) {
      console.error('Ошибка генерации видео:', error);
      throw new Error(`Не удалось создать видео: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }
}
