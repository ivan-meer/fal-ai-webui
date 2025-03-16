// タイプ別のラベルを取得するヘルパー関数
export const getTypeLabel = (type: 'image' | 'video', t: (key: string) => string): { text: string; color: string } => {
  return type === 'image' 
    ? { text: t('generationType.image'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' }
    : { text: t('generationType.video'), color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
};

// ステータス別のラベルを取得するヘルパー関数
export const getStatusLabel = (status: string, t: (key: string) => string): { text: string; color: string } => {
  let statusKey: string;
  let colorClass: string;

  switch (status) {
    case 'in_progress':
      statusKey = 'status.inProgress';
      colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      break;
    case 'completed':
      statusKey = 'status.completed';
      colorClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      break;
    case 'failed':
      statusKey = 'status.failed';
      colorClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      break;
    case 'canceled':
      statusKey = 'status.cancelled';
      colorClass = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      break;
    case 'in_queue':
      statusKey = 'status.inQueue';
      colorClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      break;
    default:
      statusKey = 'status.pending';
      colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      break;
  }

  return { text: t(statusKey), color: colorClass };
}; 