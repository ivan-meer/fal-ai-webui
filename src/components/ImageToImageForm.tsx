/**
 * @module ImageToImageForm
 * @description Компонент формы для генерации изображений на основе входного изображения.
 * Поддерживает загрузку исходного изображения, настройку параметров генерации
 * и контроль над процессом преобразования.
 *
 * @component
 * @example
 * ```tsx
 * <ImageToImageForm
 *   onResultChange={(result) => console.log(result)}
 *   initialState={{
 *     prompt: "Transform the image into an oil painting",
 *     strength: 0.75,
 *     numImages: 1
 *   }}
 *   onStateChange={(state) => console.log(state)}
 * />
 * ```
 */

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MODELS, 
  ImageGenerationResult, 
  OutputFormat, 
  ImageAspectRatio, 
  SafetyTolerance 
} from '@/lib/fal-client';
import { taskQueue, Task } from '@/lib/task-queue';
import { addImageToHistory } from '@/lib/history-store';
import { useTranslations } from '@/lib/useTranslations';

interface ImageToImageFormProps {
  onResultChange?: (result: ImageGenerationResult | null) => void;
  initialState?: {
    prompt: string;
    seed?: number;
    selectedModel: string;
    numImages: number;
    strength: number;
    outputFormat: OutputFormat;
    aspectRatio: ImageAspectRatio;
    enableSafetyChecker: boolean;
    safetyTolerance: SafetyTolerance;
  };
  onStateChange?: (state: {
    prompt: string;
    seed?: number;
    selectedModel: string;
    numImages: number;
    strength: number;
    outputFormat: OutputFormat;
    aspectRatio: ImageAspectRatio;
    enableSafetyChecker: boolean;
    safetyTolerance: SafetyTolerance;
  }) => void;
}

const ImageToImageForm: React.FC<ImageToImageFormProps> = ({ 
  onResultChange, 
  initialState,
  onStateChange
}) => {
  const { t } = useTranslations();
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourceImagePreview, setSourceImagePreview] = useState<string>('');
  const [prompt, setPrompt] = useState(initialState?.prompt || '');
  const [seed, setSeed] = useState<number | undefined>(initialState?.seed);
  const [selectedModel, setSelectedModel] = useState(initialState?.selectedModel || MODELS.imageToImage.STABLE_DIFFUSION);
  const [numImages, setNumImages] = useState(initialState?.numImages || 1);
  const [strength, setStrength] = useState(initialState?.strength || 0.75);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(initialState?.outputFormat || 'jpeg');
  const [aspectRatio] = useState<ImageAspectRatio>(initialState?.aspectRatio || '1:1');
  const [enableSafetyChecker, setEnableSafetyChecker] = useState(initialState?.enableSafetyChecker || false);
  const [safetyTolerance, setSafetyTolerance] = useState<SafetyTolerance>(initialState?.safetyTolerance || '6');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageGenerationResult | null>(null);
  const [activeTaskCount, setActiveTaskCount] = useState(0);

  // Обработка загрузки изображения
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSourceImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setSourceImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setError(null);
      } else {
        setError('Please upload an image file');
      }
    }
  }, []);

  // Обработка drag-and-drop
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSourceImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    } else {
      setError('Please drop an image file');
    }
  }, []);

  // Уведомление родительского компонента об изменении состояния
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        prompt,
        seed,
        selectedModel,
        numImages,
        strength,
        outputFormat,
        aspectRatio,
        enableSafetyChecker,
        safetyTolerance
      });
    }
  }, [
    prompt,
    seed,
    selectedModel,
    numImages,
    strength,
    outputFormat,
    aspectRatio,
    enableSafetyChecker,
    safetyTolerance,
    onStateChange
  ]);

  // Отправка результата родительскому компоненту
  useEffect(() => {
    if (onResultChange && result) {
      onResultChange(result);
    }
  }, [result, onResultChange]);

  // Мониторинг очереди задач
  useEffect(() => {
    const handleTasksUpdate = (tasks: Task[]) => {
      const imageTasks = tasks.filter(
        task => task.type === 'image2image' && 
        (task.status === 'pending' || task.status === 'in_queue' || task.status === 'in_progress')
      );
      setActiveTaskCount(imageTasks.length);
    };
    
    taskQueue.addListener(handleTasksUpdate);
    return () => taskQueue.removeListener(handleTasksUpdate);
  }, []);

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
          num_images: numImages,
          strength,
          output_format: outputFormat,
          aspect_ratio: aspectRatio,
          enable_safety_checker: enableSafetyChecker,
          safety_tolerance: safetyTolerance,
          seed
        };
        
        const task = taskQueue.addTask('image2image', prompt, selectedModel, options);
        
        // Обработка результата
        const checkTaskComplete = () => {
          const updatedTask = taskQueue.getTask(task.id);
          
          if (updatedTask?.status === 'completed' && updatedTask.result) {
            const generationResult = updatedTask.result as ImageGenerationResult;
            setResult(generationResult);
            
            // Добавление в историю
            addImageToHistory(
              generationResult.prompt || prompt,
              seed,
              selectedModel,
              generationResult,
              {
                sourceImage: sourceImagePreview,
                strength,
                outputFormat,
                aspectRatio,
                enableSafetyChecker,
                safetyTolerance
              }
            );
            
            setIsGenerating(false);
            clearInterval(intervalId);
          } else if (updatedTask?.status === 'failed') {
            setError(updatedTask.error || 'Failed to generate image');
            setIsGenerating(false);
            clearInterval(intervalId);
          }
        };
        
        const intervalId = setInterval(checkTaskComplete, 1000);
      };
    } catch (err) {
      console.error('Error generating image:', err);
      setError('Failed to generate image. Please try again.');
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
          <option value={MODELS.imageToImage.STABLE_DIFFUSION}>Stable Diffusion</option>
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

      {/* Сила преобразования */}
      <div>
        <label htmlFor="strength" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('form.strength')}
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            id="strength"
            min="0"
            max="1"
            step="0.05"
            value={strength}
            onChange={(e) => setStrength(Number(e.target.value))}
            className="w-full"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[2.5rem] text-center">
            {(strength * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Настройки генерации */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="numImages" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('form.numImages')}
          </label>
          <input
            type="number"
            id="numImages"
            min="1"
            max="4"
            value={numImages}
            onChange={(e) => setNumImages(Number(e.target.value))}
            className="input bg-white dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="outputFormat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('form.outputFormat')}
          </label>
          <select
            id="outputFormat"
            className="input bg-white dark:bg-gray-700 dark:text-white"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
          >
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
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

        {enableSafetyChecker && (
          <div>
            <label htmlFor="safetyTolerance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.safetyTolerance')}
            </label>
            <select
              id="safetyTolerance"
              className="input bg-white dark:bg-gray-700 dark:text-white"
              value={safetyTolerance}
              onChange={(e) => setSafetyTolerance(e.target.value as SafetyTolerance)}
            >
              <option value="1">{t('form.safetyLevels.strict')}</option>
              <option value="3">{t('form.safetyLevels.moderate')}</option>
              <option value="6">{t('form.safetyLevels.relaxed')}</option>
            </select>
          </div>
        )}
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

export default ImageToImageForm;