import { ImageGenerationResult, VideoGenerationResult } from './fal-client';

// 履歴アイテムの共通インターフェース
export interface HistoryItemBase {
  id: string;
  timestamp: number;
  prompt: string;
  seed?: number;
  modelId: string;
}

// 画像生成履歴
export interface ImageHistoryItem extends HistoryItemBase {
  type: 'image';
  result: ImageGenerationResult;
  options: {
    aspectRatio: string;
    outputFormat: string;
    numImages: number;
    safetyTolerance: string;
    enableSafetyChecker: boolean;
    rawMode: boolean;
  };
}

// 動画生成履歴
export interface VideoHistoryItem extends HistoryItemBase {
  type: 'video';
  result: VideoGenerationResult;
  options: {
    resolution: string;
    aspectRatio: string;
    inferenceSteps: number;
    enableSafetyChecker: boolean;
    enablePromptExpansion: boolean;
  };
}

// 生成履歴アイテム
export type HistoryItem = ImageHistoryItem | VideoHistoryItem;

// ストレージキー
const IMAGE_HISTORY_KEY = 'fal-ai-image-history';
const VIDEO_HISTORY_KEY = 'fal-ai-video-history';

// 最大履歴数
const MAX_HISTORY_ITEMS = 99999;

/**
 * 画像生成履歴を追加
 */
export function addImageToHistory(
  prompt: string, 
  seed: number | undefined, 
  modelId: string, 
  result: ImageGenerationResult,
  options: ImageHistoryItem['options']
): void {
  if (typeof window === 'undefined') return;
  
  const historyItem: ImageHistoryItem = {
    id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    timestamp: Date.now(),
    type: 'image',
    prompt,
    seed,
    modelId,
    result,
    options
  };
  
  const history = getImageHistory();
  const updatedHistory = [historyItem, ...history].slice(0, MAX_HISTORY_ITEMS);
  
  localStorage.setItem(IMAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
}

/**
 * 画像生成履歴を取得
 */
export function getImageHistory(): ImageHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const history = localStorage.getItem(IMAGE_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to parse image history from localStorage:', error);
    return [];
  }
}

/**
 * 画像生成履歴を削除
 */
export function deleteImageFromHistory(id: string): void {
  if (typeof window === 'undefined') return;
  
  const history = getImageHistory();
  const updatedHistory = history.filter(item => item.id !== id);
  
  localStorage.setItem(IMAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
}

/**
 * 画像生成履歴をすべて削除
 */
export function clearImageHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(IMAGE_HISTORY_KEY);
}

/**
 * 動画生成履歴を追加
 */
export function addVideoToHistory(
  prompt: string, 
  seed: number | undefined, 
  modelId: string, 
  result: VideoGenerationResult,
  options: VideoHistoryItem['options']
): void {
  if (typeof window === 'undefined') return;
  
  const historyItem: VideoHistoryItem = {
    id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    timestamp: Date.now(),
    type: 'video',
    prompt,
    seed,
    modelId,
    result,
    options
  };
  
  const history = getVideoHistory();
  const updatedHistory = [historyItem, ...history].slice(0, MAX_HISTORY_ITEMS);
  
  localStorage.setItem(VIDEO_HISTORY_KEY, JSON.stringify(updatedHistory));
}

/**
 * 動画生成履歴を取得
 */
export function getVideoHistory(): VideoHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const history = localStorage.getItem(VIDEO_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to parse video history from localStorage:', error);
    return [];
  }
}

/**
 * 動画生成履歴を削除
 */
export function deleteVideoFromHistory(id: string): void {
  if (typeof window === 'undefined') return;
  
  const history = getVideoHistory();
  const updatedHistory = history.filter(item => item.id !== id);
  
  localStorage.setItem(VIDEO_HISTORY_KEY, JSON.stringify(updatedHistory));
}

/**
 * 動画生成履歴をすべて削除
 */
export function clearVideoHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(VIDEO_HISTORY_KEY);
}

/**
 * 全履歴を取得（画像と動画を時系列順で統合）
 */
export function getAllHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  const imageHistory = getImageHistory();
  const videoHistory = getVideoHistory();
  
  // 両方の履歴を結合し、タイムスタンプ順（新しい順）でソート
  return [...imageHistory, ...videoHistory]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_HISTORY_ITEMS);
}

/**
 * 全履歴を削除
 */
export function clearAllHistory(): void {
  if (typeof window === 'undefined') return;
  clearImageHistory();
  clearVideoHistory();
}

/**
 * 履歴アイテムを削除（タイプ問わず）
 */
export function deleteFromHistory(id: string): void {
  if (typeof window === 'undefined') return;
  
  // IDの接頭辞からタイプを特定
  if (id.startsWith('img_')) {
    deleteImageFromHistory(id);
  } else if (id.startsWith('vid_')) {
    deleteVideoFromHistory(id);
  }
}

/**
 * 履歴アイテムのフォーマット日時を取得
 */
export function getFormattedDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
} 