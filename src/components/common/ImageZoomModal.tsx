import React, { useEffect } from 'react';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  alt = 'Zoomed image'
}) => {
  // ESCキーでモーダルを閉じるためのイベントリスナー
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // モーダルを閉じる処理（イベント伝播を止める）
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation(); // 親要素へのイベント伝播を阻止
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4 cursor-zoom-out"
      onClick={handleClose}
    >
      <div 
        className="relative flex items-center justify-center"
        onClick={(e) => e.stopPropagation()} // モーダル本体のクリックでは閉じないように
      >
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={handleClose}
            className="text-white bg-black bg-opacity-40 rounded-full p-1 hover:bg-opacity-60 transition-all"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* 画像コンテナ - 適切なサイズに調整 */}
        <div className="max-w-[90vw] max-h-[85vh]">
          {/* 画像を実際のサイズに基づいて表示、かつビューポート内に収まるように制約 */}
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-[85vh] object-contain rounded-md"
            style={{
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageZoomModal; 