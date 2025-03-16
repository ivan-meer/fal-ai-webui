import React, { useState } from 'react';
import Image from 'next/image';
import { 
  ImageHistoryItem, 
  VideoHistoryItem,
  getFormattedDate
} from '@/lib/history-store';
import CopyToClipboardButton from './common/CopyToClipboardButton';
import UseForGenerationButton from './common/UseForGenerationButton';
import { useTranslations } from '@/lib/useTranslations';
import ImageZoomModal from './common/ImageZoomModal';

interface HistoryDetailModalProps {
  item: ImageHistoryItem | VideoHistoryItem;
  onClose: () => void;
  onUseForGeneration: (prompt: string) => void;
}

const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({ 
  item, 
  onClose,
  onUseForGeneration,
}) => {
  const { t } = useTranslations();
  // For image items with multiple images
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // 画像拡大モーダルの状態
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState('');
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {item.type === 'image' ? t('history.details') + ' - ' + t('history.imageGeneration') : t('history.details') + ' - ' + t('history.videoGeneration')}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Left column - Media display */}
            <div className="flex flex-col h-full">
              <div 
                className={`relative w-full flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden ${item.type === 'image' ? 'cursor-zoom-in' : ''}`}
                style={{ minHeight: '300px' }} 
                onClick={() => {
                  if (item.type === 'image') {
                    setZoomedImageUrl(item.result.images[selectedImageIndex].url);
                    setIsZoomModalOpen(true);
                  }
                }}
              >
                {item.type === 'image' ? (
                  <Image
                    src={item.result.images[selectedImageIndex].url}
                    alt="Generated image"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain"
                  />
                ) : (
                  <video
                    src={item.result.video.url}
                    className="absolute inset-0 w-full h-full object-contain"
                    controls
                    autoPlay
                    loop
                    muted
                  />
                )}
              </div>
              
              {/* Image Gallery for Multiple Images */}
              {item.type === 'image' && item.result.images.length > 1 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {item.result.images.map((image, index) => (
                    <div 
                      key={index} 
                      className={`relative w-16 h-16 cursor-pointer rounded-md overflow-hidden border-2 ${
                        selectedImageIndex === index 
                          ? 'border-blue-500 dark:border-blue-400' 
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
            </div>
            
            {/* Right column - Details */}
            <div className="flex flex-col">
              {/* Metadata */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-gray-100">{t('history.details')}</h3>
                <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('history.generationDate')}</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{getFormattedDate(item.timestamp)}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('form.model')}</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{item.modelId}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('generation.result.seed')}</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {item.type === 'image' 
                        ? (item.result.seed !== undefined ? item.result.seed : t('generation.result.random'))
                        : (item.result.seed !== undefined ? item.result.seed : t('generation.result.random'))}
                    </div>
                  </div>
                  
                  {item.type === 'image' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('generation.result.resolution')}</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {item.result.images[selectedImageIndex].width}x{item.result.images[selectedImageIndex].height}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('form.aspectRatio')}</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{item.options.aspectRatio}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('form.outputFormat')}</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{item.options.outputFormat}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('form.safetyChecker')}</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {item.options.enableSafetyChecker ? t('common.enabled') : t('common.disabled')}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {item.type === 'video' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('form.resolution')}</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{item.options.resolution}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('form.aspectRatio')}</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{item.options.aspectRatio}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('form.inferenceSteps')}</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{item.options.inferenceSteps}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('form.safetyChecker')}</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {item.options.enableSafetyChecker ? t('common.enabled') : t('common.disabled')}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t('form.promptExpansion')}</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {item.options.enablePromptExpansion ? t('common.enabled') : t('common.disabled')}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Prompt */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-gray-100">{t('generation.result.prompt')}</h3>
                <div className="relative">
                  <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-lg max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                    {item.prompt}
                  </div>
                  <div className="flex mt-2 gap-2">
                    <CopyToClipboardButton
                      text={item.prompt}
                      className="text-xs flex items-center px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    />
                    
                    <UseForGenerationButton
                      prompt={item.prompt}
                      onClick={onUseForGeneration}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer with actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            {t('buttons.close')}
          </button>
        </div>
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

export default HistoryDetailModal; 