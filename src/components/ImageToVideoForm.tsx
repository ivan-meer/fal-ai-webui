/**
 * @module ImageToVideoForm
 * @description Компонент формы для генерации видео на основе входного изображения.
 * Поддерживает загрузку исходного изображения, настройку параметров генерации
 * и контроль над процессом создания видео.
 *
 * @component
 * @example
 * ```tsx
 * <ImageToVideoForm
 *   onResultChange={(result) => console.log(result)}
 *   initialState={{
 *     prompt: "Create a video from this image",
 *     numFrames: 30,
 *     fps: 24
 *   }}
 *   onStateChange={(state) => console.log(state)}
 * />
 * ```
 */

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MODELS, 
  VideoGenerationResult,
  VideoResolution,
  VideoAspectRatio
} from '@/lib/fal-client';
import { taskQueue, Task } from '@/lib/task-queue';
import { addVideoToHistory } from '@/lib/history-store';
import { useTranslations } from '@/lib/useTranslations';

interface ImageToVideoFormProps {
  onResultChange?: (result: VideoGenerationResult | null) => void;
  initialState?: {
    prompt: string;
    seed?: number;
    selectedModel: string;
    numFrames: number;
    fps: number;
    resolution: VideoResolution;
    aspectRatio: VideoAspectRatio;
    enableSafetyChecker: boolean;
    enablePromptExpansion: boolean;
  };
  onStateChange?: (state: {
    prompt: string;
    seed?: number;
    selectedModel: string;
    numFrames: number;
    fps: number;
    resolution: VideoResolution;
    aspectRatio: VideoAspectRatio;
    enableSafetyChecker: boolean;
    enablePromptExpansion: boolean;
  }) => void;
}

const ImageToVideoForm: React.FC<ImageToVideoFormProps> = ({ 
  onResultChange, 
  initialState,
  onStateChange
}) => {
  const { t } = useTranslations();
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourceImagePreview, setSourceImagePreview] = useState<string>('');
  const [prompt, setPrompt] = useState(initialState?.prompt || '');
  const [seed, setSeed] = useState<number | undefined>(initialState?.seed);
  const [selectedModel, setSelectedModel] = useState(initialState?.selectedModel || 'stable-diffusion-v1');
  const [numFrames, setNumFrames] = useState(initialState?.numFrames || 30);
  const [fps, setFps] = useState(initialState?.fps || 24);
  const [resolution, setResolution] = useState<VideoResolution>(initialState?.resolution || '720p');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>(initialState?.aspectRatio || '16:9');
  const [enableSafetyChecker, setEnableSafetyChecker] = useState(initialState?.enableSafetyChecker || false);
  const [enablePromptExpansion, setEnablePromptExpansion] = useState(initialState?.enablePromptExpansion || false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoGenerationResult | null>(null);
  const [activeTaskCount, setActiveTaskCount] = useState(0);

  // Обработка загрузки изображения
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(t('form.errorInvalidImageType'));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(t('form.errorFileTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setError(t('form.errorReadingFile'));
    };
    reader.onloadend = () => {
      setSourceImage(file);
      setSourceImagePreview(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, [t, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE]);

  // Обработка drag-and-drop
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(t('form.errorInvalidImageType'));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(t('form.errorFileTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setError(t('form.errorReadingFile'));
    };
    reader.onloadend = () => {
      setSourceImage(file);
      setSourceImagePreview(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, [t, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE]);

  // Уведомление родительского компонента об изменении состояния
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        prompt,
        seed,
        selectedModel,
        numFrames,
        fps,
        resolution,
        aspectRatio,
        enableSafetyChecker,
        enablePromptExpansion
      });
    }
  }, [
    prompt,
    seed,
    selectedModel,
    numFrames,
    fps,
    resolution,
    aspectRatio,
    enableSafetyChecker,
    enablePromptExpansion,
    onStateChange
  ]);

  // Отправка результата родительскому компоненту
  useEffect(() => {
    if (onResultChange && result) {
      onResultChange(result);
    }
  }, [result, onResultChange]);

  // Мониторинг очереди задач и очистка ресурсов
  useEffect(() => {
    const handleTasksUpdate = (tasks: Task[]) => {
      const videoTasks = tasks.filter(
        task => task.type === 'image_to_video' &&
        ['pending', 'in_queue', 'in_progress'].includes(task.status)
      );
      setActiveTaskCount(videoTasks.length);
    };
    
    taskQueue.addListener(handleTasksUpdate);
    
    return () => {
      taskQueue.removeListener(handleTasksUpdate);
      // Очистка ресурсов при размонтировании
      if (sourceImagePreview) {
        URL.revokeObjectURL(sourceImagePreview);
      }
      setSourceImage(null);
      setSourceImagePreview('');
      setError(null);
      setResult(null);
    };
  }, [sourceImagePreview]);

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000));
  };

  const handleClearSeed = () => {
    setSeed(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sourceImage) {
      setError('Please upload an image');
      return;
    }
    
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    
    setError(null);
    setIsGenerating(true);
    
    try {
      // Конвертация изображения в base64
      const reader = new FileReader();
      reader.readAsDataURL(sourceImage);
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        // Добавление задачи в очередь
        const options = {
          source_image: base64Image.split(',')[1], // Удаление префикса data:image/*;base64,
          num_frames: numFrames,
          fps,
          resolution,
          aspect_ratio: aspectRatio,
          enable_safety_checker: enableSafetyChecker,
          enable_prompt_expansion: enablePromptExpansion,
          seed
        };
        
        const task = taskQueue.addTask('image2video', prompt, selectedModel, options);
        
        // Обработка результата
        const checkTaskComplete = () => {
          const updatedTask = taskQueue.getTask(task.id);
          
          if (updatedTask?.status === 'completed' && updatedTask.result) {
            const generationResult = updatedTask.result as VideoGenerationResult;
            setResult(generationResult);
            
            // Добавление в историю
            addVideoToHistory(
              generationResult.prompt || prompt,
              seed,
              selectedModel,
              generationResult,
              {
                sourceImage: sourceImagePreview,
                numFrames,
                fps,
                resolution,
                aspectRatio,
                enableSafetyChecker,
                enablePromptExpansion
              }
            );
            
            setIsGenerating(false);
            clearInterval(intervalId);
          } else if (updatedTask?.status === 'failed') {
            setError(updatedTask.error || 'Failed to generate video');
            setIsGenerating(false);
            clearInterval(intervalId);
          }
        };
        
        const intervalId = setInterval(checkTaskComplete, 1000);
      };
    } catch (err) {
      console.error('Error generating video:', err);
      setError('Failed to generate video. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Область загрузки изображения */}
      <div
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {sourceImagePreview ? (
          <div className="relative">
            <img
              src={sourceImagePreview}
              alt="Source"
              className="max-h-64 mx-auto rounded"
            />
            <button
              title="Remove image"
              type="button"
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
              onClick={() => {
                setSourceImage(null);
                setSourceImagePreview('');
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('form.dragAndDrop')}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700"
            >
              {t('form.selectFile')}
            </label>
          </div>
        )}
      </div>

      {/* Выбор модели */}
      <div>
        <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('form.model')}
        </label>
        <select
          id="model"
          className="input bg-white dark:bg-gray-700 dark:text-white"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          <option value={MODELS.imageToVideo.STABLE_DIFFUSION}>Stable Diffusion Video</option>
          {/* Добавьте другие модели по мере необходимости */}
        </select>
      </div>

      {/* Текстовый промпт */}
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('form.prompt')}
        </label>
        <textarea
          id="prompt"
          className="input bg-white dark:bg-gray-700 dark:text-white"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t('form.enterPrompt')}
        />
      </div>

      {/* Настройки видео */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="numFrames" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('form.numFrames')}
          </label>
          <input
            type="number"
            id="numFrames"
            min="10"
            max="120"
            value={numFrames}
            onChange={(e) => setNumFrames(Number(e.target.value))}
            className="input bg-white dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="fps" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('form.fps')}
          </label>
          <input
            type="number"
            id="fps"
            min="12"
            max="60"
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            className="input bg-white dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Разрешение и соотношение сторон */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('form.resolution')}
          </label>
          <select
            id="resolution"
            className="input bg-white dark:bg-gray-700 dark:text-white"
            value={resolution}
            onChange={(e) => setResolution(e.target.value as VideoResolution)}
          >
            <option value="480p">480p</option>
            <option value="580p">580p</option>
            <option value="720p">720p (HD)</option>
          </select>
        </div>

        <div>
          <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('form.aspectRatio')}
          </label>
          <select
            id="aspectRatio"
            className="input bg-white dark:bg-gray-700 dark:text-white"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)}
          >
            <option value="16:9">16:9 Landscape</option>
            <option value="9:16">9:16 Portrait</option>
          </select>
        </div>
      </div>

      {/* Seed */}
      <div>
        <div className="flex items-center gap-4">
          <label htmlFor="seed" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('form.seed')}
          </label>
          <button
            type="button"
            onClick={handleRandomSeed}
            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Random
            </span>
          </button>
          {seed && (
            <button
              type="button"
              onClick={handleClearSeed}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </span>
            </button>
          )}
        </div>
        <input
          type="number"
          id="seed"
          className="mt-1 input bg-white dark:bg-gray-700 dark:text-white"
          value={seed || ''}
          onChange={(e) => {
            const value = e.target.value;
            setSeed(value ? parseInt(value, 10) : undefined);
          }}
          placeholder={t('form.randomSeed')}
        />
      </div>

      {/* Настройки безопасности */}
      <div>
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="enableSafetyChecker"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            checked={enableSafetyChecker}
            onChange={(e) => setEnableSafetyChecker(e.target.checked)}
          />
          <label htmlFor="enableSafetyChecker" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            {t('form.safetyChecker')}
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enablePromptExpansion"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            checked={enablePromptExpansion}
            onChange={(e) => setEnablePromptExpansion(e.target.checked)}
          />
          <label htmlFor="enablePromptExpansion" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            {t('form.promptExpansion')}
          </label>
        </div>
      </div>

      {/* Кнопка генерации */}
      <button
        type="submit"
        disabled={!sourceImage || !prompt.trim() || isGenerating}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
      >
        {isGenerating ? t('form.generating') : (
          <>
            {t('form.generate')}
            {activeTaskCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {activeTaskCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Сообщение об ошибке */}
      {error && (
        <div className="mt-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </form>
  );
};

export default ImageToVideoForm;