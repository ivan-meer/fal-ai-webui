// Типы для работы с историей запросов
export type HistoryItem = ImageHistoryItem | VideoHistoryItem;

export interface BaseHistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
}

export interface ImageHistoryItem extends BaseHistoryItem {
  type: 'image';
  imageUrl: string;
  width: number;
  height: number;
}

export interface VideoHistoryItem extends BaseHistoryItem {
  type: 'video';
  videoUrl: string;
  duration: number;
  thumbnailUrl: string;
}
