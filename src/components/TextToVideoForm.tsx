/**
 * @module TextToVideoForm
 * @description Компонент формы для генерации видео на основе текстового описания.
 * Поддерживает настройку различных параметров генерации, включая разрешение,
 * соотношение сторон, количество шагов вывода и другие опции.
 *
 * @component
 * @example
 * ```tsx
 * <TextToVideoForm
 *   onResultChange={(result) => console.log(result)}
 *   initialState={{
 *     prompt: "A beautiful sunset over the ocean",
 *     resolution: "720p",
 *     aspectRatio: "16:9",
 *     inferenceSteps: 30
 *   }}
 *   onStateChange={(state) => console.log(state)}
 * />
 * ```
 */

// TODO: Добавить предпросмотр кадров видео во время генерации
// TODO: Реализовать возможность редактирования отдельных кадров
// TODO: Добавить поддержку различных форматов экспорта видео
// TODO: Оптимизировать процесс генерации для длинных видео
// TODO: Реализовать систему очереди для массовой генерации

"use client";

import React, { useState, useEffect } from 'react';
import { 
  MODELS, 
  VideoGenerationResult,
  VideoResolution,
  VideoAspectRatio
} from '@/lib/fal-client';
import { taskQueue, Task } from '@/lib/task-queue';
import { addVideoToHistory } from '@/lib/history-store';
import { useTranslations } from '@/lib/useTranslations';

interface TextToVideoFormProps {
  onResultChange?: (result: VideoGenerationResult | null) => void;
  initialState?: {
    prompt: string;
    seed?: number;
    selectedModel: string;
    resolution: VideoResolution;
    aspectRatio: VideoAspectRatio;
    inferenceSteps: number;
    enableSafetyChecker: boolean;
    enablePromptExpansion: boolean;
  };
  onStateChange?: (state: {
    prompt: string;
    seed?: number;
    selectedModel: string;
    resolution: VideoResolution;
    aspectRatio: VideoAspectRatio;
    inferenceSteps: number;
    enableSafetyChecker: boolean;
    enablePromptExpansion: boolean;
  }) => void;
}

const TextToVideoForm: React.FC<TextToVideoFormProps> = ({ 
  onResultChange, 
  initialState,
  onStateChange
}) => {
  const { t } = useTranslations();
  const [prompt, setPrompt] = useState(initialState?.prompt || '');
  const [seed, setSeed] = useState<number | undefined>(initialState?.seed);
  const [selectedModel, setSelectedModel] = useState(initialState?.selectedModel || MODELS.textToVideo.WAN_T2V);
  const [resolution, setResolution] = useState<VideoResolution>(initialState?.resolution || '720p');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>(initialState?.aspectRatio || '16:9');
  const [inferenceSteps, setInferenceSteps] = useState(initialState?.inferenceSteps || 30);
  const [enableSafetyChecker, setEnableSafetyChecker] = useState(initialState?.enableSafetyChecker || false);
  const [enablePromptExpansion, setEnablePromptExpansion] = useState(initialState?.enablePromptExpansion || false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoGenerationResult | null>(null);
  const [activeTaskCount, setActiveTaskCount] = useState(0);

  // 状態が変更されたときに親コンポーネントに通知
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        prompt,
        seed,
        selectedModel,
        resolution,
        aspectRatio,
        inferenceSteps,
        enableSafetyChecker,
        enablePromptExpansion
      });
    }
  }, [
    prompt, 
    seed, 
    selectedModel, 
    resolution, 
    aspectRatio, 
    inferenceSteps, 
    enableSafetyChecker, 
    enablePromptExpansion,
    onStateChange
  ]);

  // LocalStorageからプロンプトを復元する
  useEffect(() => {
    const savedPrompt = localStorage.getItem('savedVideoPrompt');
    if (savedPrompt && !initialState?.prompt) {
      setPrompt(savedPrompt);
      // 一度使ったら削除
      localStorage.removeItem('savedVideoPrompt');
    }
  }, [initialState]);

  // Send result to parent component when it changes
  useEffect(() => {
    if (onResultChange && result) {
      onResultChange(result);
    }
  }, [result, onResultChange]);

  // タスクキューの状態をモニターする
  useEffect(() => {
    const handleTasksUpdate = (tasks: Task[]) => {
      const videoTasks = tasks.filter(
        task => task.type === 'text-to-video' &&
        (task.status === 'pending' || task.status === 'in_queue' || task.status === 'in_progress')
      );
      setActiveTaskCount(videoTasks.length);
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
        resolution,
        aspect_ratio: aspectRatio,
        inference_steps: inferenceSteps,
        enable_safety_checker: enableSafetyChecker,
        enable_prompt_expansion: enablePromptExpansion,
        seed: seed
      };
      
      // タスクキューを使用して動画生成をキューに追加
      const task = taskQueue.addTask('video', prompt, selectedModel, options);
      
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
          const generationResult = updatedTask.result as VideoGenerationResult;
          setResult(generationResult);
          
          // 履歴に追加 - APIから返されたpromptを使用（もし利用可能なら）
          addVideoToHistory(
            generationResult.prompt || prompt, // APIのpromptを優先
            seed,
            selectedModel,
            generationResult,
            {
              resolution,
              aspectRatio,
              inferenceSteps,
              enableSafetyChecker,
              enablePromptExpansion
            }
          );
          
          clearInterval(intervalId);
        } else if (updatedTask?.status === 'failed') {
          setError(updatedTask.error || 'Failed to generate video');
          clearInterval(intervalId);
        }
      };
      
      // 定期的にタスクの完了をチェック
      const intervalId = setInterval(checkTaskComplete, 1000);
      
    } catch (err) {
      console.error('Error generating video:', err);
      setError('Failed to generate video. Please try again.');
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
          <option value={MODELS.textToVideo.WAN_T2V}>Wan-2.1 Text-to-Video</option>
          <option value={MODELS.textToVideo.WAN_T2V_1_3B}>Wan-2.1 Text-to-Video 1.3B</option>
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

      <div className="grid grid-cols-2 gap-4 mb-4">
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

      <div className="mb-4">
        <label htmlFor="inferenceSteps" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('form.inferenceSteps')}
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            id="inferenceSteps"
            min="10"
            max="50"
            step="1"
            value={inferenceSteps}
            onChange={(e) => setInferenceSteps(Number(e.target.value))}
            className="w-full"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[2.5rem] text-center">
            {inferenceSteps}
          </span>
        </div>
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

export default TextToVideoForm;