import type { Env, TaskStatus, GiftCodeResult } from '../types';
import { generateTaskId, sleep } from './utils';
import { ApiService } from './api-service';

/**
 * Task Manager for handling batch gift code processing
 */
export class TaskManager {
  private apiService: ApiService;

  constructor(private env: Env) {
    this.apiService = new ApiService(env);
  }

  /**
   * Create a new batch task for a single player
   */
  async createTask(fid: string, cdks: string[]): Promise<string> {
    const taskId = generateTaskId();
    
    const taskStatus: TaskStatus = {
      taskId,
      fid,
      status: 'pending',
      progress: {
        total: cdks.length,
        completed: 0,
        succeeded: 0,
        failed: 0,
      },
      results: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Save task to KV
    await this.env.TASKS_KV.put(taskId, JSON.stringify(taskStatus), {
      expirationTtl: 3600, // Expire after 1 hour
    });

    // Start processing asynchronously
    // Note: In production, use Durable Objects or Queue for better handling
    this.processTask(taskId, fid, cdks).catch(error => {
      console.error(`Task ${taskId} failed:`, error);
    });

    return taskId;
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus | null> {
    const data = await this.env.TASKS_KV.get(taskId);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as TaskStatus;
  }

  /**
   * Process a task (process all gift codes for a player)
   */
  private async processTask(taskId: string, fid: string, cdks: string[]): Promise<void> {
    try {
      // Update status to processing
      await this.updateTaskStatus(taskId, { status: 'processing' });

      // Get player info first
      const playerInfo = await this.apiService.getPlayerInfo(fid);
      
      if (!playerInfo) {
        await this.updateTaskStatus(taskId, { 
          status: 'failed',
        });
        
        // Mark all as failed
        const failedResults: GiftCodeResult[] = cdks.map(cdk => ({
          success: false,
          message: '无法获取玩家信息',
          cdk,
          fid,
          timestamp: Date.now(),
        }));
        
        await this.addTaskResults(taskId, failedResults);
        return;
      }

      // Process each CDK
      for (const cdk of cdks) {
        const result = await this.apiService.processSingleCodeWithRetry(fid, cdk, playerInfo);
        
        // Add result and update progress
        await this.addTaskResults(taskId, [result]);
        
        // Delay between codes
        await sleep(500);
      }

      // Mark as completed
      await this.updateTaskStatus(taskId, { status: 'completed' });

      // Save to D1 for history
      await this.saveToHistory(taskId, fid, cdks);
    } catch (error) {
      console.error(`Error processing task ${taskId}:`, error);
      await this.updateTaskStatus(taskId, { status: 'failed' });
    }
  }

  /**
   * Update task status
   */
  private async updateTaskStatus(
    taskId: string,
    updates: Partial<TaskStatus>
  ): Promise<void> {
    const currentStatus = await this.getTaskStatus(taskId);
    if (!currentStatus) {
      return;
    }

    const updatedStatus: TaskStatus = {
      ...currentStatus,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.env.TASKS_KV.put(taskId, JSON.stringify(updatedStatus), {
      expirationTtl: 3600,
    });
  }

  /**
   * Add results to task
   */
  private async addTaskResults(taskId: string, results: GiftCodeResult[]): Promise<void> {
    const currentStatus = await this.getTaskStatus(taskId);
    if (!currentStatus) {
      return;
    }

    const newResults = [...currentStatus.results, ...results];
    const succeeded = newResults.filter(r => r.success).length;
    const failed = newResults.filter(r => !r.success).length;

    const updatedStatus: TaskStatus = {
      ...currentStatus,
      results: newResults,
      progress: {
        ...currentStatus.progress,
        completed: newResults.length,
        succeeded,
        failed,
      },
      updatedAt: Date.now(),
    };

    await this.env.TASKS_KV.put(taskId, JSON.stringify(updatedStatus), {
      expirationTtl: 3600,
    });
  }

  /**
   * Save task results to D1 for history
   */
  private async saveToHistory(taskId: string, fid: string, cdks: string[]): Promise<void> {
    try {
      const taskStatus = await this.getTaskStatus(taskId);
      if (!taskStatus) {
        return;
      }

      // Create table if not exists
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS task_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id TEXT NOT NULL,
          fid TEXT NOT NULL,
          total_cdks INTEGER NOT NULL,
          succeeded INTEGER NOT NULL,
          failed INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          completed_at INTEGER NOT NULL
        )
      `).run();

      // Insert task record
      await this.env.DB.prepare(`
        INSERT INTO task_history (task_id, fid, total_cdks, succeeded, failed, created_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        taskId,
        fid,
        taskStatus.progress.total,
        taskStatus.progress.succeeded,
        taskStatus.progress.failed,
        taskStatus.createdAt,
        Date.now()
      ).run();

      // Create results table if not exists
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS task_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id TEXT NOT NULL,
          fid TEXT NOT NULL,
          cdk TEXT NOT NULL,
          success INTEGER NOT NULL,
          message TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        )
      `).run();

      // Insert results
      for (const result of taskStatus.results) {
        await this.env.DB.prepare(`
          INSERT INTO task_results (task_id, fid, cdk, success, message, timestamp)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          taskId,
          result.fid,
          result.cdk,
          result.success ? 1 : 0,
          result.message,
          result.timestamp
        ).run();
      }
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }

  /**
   * Get task history from D1
   */
  async getHistory(limit = 100): Promise<any[]> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM task_history
        ORDER BY completed_at DESC
        LIMIT ?
      `).bind(limit).all();

      return result.results || [];
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  }
}
