# 贡献指南

感谢你对 GOF-CDK 项目的关注！我们欢迎所有形式的贡献。

## 🤝 如何贡献

### 报告问题

如果你发现了 bug 或有功能建议：

1. 在 [Issues](https://github.com/NewLixing/gof-cdk/issues) 中搜索是否已存在相关问题
2. 如果没有，创建新 Issue
3. 使用清晰的标题和详细的描述
4. 提供复现步骤（对于 bug）
5. 包含系统信息和日志（如适用）

### 提交代码

1. **Fork 仓库**
   ```bash
   # 在 GitHub 上 Fork 项目
   # 然后克隆你的 Fork
   git clone https://github.com/your-username/gof-cdk.git
   cd gof-cdk
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

3. **进行更改**
   - 遵循项目的代码风格
   - 添加必要的测试
   - 更新相关文档

4. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add some feature"
   ```

   提交信息格式：
   - `feat:` 新功能
   - `fix:` Bug 修复
   - `docs:` 文档更新
   - `style:` 代码格式调整
   - `refactor:` 重构
   - `test:` 测试相关
   - `chore:` 构建/工具相关

5. **推送到 GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **创建 Pull Request**
   - 在 GitHub 上创建 PR
   - 填写 PR 模板
   - 等待代码审查

## 📝 代码规范

### TypeScript

```typescript
// ✅ 好的示例
interface UserData {
  id: string;
  name: string;
}

async function getUserData(id: string): Promise<UserData> {
  // 实现
}

// ❌ 避免
function getData(id) {
  // 缺少类型声明
}
```

### React 组件

```tsx
// ✅ 好的示例
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ onClick, children }: ButtonProps) {
  return (
    <button onClick={onClick}>
      {children}
    </button>
  );
}

// ❌ 避免
export function Button(props) {
  return <button>{props.children}</button>;
}
```

### 命名约定

- **文件名**: kebab-case (`task-manager.ts`)
- **组件**: PascalCase (`TaskCard.tsx`)
- **函数/变量**: camelCase (`getUserInfo`)
- **常量**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **类型/接口**: PascalCase (`TaskStatus`)

## 🏗️ 项目结构

```
gof-cdk/
├── frontend/           # React 前端
│   ├── src/
│   │   ├── components/ # React 组件
│   │   ├── lib/        # 工具函数
│   │   └── types.ts    # 类型定义
│   └── package.json
│
├── workers/            # Cloudflare Workers 后端
│   ├── src/
│   │   ├── lib/        # 业务逻辑
│   │   ├── types.ts    # 类型定义
│   │   └── index.ts    # 入口文件
│   └── package.json
│
└── docs/               # 文档
```

## 🧪 测试

### 运行测试

```bash
# Workers
cd workers
npm test

# Frontend
cd frontend
npm test
```

### 添加测试

- 为新功能添加单元测试
- 确保所有测试通过
- 覆盖边界情况

## 📚 文档

### 更新文档

当你添加或修改功能时，请更新相关文档：

- `README.md` - 主要说明
- `DEPLOYMENT.md` - 部署指南
- `ARCHITECTURE.md` - 架构文档
- API 接口文档
- 代码注释

### 文档风格

- 使用清晰简洁的语言
- 提供代码示例
- 包含截图（如适用）
- 保持格式一致

## 🔍 代码审查

### 审查清单

- [ ] 代码符合项目规范
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 没有引入安全问题
- [ ] 性能影响可接受
- [ ] 向后兼容（如适用）

### 处理反馈

- 及时响应审查意见
- 友好讨论不同观点
- 必要时更新代码

## 🎯 优先级

我们特别欢迎以下方面的贡献：

### 高优先级
- 🐛 Bug 修复
- 📖 文档改进
- 🔒 安全问题修复
- ♿ 可访问性改进

### 中优先级
- ✨ 新功能
- ⚡ 性能优化
- 🎨 UI/UX 改进
- 🧪 测试覆盖

### 低优先级
- 🔨 重构
- 📦 依赖更新
- 🌐 国际化

## 💡 想法和讨论

如果你有想法但不确定如何实现：

1. 创建 [Discussion](https://github.com/NewLixing/gof-cdk/discussions)
2. 描述你的想法
3. 与社区讨论
4. 达成共识后再实现

## 📋 开发环境设置

### 必需工具

- Node.js 18+
- npm 或 pnpm
- Git
- Cloudflare 账号（用于部署）

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/NewLixing/gof-cdk.git
cd gof-cdk

# 2. 安装依赖
npm install

# 3. CLI 版本
npm run build
npm start

# 4. Workers 版本
cd workers
npm install
npm run dev

# 5. Frontend 版本
cd ../frontend
npm install
npm run dev
```

## 🌟 成为维护者

如果你持续贡献高质量的代码和文档，我们可能会邀请你成为项目维护者。

维护者职责：
- 审查 PR
- 管理 Issues
- 规划新功能
- 指导新贡献者

## 📞 联系方式

如有问题，可以通过以下方式联系：

- GitHub Issues
- GitHub Discussions
- Email: (在 package.json 中查看)

## ⚖️ 行为准则

### 我们的承诺

为了营造开放和友好的环境，我们承诺：

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用性化的语言或图像
- 人身攻击或政治攻击
- 公开或私下骚扰
- 未经许可发布他人的私人信息
- 其他不道德或不专业的行为

## 🙏 致谢

感谢所有贡献者的付出！

查看完整的贡献者列表：[Contributors](https://github.com/NewLixing/gof-cdk/graphs/contributors)

---

再次感谢你的贡献！让我们一起让 GOF-CDK 变得更好！🚀
