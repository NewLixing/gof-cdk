# 快速开始指南

这是最快速的部署和使用教程，让你5分钟内完成部署。

## 🚀 最快部署方式

### 1. 准备工作 (1分钟)

- 注册 [Cloudflare 账号](https://dash.cloudflare.com/sign-up)（完全免费）
- 安装 [Node.js 18+](https://nodejs.org/)

### 2. 安装 Wrangler (30秒)

```bash
npm install -g wrangler
wrangler login
```

### 3. 部署 Workers 后端 (2分钟)

```bash
cd workers

# 安装依赖
npm install

# 创建 KV 命名空间
wrangler kv:namespace create "TASKS_KV"
# 复制返回的 id，更新到 wrangler.toml 的 [[kv_namespaces]] id

# 创建 D1 数据库
wrangler d1 create gof-cdk-history
# 复制返回的 database_id，更新到 wrangler.toml 的 [[d1_databases]] database_id

# 部署
npm run deploy
```

部署成功后，会显示 Worker URL，例如：
```
https://gof-cdk-worker.your-subdomain.workers.dev
```

**保存这个 URL，稍后配置前端时会用到！**

### 4. 部署 Pages 前端 (2分钟)

```bash
cd ../frontend

# 安装依赖
npm install

# 创建环境变量文件
cp .env.example .env

# 编辑 .env 文件，设置 Worker URL
# VITE_API_BASE_URL=https://gof-cdk-worker.your-subdomain.workers.dev
```

编辑 `.env` 文件，将 `VITE_API_BASE_URL` 设置为上一步的 Worker URL。

```bash
# 构建
npm run build

# 部署到 Pages
wrangler pages deploy dist --project-name=gof-cdk
```

部署成功后，会显示 Pages URL，例如：
```
https://gof-cdk.pages.dev
```

### 5. 访问应用 ✅

打开浏览器，访问你的 Pages URL，开始使用！

## 📱 使用指南

### 输入格式

**玩家ID列表** (多个用逗号或换行分隔)：
```
123456789
987654321
```

**礼包码列表** (多个用逗号或换行分隔)：
```
WJDR666
WJDR888
WJDR999
```

### 使用步骤

1. 在左侧表单输入玩家ID和礼包码
2. 点击"开始批量处理"按钮
3. 在右侧查看实时进度和结果
4. 展开任务卡片查看详细信息

## 🔧 本地开发

如果你想本地开发和调试：

### 启动 Workers 后端

```bash
cd workers
npm run dev
```

Workers 运行在 `http://localhost:8787`

### 启动前端

```bash
cd frontend

# 设置 .env 为本地 Worker
echo "VITE_API_BASE_URL=http://localhost:8787" > .env

npm run dev
```

前端运行在 `http://localhost:3000`

## ❓ 常见问题

### Q: Workers AI 验证码识别失败？

A: 确保在 `wrangler.toml` 中添加了 AI 绑定：
```toml
[ai]
binding = "AI"
```

### Q: KV 或 D1 连接失败？

A: 检查 `wrangler.toml` 中的 ID 是否正确替换：
```toml
[[kv_namespaces]]
binding = "TASKS_KV"
id = "替换为你的KV ID"

[[d1_databases]]
binding = "DB"
database_name = "gof-cdk-history"
database_id = "替换为你的D1 ID"
```

### Q: 如何更新部署？

A: 修改代码后，重新运行部署命令：
```bash
# Workers
cd workers
npm run deploy

# Pages
cd frontend
npm run build
wrangler pages deploy dist --project-name=gof-cdk
```

### Q: 免费额度够用吗？

A: Cloudflare 免费计划包括：
- Workers: 100,000 次请求/天
- Pages: 无限静态请求
- KV: 100,000 次读取/天
- D1: 100,000 次读取/天
- Workers AI: 10,000 次推理/天

对于个人使用完全足够！

## 📚 更多信息

- 完整部署指南: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 项目说明: [README.md](./README.md)
- Cloudflare 文档: https://developers.cloudflare.com/

## 🆘 需要帮助？

如果遇到问题，请：
1. 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 的故障排查部分
2. 提交 [GitHub Issue](https://github.com/NewLixing/gof-cdk/issues)

祝你使用愉快！🎉
