/**
 * Cloudflare Workers Environment Bindings
 */
export interface Env {
  TASKS_KV: KVNamespace;
  DB: D1Database;
  AI: Ai;
}

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
 * Batch task request (legacy)
 */
export interface BatchTaskRequest {
  fids: string[];
  cdks: string[];
}

/**
 * Task status response (legacy)
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
 * Gift code processing result
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
 * Player information
 */
export interface PlayerInfo {
  fid: number;
  nickname: string;
  kid: number;
  stove_lv: number;
  stove_lv_content: string;
  avatar_image: string;
  total_recharge_amount: number;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T | null;
  err_code: number;
}

/**
 * Captcha data
 */
export interface Captcha {
  img: string;
  id?: string;
}
