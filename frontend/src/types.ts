/**
 * Subscribed player data
 */
export interface SubscribedPlayer {
  fid: string;
  nickname?: string;
  kid?: number;
  subscribedAt: number;
  lastRedemptionAt?: number;
}

/**
 * Gift code data
 */
export interface GiftCode {
  code: string;
  status: 'active' | 'expired';
  addedAt: number;
  expiredAt?: number;
  description?: string;
}

/**
 * Redemption record
 */
export interface RedemptionRecord {
  fid: string;
  code: string;
  success: boolean;
  message: string;
  timestamp: number;
  nickname?: string;
  kid?: number;
}

/**
 * Task status from API (legacy)
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
