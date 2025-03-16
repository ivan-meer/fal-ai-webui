import { fal } from '@fal-ai/client';
import { generateImage, generateVideo } from './fal-client';

// タスクの状態
export type TaskStatus = 'pending' | 'in_queue' | 'in_progress' | 'completed' | 'failed';

// タスクの種類
export type TaskType = 'image' | 'video';

// タスク更新リスナー型
export type TaskUpdateListener = (tasks: Task[]) => void;

// タスクインターフェース
export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  prompt: string;
  modelId: string;
  requestId?: string;
  error?: string;
  progress?: number;
  logs?: string[];
  result?: any;
  startTime: number;
  endTime?: number;
  options: Record<string, any>;
}

// Fal.ai API キューのステータスレスポンス型
interface FalQueueStatus {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  logs?: Array<{ message: string; level?: string; timestamp?: string }>;
  queue_position?: number;
}

/**
 * タスクキューマネージャー
 * 複数の生成タスクを追跡・管理するためのシングルトンクラス
 */
class TaskQueueManager {
  private tasks: Task[] = [];
  private listeners: TaskUpdateListener[] = [];
  private activeTaskCount = 0;
  private maxConcurrentTasks = 2; // 同時処理可能なタスク数
  
  /**
   * タスクをキューに追加
   */
  addTask(type: TaskType, prompt: string, modelId: string, options: Record<string, any>): Task {
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      status: 'pending',
      prompt,
      modelId,
      startTime: Date.now(),
      options
    };
    
    this.tasks.unshift(task); // 新しいタスクを先頭に追加
    this.notifyListeners();
    
    // ペンディングタスクの処理を開始
    this.processNextTasks();
    
    return task;
  }
  
  /**
   * ペンディング状態のタスクの処理を開始
   */
  private processNextTasks(): void {
    // 同時実行数の制限を考慮
    const pendingTasks = this.tasks.filter(task => task.status === 'pending');
    
    // アクティブタスク数が上限未満の場合のみ新たなタスクを開始
    const tasksToStart = pendingTasks.slice(0, this.maxConcurrentTasks - this.activeTaskCount);
    
    tasksToStart.forEach(task => {
      this.startTask(task);
    });
  }
  
  /**
   * タスクの処理を開始
   */
  private async startTask(task: Task): Promise<void> {
    this.activeTaskCount++;
    
    // タスクを「キュー内」状態に更新
    this.updateTask(task.id, {
      status: 'in_queue'
    });
    
    try {
      // デバッグ用: リクエストに含まれるオプションを出力
      console.log('Task request options:', { prompt: task.prompt, ...task.options });
      
      // Fal.ai APIのqueueを使用してリクエストを送信
      const { request_id } = await fal.queue.submit(task.modelId, {
        input: { prompt: task.prompt, ...task.options }
      });
      
      // リクエストIDを設定
      this.updateTask(task.id, {
        requestId: request_id
      });
      
      // ステータスの定期チェックを開始
      this.pollTaskStatus(task.id, request_id);
    } catch (error) {
      this.updateTask(task.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        endTime: Date.now()
      });
      
      this.activeTaskCount--;
      this.processNextTasks(); // 次のタスクの処理を試行
    }
  }
  
  /**
   * タスクの状態を定期的にポーリング
   */
  private async pollTaskStatus(taskId: string, requestId: string): Promise<void> {
    const task = this.getTask(taskId);
    if (!task) return;
    
    try {
      // キューのステータスを取得
      const status = await fal.queue.status(task.modelId, {
        requestId,
        logs: true
      }) as unknown as FalQueueStatus;
      
      // ステータスに基づいてタスク情報を更新
      if (status.status === 'IN_QUEUE') {
        this.updateTask(taskId, {
          status: 'in_queue',
          progress: 0
        });
      } else if (status.status === 'IN_PROGRESS') {
        // ログがあれば表示
        const logs = status.logs?.map(log => log.message) || [];
        
        this.updateTask(taskId, {
          status: 'in_progress',
          progress: 50, // 進行中はとりあえず50%と表示
          logs
        });
      } else if (status.status === 'COMPLETED') {
        // 完了したらfal.queue.resultで結果を取得
        const result = await fal.queue.result(task.modelId, { requestId });
        
        // 結果オブジェクトにプロンプトを追加（APIレスポンスにプロンプトがない場合）
        const resultData = result.data;
        if (task.type === 'video' && !resultData.prompt) {
          // 動画生成の場合、APIレスポンスにプロンプトがないので追加する
          resultData.prompt = task.prompt;
        }
        
        this.updateTask(taskId, {
          status: 'completed',
          progress: 100,
          result: resultData,
          endTime: Date.now()
        });
        
        this.activeTaskCount--;
        this.processNextTasks(); // 次のタスクの処理を試行
        return; // ポーリングを停止
      } else if (status.status === 'FAILED') {
        const errorMessage = status.logs?.map(log => log.message).join('\n') || 'Task failed';
        
        this.updateTask(taskId, {
          status: 'failed',
          error: errorMessage,
          endTime: Date.now()
        });
        
        this.activeTaskCount--;
        this.processNextTasks(); // 次のタスクの処理を試行
        return; // ポーリングを停止
      }
      
      // 完了または失敗するまで引き続きポーリング
      setTimeout(() => this.pollTaskStatus(taskId, requestId), 2000);
    } catch (error) {
      this.updateTask(taskId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to poll task status',
        endTime: Date.now()
      });
      
      this.activeTaskCount--;
      this.processNextTasks(); // 次のタスクの処理を試行
    }
  }
  
  /**
   * タスク情報を更新
   */
  private updateTask(taskId: string, updates: Partial<Task>): void {
    const index = this.tasks.findIndex(task => task.id === taskId);
    if (index === -1) return;
    
    this.tasks[index] = { ...this.tasks[index], ...updates };
    this.notifyListeners();
  }
  
  /**
   * タスクをキャンセル
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.getTask(taskId);
    if (!task || !task.requestId || task.status === 'completed' || task.status === 'failed') {
      return false;
    }
    
    try {
      // fal クライアントを使用してキャンセルリクエストを送信
      await fal.queue.cancel(task.modelId, {
        requestId: task.requestId
      });
      
      this.updateTask(taskId, {
        status: 'failed',
        error: 'Task cancelled by user',
        endTime: Date.now()
      });
      
      if (task.status !== 'pending') {
        this.activeTaskCount--;
        this.processNextTasks(); // 次のタスクの処理を試行
      }
      
      return true;
    } catch (error) {
      console.error('Failed to cancel task:', error);
      return false;
    }
  }
  
  /**
   * タスクの情報を取得
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.find(task => task.id === taskId);
  }
  
  /**
   * すべてのタスクを取得
   */
  getAllTasks(): Task[] {
    return [...this.tasks];
  }
  
  /**
   * タスクをクリア（UIからの表示のみ削除、実際の処理はキャンセルされない）
   */
  clearTask(taskId: string): void {
    const task = this.getTask(taskId);
    if (!task) return;
    
    // アクティブタスクの場合はカウントを減らす
    if (task.status === 'in_queue' || task.status === 'in_progress') {
      this.activeTaskCount--;
    }
    
    // タスクを削除
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.notifyListeners();
    
    // 新しいタスクを処理できるようになったので次のタスクを処理
    this.processNextTasks();
  }
  
  /**
   * 完了またはエラーになったタスクをクリア
   */
  clearCompletedTasks(): void {
    this.tasks = this.tasks.filter(task => 
      task.status !== 'completed' && task.status !== 'failed'
    );
    this.notifyListeners();
  }
  
  /**
   * リスナーを登録
   */
  addListener(listener: TaskUpdateListener): void {
    this.listeners.push(listener);
  }
  
  /**
   * リスナーを削除
   */
  removeListener(listener: TaskUpdateListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  /**
   * すべてのリスナーに通知
   */
  private notifyListeners(): void {
    const tasks = this.getAllTasks();
    this.listeners.forEach(listener => listener(tasks));
  }
}

// シングルトンインスタンス
export const taskQueue = new TaskQueueManager(); 