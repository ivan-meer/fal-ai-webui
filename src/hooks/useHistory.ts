// Хук для работы с историей генераций
import { useState, useEffect } from 'react';
import { FalClient } from '@/lib/fal-client';
import { HistoryItem } from '@/lib/types';

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка истории при монтировании
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await FalClient.getHistory();
        setHistory(data);
      } catch (err) {
        setError('Ошибка загрузки истории');
        console.error('History load error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadHistory();
  }, []);

  // Удаление элемента истории
  const deleteItem = async (id: string) => {
    try {
      await FalClient.deleteHistoryItem(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError('Ошибка удаления записи');
      console.error('Delete history error:', err);
    }
  };

  return {
    history,
    loading,
    error,
    deleteItem
  };
};
