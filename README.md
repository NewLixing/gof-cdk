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

<h3>无尽冬日礼包码自动领取系统</h3>
<p>基于 Cloudflare Pages + Workers + Workers AI 的订阅制自动领取平台</p>

</div>

## 📋 目录

- [🚀 项目简介](#-项目简介)
- [✨ 核心特性](#-核心特性)
- [🏗️ 系统架构](#️-系统架构)
- [🛠️ 技术栈](#️-技术栈)
- [📥 快速开始](#-快速开始)
- [📝 使用方法](#-使用方法)
- [📊 API 文档](#-api-文档)
- [⚙️ 配置说明](#️-配置说明)
- [⚠️ 注意事项](#️-注意事项)
- [👥 贡献指南](#-贡献指南)
- [📄 许可证](#-许可证)

## 🚀 项目简介

GOF-CDK 是一个现代化、零运维的《无尽冬日》游戏礼包码自动领取平台。用户可以订阅玩家ID，系统自动为订阅的玩家领取所有礼包码，并智能管理礼包码的有效期。

**核心理念：**
- 🎯 **订阅制** - 订阅玩家ID，无需每次手动输入
- 🤖 **自动化** - 系统自动领取，智能识别验证码
- 💡 **智能管理** - 自动检测过期礼包码，防重复领取

## ✨ 核心特性

### 🌐 Web 界面
- **玩家订阅管理** - 添加/移除订阅玩家，查看订阅列表
- **礼包码管理** - 添加礼包码，自动分类（有效/过期）
- **自动领取控制** - 一键触发自动领取，实时查看结果

### 🤖 智能特性
- **Workers AI 验证码识别** - 使用 LLaVA 1.5 7B 模型自动识别验证码
- **自动过期检测** - 识别过期礼包码（40007错误）并自动移至过期列表
- **防重复领取** - 智能跟踪领取记录，避免重复领取

### ☁️ 云端特性
- **零运维** - 完全基于 Cloudflare 平台，无需服务器管理
- **全球加速** - Cloudflare CDN + 边缘计算，延迟 <50ms
- **自动扩展** - Workers 自动应对流量高峰
- **完全免费** - 使用 Cloudflare 免费额度（100k 请求/天）

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages (前端)                    │
│              React + TypeScript + Tailwind CSS              │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 玩家订阅管理  │  │ 礼包码管理    │  │ 自动领取控制  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────────────┐
│                 Cloudflare Workers (后端)                    │
│                  Hono + TypeScript                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  KV 存储    │  │  D1 数据库   │  │  Workers AI      │   │
│  │  (订阅/码)  │  │  (历史记录)  │  │  (验证码识别)    │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 数据流程

1. **订阅玩家** → 存储到 KV → 持久化到 D1
2. **添加礼包码** → 存储到 KV（有效列表）
3. **自动领取** → 为每个订阅玩家领取每个礼包码
   - 获取验证码 → Workers AI 识别 → 提交领取
   - 成功 → 记录到 KV
   - 过期 → 移至过期列表
4. **查询历史** → 从 D1 读取

## 🛠️ 技术栈

### 前端
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Vite** - 构建工具

### 后端
- **Cloudflare Workers** - 无服务器运行时
- **Hono** - 轻量级 Web 框架
- **Workers AI** - AI 模型推理（LLaVA 1.5 7B）
- **KV Storage** - 键值存储
- **D1 Database** - SQL 数据库

## 📥 快速开始

详细部署指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 或 [QUICKSTART.md](./QUICKSTART.md)

### 前置要求
- Node.js 18+
- Cloudflare 账号（免费）
- Wrangler CLI

### 5分钟部署

```bash
# 1. 安装 Wrangler
npm install -g wrangler
wrangler login

# 2. 部署 Workers 后端
cd workers
npm install
# 创建 KV 和 D1（按照 DEPLOYMENT.md 配置）
npm run deploy

# 3. 部署 Pages 前端
cd ../frontend
npm install
npm run build
wrangler pages deploy dist --project-name=gof-cdk
```

## 📝 使用方法

### 三步使用流程

1. **订阅玩家** 
   - 在左侧"玩家订阅管理"输入玩家ID
   - 点击"订阅"按钮
   - 系统自动获取并保存玩家信息

2. **添加礼包码**
   - 在中间"礼包码管理"输入礼包码
   - 可选添加备注说明
   - 点击"添加礼包码"

3. **自动领取**
   - 在右侧"自动领取控制"点击"立即执行"
   - 系统自动为所有订阅玩家领取所有有效礼包码
   - 查看领取结果摘要

### 自动化特性

- ✅ **自动跳过** - 已领取的礼包码自动跳过
- ✅ **自动检测** - 过期礼包码自动移至过期列表
- ✅ **自动识别** - Workers AI 自动识别验证码
- ✅ **自动重试** - 验证码识别失败自动重试（最多3次）

## 📊 API 文档

### 玩家订阅管理

```bash
# 订阅玩家
POST /api/players/subscribe
Body: { "fid": "123456789" }

# 获取订阅列表
GET /api/players

# 取消订阅
DELETE /api/players/:fid
```

### 礼包码管理

```bash
# 添加礼包码
POST /api/giftcodes
Body: { "code": "WJDR666", "description": "测试码" }

# 获取礼包码列表
GET /api/giftcodes
Response: { "active": [...], "expired": [...] }

# 删除礼包码
DELETE /api/giftcodes/:code
```

### 自动领取

```bash
# 触发自动领取
POST /api/redeem/auto

# 查询领取历史
GET /api/redemptions?limit=100
```

## ⚙️ 配置说明

### Workers 配置

在 `workers/wrangler.toml` 中配置：

```toml
[[kv_namespaces]]
binding = "TASKS_KV"
id = "your_kv_namespace_id"  # 替换为你的 KV ID

[[d1_databases]]
binding = "DB"
database_name = "gof-cdk-history"
database_id = "your_d1_database_id"  # 替换为你的 D1 ID

[ai]
binding = "AI"
```

### 前端配置

在 `frontend/.env` 中配置：

```bash
VITE_API_BASE_URL=https://your-worker.workers.dev
```

## 💰 费用说明

使用 Cloudflare 免费计划：

| 服务 | 免费额度 | 说明 |
|------|----------|------|
| Workers | 100,000 请求/天 | 足够个人使用 |
| Pages | 无限请求 | 静态资源 |
| KV | 100,000 读/天 | 键值存储 |
| D1 | 100,000 读/天 | SQL 数据库 |
| Workers AI | 10,000 推理/天 | AI 模型 |

对于个人和中小型应用**完全免费**！

## ⚠️ 注意事项

### 使用限制
- 每个玩家处理间隔 2 秒，避免触发游戏风控
- 每个礼包码处理间隔 500ms
- 验证码识别最多重试 3 次

### 安全建议
- 生产环境配置 CORS 限制域名
- 不要在前端暴露敏感信息
- 定期清理过期数据

### 法律合规
- ⚖️ 本项目仅供学习研究使用
- ⚖️ 请遵守游戏服务条款
- ⚖️ 不得用于任何商业用途
- ⚖️ 使用者需自行承担所有责任

## 👥 贡献指南

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md)

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by [NewLixing](https://github.com/NewLixing)

Powered by [Cloudflare](https://www.cloudflare.com/)

</div>
