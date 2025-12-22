import type { Env, PlayerInfo, ApiResponse, Captcha, GiftCodeResult } from '../types';
import { generateSignedObject, sleep } from './utils';

const API_BASE_URL = 'https://wjdr-giftcode-api.campfiregames.cn/api';
const SIGN_SALT = 'Uiv#87#SPan.ECsp';
const MAX_RETRIES = 3;

/**
 * API Service for interacting with game server
 */
export class ApiService {
  constructor(private env: Env) {}

  /**
   * Get player information
   */
  async getPlayerInfo(fid: string): Promise<PlayerInfo | null> {
    try {
      const inputData = {
        fid,
        time: Date.now(),
      };

      const signedData = generateSignedObject(inputData, SIGN_SALT);

      const response = await fetch(`${API_BASE_URL}/player`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: signedData,
      });

      const data: ApiResponse<PlayerInfo> = await response.json();
      return data.code === 0 ? data.data : null;
    } catch (error) {
      console.error('Failed to get player info:', error);
      return null;
    }
  }

  /**
   * Get captcha image and recognize using Workers AI
   */
  async getCaptcha(fid: string): Promise<string> {
    try {
      const inputData = {
        fid,
        init: 0,
        time: Date.now(),
      };

      const signedData = generateSignedObject(inputData, SIGN_SALT);

      const response = await fetch(`${API_BASE_URL}/captcha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: signedData,
      });

      const data: ApiResponse<Captcha> = await response.json();
      
      if (!data.data?.img) {
        console.error('No captcha image received');
        return '';
      }

      // Use Workers AI to recognize captcha
      const captchaCode = await this.recognizeCaptcha(data.data.img);
      console.log('Recognized captcha:', captchaCode);
      
      return captchaCode;
    } catch (error) {
      console.error('Failed to get captcha:', error);
      return '';
    }
  }

  /**
   * Recognize captcha using Cloudflare Workers AI
   */
  private async recognizeCaptcha(base64Image: string): Promise<string> {
    try {
      // Use LLaVA model for image recognition
      const response = await this.env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
        image: Array.from(Buffer.from(base64Image, 'base64')),
        prompt: 'This is a 4-digit captcha containing only numbers and letters. Please extract the exact 4 characters you see. Only output those 4 characters, nothing else.',
        max_tokens: 10,
      }) as { description: string };

      // Extract alphanumeric characters from response
      const captchaText = response.description.trim();
      const alphanumeric = captchaText.replace(/[^a-zA-Z0-9]/g, '');
      
      // Return first 4 characters if available
      return alphanumeric.substring(0, 4).toUpperCase();
    } catch (error) {
      console.error('Failed to recognize captcha:', error);
      return '';
    }
  }

  /**
   * Process gift code
   */
  async processGiftCode(
    fid: string,
    cdk: string,
    captcha_code: string
  ): Promise<GiftCodeResult> {
    const errorMap: Record<number, string> = {
      40004: '服务器处理超时，请稍后重试',
      40007: '超出兑换时间，无法领取',
      40008: '已领过该礼包，不能重复领取',
    };

    try {
      const inputData = {
        fid,
        cdk,
        captcha_code,
        time: Date.now(),
      };

      const signedData = generateSignedObject(inputData, SIGN_SALT);

      const response = await fetch(`${API_BASE_URL}/gift_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: signedData,
      });

      const data: ApiResponse<null> = await response.json();

      if (data.code === 0 || data.err_code === 40008) {
        return {
          success: true,
          message: data.err_code === 40008 ? '已领过该礼包' : '已成功领取',
          cdk,
          fid,
          timestamp: Date.now(),
        };
      }

      return {
        success: false,
        message: errorMap[data.err_code] || data.msg,
        cdk,
        fid,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to process gift code:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '未知错误',
        cdk,
        fid,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Process single code with retry logic
   */
  async processSingleCodeWithRetry(
    fid: string,
    cdk: string,
    playerInfo: PlayerInfo
  ): Promise<GiftCodeResult> {
    let currentRetry = 0;

    while (currentRetry < MAX_RETRIES) {
      try {
        // Get captcha
        const captchaCode = await this.getCaptcha(fid);

        // Validate captcha format (must be 4 characters)
        if (captchaCode.length !== 4) {
          currentRetry++;
          if (currentRetry >= MAX_RETRIES) {
            return {
              success: false,
              message: `识别验证码失败，已达到最大重试次数(${MAX_RETRIES})`,
              cdk,
              fid,
              nickname: playerInfo.nickname,
              kid: playerInfo.kid,
              timestamp: Date.now(),
            };
          }
          await sleep(1000);
          continue;
        }

        // Process gift code
        const result = await this.processGiftCode(fid, cdk, captchaCode);

        if (result.success) {
          return {
            ...result,
            nickname: playerInfo.nickname,
            kid: playerInfo.kid,
          };
        }

        currentRetry++;
        if (currentRetry >= MAX_RETRIES) {
          return {
            ...result,
            nickname: playerInfo.nickname,
            kid: playerInfo.kid,
          };
        }

        await sleep(1000);
      } catch (error) {
        currentRetry++;
        if (currentRetry >= MAX_RETRIES) {
          return {
            success: false,
            message: `处理失败: ${error instanceof Error ? error.message : '未知错误'}`,
            cdk,
            fid,
            nickname: playerInfo.nickname,
            kid: playerInfo.kid,
            timestamp: Date.now(),
          };
        }
        await sleep(1000);
      }
    }

    return {
      success: false,
      message: '未知错误',
      cdk,
      fid,
      nickname: playerInfo.nickname,
      kid: playerInfo.kid,
      timestamp: Date.now(),
    };
  }
}
