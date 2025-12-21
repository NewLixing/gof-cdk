import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
	apiService,
	processSingleCode,
	removeSuccessfulTask,
	saveFailedTask,
} from "./api";
import { SessionManager } from "./api/session-manager";
import { loadConfig } from "./config";
import { colors, useLogger } from "./logger";
import type { GiftCodeResult, ProcessTask, SessionTask } from "./types";
import { sleep } from "./utils";

// 禁用 TensorFlow.js 日志
process.env.TF_CPP_MIN_LOG_LEVEL = "3";

// 创建日志记录器
const logger = useLogger();

/**
 * 处理结果统计
 */
interface ResultStats {
	success: number;
	failure: number;
	timeout: number;
	alreadyClaimed: number;
}

/**
 * 处理礼包码
 * @param cdks 礼包码列表
 * @param fids 玩家ID列表
 * @returns 处理结果列表
 */
const processGiftCodes = async (
	cdks: string[],
	fids: string[],
): Promise<GiftCodeResult[]> => {
	const tasks: ProcessTask[] = fids.flatMap((fid) =>
		cdks.map((cdk) => ({ fid, cdk })),
	);

	logger.info(
		`开始处理礼包码,共 ${cdks.length} 个礼包码,${fids.length} 个玩家ID`,
	);
	logger.info(`生成任务列表,共 ${tasks.length} 个任务`);

	// 刷新日志缓冲区,确保所有日志都已输出
	await logger.flush();

	// 结果和统计
	const results: GiftCodeResult[] = [];
	const stats: ResultStats = {
		success: 0,
		failure: 0,
		timeout: 0,
		alreadyClaimed: 0,
	};

	// 串行处理所有任务
	for (let i = 0; i < tasks.length; i++) {
		const task = tasks[i];
		try {
			// 显示进度
			logger.progress(i + 1, tasks.length, "处理进度:");

			// 串行处理单个任务
			const result = await processSingleCode(task);

			// 更新统计信息
			if (result.success) {
				if (result.message.includes("已领过")) {
					stats.alreadyClaimed++;
				} else {
					stats.success++;
				}
			} else {
				if (
					result.message.includes("TIMEOUT") ||
					result.message.includes("超时")
				) {
					stats.timeout++;
				} else {
					stats.failure++;
				}
			}

			results.push(result);

			// 每个任务之间添加短暂延迟,避免验证码机制触发限制
			await sleep(500);
		} catch (error) {
			// 单个任务处理失败
			logger.error(`任务执行失败: ${error}`);
			const failedResult: GiftCodeResult = {
				success: false,
				message: `处理失败: ${error instanceof Error ? error.message : String(error)}`,
				cdk: task.cdk,
				fid: task.fid,
			};
			results.push(failedResult);
			stats.failure++;
		}
	}

	return results;
};

/**
 * 将 fids 和 cdks 转换为按玩家分组的任务
 * @param fids - 玩家ID列表
 * @param cdks - 礼包码列表
 * @returns 按玩家分组的任务列表
 */
const groupTasksByPlayer = (fids: string[], cdks: string[]): SessionTask[] => {
	return fids.map((fid) => ({
		fid,
		cdks: [...cdks], // 每个玩家处理所有礼包码
	}));
};

/**
 * 优化的礼包码处理流程（按玩家分组复用会话）
 * @param cdks 礼包码列表
 * @param fids 玩家ID列表
 * @returns 处理结果列表
 */
const processGiftCodesOptimized = async (
	cdks: string[],
	fids: string[],
): Promise<GiftCodeResult[]> => {
	// 将任务按玩家分组
	const sessionTasks = groupTasksByPlayer(fids, cdks);

	logger.info(
		`开始处理礼包码（优化模式），共 ${cdks.length} 个礼包码，${fids.length} 个玩家`,
	);
	logger.info(`生成会话任务列表，共 ${sessionTasks.length} 个会话`);

	// 刷新日志缓冲区，确保所有日志都已输出
	await logger.flush();

	// 结果和统计
	const allResults: GiftCodeResult[] = [];
	const stats: ResultStats = {
		success: 0,
		failure: 0,
		timeout: 0,
		alreadyClaimed: 0,
	};

	// 串行处理每个玩家的会话
	for (let i = 0; i < sessionTasks.length; i++) {
		const sessionTask = sessionTasks[i];

		// 显示玩家进度
		logger.divider("━", 70);
		logger.info(
			`📍 处理玩家 ${i + 1}/${sessionTasks.length}: FID=${sessionTask.fid}`,
		);
		logger.divider("━", 70);

		// 创建会话管理器
		const session = new SessionManager(apiService, sessionTask.fid);

		try {
			// 初始化会话（获取玩家信息，只调用一次）
			const initialized = await session.initialize();

			if (!initialized) {
				// 初始化失败，记录所有礼包码为失败，并保存失败任务
				for (const cdk of sessionTask.cdks) {
					const failedResult: GiftCodeResult = {
						success: false,
						message: "会话初始化失败",
						cdk,
						fid: sessionTask.fid,
					};
					allResults.push(failedResult);
					stats.failure++;

					// 保存失败任务
					await saveFailedTask({
						fid: sessionTask.fid,
						cdk,
					});
				}
				continue;
			}

			// 批量处理该玩家的所有礼包码
			const results = await session.processMultipleCodes(sessionTask.cdks);
			allResults.push(...results);

			// 更新统计信息，保存失败的任务
			for (const result of results) {
				if (result.success) {
					if (result.message.includes("已领过")) {
						stats.alreadyClaimed++;
					} else {
						stats.success++;
					}
				} else {
					// 保存失败任务
					await saveFailedTask({
						fid: result.fid,
						cdk: result.cdk,
					});

					if (
						result.message.includes("TIMEOUT") ||
						result.message.includes("超时")
					) {
						stats.timeout++;
					} else {
						stats.failure++;
					}
				}
			}
		} catch (error) {
			logger.error({ err: error }, `处理玩家 ${sessionTask.fid} 时出错`);

			// 记录所有礼包码为失败，并保存失败任务
			for (const cdk of sessionTask.cdks) {
				const failedResult: GiftCodeResult = {
					success: false,
					message: `处理失败: ${error instanceof Error ? error.message : String(error)}`,
					cdk,
					fid: sessionTask.fid,
				};
				allResults.push(failedResult);
				stats.failure++;

				// 保存失败任务
				await saveFailedTask({
					fid: sessionTask.fid,
					cdk,
				});
			}
		} finally {
			// 清理会话资源
			await session.cleanup();
		}

		// 玩家之间延迟 2 秒
		if (i < sessionTasks.length - 1) {
			await sleep(2000);
		}
	}

	return allResults;
};

/**
 * 处理失败任务文件
 * @param filePath 失败任务文件路径
 * @returns 处理结果列表
 */
const processFailedTasks = async (
	filePath: string,
): Promise<GiftCodeResult[]> => {
	try {
		// 读取失败任务文件
		const fileContent = await fs.readFile(filePath, "utf8");
		const tasks: ProcessTask[] = JSON.parse(fileContent);

		if (!Array.isArray(tasks) || tasks.length === 0) {
			logger.info("失败任务文件为空或格式不正确");
			return [];
		}

		logger.info(`开始处理失败任务,共 ${tasks.length} 个任务`);

		// 刷新日志缓冲区,确保所有日志都已输出
		await logger.flush();

		// 结果和统计
		const results: GiftCodeResult[] = [];
		const stats: ResultStats = {
			success: 0,
			failure: 0,
			timeout: 0,
			alreadyClaimed: 0,
		};

		// 串行处理所有任务
		for (let i = 0; i < tasks.length; i++) {
			const task = tasks[i];
			try {
				// 显示进度
				logger.progress(i + 1, tasks.length, "重试进度:");

				// 串行处理单个任务
				const result = await processSingleCode(task);

				// 更新统计信息
				if (result.success) {
					if (result.message.includes("已领过")) {
						stats.alreadyClaimed++;
					} else {
						stats.success++;
					}

					// 任务成功,立即从失败任务文件中删除
					await removeSuccessfulTask(filePath, task);
					logger.debug(`成功任务 [${task.fid}-${task.cdk}] 已从失败列表中删除`);
				} else {
					if (
						result.message.includes("TIMEOUT") ||
						result.message.includes("超时")
					) {
						stats.timeout++;
					} else {
						stats.failure++;
					}
				}

				results.push(result);

				// 每个任务之间添加短暂延迟,避免验证码机制触发限制
				await sleep(500);
			} catch (error) {
				// 单个任务处理失败
				logger.error(`任务执行失败: ${error}`);
				const failedResult: GiftCodeResult = {
					success: false,
					message: `处理失败: ${error instanceof Error ? error.message : String(error)}`,
					cdk: task.cdk,
					fid: task.fid,
				};
				results.push(failedResult);
				stats.failure++;
			}
		}

		// 输出最终统计结果
		logger.info(
			`\n所有任务处理完成,总成功: ${stats.success},已领过: ${stats.alreadyClaimed},总超时: ${stats.timeout},总失败: ${stats.failure}`,
		);

		return results;
	} catch (error) {
		logger.error({ err: error }, "处理失败任务文件时出错");
		return [];
	}
};

/**
 * 输出任务执行统计报告
 * @param stats 统计数据
 * @param results 结果列表
 * @param showPlayerGroups 是否显示按玩家分组的详情（优化模式）
 */
const printTaskSummary = (
	stats: {
		success: number;
		failure: number;
		timeout: number;
		alreadyClaimed: number;
	},
	results: GiftCodeResult[],
	showPlayerGroups = false,
): void => {
	const totalTasks =
		stats.success + stats.alreadyClaimed + stats.timeout + stats.failure;
	const successRate =
		totalTasks > 0
			? (((stats.success + stats.alreadyClaimed) / totalTasks) * 100).toFixed(1)
			: "0.0";

	// 统计数据内容
	const summaryContent = [
		`${colors.bright}📊 总体统计${colors.reset}`,
		"",
		`  ${colors.cyan}总任务数:${colors.reset} ${colors.bright}${totalTasks}${colors.reset} 个`,
		`  ${colors.green}✓ 成功领取:${colors.reset} ${colors.green}${stats.success}${colors.reset} 个`,
		`  ${colors.yellow}↻ 已领过的:${colors.reset} ${colors.yellow}${stats.alreadyClaimed}${colors.reset} 个`,
		`  ${colors.red}⏱ 超时失败:${colors.reset} ${colors.red}${stats.timeout}${colors.reset} 个`,
		`  ${colors.red}✗ 其他失败:${colors.reset} ${colors.red}${stats.failure}${colors.reset} 个`,
		`  ${colors.magenta}📈 成功率:${colors.reset} ${colors.bright}${successRate}%${colors.reset} (含已领取)`,
	];

	// 使用边框输出统计报告
	logger.box("🎆 任务执行统计报告", summaryContent, 70);

	// 按玩家分组的详细统计（优化模式）
	if (showPlayerGroups) {
		logger.divider("─", 70);
		logger.raw(
			`\n${colors.cyan}${colors.bright}👥 按玩家分组统计${colors.reset}\n\n`,
		);

		// 按FID分组结果
		const playerGroups = new Map<string, GiftCodeResult[]>();
		for (const result of results) {
			if (!playerGroups.has(result.fid)) {
				playerGroups.set(result.fid, []);
			}
			playerGroups.get(result.fid)?.push(result);
		}

		// 输出每个玩家的统计
		let playerIndex = 0;
		for (const [fid, playerResults] of playerGroups) {
			playerIndex++;
			const playerSuccess = playerResults.filter((r) => r.success).length;
			const playerAlreadyClaimed = playerResults.filter(
				(r) => r.success && r.message.includes("已领过"),
			).length;
			const playerNewClaim = playerSuccess - playerAlreadyClaimed;
			const playerFailed = playerResults.length - playerSuccess;
			const playerName = playerResults[0]?.nickname || `FID=${fid}`;
			const playerKid = playerResults[0]?.kid;

			// 玩家信息标题
			logger.raw(
				`  ${colors.bright}${playerIndex}. ${playerName}${colors.reset}`,
			);
			if (playerKid !== undefined) {
				logger.raw(` ${colors.dim}(区服${playerKid})${colors.reset}`);
			}
			logger.raw(` - ${colors.dim}FID: ${fid}${colors.reset}\n`);

			// 该玩家的统计
			logger.raw(
				`     ${colors.green}✓ 新领取: ${playerNewClaim}${colors.reset}  `,
			);
			logger.raw(
				`${colors.yellow}↻ 已领过: ${playerAlreadyClaimed}${colors.reset}  `,
			);
			logger.raw(`${colors.red}✗ 失败: ${playerFailed}${colors.reset}\n`);
		}
		logger.raw("\n");
	}

	// 成功的任务详情
	const successTasks = results.filter((r) => r.success);
	if (successTasks.length > 0) {
		logger.divider("─", 70);
		logger.raw(
			`\n${colors.green}${colors.bright}✅ 成功的任务 (${successTasks.length})${colors.reset}\n\n`,
		);
		for (const task of successTasks) {
			const index = successTasks.indexOf(task);
			const isNewClaim = !task.message.includes("已领过");
			const icon = isNewClaim ? "🎁" : "✓";
			const messageColor = isNewClaim ? colors.green : colors.yellow;

			// 格式: FID:XXX | 游戏名:XXX | 区号:XXX | CDK:XXX
			const displayParts = [`${colors.cyan}FID:${colors.reset} ${task.fid}`];

			if (task.nickname) {
				displayParts.push(
					`${colors.cyan}游戏名:${colors.reset} ${task.nickname}`,
				);
			}

			if (task.kid !== undefined) {
				displayParts.push(`${colors.cyan}区号:${colors.reset} ${task.kid}`);
			}

			displayParts.push(`${colors.cyan}CDK:${colors.reset} ${task.cdk}`);

			logger.raw(
				`  ${colors.dim}${index + 1}.${colors.reset} ${icon} ${displayParts.join(` ${colors.dim}|${colors.reset} `)}\n`,
			);
			logger.raw(`     ${messageColor}${task.message}${colors.reset}\n`);
		}
		logger.raw("\n");
	}

	// 失败的任务详情
	const failedTasks = results.filter((r) => !r.success);
	if (failedTasks.length > 0) {
		logger.divider("─", 70);
		logger.raw(
			`\n${colors.red}${colors.bright}❌ 失败的任务 (${failedTasks.length})${colors.reset}\n\n`,
		);
		for (const task of failedTasks) {
			const index = failedTasks.indexOf(task);
			const isTimeout =
				task.message.includes("TIMEOUT") || task.message.includes("超时");
			const icon = isTimeout ? "⏱" : "✗";

			// 格式: FID:XXX | 游戏名:XXX | 区号:XXX | CDK:XXX
			const displayParts = [`${colors.cyan}FID:${colors.reset} ${task.fid}`];

			if (task.nickname) {
				displayParts.push(
					`${colors.cyan}游戏名:${colors.reset} ${task.nickname}`,
				);
			}

			if (task.kid !== undefined) {
				displayParts.push(`${colors.cyan}区号:${colors.reset} ${task.kid}`);
			}

			displayParts.push(`${colors.cyan}CDK:${colors.reset} ${task.cdk}`);

			logger.raw(
				`  ${colors.dim}${index + 1}.${colors.reset} ${icon} ${displayParts.join(` ${colors.dim}|${colors.reset} `)}\n`,
			);
			logger.raw(`     ${colors.red}${task.message}${colors.reset}\n`);
		}
		logger.raw("\n");
		logger.divider("─", 70);
		logger.raw(
			`\n${colors.yellow}💾 失败的任务已保存到 ${colors.bright}failed_tasks/${colors.reset}${colors.yellow} 目录${colors.reset}\n`,
		);
		logger.raw(
			`${colors.dim}   使用 ${colors.bright}npm run start:failed${colors.reset}${colors.dim} 参数重试失败任务${colors.reset}\n\n`,
		);
	}

	logger.divider("═", 70);
	logger.success("\n🎉 程序执行完成！\n");
};

/**
 * 主程序入口
 */
async function main(): Promise<void> {
	try {
		// 加载配置
		const config = await loadConfig();

		// 检查命令行参数
		const args = process.argv.slice(2);
		const isProcessingFailedTasks = args.includes("--process-failed");

		if (isProcessingFailedTasks) {
			// 处理失败任务
			const failedTasksDir = path.join(process.cwd(), "failed_tasks");

			try {
				// 获取目录中的所有文件
				const files = await fs.readdir(failedTasksDir);
				const jsonFiles = files.filter((file) => file.endsWith(".json"));

				if (jsonFiles.length === 0) {
					logger.error("没有找到失败任务文件");
					process.exit(1);
				}

				// 按时间排序，处理最新的文件
				jsonFiles.sort();
				const latestFile = jsonFiles[jsonFiles.length - 1];
				const filePath = path.join(failedTasksDir, latestFile);

				logger.info(`开始处理失败任务文件: ${latestFile}`);

				// 处理失败任务
				const startTime = Date.now();
				const results = await processFailedTasks(filePath);
				const endTime = Date.now();

				// 计算成功和失败数量
				const successResults = results.filter((r) => r.success);
				const successCount = successResults.length;
				const alreadyClaimedCount = successResults.filter((r) =>
					r.message.includes("已领过"),
				).length;
				const newClaimCount = successCount - alreadyClaimedCount;
				const failureCount = results.length - successCount;
				const timeoutCount = results.filter(
					(r) =>
						!r.success &&
						(r.message.includes("TIMEOUT") || r.message.includes("超时")),
				).length;
				const otherFailureCount = failureCount - timeoutCount;

				// 输出失败任务处理统计
				logger.info(
					`\n⏱️ 执行用时: ${((endTime - startTime) / 1000).toFixed(2)} 秒`,
				);
				const failedStats = {
					success: newClaimCount,
					alreadyClaimed: alreadyClaimedCount,
					timeout: timeoutCount,
					failure: otherFailureCount,
				};
				printTaskSummary(failedStats, results);
			} catch (error) {
				logger.error({ err: error }, "处理失败任务时出错");
				process.exit(1);
			}
		} else {
			// 正常处理礼包码
			// 验证输入数据
			if (config.cdks.length === 0 || config.fids.length === 0) {
				logger.error("配置错误: 礼包码或玩家ID列表为空");
				process.exit(1);
			}

			// 处理礼包码（使用优化的流程）
			const startTime = Date.now();
			const results = await processGiftCodesOptimized(config.cdks, config.fids);
			const endTime = Date.now();

			// 计算成功和失败数量
			const successResults = results.filter((r) => r.success);
			const successCount = successResults.length;
			const alreadyClaimedCount = successResults.filter((r) =>
				r.message.includes("已领过"),
			).length;
			const newClaimCount = successCount - alreadyClaimedCount;
			const failureCount = results.length - successCount;
			const timeoutCount = results.filter(
				(r) =>
					!r.success &&
					(r.message.includes("TIMEOUT") || r.message.includes("超时")),
			).length;
			const otherFailureCount = failureCount - timeoutCount;

			// 输出正常任务处理统计
			logger.info(
				`\n⏱️ 执行用时: ${((endTime - startTime) / 1000).toFixed(2)} 秒`,
			);
			const normalStats = {
				success: newClaimCount,
				alreadyClaimed: alreadyClaimedCount,
				timeout: timeoutCount,
				failure: otherFailureCount,
			};
			// 使用优化流程时显示按玩家分组的统计
			printTaskSummary(normalStats, results, true);
		}

		process.exit(0);
	} catch (error) {
		logger.error({ err: error }, "程序运行失败");
		process.exit(1);
	}
}

main();
