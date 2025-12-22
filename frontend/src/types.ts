/**
 * Task status from API
 */
export interface TaskStatus {
  taskId: string;
  fid: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    completed: number;
    succeeded: number;
    failed: number;
  };
  results: GiftCodeResult[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Gift code result
 */
export interface GiftCodeResult {
  success: boolean;
  message: string;
  cdk: string;
  fid: string;
  nickname?: string;
  kid?: number;
  timestamp: number;
}

/**
 * Player task info
 */
export interface PlayerTask {
  fid: string;
  taskId: string;
  status?: TaskStatus;
}

/**
 * API configuration
 */
export interface ApiConfig {
  baseUrl: string;
}
