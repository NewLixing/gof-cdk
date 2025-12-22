import type { Env, SubscribedPlayer, GiftCode, RedemptionRecord } from '../types';
import { ApiService } from './api-service';

const PLAYERS_KEY = 'players:subscribed';
const GIFTCODES_ACTIVE_KEY = 'giftcodes:active';
const GIFTCODES_EXPIRED_KEY = 'giftcodes:expired';

/**
 * Subscription Manager
 * Manages player subscriptions and gift code lists
 */
export class SubscriptionManager {
  private apiService: ApiService;

  constructor(private env: Env) {
    this.apiService = new ApiService(env);
  }

  /**
   * Subscribe a player
   * Returns player data with isNew flag and codesTriggered count
   */
  async subscribePlayer(fid: string): Promise<{ player: SubscribedPlayer; isNew: boolean; codesTriggered: number }> {
    // Get existing players
    const players = await this.getPlayers();
    
    // Check if already subscribed
    const existing = players.find(p => p.fid === fid);
    if (existing) {
      return { player: existing, isNew: false, codesTriggered: 0 };
    }

    // Get player info from game API
    const playerInfo = await this.apiService.getPlayerInfo(fid);
    
    const player: SubscribedPlayer = {
      fid,
      nickname: playerInfo?.nickname,
      kid: playerInfo?.kid,
      subscribedAt: Date.now(),
    };

    // Add new player
    players.push(player);
    await this.env.TASKS_KV.put(PLAYERS_KEY, JSON.stringify(players));

    // Save to D1
    await this.savePlayerToD1(player);

    // Auto redeem all active gift codes for new player
    const activeCodes = await this.getActiveGiftCodes();
    let codesTriggered = 0;

    for (const giftCode of activeCodes) {
      // Check if already redeemed (shouldn't be for new player, but just in case)
      const hasRedeemed = await this.hasRedeemed(fid, giftCode.code);
      if (hasRedeemed) {
        continue;
      }

      // Try to redeem
      const result = await this.apiService.processSingleCodeWithRetry(
        fid,
        giftCode.code,
        {
          fid: Number(fid),
          nickname: playerInfo?.nickname || '',
          kid: playerInfo?.kid || 0,
          stove_lv: 0,
          stove_lv_content: '',
          avatar_image: '',
          total_recharge_amount: 0,
        }
      );

      const record: RedemptionRecord = {
        fid,
        code: giftCode.code,
        success: result.success,
        message: result.message,
        timestamp: Date.now(),
        nickname: result.nickname,
        kid: result.kid,
      };

      await this.recordRedemption(record);
      codesTriggered++;

      // Check if code expired
      if (!result.success && result.message.includes('超出兑换时间')) {
        await this.markGiftCodeExpired(giftCode.code);
      }

      // Delay between redemptions
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Update last redemption time
    if (codesTriggered > 0) {
      const updatedPlayers = await this.getPlayers();
      const playerIndex = updatedPlayers.findIndex(p => p.fid === fid);
      if (playerIndex !== -1) {
        updatedPlayers[playerIndex].lastRedemptionAt = Date.now();
        await this.env.TASKS_KV.put(PLAYERS_KEY, JSON.stringify(updatedPlayers));
      }
    }

    return { player, isNew: true, codesTriggered };
  }

  /**
   * Unsubscribe a player
   */
  async unsubscribePlayer(fid: string): Promise<boolean> {
    const players = await this.getPlayers();
    const filtered = players.filter(p => p.fid !== fid);
    
    if (filtered.length === players.length) {
      return false; // Player not found
    }

    await this.env.TASKS_KV.put(PLAYERS_KEY, JSON.stringify(filtered));
    return true;
  }

  /**
   * Get all subscribed players
   */
  async getPlayers(): Promise<SubscribedPlayer[]> {
    const data = await this.env.TASKS_KV.get(PLAYERS_KEY);
    if (!data) {
      return [];
    }
    return JSON.parse(data) as SubscribedPlayer[];
  }

  /**
   * Add a gift code
   */
  async addGiftCode(code: string, description?: string): Promise<GiftCode> {
    const giftCode: GiftCode = {
      code,
      status: 'active',
      addedAt: Date.now(),
      description,
    };

    const codes = await this.getActiveGiftCodes();
    
    // Check if already exists
    const existing = codes.find(c => c.code === code);
    if (existing) {
      return existing;
    }

    codes.push(giftCode);
    await this.env.TASKS_KV.put(GIFTCODES_ACTIVE_KEY, JSON.stringify(codes));

    return giftCode;
  }

  /**
   * Validate and submit a gift code from user
   * Returns validation result and number of players triggered
   */
  async validateAndSubmitGiftCode(code: string): Promise<{ isValid: boolean; playersTriggered: number; message: string }> {
    // Check if code already exists
    const activeCodes = await this.getActiveGiftCodes();
    const expiredCodes = await this.getExpiredGiftCodes();
    
    if (activeCodes.find(c => c.code === code)) {
      return { isValid: true, playersTriggered: 0, message: '礼包码已存在系统中' };
    }
    
    if (expiredCodes.find(c => c.code === code)) {
      return { isValid: false, playersTriggered: 0, message: '礼包码已过期' };
    }

    // Get any player to test the code
    const players = await this.getPlayers();
    
    if (players.length === 0) {
      // No players to validate with, just add it
      await this.addGiftCode(code, 'User submitted');
      return { isValid: true, playersTriggered: 0, message: '礼包码已添加（无玩家验证）' };
    }

    // Test with first player
    const testPlayer = players[0];
    const playerInfo = await this.apiService.getPlayerInfo(testPlayer.fid);
    
    if (!playerInfo) {
      return { isValid: false, playersTriggered: 0, message: '无法获取玩家信息进行验证' };
    }

    // Try to redeem with test player
    const result = await this.apiService.processSingleCodeWithRetry(
      testPlayer.fid,
      code,
      playerInfo
    );

    // Check result
    if (!result.success) {
      if (result.message.includes('超出兑换时间') || result.message.includes('已过期')) {
        // Mark as expired immediately
        const expiredCode: GiftCode = {
          code,
          status: 'expired',
          addedAt: Date.now(),
          expiredAt: Date.now(),
          description: 'User submitted (expired)',
        };
        const expired = await this.getExpiredGiftCodes();
        expired.push(expiredCode);
        await this.env.TASKS_KV.put(GIFTCODES_EXPIRED_KEY, JSON.stringify(expired));
        
        return { isValid: false, playersTriggered: 0, message: '礼包码已过期' };
      } else if (result.message.includes('已经领取过')) {
        // Already redeemed by test player, but code is valid
        // Continue to add and trigger for others
      } else {
        return { isValid: false, playersTriggered: 0, message: `验证失败: ${result.message}` };
      }
    }

    // Code is valid, add to active list
    await this.addGiftCode(code, 'User submitted (validated)');

    // Record test player's redemption
    const record: RedemptionRecord = {
      fid: testPlayer.fid,
      code,
      success: result.success,
      message: result.message,
      timestamp: Date.now(),
      nickname: result.nickname,
      kid: result.kid,
    };
    await this.recordRedemption(record);

    // Trigger redemption for all other players
    let playersTriggered = 0;
    
    for (const player of players) {
      // Skip test player (already redeemed)
      if (player.fid === testPlayer.fid) {
        continue;
      }

      // Check if already redeemed
      const hasRedeemed = await this.hasRedeemed(player.fid, code);
      if (hasRedeemed) {
        continue;
      }

      // Get player info
      const pInfo = await this.apiService.getPlayerInfo(player.fid);
      if (!pInfo) {
        continue;
      }

      // Try to redeem
      const pResult = await this.apiService.processSingleCodeWithRetry(
        player.fid,
        code,
        pInfo
      );

      const pRecord: RedemptionRecord = {
        fid: player.fid,
        code,
        success: pResult.success,
        message: pResult.message,
        timestamp: Date.now(),
        nickname: pResult.nickname,
        kid: pResult.kid,
      };

      await this.recordRedemption(pRecord);
      playersTriggered++;

      // Delay between redemptions
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Update last redemption time for all affected players
    const updatedPlayers = await this.getPlayers();
    for (let i = 0; i < updatedPlayers.length; i++) {
      updatedPlayers[i].lastRedemptionAt = Date.now();
    }
    await this.env.TASKS_KV.put(PLAYERS_KEY, JSON.stringify(updatedPlayers));

    return { 
      isValid: true, 
      playersTriggered: playersTriggered + 1, // +1 for test player
      message: '礼包码有效并已触发批量领取' 
    };
  }

  /**
   * Get active gift codes
   */
  async getActiveGiftCodes(): Promise<GiftCode[]> {
    const data = await this.env.TASKS_KV.get(GIFTCODES_ACTIVE_KEY);
    if (!data) {
      return [];
    }
    return JSON.parse(data) as GiftCode[];
  }

  /**
   * Get expired gift codes
   */
  async getExpiredGiftCodes(): Promise<GiftCode[]> {
    const data = await this.env.TASKS_KV.get(GIFTCODES_EXPIRED_KEY);
    if (!data) {
      return [];
    }
    return JSON.parse(data) as GiftCode[];
  }

  /**
   * Mark a gift code as expired
   */
  async markGiftCodeExpired(code: string): Promise<void> {
    // Remove from active list
    const activeCodes = await this.getActiveGiftCodes();
    const giftCode = activeCodes.find(c => c.code === code);
    
    if (!giftCode) {
      return; // Code not found in active list
    }

    const filteredActive = activeCodes.filter(c => c.code !== code);
    await this.env.TASKS_KV.put(GIFTCODES_ACTIVE_KEY, JSON.stringify(filteredActive));

    // Add to expired list
    const expiredCodes = await this.getExpiredGiftCodes();
    giftCode.status = 'expired';
    giftCode.expiredAt = Date.now();
    expiredCodes.push(giftCode);
    await this.env.TASKS_KV.put(GIFTCODES_EXPIRED_KEY, JSON.stringify(expiredCodes));
  }

  /**
   * Delete a gift code
   */
  async deleteGiftCode(code: string): Promise<boolean> {
    // Try active list first
    const activeCodes = await this.getActiveGiftCodes();
    const filteredActive = activeCodes.filter(c => c.code !== code);
    
    if (filteredActive.length < activeCodes.length) {
      await this.env.TASKS_KV.put(GIFTCODES_ACTIVE_KEY, JSON.stringify(filteredActive));
      return true;
    }

    // Try expired list
    const expiredCodes = await this.getExpiredGiftCodes();
    const filteredExpired = expiredCodes.filter(c => c.code !== code);
    
    if (filteredExpired.length < expiredCodes.length) {
      await this.env.TASKS_KV.put(GIFTCODES_EXPIRED_KEY, JSON.stringify(filteredExpired));
      return true;
    }

    return false; // Code not found
  }

  /**
   * Check if player has redeemed a specific code
   */
  async hasRedeemed(fid: string, code: string): Promise<boolean> {
    const key = `redemption:${fid}:${code}`;
    const data = await this.env.TASKS_KV.get(key);
    return data !== null;
  }

  /**
   * Record a redemption
   */
  async recordRedemption(record: RedemptionRecord): Promise<void> {
    const key = `redemption:${record.fid}:${record.code}`;
    await this.env.TASKS_KV.put(key, JSON.stringify(record), {
      expirationTtl: 86400 * 90, // Keep for 90 days
    });

    // Save to D1
    await this.saveRedemptionToD1(record);
  }

  /**
   * Auto redeem all active codes for all subscribed players
   */
  async autoRedeemAll(): Promise<RedemptionRecord[]> {
    const players = await this.getPlayers();
    const codes = await this.getActiveGiftCodes();
    const results: RedemptionRecord[] = [];

    for (const player of players) {
      for (const giftCode of codes) {
        // Check if already redeemed
        const hasRedeemed = await this.hasRedeemed(player.fid, giftCode.code);
        if (hasRedeemed) {
          continue;
        }

        // Try to redeem
        const result = await this.apiService.processSingleCodeWithRetry(
          player.fid,
          giftCode.code,
          {
            fid: Number(player.fid),
            nickname: player.nickname || '',
            kid: player.kid || 0,
            stove_lv: 0,
            stove_lv_content: '',
            avatar_image: '',
            total_recharge_amount: 0,
          }
        );

        const record: RedemptionRecord = {
          fid: player.fid,
          code: giftCode.code,
          success: result.success,
          message: result.message,
          timestamp: Date.now(),
          nickname: result.nickname,
          kid: result.kid,
        };

        results.push(record);
        await this.recordRedemption(record);

        // Check if code expired (error code 40007)
        if (!result.success && result.message.includes('超出兑换时间')) {
          await this.markGiftCodeExpired(giftCode.code);
        }

        // Delay between redemptions
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Update last redemption time
      const updatedPlayers = await this.getPlayers();
      const playerIndex = updatedPlayers.findIndex(p => p.fid === player.fid);
      if (playerIndex !== -1) {
        updatedPlayers[playerIndex].lastRedemptionAt = Date.now();
        await this.env.TASKS_KV.put(PLAYERS_KEY, JSON.stringify(updatedPlayers));
      }

      // Delay between players
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
  }

  /**
   * Get redemption history
   */
  async getRedemptionHistory(limit = 100): Promise<any[]> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM redemption_history
        ORDER BY timestamp DESC
        LIMIT ?
      `).bind(limit).all();

      return result.results || [];
    } catch (error) {
      console.error('Failed to get redemption history:', error);
      return [];
    }
  }

  /**
   * Save player to D1
   */
  private async savePlayerToD1(player: SubscribedPlayer): Promise<void> {
    try {
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS subscribed_players (
          fid TEXT PRIMARY KEY,
          nickname TEXT,
          kid INTEGER,
          subscribed_at INTEGER NOT NULL,
          last_redemption_at INTEGER
        )
      `).run();

      await this.env.DB.prepare(`
        INSERT OR REPLACE INTO subscribed_players (fid, nickname, kid, subscribed_at, last_redemption_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        player.fid,
        player.nickname || null,
        player.kid || null,
        player.subscribedAt,
        player.lastRedemptionAt || null
      ).run();
    } catch (error) {
      console.error('Failed to save player to D1:', error);
    }
  }

  /**
   * Save redemption to D1
   */
  private async saveRedemptionToD1(record: RedemptionRecord): Promise<void> {
    try {
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS redemption_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fid TEXT NOT NULL,
          code TEXT NOT NULL,
          success INTEGER NOT NULL,
          message TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          nickname TEXT,
          kid INTEGER
        )
      `).run();

      await this.env.DB.prepare(`
        INSERT INTO redemption_history (fid, code, success, message, timestamp, nickname, kid)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        record.fid,
        record.code,
        record.success ? 1 : 0,
        record.message,
        record.timestamp,
        record.nickname || null,
        record.kid || null
      ).run();
    } catch (error) {
      console.error('Failed to save redemption to D1:', error);
    }
  }

  /**
   * Get player redemptions for display
   */
  async getPlayerRedemptions(fid: string): Promise<RedemptionRecord[]> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM redemption_history
        WHERE fid = ?
        ORDER BY timestamp DESC
        LIMIT 100
      `).bind(fid).all();

      return (result.results || []).map((row: any) => ({
        fid: row.fid,
        code: row.code,
        success: row.success === 1,
        message: row.message,
        timestamp: row.timestamp,
        nickname: row.nickname,
        kid: row.kid,
      }));
    } catch (error) {
      console.error('Failed to get player redemptions:', error);
      return [];
    }
  }

  /**
   * Test: Get captcha image for testing
   */
  async testGetCaptcha(fid: string, code: string): Promise<{ captchaId: string; image: string } | null> {
    try {
      const result = await this.apiService.getCaptcha(fid, code);
      if (typeof result === 'string') {
        return null;
      }
      return result;
    } catch (error) {
      console.error('Test getCaptcha failed:', error);
      return null;
    }
  }

  /**
   * Test: Recognize captcha with AI
   */
  async testRecognizeCaptcha(imageBase64: string): Promise<{ recognized: string; raw: string } | null> {
    try {
      const result = await this.apiService.recognizeCaptcha(imageBase64);
      return result;
    } catch (error) {
      console.error('Test recognizeCaptcha failed:', error);
      return null;
    }
  }

  /**
   * Test: Full redemption process
   */
  async testFullRedemption(fid: string, code: string): Promise<any> {
    try {
      // Get player info
      const playerInfo = await this.apiService.getPlayerInfo(fid);
      
      if (!playerInfo) {
        return {
          success: false,
          error: 'Failed to get player info',
        };
      }

      // Process redemption
      const result = await this.apiService.processSingleCodeWithRetry(fid, code, playerInfo);
      
      return {
        success: true,
        playerInfo,
        redemptionResult: result,
      };
    } catch (error) {
      console.error('Test fullRedemption failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
