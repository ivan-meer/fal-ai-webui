"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';

type NotificationType = 'success' | 'error';

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
  notification: {
    show: boolean;
    message: string;
    type: NotificationType;
  };
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: NotificationType;
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showNotification = (message: string, type: NotificationType = 'success') => {
    // 既存の通知を消す
    setNotification(prev => ({ ...prev, show: false }));
    
    // 新しい通知を少し遅延して表示（前の通知のフェードアウトが完了するまで待つ）
    setTimeout(() => {
      setNotification({
        show: true,
        message,
        type
      });
      
      // 3秒後に通知を消す
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    }, 300);
  };

  return (
    <NotificationContext.Provider value={{ showNotification, notification }}>
      {children}
      {notification.show && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 animate-fade-in">
          <div className={`p-4 rounded-lg shadow-lg flex items-center max-w-md mx-auto sm:mx-0 ${
            notification.type === 'success' 
              ? 'bg-green-50 border-l-4 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400' 
              : 'bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-400'
          }`}>
            <div className="mr-3 flex-shrink-0">
              {notification.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              className="ml-3 flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
              aria-label="閉じる"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};