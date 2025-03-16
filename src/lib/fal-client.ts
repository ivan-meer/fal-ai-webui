import { fal } from '@fal-ai/client';

// Initialize the Fal.ai client with proxy URL instead of API key
fal.config({
  proxyUrl: '/api/fal/proxy',
});

// Available model endpoints
export const MODELS = {
  textToImage: {
    FLUX1_1_PRO_ultra: 'fal-ai/flux-pro/v1.1-ultra',
    FLUX1_1_PRO: 'fal-ai/flux-pro/v1.1',

  },
  textToVideo: {
    WAN_T2V: 'fal-ai/wan-t2v',
    WAN_T2V_1_3B: 'fal-ai/wan/v2.1/1.3b/text-to-video',
  },
};

// Types for image format and aspect ratio options
export type OutputFormat = 'jpeg' | 'png';
export type ImageAspectRatio = '21:9' | '16:9' | '4:3' | '3:2' | '1:1' | '2:3' | '3:4' | '9:16' | '9:21';
export type VideoAspectRatio = '16:9' | '9:16';
export type VideoResolution = '480p' | '580p' | '720p';
export type SafetyTolerance = '1' | '2' | '3' | '4' | '5' | '6';

// Types for the API responses
export interface ImageGenerationResult {
  images: {
    url: string;
    width: number;
    height: number;
    content_type?: string;
  }[];
  seed?: number;
  timings?: any;
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
}

// Function to generate images from text
export async function generateImage(
  prompt: string,
  modelId: string = MODELS.textToImage.FLUX1_1_PRO_ultra,
  seed?: number,
  options: {
    num_images?: number;
    enable_safety_checker?: boolean;
    safety_tolerance?: SafetyTolerance;
    output_format?: OutputFormat;
    aspect_ratio?: ImageAspectRatio;
    raw?: boolean;
    sync_mode?: boolean;
  } = {}
): Promise<ImageGenerationResult> {
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
      },
    });
    
    console.log("API raw response:", JSON.stringify(response));
    
    // APIレスポンスがimagesを直接持っている場合と、data.imagesの形式の場合の両方に対応
    let result: ImageGenerationResult;
    
    if ('data' in response && response.data && typeof response.data === 'object') {
      // API returns { data: { images: [...] } }
      result = response.data as unknown as ImageGenerationResult;
    } else if ('images' in response && Array.isArray(response.images)) {
      // API returns { images: [...] } directly
      result = response as unknown as ImageGenerationResult;
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

// Function to generate videos from text and image
export async function generateVideo(
  prompt: string,
  modelId: string = MODELS.textToVideo.WAN_T2V,
  seed?: number,
  options: {
    resolution?: VideoResolution;
    aspect_ratio?: VideoAspectRatio;
    inference_steps?: number;
    enable_safety_checker?: boolean;
    enable_prompt_expansion?: boolean;
  } = {}
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
      },
    });
    
    const result = (response as FalApiResponse<VideoGenerationResult>).data;
    
    // Type guard to ensure the result has the expected structure
    if (!result || !result.video || !result.video.url) {
      throw new Error('Unexpected API response format');
    }
    
    return result;
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
} 