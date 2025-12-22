# GOF-CDK Frontend

基于 React + TypeScript + Tailwind CSS 的现代化 Web 界面。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
# 复制环境变量文件
cp .env.example .env

# 编辑 .env，设置 Workers API URL
# VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev
```

### 3. 本地开发

```bash
npm run dev
```

应用将运行在 `http://localhost:3000`

### 4. 构建

```bash
npm run build
```

构建输出在 `dist/` 目录

### 5. 部署到 Cloudflare Pages

```bash
# 使用 Wrangler CLI
wrangler pages deploy dist --project-name=gof-cdk

# 或通过 Git 集成（推荐）
# 1. 推送代码到 GitHub
# 2. 在 Cloudflare Dashboard 连接仓库
# 3. 配置构建命令和环境变量
```

## 🎨 功能特性

- 📝 批量提交表单
  - 支持多玩家ID输入
  - 支持多礼包码输入
  - 实时表单验证

- 📊 任务进度展示
  - 实时状态更新
  - 进度条显示
  - 详细结果展示

- 🎯 响应式设计
  - 适配桌面端和移动端
  - 现代化 UI 设计
  - 流畅的交互体验

## 🏗️ 项目结构

```
frontend/
├── src/
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 入口文件
│   ├── index.css            # 全局样式
│   ├── types.ts             # TypeScript 类型
│   ├── components/
│   │   ├── BatchForm.tsx    # 批量提交表单
│   │   ├── TaskList.tsx     # 任务列表
│   │   └── TaskCard.tsx     # 任务卡片
│   └── lib/
│       └── api.ts           # API 客户端
├── public/                  # 静态资源
├── index.html              # HTML 入口
├── vite.config.ts          # Vite 配置
├── tailwind.config.js      # Tailwind 配置
└── package.json
```

## 🎨 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Vite** - 构建工具

## 🌐 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `VITE_API_BASE_URL` | Workers API 地址 | `https://worker.your-subdomain.workers.dev` |

## 📱 使用示例

### 输入格式

**玩家ID：**
```
123456789
987654321
```

**礼包码：**
```
WJDR666
WJDR888
WJDR999
```

### 处理流程

1. 输入玩家ID和礼包码
2. 点击"开始批量处理"
3. 系统为每个玩家创建独立任务
4. 实时展示处理进度和结果
5. 可展开查看详细信息

## 🎯 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 📚 相关文档

- [React 文档](https://react.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Vite 文档](https://vitejs.dev/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
