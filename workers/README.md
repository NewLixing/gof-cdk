# GOF-CDK Workers Backend

Cloudflare Workers 后端服务，提供 API 接口处理礼包码批量领取任务。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置

```bash
# 复制配置文件
cp wrangler.toml.example wrangler.toml

# 创建 KV 命名空间
wrangler kv:namespace create "TASKS_KV"
# 将返回的 id 更新到 wrangler.toml

# 创建 D1 数据库
wrangler d1 create gof-cdk-history
# 将返回的 database_id 更新到 wrangler.toml
```

### 3. 本地开发

```bash
npm run dev
```

Worker 将运行在 `http://localhost:8787`

### 4. 部署

```bash
npm run deploy
```

## 📡 API 接口

### POST /api/batch

提交批量任务

**请求：**
```json
{
  "fids": ["123456789"],
  "cdks": ["WJDR666", "WJDR888"]
}
```

**响应：**
```json
{
  "success": true,
  "message": "Created 1 tasks",
  "data": [
    { "fid": "123456789", "taskId": "task_xxx" }
  ]
}
```

### GET /api/status/:taskId

查询任务状态

**响应：**
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
    "results": [...]
  }
}
```

### GET /api/history

获取历史记录

**响应：**
```json
{
  "success": true,
  "data": [...]
}
```

## 🏗️ 项目结构

```
workers/
├── src/
│   ├── index.ts          # Worker 入口
│   ├── types.ts          # TypeScript 类型定义
│   └── lib/
│       ├── api-service.ts    # 游戏 API 服务
│       ├── task-manager.ts   # 任务管理器
│       └── utils.ts          # 工具函数
├── wrangler.toml.example # 配置文件示例
└── package.json
```

## 🤖 Workers AI

本项目使用 Cloudflare Workers AI 的 LLaVA 模型进行验证码识别：

- 模型: `@cf/llava-hf/llava-1.5-7b-hf`
- 用途: 识别4位数字/字母验证码
- 免费额度: 10,000 次推理/天

## 💾 数据存储

### KV Storage
- 用途: 存储任务状态
- 过期时间: 1小时
- 绑定名称: `TASKS_KV`

### D1 Database
- 用途: 存储历史记录
- 表结构:
  - `task_history`: 任务记录
  - `task_results`: 详细结果

## 📚 相关文档

- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Workers AI](https://developers.cloudflare.com/workers-ai/)
- [KV Storage](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [D1 Database](https://developers.cloudflare.com/d1/)
