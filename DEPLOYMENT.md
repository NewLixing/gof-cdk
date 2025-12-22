# GOF-CDK Cloudflare 部署指南

基于 Cloudflare Pages + Workers + Workers AI 实现的现代化礼包码批量处理系统。

## 🌟 系统架构

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

## 📋 功能特性

- ✅ **Web UI界面** - 用户友好的礼包码批量领取页面
- 🎯 **批量处理** - 支持多玩家ID与多CDK同时处理
- 🤖 **AI验证码识别** - 使用Cloudflare Workers AI自动识别验证码
- 📊 **实时进度展示** - WebSocket或轮询方式实时更新处理进度
- 💾 **持久化存储** - KV存储任务状态，D1数据库保存历史记录
- 🚀 **零运维** - 全部使用Cloudflare免费额度，自动扩展
- 🌍 **全球加速** - Cloudflare CDN加速，全球访问更快

## 🚀 快速开始

### 前置要求

- Node.js 18+
- Cloudflare 账号
- Wrangler CLI (Cloudflare Workers 开发工具)

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 创建 KV 命名空间

```bash
# 创建生产环境 KV
wrangler kv:namespace create "TASKS_KV"

# 创建预览环境 KV (可选)
wrangler kv:namespace create "TASKS_KV" --preview
```

记录返回的 `id` 值，更新到 `workers/wrangler.toml` 文件中。

### 4. 创建 D1 数据库

```bash
# 创建数据库
wrangler d1 create gof-cdk-history

# 记录返回的 database_id，更新到 workers/wrangler.toml
```

### 5. 部署 Workers 后端

```bash
cd workers

# 安装依赖
npm install

# 部署到 Cloudflare Workers
npm run deploy
```

部署成功后，记录返回的 Worker URL，例如：
`https://gof-cdk-worker.your-subdomain.workers.dev`

### 6. 配置前端

```bash
cd ../frontend

# 复制环境变量文件
cp .env.example .env

# 编辑 .env，设置 Workers API URL
# VITE_API_BASE_URL=https://gof-cdk-worker.your-subdomain.workers.dev
```

### 7. 部署前端到 Cloudflare Pages

有两种部署方式：

#### 方式 A: 通过 Wrangler CLI

```bash
cd frontend

# 安装依赖
npm install

# 构建
npm run build

# 部署到 Pages
wrangler pages deploy dist --project-name=gof-cdk
```

#### 方式 B: 通过 Git 集成 (推荐)

1. 将代码推送到 GitHub
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. 进入 Pages > Create a project
4. 连接 GitHub 仓库
5. 配置构建设置：
   - Build command: `cd frontend && npm install && npm run build`
   - Build output directory: `frontend/dist`
   - Root directory: `/`
6. 设置环境变量：
   - `VITE_API_BASE_URL`: 你的 Worker URL
7. 点击 "Save and Deploy"

### 8. 访问应用

部署完成后，访问分配的 Pages URL：
`https://gof-cdk.pages.dev`

## 📝 配置说明

### Workers 配置 (`workers/wrangler.toml`)

```toml
name = "gof-cdk-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "TASKS_KV"
id = "your_kv_namespace_id"  # 替换为实际的 KV ID

[[d1_databases]]
binding = "DB"
database_name = "gof-cdk-history"
database_id = "your_d1_database_id"  # 替换为实际的 D1 ID

[ai]
binding = "AI"
```

### 前端环境变量 (`frontend/.env`)

```bash
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev
```

## 🔧 开发模式

### 启动 Workers 开发服务器

```bash
cd workers
npm install
npm run dev
```

Workers 将运行在 `http://localhost:8787`

### 启动前端开发服务器

```bash
cd frontend
npm install
npm run dev
```

前端将运行在 `http://localhost:3000`

## 📊 API 接口文档

### POST /api/batch

提交批量任务

**请求体:**
```json
{
  "fids": ["123456789", "987654321"],
  "cdks": ["WJDR666", "WJDR888"]
}
```

**响应:**
```json
{
  "success": true,
  "message": "Created 2 tasks",
  "data": [
    { "fid": "123456789", "taskId": "task_xxx" },
    { "fid": "987654321", "taskId": "task_yyy" }
  ]
}
```

### GET /api/status/:taskId

查询任务状态

**响应:**
```json
{
  "success": true,
  "data": {
    "taskId": "task_xxx",
    "fid": "123456789",
    "status": "processing",
    "progress": {
      "total": 2,
      "completed": 1,
      "succeeded": 1,
      "failed": 0
    },
    "results": [
      {
        "success": true,
        "message": "已成功领取",
        "cdk": "WJDR666",
        "fid": "123456789",
        "nickname": "玩家昵称",
        "kid": 1,
        "timestamp": 1703001234567
      }
    ],
    "createdAt": 1703001234567,
    "updatedAt": 1703001234567
  }
}
```

### GET /api/history?limit=100

获取历史记录

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "task_id": "task_xxx",
      "fid": "123456789",
      "total_cdks": 2,
      "succeeded": 2,
      "failed": 0,
      "created_at": 1703001234567,
      "completed_at": 1703001244567
    }
  ]
}
```

## 💰 费用说明

使用 Cloudflare 免费计划：

- **Pages**: 无限静态请求，500次构建/月
- **Workers**: 100,000次请求/天
- **KV**: 100,000次读取/天，1,000次写入/天，1GB存储
- **D1**: 100,000次读取/天，50,000次写入/天，5GB存储
- **Workers AI**: 10,000次推理/天

对于个人使用完全免费！

## 🔒 安全注意事项

1. **不要暴露敏感信息**: Workers 代码会处理游戏API签名，确保不在前端暴露签名密钥
2. **速率限制**: 实现适当的速率限制防止滥用
3. **CORS配置**: 根据需要调整CORS策略
4. **环境变量**: 敏感配置使用环境变量而非硬编码

## 🐛 故障排查

### Workers AI 验证码识别失败

- 确保已启用 Workers AI 绑定
- 检查图片格式是否正确
- 验证码模型可能需要调整 prompt

### KV 存储连接失败

- 确认 KV namespace 已正确创建
- 检查 wrangler.toml 中的 ID 是否正确
- 确认已部署最新代码

### D1 数据库错误

- 运行数据库迁移脚本创建表
- 检查 database_id 是否正确

## 📚 相关文档

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Workers AI 文档](https://developers.cloudflare.com/workers-ai/)
- [KV 存储文档](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## ⚠️ 免责声明

本项目仅供学习和研究目的使用，不得用于任何商业用途。使用本项目进行任何商业行为所产生的后果，需自行承担全部责任。请遵守相关法律法规和游戏服务条款。
