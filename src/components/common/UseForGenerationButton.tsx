import React from 'react';
import { useTranslations } from '@/lib/useTranslations';

interface UseForGenerationButtonProps {
  prompt: string;
  onClick?: (prompt: string) => void;
  className?: string;
  buttonText?: string;
  stopPropagation?: boolean;
  icon?: boolean;
}

const UseForGenerationButton: React.FC<UseForGenerationButtonProps> = ({
  prompt,
  onClick,
  className = "text-xs flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800",
  buttonText,
  stopPropagation = true,
  icon = true
}) => {
  const { t } = useTranslations();
  
  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    
    if (onClick) {
      onClick(prompt);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={className}
    >
      {icon && (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
      {buttonText || t('buttons.useForGeneration')}
    </button>
  );
};

export default UseForGenerationButton; 