# GOF-CDK 系统架构详解

## 🏗️ 整体架构

```
┌───────────────────────────────────────────────────────────────────────┐
│                          用户浏览器                                      │
│                    (React SPA Application)                            │
└──────────────────┬────────────────────────────────────────────────────┘
                   │
                   │ HTTPS
                   │
┌──────────────────▼────────────────────────────────────────────────────┐
│                    Cloudflare Pages (CDN)                             │
│                      静态资源托管 + 全球加速                              │
└──────────────────┬────────────────────────────────────────────────────┘
                   │
                   │ REST API (JSON)
                   │
┌──────────────────▼────────────────────────────────────────────────────┐
│                   Cloudflare Workers                                  │
│                      Edge Serverless Runtime                          │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                     API Routes (Hono)                            │ │
│  │  • POST /api/batch      - 创建批量任务                            │ │
│  │  • GET /api/status/:id  - 查询任务状态                           │ │
│  │  • GET /api/history     - 获取历史记录                           │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Task Manager │  │ API Service  │  │  Workers AI Binding      │   │
│  │              │  │              │  │  (LLaVA Model)          │   │
│  │ • 任务创建    │  │ • 玩家信息   │  │  • 验证码识别            │   │
│  │ • 状态管理    │  │ • 验证码获取 │  │  • OCR 推理              │   │
│  │ • 批量处理    │  │ • 礼包兑换   │  │                          │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────────┘   │
│         │                 │                                            │
└─────────┼─────────────────┼────────────────────────────────────────────┘
          │                 │
          │                 │
    ┌─────▼─────┐     ┌─────▼──────┐
    │ KV Store  │     │ D1 Database │
    │           │     │             │
    │ • 任务状态 │     │ • 历史记录  │
    │ • 1小时TTL│     │ • 详细结果  │
    └───────────┘     └─────────────┘
```

## 🔄 数据流程

### 1. 用户提交任务

```
用户 → Frontend → POST /api/batch
                      ↓
                  创建任务ID
                      ↓
                  存储到 KV (pending)
                      ↓
                  启动异步处理
                      ↓
                  返回 taskId 给用户
```

### 2. 任务处理流程

```
Task Manager 获取任务
        ↓
获取玩家信息 (API Service)
        ↓
循环处理每个礼包码：
    ↓
获取验证码图片
    ↓
Workers AI 识别验证码
    ↓
提交礼包码兑换
    ↓
更新 KV 任务状态
    ↓
延迟 500ms
        ↓
所有礼包码处理完成
        ↓
保存到 D1 历史记录
        ↓
任务状态更新为 completed
```

### 3. 实时进度查询

```
Frontend 每2秒轮询
        ↓
GET /api/status/:taskId
        ↓
从 KV 读取任务状态
        ↓
返回进度和结果
        ↓
Frontend 更新 UI
```

## 🧩 核心组件

### Frontend (React)

#### 组件结构
```
App.tsx
├── BatchForm.tsx       # 批量提交表单
│   ├── 玩家ID输入
│   ├── 礼包码输入
│   └── 提交按钮
└── TaskList.tsx        # 任务列表
    └── TaskCard.tsx    # 单个任务卡片
        ├── 进度条
        ├── 状态图标
        └── 结果详情
```

#### 状态管理
- 使用 React Hooks (useState)
- 任务列表本地状态
- 轮询机制更新状态

### Workers Backend

#### API Layer (Hono)
- 路由处理
- CORS 配置
- 错误处理
- 响应格式化

#### Business Logic

**Task Manager**
```typescript
class TaskManager {
  createTask()        // 创建新任务
  getTaskStatus()     // 查询任务状态
  processTask()       // 异步处理任务
  updateTaskStatus()  // 更新任务状态
  saveToHistory()     // 保存到历史记录
}
```

**API Service**
```typescript
class ApiService {
  getPlayerInfo()           // 获取玩家信息
  getCaptcha()              // 获取验证码
  recognizeCaptcha()        // AI识别验证码
  processGiftCode()         // 处理礼包码
  processSingleCodeWithRetry() // 带重试的处理
}
```

## 💾 数据存储

### KV Storage 结构

```typescript
// Key: taskId
// Value:
{
  taskId: string,
  fid: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress: {
    total: number,
    completed: number,
    succeeded: number,
    failed: number
  },
  results: GiftCodeResult[],
  createdAt: number,
  updatedAt: number
}

// TTL: 3600 seconds (1 hour)
```

### D1 Database Schema

```sql
-- 任务历史表
CREATE TABLE task_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  fid TEXT NOT NULL,
  total_cdks INTEGER NOT NULL,
  succeeded INTEGER NOT NULL,
  failed INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  completed_at INTEGER NOT NULL
);

-- 任务结果表
CREATE TABLE task_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  fid TEXT NOT NULL,
  cdk TEXT NOT NULL,
  success INTEGER NOT NULL,
  message TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);
```

## 🤖 Workers AI 集成

### 验证码识别流程

```
1. 获取 Base64 验证码图片
        ↓
2. 转换为 ArrayBuffer
        ↓
3. 调用 Workers AI
   Model: @cf/llava-hf/llava-1.5-7b-hf
   Prompt: "This is a 4-digit captcha..."
        ↓
4. 提取识别结果
        ↓
5. 验证格式 (4位字母/数字)
        ↓
6. 返回验证码文本
```

### 重试机制

```
最多重试 3 次
每次重试间隔 1 秒
验证码格式检查：
  - 长度必须为 4
  - 不包含中文字符
```

## 🔐 安全机制

### API 签名

```typescript
// 游戏 API 签名算法
function generateSignedObject(data, salt) {
  // 1. 参数按字母排序
  const sorted = Object.keys(data).sort()
  
  // 2. 拼接签名字符串
  const signStr = sorted.map(k => `${k}=${data[k]}`).join('&')
  
  // 3. MD5 加密
  const sign = md5(signStr + salt)
  
  // 4. 添加签名参数
  return { ...data, sign }
}
```

### CORS 配置

```typescript
// Workers 中配置
cors({
  origin: '*',  // 生产环境建议限制域名
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
})
```

## ⚡ 性能优化

### 1. 边缘计算
- Workers 运行在全球边缘节点
- 请求延迟低至 50ms 以内
- 自动选择最近的数据中心

### 2. 缓存策略
- Pages 静态资源 CDN 缓存
- 浏览器缓存策略
- KV 高速读写

### 3. 并发控制
- 每个玩家串行处理礼包码
- 礼包码间延迟 500ms
- 避免触发游戏服务器限流

### 4. 资源优化
- 代码分割和懒加载
- 静态资源压缩
- Tailwind CSS purge

## 📊 监控与调试

### Workers 日志
```bash
# 实时查看日志
wrangler tail

# 查看特定 Worker
wrangler tail gof-cdk-worker
```

### 性能指标
- Workers 执行时间
- API 响应时间
- AI 推理时间
- KV/D1 操作时间

### 错误处理
- Try-catch 包装
- 详细错误日志
- 用户友好的错误提示

## 🔄 扩展性

### 水平扩展
- Workers 自动扩展
- 无需配置服务器
- 应对突发流量

### 功能扩展

**可扩展点：**
1. 增加 Webhook 通知
2. 支持定时任务
3. 添加用户认证
4. 实现 WebSocket 实时通信
5. 接入更多游戏 API

**建议架构：**
```
1. 使用 Durable Objects 管理长连接
2. 使用 Queue 处理异步任务
3. 使用 R2 存储大文件
4. 使用 Workers Analytics 监控
```

## 📈 成本分析

### Cloudflare 免费计划限制

| 服务 | 免费额度 | 预估使用 |
|------|----------|----------|
| Workers | 100,000 请求/天 | ~1,000 请求/天 |
| Pages | 无限请求 | 不限制 |
| KV | 100,000 读取/天 | ~500 读取/天 |
| D1 | 100,000 读取/天 | ~100 读取/天 |
| Workers AI | 10,000 推理/天 | ~200 推理/天 |

**结论：** 对于个人和中小型应用，完全免费使用！

## 🆚 对比分析

### vs 传统服务器方案

| 维度 | Cloudflare | 传统服务器 |
|------|-----------|-----------|
| 成本 | 免费 | $5-50/月 |
| 运维 | 零运维 | 需要管理 |
| 扩展性 | 自动扩展 | 手动扩展 |
| 延迟 | <50ms | >100ms |
| 可用性 | 99.99% | 取决于配置 |

## 🔮 未来展望

### 短期计划
- [ ] WebSocket 实时通信
- [ ] 用户认证和授权
- [ ] 数据统计和报表
- [ ] 移动端优化

### 长期计划
- [ ] 支持更多游戏
- [ ] 多语言支持
- [ ] API 开放平台
- [ ] 插件系统

## 📚 参考资料

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Workers AI 文档](https://developers.cloudflare.com/workers-ai/)
- [Hono 框架](https://hono.dev/)
- [React 文档](https://react.dev/)
