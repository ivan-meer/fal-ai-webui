import { FalClient, MODELS, VideoGenerationResult, ImageGenerationResult, ImageAspectRatio, VideoAspectRatio, SafetyTolerance, QualityPreset, StylePreset } from '@/lib/fal-client';
import { fal } from '@fal-ai/client';

jest.mock('@fal-ai/client');

describe('FalClient', () => {
  let client: FalClient;
  const mockFalSubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (fal.subscribe as jest.Mock) = mockFalSubscribe;
    client = new FalClient('test-key');
  });

  describe('Type Validation', () => {
    it('validates ImageAspectRatio type', () => {
      const validRatios = ['21:9', '16:9', '4:3', '3:2', '1:1', '2:3', '3:4', '9:16', '9:21'] as const;
      validRatios.forEach(ratio => {
        expect(() => {
          client.generateImage('test', 'test-model', { aspect_ratio: ratio });
        }).not.toThrow();
      });

      // @ts-expect-error - Invalid aspect ratio
      expect(() => {
        client.generateImage('test', 'test-model', { aspect_ratio: 'invalid' });
      }).toThrow();
    });

    it('validates VideoAspectRatio type', () => {
      const validRatios = ['16:9', '9:16', '1:1'] as const;
      validRatios.forEach(ratio => {
        expect(() => {
          client.generateVideo('test', 'test-model', { aspect_ratio: ratio });
        }).not.toThrow();
      });

      // @ts-expect-error - Invalid aspect ratio
      expect(() => {
        client.generateVideo('test', 'test-model', { aspect_ratio: 'invalid' });
      }).toThrow();
    });

    it('validates SafetyTolerance type', () => {
      const validTolerances = ['1', '2', '3', '4', '5', '6'] as const;
      validTolerances.forEach(tolerance => {
        expect(() => {
          client.generateImage('test', 'test-model', { safety_tolerance: tolerance });
        }).not.toThrow();
      });

      // @ts-expect-error - Invalid safety tolerance
      expect(() => {
        client.generateImage('test', 'test-model', { safety_tolerance: '7' });
      }).toThrow();
    });

    it('validates QualityPreset type', () => {
      const validPresets = ['draft', 'normal', 'high', 'extreme'] as const;
      validPresets.forEach(preset => {
        expect(() => {
          client.generateImage('test', 'test-model', { quality_preset: preset });
        }).not.toThrow();
      });

      // @ts-expect-error - Invalid quality preset
      expect(() => {
        client.generateImage('test', 'test-model', { quality_preset: 'invalid' });
      }).toThrow();
    });

    it('validates StylePreset type', () => {
      const validStyles = ['anime', 'photographic', 'digital-art', 'comic', 'fantasy'] as const;
      validStyles.forEach(style => {
        expect(() => {
          client.generateImage('test', 'test-model', { style_preset: style });
        }).not.toThrow();
      });

      // @ts-expect-error - Invalid style preset
      expect(() => {
        client.generateImage('test', 'test-model', { style_preset: 'invalid' });
      }).toThrow();
    });
  });

  describe('API Response Types', () => {

    it('validates ImageGenerationResult type', async () => {
      const mockResult = {
        images: [{
          url: 'https://example.com/image.jpg',
          content_type: 'image/jpeg',
          width: 512,
          height: 512
        }],
        seed: 12345,
        has_nsfw_concepts: [false],
        prompt: 'test prompt'
      };

      mockFalSubscribe.mockResolvedValueOnce({ data: mockResult });
      const result = await client.generateImage('test prompt', MODELS.textToImage.FLUX1_1_PRO);
      
      expect(result.images[0].url).toBe('https://example.com/image.jpg');
      expect(result.images[0].width).toBe(512);
      expect(result.seed).toBe(12345);
      expect(result.prompt).toBe('test prompt');
    });

    it('handles API errors correctly', async () => {
      mockFalSubscribe.mockRejectedValueOnce(new Error('API Error'));
      await expect(client.generateImage('test')).rejects.toThrow('API Error');
    });

    it('validates advanced image generation options', async () => {
      const mockResult = {
        images: [{ url: 'test.jpg', width: 512, height: 512 }]
      };
      mockFalSubscribe.mockResolvedValueOnce({ data: mockResult });

      await client.generateImage('test', MODELS.textToImage.FLUX1_1_PRO, {
        quality_preset: 'high',
        style_preset: 'anime',
        negative_prompt: 'bad quality',
        guidance_scale: 7.5,
        controlnet_mode: 'canny'
      });

      expect(mockFalSubscribe).toHaveBeenCalledWith(
        MODELS.textToImage.FLUX1_1_PRO,
        expect.objectContaining({
          input: expect.objectContaining({
            quality_preset: 'high',
            style_preset: 'anime',
            negative_prompt: 'bad quality',
            guidance_scale: 7.5,
            controlnet_mode: 'canny'
          })
        })
      );
    });

    it('validates VideoGenerationResult type', async () => {
      const mockResult: VideoGenerationResult = {
        video: {
          url: 'https://example.com/video.mp4',
          content_type: 'video/mp4',
          file_name: 'output.mp4',
          file_size: 1024000
        },
        seed: 12345,
        prompt: 'test video'
      };

      mockFalSubscribe.mockResolvedValueOnce({ data: mockResult });
      const result = await client.generateVideo('test video', MODELS.textToVideo.WAN_T2V);

      expect(result.video.url).toBe('https://example.com/video.mp4');
      expect(result.video.file_size).toBe(1024000);
      expect(result.seed).toBe(12345);
      expect(result.prompt).toBe('test video');
    });

    it('handles different API response formats', async () => {
      const directResponse = {
        images: [{ url: 'direct.jpg', width: 512, height: 512 }]
      };
      mockFalSubscribe.mockResolvedValueOnce(directResponse);
      
      const result = await client.generateImage('test');
      expect(result.images[0].url).toBe('direct.jpg');

      const wrappedResponse = {
        data: {
          images: [{ url: 'wrapped.jpg', width: 512, height: 512 }]
        }
      };
      mockFalSubscribe.mockResolvedValueOnce(wrappedResponse);
      
      const result2 = await client.generateImage('test');
      expect(result2.images[0].url).toBe('wrapped.jpg');
    });
  });

  describe('Error Handling', () => {
    it('handles invalid API responses', async () => {
      mockFalSubscribe.mockResolvedValueOnce({ data: { invalid: 'response' } });
      await expect(client.generateImage('test')).rejects.toThrow('Unexpected API response format');
    });

    it('handles network errors', async () => {
      mockFalSubscribe.mockRejectedValueOnce(new Error('Network Error'));
      await expect(client.generateImage('test')).rejects.toThrow('Network Error');
    });

    it('validates required parameters', () => {
      expect(() => client.generateImage('')).toThrow();
      expect(() => client.generateVideo('')).toThrow();
    });
  });
});