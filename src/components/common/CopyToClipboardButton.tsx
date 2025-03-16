import React from 'react';
import { useNotification } from './NotificationContext';
import { useTranslations } from '@/lib/useTranslations';

interface CopyToClipboardButtonProps {
  text: string;
  onCopy?: () => void;
  className?: string;
  icon?: boolean;
  buttonText?: string;
  stopPropagation?: boolean;
}

const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({
  text,
  onCopy,
  className = "text-xs flex items-center px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600",
  icon = true,
  buttonText,
  stopPropagation = false
}) => {
  const { showNotification } = useNotification();
  const { t } = useTranslations();
  
  const handleCopy = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    
    navigator.clipboard.writeText(text)
      .then(() => {
        showNotification(t('notifications.promptCopied'), 'success');
        if (onCopy) onCopy();
      })
      .catch(err => {
        console.error(t('notifications.promptCopyFailed'), err);
        showNotification(t('notifications.promptCopyFailed'), 'error');
      });
  };

  return (
    <button
      onClick={handleCopy}
      className={className}
    >
      {icon && (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
      )}
      {buttonText || t('buttons.copy')}
    </button>
  );
};

export default CopyToClipboardButton; 