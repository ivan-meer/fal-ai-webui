"use client";

import React, { useState, useEffect } from 'react';
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

interface TextToImageFormProps {
  onResultChange?: (result: ImageGenerationResult | null) => void;
  initialState?: {
    prompt: string;
    seed?: number;
    selectedModel: string;
    numImages: number;
    outputFormat: OutputFormat;
    aspectRatio: ImageAspectRatio;
    enableSafetyChecker: boolean;
    safetyTolerance: SafetyTolerance;
    rawMode: boolean;
  };
  onStateChange?: (state: {
    prompt: string;
    seed?: number;
    selectedModel: string;
    numImages: number;
    outputFormat: OutputFormat;
    aspectRatio: ImageAspectRatio;
    enableSafetyChecker: boolean;
    safetyTolerance: SafetyTolerance;
    rawMode: boolean;
  }) => void;
}

const TextToImageForm: React.FC<TextToImageFormProps> = ({ 
  onResultChange, 
  initialState,
  onStateChange
}) => {
  const { t } = useTranslations();
  const [prompt, setPrompt] = useState(initialState?.prompt || '');
  const [seed, setSeed] = useState<number | undefined>(initialState?.seed);
  const [selectedModel, setSelectedModel] = useState(initialState?.selectedModel || MODELS.textToImage.FLUX1_1_PRO_ultra);
  const [numImages, setNumImages] = useState(initialState?.numImages || 1);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(initialState?.outputFormat || 'jpeg');
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>(initialState?.aspectRatio || '3:4');
  const [enableSafetyChecker, setEnableSafetyChecker] = useState(initialState?.enableSafetyChecker || false);
  const [safetyTolerance, setSafetyTolerance] = useState<SafetyTolerance>(initialState?.safetyTolerance || '6');
  const [rawMode, setRawMode] = useState(initialState?.rawMode || false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageGenerationResult | null>(null);
  const [activeTaskCount, setActiveTaskCount] = useState(0);

  // 状態が変更されたときに親コンポーネントに通知
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        prompt,
        seed,
        selectedModel,
        numImages,
        outputFormat,
        aspectRatio,
        enableSafetyChecker,
        safetyTolerance,
        rawMode
      });
    }
  }, [
    prompt, 
    seed, 
    selectedModel, 
    numImages, 
    outputFormat, 
    aspectRatio, 
    enableSafetyChecker, 
    safetyTolerance, 
    rawMode, 
    onStateChange
  ]);

  // LocalStorageからプロンプトを復元する
  useEffect(() => {
    const savedPrompt = localStorage.getItem('savedImagePrompt');
    if (savedPrompt && !initialState?.prompt) {
      setPrompt(savedPrompt);
      // 一度使ったら削除
      localStorage.removeItem('savedImagePrompt');
    }
  }, [initialState]);

  // モデルによって利用可能なサイズが異なるため、モデルが変更されたときにサイズを更新
  useEffect(() => {
    // 現在はモデル固有の条件分岐は不要ですが、将来的に必要になった場合のためのプレースホルダー
    if (selectedModel === MODELS.textToImage.FLUX1_1_PRO_ultra) {
      // モデル固有の設定があれば、ここで行います
    }
  }, [selectedModel]);
  
  // Send result to parent component when it changes
  useEffect(() => {
    if (onResultChange && result) {
      onResultChange(result);
    }
  }, [result, onResultChange]);

  // タスクキューの状態をモニターする
  useEffect(() => {
    const handleTasksUpdate = (tasks: Task[]) => {
      const imageTasks = tasks.filter(
        task => task.type === 'image' && 
        (task.status === 'pending' || task.status === 'in_queue' || task.status === 'in_progress')
      );
      setActiveTaskCount(imageTasks.length);
    };
    
    taskQueue.addListener(handleTasksUpdate);
    return () => taskQueue.removeListener(handleTasksUpdate);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    
    // フォームをリセットするかどうかのフラグ - 複数のリクエストを連続して投げる場合に便利
    const shouldResetForm = false;
    
    setError(null);
    
    try {
      // タスクキューに追加
      const options = {
        num_images: numImages,
        output_format: outputFormat,
        aspect_ratio: aspectRatio,
        enable_safety_checker: enableSafetyChecker,
        safety_tolerance: safetyTolerance,
        raw: rawMode,
        seed: seed
      };
      
      // タスクキューを使用して画像生成をキューに追加
      const task = taskQueue.addTask('image', prompt, selectedModel, options);
      
      // フォームをリセット（オプション）
      if (shouldResetForm) {
        setPrompt('');
        setSeed(undefined);
      }
      
      // このアプローチでは、結果が得られたときにリスナーで通知を受ける
      const checkTaskComplete = () => {
        const updatedTask = taskQueue.getTask(task.id);
        
        if (updatedTask?.status === 'completed' && updatedTask.result) {
          // 結果を設定
          const generationResult = updatedTask.result as ImageGenerationResult;
          setResult(generationResult);
          
          // 履歴に追加 - APIから返されたpromptを使用（もし利用可能なら）
          addImageToHistory(
            generationResult.prompt || prompt, // APIのpromptを優先
            seed,
            selectedModel,
            generationResult,
            {
              aspectRatio,
              outputFormat,
              numImages,
              safetyTolerance,
              enableSafetyChecker,
              rawMode
            }
          );
          
          clearInterval(intervalId);
        } else if (updatedTask?.status === 'failed') {
          setError(updatedTask.error || 'Failed to generate image');
          clearInterval(intervalId);
        }
      };
      
      // 定期的にタスクの完了をチェック
      const intervalId = setInterval(checkTaskComplete, 1000);
      
    } catch (err) {
      console.error('Error generating image:', err);
      setError('Failed to generate image. Please try again.');
      setIsGenerating(false);
    }
  };

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000));
  };

  const handleClearSeed = () => {
    setSeed(undefined);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('form.model')}
        </label>
        <select
          id="model"
          className="input bg-white dark:bg-gray-700 dark:text-white"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          <option value={MODELS.textToImage.FLUX1_1_PRO_ultra}>FLUX1.1 [pro] ultra</option>
          <option value={MODELS.textToImage.FLUX1_1_PRO}>FLUX1.1 [pro]</option>
        </select>
      </div>
      
      <div className="mb-4">
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
      
      <div className="mb-4">
        <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('form.aspectRatio')}
        </label>
        <select
          id="aspectRatio"
          className="input bg-white dark:bg-gray-700 dark:text-white"
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value as ImageAspectRatio)}
        >
          <option value="21:9">21:9 Ultra-Wide</option>
          <option value="16:9">16:9 Landscape</option>
          <option value="4:3">4:3 Standard</option>
          <option value="3:2">3:2 Photo</option>
          <option value="1:1">1:1 Square</option>
          <option value="2:3">2:3 Portrait</option>
          <option value="3:4">3:4 Portrait</option>
          <option value="9:16">9:16 Mobile</option>
          <option value="9:21">9:21 Ultra-Tall</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="numImages" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('form.numberOfImages')}
          </label>
          <select
            id="numImages"
            className="input bg-white dark:bg-gray-700 dark:text-white"
            value={numImages}
            onChange={(e) => setNumImages(Number(e.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
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

      <div className="mb-4">
        <label htmlFor="safetyTolerance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('form.safetyTolerance')}
        </label>
        <select
          id="safetyTolerance"
          className="input bg-white dark:bg-gray-700 dark:text-white"
          value={safetyTolerance}
          onChange={(e) => setSafetyTolerance(e.target.value as SafetyTolerance)}
        >
          <option value="1">1 (Most Strict)</option>
          <option value="2">2 </option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6 (Most Permissive)</option>
        </select>
      </div>
      
      <div className="mb-4">
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
            id="rawMode"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            checked={rawMode}
            onChange={(e) => setRawMode(e.target.checked)}
          />
          <label htmlFor="rawMode" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            {t('form.rawMode')}
          </label>
        </div>
      </div>
      
      <div className="mb-4">
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
      
      <button
        type="submit"
        disabled={!prompt.trim() || isGenerating}
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
      
      {error && (
        <div className="mt-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </form>
  );
};

export default TextToImageForm; 