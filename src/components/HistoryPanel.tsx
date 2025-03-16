import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  getImageHistory, 
  getVideoHistory, 
  getAllHistory,
  deleteFromHistory,
  clearImageHistory,
  clearVideoHistory,
  clearAllHistory,
  getFormattedDate,
  ImageHistoryItem,
  VideoHistoryItem,
  HistoryItem
} from '@/lib/history-store';
import HistoryDetailModal from './HistoryDetailModal';
import CopyToClipboardButton from './common/CopyToClipboardButton';
import UseForGenerationButton from './common/UseForGenerationButton';
import { useTranslations } from '@/lib/useTranslations';

interface HistoryPanelProps {
  type?: 'image' | 'video' | 'all'; // Add 'all' as a new option for unified history
  onSelectHistoryItem?: (item: ImageHistoryItem | VideoHistoryItem) => void;
  onUsePrompt?: (prompt: string) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ type = 'all', onSelectHistoryItem, onUsePrompt }) => {
  const { t } = useTranslations();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  
  // Confirmation dialog states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
    
  // Add state for selected history item for detailed view
  const [detailItem, setDetailItem] = useState<HistoryItem | null>(null);
  
  // 履歴を読み込む - type または filterType が変更されたときに再読み込み
  useEffect(() => {
    loadHistory();
  }, [type, filterType]);
  
  // 履歴を更新する
  const loadHistory = () => {
    let items: HistoryItem[] = [];
    
    if (type === 'image') {
      items = getImageHistory();
    } else if (type === 'video') {
      items = getVideoHistory();
    } else {
      // Get combined history if type is 'all'
      items = getAllHistory();
      
      // Apply filtering if needed
      if (filterType !== 'all') {
        items = items.filter(item => item.type === filterType);
      }
    }
    
    setHistoryItems(items);
  };
  
  // 履歴アイテムを削除
  const handleDelete = (item: HistoryItem) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };
  
  // 確認後、アイテムを削除
  const confirmDelete = () => {
    if (itemToDelete) {
      deleteFromHistory(itemToDelete.id);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      loadHistory();
    }
  };
  
  // 履歴をすべて削除
  const handleClearAll = () => {
    setShowClearAllConfirm(true);
  };
  
  // 確認後、すべてを削除
  const confirmClearAll = () => {
    if (type === 'image') {
      clearImageHistory();
    } else if (type === 'video') {
      clearVideoHistory();
    } else {
      // If filtering is active, only clear the filtered type
      if (filterType === 'image') {
        clearImageHistory();
      } else if (filterType === 'video') {
        clearVideoHistory();
      } else {
        clearAllHistory();
      }
    }
    setShowClearAllConfirm(false);
    loadHistory();
  };
  
  // 履歴アイテムを選択: open detail modal
  const handleSelect = (item: HistoryItem) => {
    setDetailItem(item);
  };

  // フィルターを変更
  const handleFilterChange = (newFilter: 'all' | 'image' | 'video') => {
    setFilterType(newFilter);
  };

  // 履歴タイプに基づくラベル
  const getTypeLabel = (type: 'image' | 'video', t: (key: string) => string): { text: string; color: string } => {
    return type === 'image' 
      ? { text: t('generationType.image'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' }
      : { text: t('generationType.video'), color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
  };
  
  // 空の履歴表示用コンポーネント
  const EmptyHistoryMessage = () => (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M8 12h.01M12 12h.01M16 12h.01M20 12h.01" />
      </svg>
      <p className="text-gray-600 dark:text-gray-400 mb-1">
        {filterType === 'image' ? t('generationType.image') : filterType === 'video' ? t('generationType.video') : t('generation.result')}
        {t('history.noHistory')}
      </p>
      {filterType !== 'all' && (
        <p className="text-sm text-gray-500 dark:text-gray-500">
          {t('history.selectAll')}
        </p>
      )}
    </div>
  );
  
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{t('navigation.history')}</h2>
        
        <div className="flex gap-2">
          {/* 表示切替タブ - 改善版 */}
          <div className="flex bg-gray-100 dark:bg-gray-750 rounded-lg p-1">
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                view === 'grid'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                {t('history.gridView')}
              </span>
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                view === 'list'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {t('history.listView')}
              </span>
            </button>
          </div>
          
          {/* 履歴フィルタータブ - 実装 */}
          {type === 'all' && (
            <div className="hidden sm:flex bg-gray-100 dark:bg-gray-750 rounded-lg p-1">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                  filterType === 'all'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span className="flex items-center justify-center">
                  {t('history.allItems')}
                </span>
              </button>
              <button
                onClick={() => handleFilterChange('image')}
                className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                  filterType === 'image'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span className="flex items-center justify-center">
                  {t('generationType.image')}
                </span>
              </button>
              <button
                onClick={() => handleFilterChange('video')}
                className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                  filterType === 'video'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span className="flex items-center justify-center">
                  {t('generationType.video')}
                </span>
              </button>
            </div>
          )}
          
          {/* クリアボタン */}
          <button
            onClick={handleClearAll}
            className="px-3 py-1 rounded-md text-sm flex items-center bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t('history.clearHistory')}
          </button>
        </div>
      </div>
      
      {/* グリッド表示 */}
      {view === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {historyItems.length > 0 ? (
            historyItems.map(item => (
              <div 
                key={item.id} 
                className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden hover:shadow-md transition-shadow relative group"
                onClick={() => handleSelect(item)}
              >
                {/* サムネイル部分 */}
                <div 
                  className="relative aspect-square cursor-pointer overflow-hidden bg-gray-100 dark:bg-gray-700"
                >
                  {item.type === 'image' ? (
                    <>
                      <Image
                        src={item.result.images[0].url}
                        alt="Generated image"
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        className="object-cover transition-transform hover:scale-105"
                      />
                      {/* 複数画像インジケーター */}
                      {item.result.images.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs font-medium rounded-md px-1.5 py-0.5 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {item.result.images.length}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center relative">
                      <video
                        src={item.result.video.url}
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                        onMouseOver={e => e.currentTarget.play()}
                        onMouseOut={e => e.currentTarget.pause()}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  
                  {/* タイプラベル */}
                  <div className="absolute top-2 left-2">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md ${getTypeLabel(item.type, t).color}`}>
                      {getTypeLabel(item.type, t).text}
                    </span>
                  </div>
                  
                  {/* クリック促進オーバーレイ */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity">
                  </div>
                </div>
                
                {/* 情報部分 */}
                <div className="p-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <div className="truncate">
                      {getFormattedDate(item.timestamp)}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item);
                        }}
                        className="text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title={t('buttons.delete')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* プロンプトのプレビュー（簡略化） */}
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{item.prompt}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <EmptyHistoryMessage />
            </div>
          )}
        </div>
      )}
      
      {/* リスト表示 */}
      {view === 'list' && (
        <div className="space-y-4">
          {historyItems.length > 0 ? (
            historyItems.map(item => (
              <div 
                key={item.id} 
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                onClick={() => handleSelect(item)}
              >
                <div className="flex gap-4">
                  {/* サムネイル */}
                  <div className="flex-shrink-0">
                    <div className="relative w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                      {item.type === 'image' ? (
                        <>
                          <Image
                            src={item.result.images[0].url}
                            alt="Generated image"
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                          {/* 複数画像インジケーター (リスト表示用) */}
                          {item.result.images.length > 1 && (
                            <div className="absolute top-1 right-1 bg-black bg-opacity-70 text-white text-xs font-medium rounded-md px-1 py-0.5 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {item.result.images.length}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full bg-black flex items-center justify-center relative">
                          <video
                            src={item.result.video.url}
                            className="absolute inset-0 w-full h-full object-cover"
                            muted
                            onMouseOver={e => e.currentTarget.play()}
                            onMouseOut={e => e.currentTarget.pause()}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 情報部分 */}
                  <div className="flex-1 min-w-0">
                    {/* ヘッダー */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md ${getTypeLabel(item.type, t).color}`}>
                          {getTypeLabel(item.type, t).text}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getFormattedDate(item.timestamp)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item);
                        }}
                        className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* プロンプト */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">{item.prompt}</p>
                    
                    {/* アクションボタン */}
                    <div className="flex gap-2">
                      <CopyToClipboardButton
                        text={item.prompt}
                        className="text-xs flex items-center px-2 py-1 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        buttonText={t('buttons.copyPrompt')}
                        stopPropagation={true}
                      />
                      
                      {onUsePrompt && (
                        <UseForGenerationButton
                          prompt={item.prompt}
                          onClick={onUsePrompt}
                          stopPropagation={true}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyHistoryMessage />
          )}
        </div>
      )}
      
      {/* Confirmation Modal for Item Deletion */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-auto">
            <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-gray-100">{t('history.deleteConfirmTitle')}</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {itemToDelete?.type === 'image' ? t('generationType.image') : t('generationType.video')}{t('history.deleteConfirmMessage')}
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setItemToDelete(null);
                }} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {t('buttons.cancel')}
              </button>
              <button 
                onClick={confirmDelete} 
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                {t('buttons.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Modal for Clear All */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-auto">
            <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-gray-100">{t('history.clearAllConfirmTitle')}</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {filterType === 'image' 
                ? t('history.clearAllImageConfirmMessage')
                : filterType === 'video' 
                  ? t('history.clearAllVideoConfirmMessage')
                  : t('history.clearAllConfirmMessage')}
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowClearAllConfirm(false)} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {t('buttons.cancel')}
              </button>
              <button 
                onClick={confirmClearAll} 
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                {t('buttons.deleteAll')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Detail Modal if an item is selected */}
      {detailItem && (
        <HistoryDetailModal 
          item={detailItem} 
          onClose={() => setDetailItem(null)} 
          onUseForGeneration={(prompt: string) => {
            if (onUsePrompt) {
              onUsePrompt(prompt);
            } else if (onSelectHistoryItem) {
              onSelectHistoryItem(detailItem);
            }
            setDetailItem(null);
          }}
        />
      )}
    </div>
  );
};

export default HistoryPanel; 