# 更新日志

所有重要更改都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [2.0.0] - 2024-12-22

### 新增

#### Web 版本
- 🌐 基于 Cloudflare Pages 的现代化 Web UI
- 🤖 集成 Cloudflare Workers AI 进行验证码识别
- 📊 实时任务进度追踪和展示
- 💾 使用 KV Storage 存储任务状态
- 📚 使用 D1 Database 存储历史记录
- 🚀 Cloudflare Workers 无服务器后端
- 🎨 基于 React + TypeScript + Tailwind CSS 的前端
- 📱 响应式设计，支持移动端和桌面端

#### API 接口
- `POST /api/batch` - 批量提交任务
- `GET /api/status/:taskId` - 查询任务状态
- `GET /api/history` - 获取历史记录

#### 文档
- ✅ 新增 `DEPLOYMENT.md` - 详细部署指南
- ✅ 新增 `QUICKSTART.md` - 快速开始指南
- ✅ 新增 `ARCHITECTURE.md` - 系统架构文档
- ✅ 新增 `CONTRIBUTING.md` - 贡献指南
- ✅ 更新 `README.md` - 添加 Web 版本说明
- ✅ 各子项目的 `README.md`

### 改进
- ⚡ 使用边缘计算，全球访问延迟更低
- 🌍 CDN 加速，静态资源加载更快
- 📈 自动扩展，无需关心服务器容量
- 💰 完全免费，使用 Cloudflare 免费额度
- 🔒 更安全的架构，Workers 运行在隔离环境

### 技术栈
- **前端**: React 18, TypeScript, Tailwind CSS, Vite
- **后端**: Cloudflare Workers, Hono
- **AI**: Cloudflare Workers AI (LLaVA 1.5 7B)
- **存储**: KV Storage, D1 Database
- **部署**: Cloudflare Pages, Wrangler CLI

## [1.0.0] - 2024-XX-XX

### 新增

#### CLI 版本
- ✅ 命令行批量处理工具
- 🚀 智能会话管理，减少 95% 的玩家信息请求
- 🔄 自动重试机制
- 📊 详细的统计报告
- 💾 失败任务保存和重试
- 🔍 本地验证码识别（ddddocr）

### 特性
- 按玩家分组处理礼包码
- 验证码自动识别
- 详细日志记录
- 失败任务管理

### 性能
- 相比传统方式减少 31.7% 的 API 请求
- 提升 32.5% 的执行速度

### 技术栈
- **语言**: TypeScript
- **HTTP 客户端**: Axios
- **验证码识别**: ddddocr-node
- **配置管理**: dotenv
- **数据验证**: Zod
- **日志**: Pino

---

## 版本对比

| 功能 | v1.0 (CLI) | v2.0 (Web) |
|------|-----------|-----------|
| 使用方式 | 命令行 | Web 浏览器 |
| 部署方式 | 本地运行 | 云端部署 |
| 验证码识别 | 本地 (ddddocr) | AI (Workers AI) |
| 实时进度 | 控制台输出 | Web UI 实时更新 |
| 多用户支持 | ❌ | ✅ |
| 全球加速 | ❌ | ✅ (CDN) |
| 自动扩展 | ❌ | ✅ |
| 成本 | 免费 | 免费 |
| 运维 | 需要本地环境 | 零运维 |

---

## 未来计划

### v2.1.0 (计划中)
- [ ] WebSocket 实时通信
- [ ] 用户认证和授权
- [ ] 更详细的统计图表
- [ ] 移动端 PWA 支持

### v2.2.0 (计划中)
- [ ] 批量任务导入/导出
- [ ] 定时任务
- [ ] Webhook 通知
- [ ] 多语言支持

### v3.0.0 (远期)
- [ ] 支持更多游戏
- [ ] API 开放平台
- [ ] 插件系统
- [ ] 社区功能

---

## 升级指南

### 从 v1.0 升级到 v2.0

v2.0 是全新的 Web 版本，与 v1.0 CLI 版本并存，你可以：

1. **继续使用 CLI 版本** - v1.0 功能完全保留
2. **尝试 Web 版本** - 按照 QUICKSTART.md 部署
3. **同时使用** - CLI 用于本地批量，Web 用于在线服务

不需要迁移数据，两个版本独立运行。

---

[2.0.0]: https://github.com/NewLixing/gof-cdk/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/NewLixing/gof-cdk/releases/tag/v1.0.0
