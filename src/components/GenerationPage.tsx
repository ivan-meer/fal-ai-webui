"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  MODELS, 
  ImageGenerationResult, 
  VideoGenerationResult,
  OutputFormat,
  ImageAspectRatio,
  SafetyTolerance,
  VideoResolution,
  VideoAspectRatio
} from '@/lib/fal-client';
import { Task } from '@/lib/task-queue';
import { 
  ImageHistoryItem, 
  VideoHistoryItem,
} from '@/lib/history-store';
import Header from './Header';
import TextToImageForm from './TextToImageForm';
import TextToVideoForm from './TextToVideoForm';
import { HistoryPanel } from './HistoryPanel';
import TaskQueuePanel from './TaskQueuePanel';
import CopyToClipboardButton from './common/CopyToClipboardButton';
import UseForGenerationButton from './common/UseForGenerationButton';
import { useTranslations } from '@/lib/useTranslations';
import ImageZoomModal from './common/ImageZoomModal';

type GenerationType = 'image' | 'video';

// 画像生成フォームの状態の型定義
interface ImageFormState {
  prompt: string;
  seed?: number;
  selectedModel: string;
  numImages: number;
  outputFormat: OutputFormat;
  aspectRatio: ImageAspectRatio;
  enableSafetyChecker: boolean;
  safetyTolerance: SafetyTolerance;
  rawMode: boolean;
}

// 動画生成フォームの状態の型定義
interface VideoFormState {
  prompt: string;
  seed?: number;
  selectedModel: string;
  resolution: VideoResolution;
  aspectRatio: VideoAspectRatio;
  inferenceSteps: number;
  enableSafetyChecker: boolean;
  enablePromptExpansion: boolean;
}

const GenerationPage: React.FC = () => {
  const { t } = useTranslations();
  
  // Common state
  const [generationType, setGenerationType] = useState<GenerationType>('image');
  const [activePanel, setActivePanel] = useState<'form' | 'history'>('form');
  const [imageResult, setImageResult] = useState<ImageGenerationResult | null>(null);
  const [videoResult, setVideoResult] = useState<VideoGenerationResult | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [formKey, setFormKey] = useState(0); // コンポーネントの強制再マウント用
  
  // フォームの状態を保持するためのステート
  const [imageFormState, setImageFormState] = useState<ImageFormState>({
    prompt: '',
    seed: undefined,
    selectedModel: MODELS.textToImage.FLUX1_1_PRO_ultra,
    numImages: 1,
    outputFormat: 'jpeg',
    aspectRatio: '3:4',
    enableSafetyChecker: false,
    safetyTolerance: '6',
    rawMode: false
  });
  
  const [videoFormState, setVideoFormState] = useState<VideoFormState>({
    prompt: '',
    seed: undefined,
    selectedModel: MODELS.textToVideo.WAN_T2V,
    resolution: '720p',
    aspectRatio: '16:9',
    inferenceSteps: 30,
    enableSafetyChecker: false,
    enablePromptExpansion: false
  });
  
  // 画像拡大モーダルの状態
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState('');
  
  // Reset the selected image index when the image result changes
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [imageResult]);
  
  // タスクを選択して結果を表示
  const handleSelectTask = (task: Task) => {
    if (task.status === 'completed' && task.result) {
      if (task.type === 'image' && task.result && 'images' in task.result) {
        setImageResult(task.result);
        setGenerationType('image');
        setSelectedImageIndex(0);
      } else if (task.type === 'video' && task.result && 'video' in task.result) {
        setVideoResult(task.result as VideoGenerationResult);
        setGenerationType('video');
      }
    }
  };
  
  // 履歴アイテムを選択したときの処理
  const handleSelectHistoryItem = (item: ImageHistoryItem | VideoHistoryItem) => {
    if (item.type === 'image') {
      setImageResult(item.result);
      setGenerationType('image');
      setSelectedImageIndex(0);
    } else if (item.type === 'video') {
      setVideoResult(item.result);
      setGenerationType('video');
    }
    setActivePanel('form');
  };

  // 結果表示コンポーネント
  const ResultDisplay = () => {
    if (generationType === 'image') {
      if (imageResult && imageResult.images && imageResult.images.length > 0) {
        return (
          <div>
            <div 
              className="relative aspect-square w-full mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-zoom-in"
              onClick={() => {
                setZoomedImageUrl(imageResult.images[selectedImageIndex].url);
                setIsZoomModalOpen(true);
              }}
            >
              <Image
                src={imageResult.images[selectedImageIndex].url}
                alt={`Generated image ${selectedImageIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
              />
            </div>
            
            {/* Image Gallery for Multiple Images */}
            {imageResult.images.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {imageResult.images.map((image, index) => (
                  <div 
                    key={index} 
                    className={`relative w-16 h-16 cursor-pointer rounded-md overflow-hidden border-2 ${
                      selectedImageIndex === index 
                        ? 'border-primary-500 dark:border-primary-400' 
                        : 'border-transparent'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <Image
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>{t('generation.result.seed')}: {imageResult.seed || t('generation.result.random')}</p>
              <p>{t('generation.result.resolution')}: {imageResult.images[selectedImageIndex].width}x{imageResult.images[selectedImageIndex].height}</p>
              <div className="mt-2">
                <p className="font-medium">{t('generation.result.prompt')}:</p>
                <div className="relative">
                  <p className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded-md max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {imageResult.prompt || t('generation.result.noPromptData')}
                  </p>
                  <div className="flex mt-2 gap-2">
                    <CopyToClipboardButton
                      text={imageResult.prompt || ''}
                      className="text-xs flex items-center px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                      buttonText={t('buttons.copy')}
                    />
                    <UseForGenerationButton
                      prompt={imageResult.prompt || ''}
                      onClick={usePromptForGeneration}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <a
                href={imageResult.images[selectedImageIndex].url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary w-full"
              >
                {t('buttons.downloadImage')}
              </a>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex justify-center items-center h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">{t('generation.result.willAppearHere')}</p>
          </div>
        );
      }
    } else {
      if (videoResult && videoResult.video && videoResult.video.url) {
        return (
          <div>
            <div className="aspect-video w-full mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <video
                src={videoResult.video.url}
                controls
                autoPlay
                loop
                muted
                className="w-full h-full"
              />
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>{t('generation.result.seed')}: {videoResult.seed || t('generation.result.random')}</p>
              <div className="mt-2">
                <p className="font-medium">{t('generation.result.prompt')}:</p>
                <div className="relative">
                  <p className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded-md max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {videoResult.prompt || t('generation.result.noPromptData')}
                  </p>
                  <div className="flex mt-2 gap-2">
                    <CopyToClipboardButton
                      text={videoResult.prompt || ''}
                      className="text-xs flex items-center px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                      buttonText={t('buttons.copy')}
                    />
                    <UseForGenerationButton
                      prompt={videoResult.prompt || ''}
                      onClick={usePromptForGeneration}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <a
                href={videoResult.video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary w-full"
                download
              >
                {t('buttons.downloadVideo')}
              </a>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex justify-center items-center h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">{t('generation.result.willAppearHere')}</p>
          </div>
        );
      }
    }
  };

  // プロンプトを生成フォームに適用する関数
  const usePromptForGeneration = (prompt: string) => {
    // TextToImageFormまたはTextToVideoFormコンポーネントにプロンプトを渡すための状態
    if (generationType === 'image') {
      // 現在の状態を保存
      localStorage.setItem('savedImagePrompt', prompt);
      // イメージフォームの状態を更新
      setImageFormState(prev => ({
        ...prev,
        prompt
      }));
    } else {
      localStorage.setItem('savedVideoPrompt', prompt);
      // ビデオフォームの状態を更新
      setVideoFormState(prev => ({
        ...prev,
        prompt
      }));
    }
    
    // フォームを強制的に再マウントするためにキーを更新
    setFormKey(prevKey => prevKey + 1);
    
    // アクティブパネルをフォームに切り替える
    setActivePanel('form');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        
        {/* メインナビゲーション - 改善版 */}
        <div className="mb-6">
          {/* メインタブナビゲーション - より大きく、明確に */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-4">
            <button
              className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all duration-200 ${
                activePanel === 'form'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750'
              }`}
              onClick={() => setActivePanel('form')}
            >
              <span className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('navigation.newGeneration')}
              </span>
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all duration-200 ${
                activePanel === 'history'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750'
              }`}
              onClick={() => setActivePanel('history')}
            >
              <span className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('navigation.history')}
              </span>
            </button>
          </div>
          
          {/* サブナビゲーション - 生成タイプの選択 (フォームパネルのみ表示) */}
          {activePanel === 'form' && (
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
              <div className="flex">
                <button
                  className={`relative py-3 px-6 font-medium text-sm focus:outline-none ${
                    generationType === 'image'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setGenerationType('image')}
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t('generationType.image')}
                  </span>
                  {generationType === 'image' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                  )}
                </button>
                <button
                  className={`relative py-3 px-6 font-medium text-sm focus:outline-none ${
                    generationType === 'video'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setGenerationType('video')}
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {t('generationType.video')}
                  </span>
                  {generationType === 'video' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* アクティブなパネルを表示 */}
        {activePanel === 'form' ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* 左側カラム: フォーム部分 */}
            <div className="xl:col-span-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                {generationType === 'image' ? (
                  <TextToImageForm 
                    onResultChange={setImageResult}
                    key={formKey}
                    initialState={imageFormState}
                    onStateChange={setImageFormState}
                  />
                ) : (
                  <TextToVideoForm 
                    onResultChange={setVideoResult}
                    key={formKey}
                    initialState={videoFormState}
                    onStateChange={setVideoFormState}
                  />
                )}
              </div>
              
              {/* タスクキュー部分を左側カラムの下に配置 - スマホでも表示されるように */}
              <div className="xl:hidden">
                <TaskQueuePanel onTaskSelected={handleSelectTask} />
              </div>
            </div>
            
            {/* 中央カラム: 結果表示エリア */}
            <div className="xl:col-span-5">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  {generationType === 'image' ? t('generation.result.imageTitle') : t('generation.result.videoTitle')}
                </h2>
                <ResultDisplay />
              </div>
            </div>
            
            {/* 右側カラム: タスクキュー部分 - デスクトップでのみ表示 */}
            <div className="hidden xl:block xl:col-span-3">
              <TaskQueuePanel onTaskSelected={handleSelectTask} />
            </div>
          </div>
        ) : (
          <HistoryPanel 
            onSelectHistoryItem={handleSelectHistoryItem} 
            onUsePrompt={usePromptForGeneration}
          />
        )}
      </div>

      {/* 画像拡大モーダル */}
      <ImageZoomModal 
        isOpen={isZoomModalOpen}
        onClose={() => setIsZoomModalOpen(false)}
        imageUrl={zoomedImageUrl}
      />
    </div>
  );
};

export default GenerationPage;
