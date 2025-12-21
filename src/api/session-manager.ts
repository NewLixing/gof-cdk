import { useLogger } from "../logger";
import type { GiftCodeResult, PlayerInfo, SessionStats } from "../types";
import { sleep } from "../utils";

// 创建日志记录器
const logger = useLogger("SessionManager");

/**
 * 会话管理器配置常量
 */
const SESSION_CONSTANTS = {
	/** 验证码识别失败最大重试次数 */
	MAX_CAPTCHA_RETRIES: 3,
	/** 验证码必须的长度 */
	CAPTCHA_LENGTH: 4,
	/** 重试延迟时间（毫秒） */
	RETRY_DELAY: 1000,
} as const;

/**
 * 验证验证码格式是否有效
 * @param captchaCode - 验证码
 * @returns 是否有效
 */
function isValidCaptcha(captchaCode: string): boolean {
	// 验证码必须是4位且不包含中文字符
	const hasChinese = /[\u4e00-\u9fa5]/.test(captchaCode);
	return captchaCode.length === SESSION_CONSTANTS.CAPTCHA_LENGTH && !hasChinese;
}

/**
 * API服务接口（用于依赖注入）
 */
interface ApiServiceInterface {
	getPlayerInfo(fid: string): Promise<PlayerInfo | null>;
	getCaptcha(fid: string): Promise<string>;
	processGiftCode(
		fid: string,
		cdk: string,
		captcha_code: string,
	): Promise<GiftCodeResult>;
}

/**
 * 会话管理器类
 * 负责管理单个玩家的会话，复用玩家信息，批量处理礼包码
 * @class
 */
export class SessionManager {
	private playerInfo: PlayerInfo | null = null;
	private requestCount = 0;
	private startTime = 0;
	private initialized = false;

	/**
	 * 构造函数
	 * @param apiService - API服务实例
	 * @param fid - 玩家ID
	 */
	constructor(
		private readonly apiService: ApiServiceInterface,
		private readonly fid: string,
	) {}

	/**
	 * 初始化会话，获取并缓存玩家信息（只调用一次）
	 * @returns {Promise<boolean>} 初始化是否成功
	 */
	async initialize(): Promise<boolean> {
		if (this.initialized) {
			logger.debug(`会话已初始化，跳过重复初始化: FID=${this.fid}`);
			return true;
		}

		this.startTime = Date.now();
		logger.info(`🔐 为玩家 ${this.fid} 初始化会话...`);

		try {
			this.playerInfo = await this.apiService.getPlayerInfo(this.fid);
			this.requestCount++;

			if (!this.playerInfo) {
				logger.error(`❌ 无法获取玩家信息: FID=${this.fid}`);
				return false;
			}

			this.initialized = true;
			logger.info(
				`✅ 会话初始化成功: ${this.playerInfo.nickname} (区服${this.playerInfo.kid})`,
			);
			return true;
		} catch (error) {
			logger.error({ err: error }, `❌ 会话初始化失败: FID=${this.fid}`);
			return false;
		}
	}

	/**
	 * 处理单个礼包码（获取验证码 + 提交）
	 * @param cdk - 礼包码
	 * @returns {Promise<GiftCodeResult>} 处理结果
	 */
	async processGiftCode(cdk: string): Promise<GiftCodeResult> {
		if (!this.initialized || !this.playerInfo) {
			return {
				success: false,
				message: "会话未初始化或玩家信息不可用",
				cdk,
				fid: this.fid,
			};
		}

		let currentRetry = 0;

		while (currentRetry < SESSION_CONSTANTS.MAX_CAPTCHA_RETRIES) {
			try {
				// 获取验证码
				const captcha_code = await this.apiService.getCaptcha(this.fid);
				this.requestCount++;

				// 验证码格式检查
				if (!isValidCaptcha(captcha_code)) {
					currentRetry++;
					logger.debug(
						`验证码格式错误 (长度: ${captcha_code.length})，重试 ${currentRetry}/${SESSION_CONSTANTS.MAX_CAPTCHA_RETRIES}`,
					);

					if (currentRetry >= SESSION_CONSTANTS.MAX_CAPTCHA_RETRIES) {
						return {
							success: false,
							message: `识别验证码失败，已达到最大重试次数(${SESSION_CONSTANTS.MAX_CAPTCHA_RETRIES})`,
							cdk,
							fid: this.fid,
							nickname: this.playerInfo.nickname,
							kid: this.playerInfo.kid,
						};
					}

					// 等待后重试
					await sleep(SESSION_CONSTANTS.RETRY_DELAY);
					continue;
				}

				// 处理礼包码
				const result = await this.apiService.processGiftCode(
					this.fid,
					cdk,
					captcha_code,
				);
				this.requestCount++;

				// 返回结果，附加玩家信息
				return {
					...result,
					nickname: this.playerInfo.nickname,
					kid: this.playerInfo.kid,
				};
			} catch (error) {
				currentRetry++;
				logger.debug(
					{ err: error },
					`处理礼包码出错，重试 ${currentRetry}/${SESSION_CONSTANTS.MAX_CAPTCHA_RETRIES}`,
				);

				if (currentRetry >= SESSION_CONSTANTS.MAX_CAPTCHA_RETRIES) {
					return {
						success: false,
						message: `处理出错，已达到最大重试次数(${SESSION_CONSTANTS.MAX_CAPTCHA_RETRIES})`,
						cdk,
						fid: this.fid,
						nickname: this.playerInfo.nickname,
						kid: this.playerInfo.kid,
					};
				}

				// 等待后重试
				await sleep(SESSION_CONSTANTS.RETRY_DELAY);
			}
		}

		// 理论上不会到达这里
		return {
			success: false,
			message: "未知错误",
			cdk,
			fid: this.fid,
			nickname: this.playerInfo?.nickname,
			kid: this.playerInfo?.kid,
		};
	}

	/**
	 * 批量处理多个礼包码
	 * @param cdks - 礼包码列表
	 * @returns {Promise<GiftCodeResult[]>} 处理结果列表
	 */
	async processMultipleCodes(cdks: string[]): Promise<GiftCodeResult[]> {
		if (!this.initialized || !this.playerInfo) {
			logger.error("会话未初始化，无法处理礼包码");
			return cdks.map((cdk) => ({
				success: false,
				message: "会话未初始化",
				cdk,
				fid: this.fid,
			}));
		}

		logger.info(
			`\n📦 开始为玩家 ${this.playerInfo.nickname} 处理 ${cdks.length} 个礼包码`,
		);

		const results: GiftCodeResult[] = [];

		for (let i = 0; i < cdks.length; i++) {
			const cdk = cdks[i];
			logger.info(`  [${i + 1}/${cdks.length}] 处理礼包码: ${cdk}`);

			const result = await this.processGiftCode(cdk);
			results.push(result);

			// 显示结果
			if (result.success) {
				if (result.message.includes("已领过")) {
					logger.info(`    ❌ ${result.message}`);
				} else {
					logger.info(`    ✅ ${result.message}`);
				}
			} else {
				logger.error(`    ❌ ${result.message}`);
			}

			// 礼包码之间延迟 500ms
			if (i < cdks.length - 1) {
				await sleep(500);
			}
		}

		return results;
	}

	/**
	 * 获取会话统计信息
	 * @returns {SessionStats} 会话统计信息
	 */
	getStats(): SessionStats {
		const duration = (Date.now() - this.startTime) / 1000;
		return {
			fid: this.fid,
			playerName: this.playerInfo?.nickname,
			duration,
			requestCount: this.requestCount,
		};
	}

	/**
	 * 清理会话资源
	 * @returns {Promise<void>}
	 */
	async cleanup(): Promise<void> {
		const stats = this.getStats();
		logger.info(
			`\n🔚 会话结束 - ${this.playerInfo?.nickname || `FID=${this.fid}`}`,
		);
		logger.info(`   总请求: ${stats.requestCount} 次`);
		logger.info(`   耗时: ${stats.duration.toFixed(2)} 秒`);

		// 清理资源
		this.playerInfo = null;
		this.initialized = false;
	}
}
