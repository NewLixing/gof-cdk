# GOF-CDK

<div align="center">

```
 ██████╗  ██████╗ ███████╗      ██████╗██████╗ ██╗  ██╗
██╔════╝ ██╔═══██╗██╔════╝     ██╔════╝██╔══██╗██║ ██╔╝
██║  ███╗██║   ██║█████╗█████╗ ██║     ██║  ██║█████╔╝ 
██║   ██║██║   ██║██╔══╝╚════╝ ██║     ██║  ██║██╔═██╗ 
╚██████╔╝╚██████╔╝██║          ╚██████╗██████╔╝██║  ██╗
 ╚═════╝  ╚═════╝ ╚═╝           ╚═════╝╚═════╝ ╚═╝  ╚═╝
```

![Version](https://img.shields.io/badge/版本-2.0.0-blue)
![License](https://img.shields.io/badge/许可证-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange)

<h3>无尽冬日礼包码批量处理系统</h3>
<p>基于 Cloudflare Pages + Workers + Workers AI 的现代化 Web 应用</p>

</div>

## 📋 目录

- [GOF-CDK](#gof-cdk)
  - [📋 目录](#-目录)
  - [🚀 项目简介](#-项目简介)
  - [🌟 新版本特性 (v2.0)](#-新版本特性-v20)
  - [✨ 主要特性](#-主要特性)
  - [🏗️ 系统架构](#️-系统架构)
  - [🛠️ 技术栈](#️-技术栈)
  - [📥 安装与部署](#-安装与部署)
  - [📝 使用方法](#-使用方法)
  - [⚙️ CLI版本使用 (传统模式)](#️-cli版本使用-传统模式)
  - [📊 性能优化](#-性能优化)
  - [⚠️ 注意事项](#️-注意事项)
  - [👥 贡献指南](#-贡献指南)
  - [📄 许可证](#-许可证)
  - [⚠️ 免责声明](#️-免责声明)

## 🚀 项目简介

GOF-CDK 是一个用于处理《无尽冬日》游戏礼包码的现代化平台。项目提供两种使用方式：

1. **Web 版 (v2.0)** - 基于 Cloudflare 的全栈 Web 应用，零运维，全球加速
2. **CLI 版 (v1.0)** - 命令行工具，适合本地批量处理

## 🌟 新版本特性 (v2.0)

### Web UI 版本

基于 **Cloudflare Pages + Workers + Workers AI** 构建的现代化 Web 应用：

- 🌐 **Web 界面** - 用户友好的可视化操作界面
- 🤖 **AI 验证码识别** - 使用 Cloudflare Workers AI 自动识别验证码
- 📊 **实时进度追踪** - 批量任务实时进度展示
- 💾 **云端存储** - KV + D1 数据库持久化存储
- 🚀 **零运维部署** - 一键部署到 Cloudflare，自动扩展
- 🌍 **全球 CDN 加速** - 基于 Cloudflare 网络，全球访问更快
- 💰 **完全免费** - 使用 Cloudflare 免费额度，无需服务器

## ✨ 主要特性

### Web 版特性
- ✅ 可视化批量处理界面
- 🎯 支持多玩家 ID 与多礼包码同时处理
- 📈 实时任务进度与结果展示
- 🤖 AI 自动识别验证码（Workers AI）
- 💾 任务状态持久化（KV 存储）
- 📚 历史记录查询（D1 数据库）
- 🔄 自动重试机制
- 🌐 全球 CDN 加速访问

### CLI 版特性
- ✅ 支持处理多个礼包码和多个玩家账号
- 🚀 智能会话管理 - 按玩家分组，减少95%的玩家信息重复请求
- 🔄 自动重试机制，提高领取成功率
- 📊 详细的日志记录和统计报告
- 🔧 基于环境变量的简单配置
- 🔍 本地验证码识别
- 💾 失败任务保存与重新处理

## 🏗️ 系统架构

### Web 版架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages (前端)                    │
│              React + TypeScript + Tailwind CSS              │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/JSON API
┌────────────────────▼────────────────────────────────────────┐
│                 Cloudflare Workers (后端)                    │
│                  Hono + TypeScript                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  KV 存储    │  │  D1 数据库   │  │  Workers AI OCR  │   │
│  │  (任务状态) │  │  (历史记录)  │  │  (验证码识别)    │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ 技术栈

### Web 版 (v2.0)

**前端:**
- React 18
- TypeScript
- Tailwind CSS
- Vite

**后端:**
- Cloudflare Workers
- Hono (轻量级 Web 框架)
- Workers AI (验证码识别)
- KV Storage (任务状态)
- D1 Database (历史记录)

### CLI 版 (v1.0)

- **TypeScript** - 主要开发语言
- **Axios** - HTTP请求处理
- **Crypto-JS** - 加密处理
- **Dotenv** - 环境变量管理
- **Zod** - 数据验证
- **DdddOcr** - 验证码识别

## 📥 安装与部署

### Web 版部署

详细部署指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

快速开始：

```bash
# 1. 部署 Workers 后端
cd workers
npm install
wrangler login
npm run deploy

# 2. 部署 Pages 前端
cd ../frontend
npm install
npm run build
wrangler pages deploy dist --project-name=gof-cdk
```

### CLI 版安装

详见下方 "CLI版本使用" 部分。

## 📝 使用方法

### Web 版使用

1. 访问部署的 Pages URL
2. 在左侧表单中输入：
   - 玩家 ID 列表（多个用逗号或换行分隔）
   - 礼包码列表（多个用逗号或换行分隔）
3. 点击"开始批量处理"
4. 在右侧实时查看处理进度和结果

### API 接口

```bash
# 提交批量任务
POST /api/batch
Body: { "fids": ["123456"], "cdks": ["WJDR666"] }

# 查询任务状态
GET /api/status/:taskId

# 获取历史记录
GET /api/history?limit=100
```

## ⚙️ CLI版本使用 (传统模式)
## ⚙️ CLI版本使用 (传统模式)

### 前置条件

- Node.js (v16+)
- npm 或 pnpm

### 安装步骤

1. **克隆仓库**

   ```bash
   git clone https://github.com/NewLixing/gof-cdk.git
   cd gof-cdk
   ```

2. **安装依赖**

   ```bash
   npm install
   # 或使用 pnpm
   pnpm install
   ```

3. **配置环境变量**

   ```bash
   cp .env.example .env
   ```

   编辑`.env`文件，配置必要参数。

### CLI 使用方法

### CLI 使用方法

1. **构建项目**

   ```bash
   npm run build
   # 或使用 pnpm
   pnpm build
   ```

2. **运行程序**

   正常处理礼包码：

   ```bash
   npm start
   # 或使用 pnpm
   pnpm start
   ```

   处理之前失败的任务：

   ```bash
   npm run start:failed
   # 或使用 pnpm
   pnpm start:failed
   ```

### CLI 配置详解

### CLI 配置详解

在`.env`文件中可配置以下参数：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `CDK_LIST` | 礼包码列表，多个用逗号分隔 | - |
| `FID_LIST` | 玩家ID列表，多个用逗号分隔 | - |
| `MAX_RETRIES` | 请求最大重试次数 | `5` |
| `TIMEOUT` | 请求超时时间（毫秒） | `20000` |
| `DEVELOPMENT_MODE` | 开发模式开关，开启后显示所有日志 | `false` |
| `API_BASE_URL` | API服务基础URL | `https://wjdr-giftcode-api.campfiregames.cn/api` |
| `SIGN_SALT` | API签名盐值 | `Uiv#87#SPan.ECsp` |

### CLI 失败任务处理

- 系统会自动重试失败的任务，最多重试3次
- 如果验证码格式不正确（长度不为4或包含中文），会自动重试
- 所有失败的任务会保存到 `failed_tasks` 目录下，文件名格式为 `failed_tasks_YYYY-MM-DD.json`
- 可以使用 `npm run start:failed` 命令重新处理失败的任务

## 📊 性能优化

### CLI 版性能优化

本工具采用了**会话管理优化策略**，相比传统的逐任务处理方式，大幅提升了处理效率：

**优化原理：**
- 按玩家分组，每个玩家只获取一次信息，然后批量处理该玩家的所有礼包码
- 10个玩家 × 20个礼包码 = 10次玩家信息请求（**减少95%**）

**性能提升：** (以 10个玩家 × 20个礼包码 为例)

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 玩家信息请求 | 200次 | 10次 | **减少95%** |
| 总API请求数 | 约600次 | 约410次 | **减少31.7%** |
| 执行时间 | 约200秒 | 约135秒 | **减少32.5%** |

### Web 版性能优势

- 🚀 **边缘计算** - Cloudflare Workers 全球边缘节点，延迟更低
- 🌐 **CDN 加速** - Pages 静态资源全球 CDN 分发
- 📈 **自动扩展** - 无需管理服务器，自动应对流量高峰
- 💾 **高速存储** - KV 和 D1 优化的全球分布式存储

## ⚠️ 注意事项

- 请确保礼包码和玩家ID格式正确
- 批次大小建议设置为2-5，避免请求过于频繁触发限制
- 批次间延迟建议设置为3000毫秒以上

## 👥 贡献指南

欢迎提交Issue和Pull Request，共同改进这个项目。

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m '添加了一些很棒的功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个Pull Request

## 📄 许可证

本项目基于MIT许可证开源，详见[LICENSE](LICENSE)文件。

## ⚠️ 免责声明

本项目仅供学习和研究目的使用，不得用于任何商业用途。使用本项目进行任何商业行为所产生的后果，需自行承担全部责任。作者不对使用本项目所导致的任何直接或间接损失负责。

请遵守相关法律法规和游戏服务条款，合理使用本工具。
