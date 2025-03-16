import React from 'react';
import Modal from './Modal';
import { useTranslations } from '@/lib/useTranslations';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  confirmButtonClass = 'px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700'
}) => {
  const { t } = useTranslations();
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            {cancelText || t('buttons.cancel')}
          </button>
          <button 
            onClick={() => {
              onConfirm();
            }} 
            className={confirmButtonClass}
          >
            {confirmText || t('buttons.confirm')}
          </button>
        </>
      }
    >
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        {message}
      </p>
    </Modal>
  );
};

export default ConfirmationDialog; 