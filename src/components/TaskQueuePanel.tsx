import React, { useEffect, useState } from 'react';
import { Task, taskQueue, TaskStatus } from '@/lib/task-queue';
import { getFormattedDate } from '@/lib/history-store';
import { getStatusLabel } from '../lib/ui-helpers';
import { useTranslations } from '@/lib/useTranslations';

interface TaskQueuePanelProps {
  onTaskSelected?: (task: Task) => void;
}

const TaskQueuePanel: React.FC<TaskQueuePanelProps> = ({ 
  onTaskSelected
}) => {
  const { t } = useTranslations();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // タスクキューのイベントリスナーを設定
  useEffect(() => {
    const handleTasksUpdate = (updatedTasks: Task[]) => {
      setTasks(updatedTasks);
    };
    
    // リスナーを登録
    taskQueue.addListener(handleTasksUpdate);
    
    // 初期タスクを取得
    setTasks(taskQueue.getAllTasks());
    
    // クリーンアップ
    return () => {
      taskQueue.removeListener(handleTasksUpdate);
    };
  }, []);
  
  // タスクをキャンセル
  const handleCancelTask = async (taskId: string) => {
    await taskQueue.cancelTask(taskId);
  };
  
  // タスクをクリア（UIから削除）
  const handleClearTask = (taskId: string) => {
    taskQueue.clearTask(taskId);
  };
  
  // 完了したタスクをすべてクリア
  const handleClearCompleted = () => {
    taskQueue.clearCompletedTasks();
  };
  
  // タスクの種類に基づくラベル
  const getTaskTypeLabel = (type: 'image' | 'video'): string => {
    return type === 'image' ? t('generationType.image') : t('generationType.video');
  };
  
  // プログレスバーのスタイル
  const getProgressStyle = (task: Task) => {
    if (task.status === 'completed') return 'bg-green-500';
    if (task.status === 'failed') return 'bg-red-500';
    if (task.status === 'in_progress') return 'bg-blue-500';
    if (task.status === 'in_queue') return 'bg-amber-500';
    if (task.status === 'pending') return 'bg-gray-500';
    return 'bg-gray-300'; // Default fallback
  };
  
  // タスクを選択
  const handleSelectTask = (task: Task) => {
    if (task.status === 'completed' && onTaskSelected) {
      onTaskSelected(task);
      
      // タスクを選択したら、自動的にタスクキューから削除
      setTimeout(() => {
        handleClearTask(task.id);
      }, 500); // 少し遅延して削除することで、UI遷移をスムーズにする
    }
  };
  
  if (tasks.length === 0) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">{t('taskQueue.title')}</h2>
        <p className="text-gray-500 dark:text-gray-400">{t('taskQueue.noActiveTasks')}</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{t('taskQueue.title')}</h2>
        {tasks.some(t => t.status === 'completed' || t.status === 'failed') && (
          <button 
            onClick={handleClearCompleted}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {t('taskQueue.clearCompleted')}
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {tasks.map(task => (
          <div 
            key={task.id} 
            className={`border border-gray-200 dark:border-gray-700 rounded-lg p-3 ${
              task.status === 'completed' ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750' : ''
            }`}
            onClick={() => task.status === 'completed' ? handleSelectTask(task) : null}
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className={`inline-block px-2 py-1 text-xs rounded mr-2 ${getStatusLabel(task.status, t).color}`}>
                  {getStatusLabel(task.status, t).text}
                </span>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {getTaskTypeLabel(task.type)}
                </span>
              </div>
              <div className="flex gap-2">
                {/* {(task.status === 'pending' || task.status === 'in_queue') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelTask(task.id);
                    }}
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 px-2 py-1"
                  >
                    {t('taskQueue.cancel')}
                  </button>
                )} */}
                {(task.status == 'completed' || task.status == 'failed' || task.error) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearTask(task.id);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 px-2 py-1"
                  >
                    {t('taskQueue.delete')}
                  </button>
                )}
              </div>
            </div>
            
            <div className="mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{task.prompt}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getFormattedDate(task.startTime)}
                {task.endTime && ` - ${getFormattedDate(task.endTime)}`}
              </p>
            </div>
            
            {/* プログレスバー */}
            {task.status !== 'pending' && (
              <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full ${getProgressStyle(task)}`} 
                  style={{ width: `${task.progress || 0}%` }}
                ></div>
              </div>
            )}
            
            {/* タスク完了の場合、クリックして表示するように促す */}
            {task.status === 'completed' && (
              <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                {t('taskQueue.clickToViewResult')}
              </div>
            )}
            
            {/* エラーメッセージ */}
            {task.error && (
              <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                {task.error}
              </div>
            )}
            
            {/* ログ */}
            {task.logs && task.logs.length > 0 && (
              <div className="mt-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-md max-h-24 overflow-y-auto">
                {task.logs.map((log, i) => (
                  <p key={i} className="text-xs text-gray-700 dark:text-gray-300 font-mono">{log}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskQueuePanel; 