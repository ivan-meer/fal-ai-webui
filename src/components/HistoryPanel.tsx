// HistoryPanel.tsx - компонент для отображения истории запросов
import React from 'react';
import { ImageHistoryItem, VideoHistoryItem } from '@/lib/types';

interface HistoryPanelProps {
  onSelectHistoryItem: (item: ImageHistoryItem | VideoHistoryItem) => void;
  onUsePrompt: (prompt: string) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  onSelectHistoryItem,
  onUsePrompt,
}) => {
  const [history, setHistory] = React.useState<(ImageHistoryItem | VideoHistoryItem)[]>([]);

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
        История запросов
      </h3>
      {history.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          История пуста
        </p>
      ) : (
        <ul className="space-y-2">
          {history.map((entry) => (
            <li
              key={entry.id}
              className="flex justify-between items-center bg-white dark:bg-gray-700 p-3 rounded-md shadow-sm"
            >
              <div className="flex-1">
                <button
                  onClick={() => onSelectHistoryItem(entry)}
                  className="text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-gray-800 dark:text-gray-200"
                >
                  {entry.prompt}
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onUsePrompt(entry.prompt)}
                  className="p-2 text-green-600 hover:text-green-800 dark:hover:text-green-400 transition-colors"
                  aria-label="Повторить запрос"
                  title="Повторить запрос"
                >
                  ↻
                </button>
                <button
                  onClick={() => setHistory(prev => prev.filter(item => item.id !== entry.id))}
                  className="p-2 text-red-600 hover:text-red-800 dark:hover:text-red-400 transition-colors"
                  aria-label="Удалить запрос"
                  title="Удалить запрос"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
