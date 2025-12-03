# 云文档 AI 翻译平台 - 完整实现指南

## 📋 项目概览

这是一个专业级的云文档 AI 翻译平台，支持 AWS、GCP、Azure 等云服务官方文档的快速准确翻译。

**项目状态**: MVP 前端完成，后端框架搭建完成

---

## 🚀 快速开始

### 前提条件
- Node.js 18+
- Docker & Docker Compose
- Git

### 启动前端（已完成）

```bash
cd frontend
npm run dev
```

前端运行地址：http://localhost:3000

### 启动基础设施

```bash
# 启动 PostgreSQL + Redis
docker-compose up -d
```

可访问数据库管理界面：http://localhost:8080
- 用户名: postgres
- 密码: postgres
- 数据库: ai_translator

### 后端开发设置

```bash
cd backend

# 1. 创建 .env 文件
cp .env.example .env

# 2. 修改必要的配置
# - GEMINI_API_KEY: 从 Google Cloud Console 获取
# - CLAUDE_API_KEY: 从 Anthropic 获取
# - OPENAI_API_KEY: 从 OpenAI 获取

# 3. 安装依赖（可能需要 --legacy-peer-deps）
npm install --legacy-peer-deps

# 4. 启动开发服务器
npm run dev
```

后端运行地址：http://localhost:3001

---

## 📁 项目结构

```
ai-translator-website/
├── frontend/                 # Next.js 前端应用
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # React 组件
│   │   │   ├── HomePage.tsx        # 首页
│   │   │   ├── DualEditor.tsx      # 双栏编辑器 ⭐
│   │   │   ├── AIAssistant.tsx     # AI 助手侧边栏
│   │   │   └── GlossaryPanel.tsx   # 术语库面板
│   │   ├── store/           # Zustand 状态管理
│   │   ├── types/           # TypeScript 类型定义
│   │   └── hooks/           # 自定义 React Hook
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                  # Nest.js 后端应用
│   ├── src/
│   │   ├── main.ts                 # 应用入口
│   │   ├── app.module.ts           # 主模块
│   │   ├── modules/
│   │   │   ├── translation/        # 翻译模块 ⭐
│   │   │   │   ├── translation.controller.ts
│   │   │   │   ├── translation.service.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── ai-translation.service.ts  # 多 LLM 支持
│   │   │   │   ├── entities/
│   │   │   │   └── dto/
│   │   │   ├── user/               # 用户管理
│   │   │   ├── auth/               # 身份认证
│   │   │   ├── document/           # 文档处理
│   │   │   ├── glossary/           # 术语库
│   │   │   └── health/             # 健康检查
│   │   ├── common/
│   │   │   └── guards/             # JWT 认证 Guard
│   │   └── migrations/             # 数据库迁移
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml       # 数据库和缓存配置
├── ARCHITECTURE.md          # 系统架构设计
├── IMPLEMENTATION_EXAMPLES.md
├── TECHNOLOGY_DECISIONS.md
└── PROJECT_EXECUTION_PLAN.md
```

---

## ✨ 已实现的功能

### 前端 ✅
- [x] 现代化的首页设计
- [x] 双栏编辑器（原文 + 译文）
- [x] AI 助手侧边栏
- [x] 术语库面板（含 8 个默认云术语）
- [x] Zustand 状态管理
- [x] 响应式 UI（Tailwind CSS）
- [x] 文件上传和 URL 输入
- [x] 翻译模式选择（专业/通俗/总结）

### 后端 ⚙️
- [x] Nest.js 项目框架
- [x] TypeORM 数据库配置
- [x] 翻译模块框架
- [x] 多 LLM 集成（Gemini/Claude/OpenAI）
- [x] 用户实体定义
- [x] 文档和段落实体
- [x] JWT 认证 Guard
- [x] Swagger API 文档
- [x] PostgreSQL 数据库配置
- [x] Redis 缓存配置

---

## 🔧 核心技术栈

### 前端
- **框架**: Next.js 14 + React 18 + TypeScript
- **状态管理**: Zustand (轻量级、易于使用)
- **UI**: Tailwind CSS + Lucide Icons
- **Markdown 渲染**: react-markdown + remark-gfm
- **HTTP 客户端**: axios

### 后端
- **框架**: Nest.js 10
- **数据库**: PostgreSQL 15 + TypeORM
- **缓存**: Redis 7
- **认证**: JWT + Passport.js
- **API 文档**: Swagger/OpenAPI
- **LLM API**: Google Gemini, Claude, OpenAI

### 基础设施
- **容器化**: Docker & Docker Compose
- **部署**: (后续可扩展到 Kubernetes)
- **CI/CD**: (可集成 GitHub Actions)

---

## 🎯 接下来的步骤

### Phase 1: 后端 API 完整实现（优先级最高）
1. **文档解析模块**
   ```bash
   # 实现以下功能:
   - URL 爬取 (Puppeteer/Cheerio)
   - PDF 解析 (pdf-parse)
   - HTML 清理和提取
   - Markdown 保留格式信息
   ```

2. **完整 API 端点**
   ```
   POST   /api/translations              # 创建翻译任务
   GET    /api/translations/:id          # 获取文档
   POST   /api/translations/:id/translate # 翻译整个文档
   PUT    /api/translations/:id/paragraphs/:paraId  # 更新段落
   GET    /api/glossary                  # 获取术语库
   POST   /api/glossary                  # 添加自定义术语
   ```

3. **认证系统**
   - JWT 令牌生成和验证
   - Google OAuth 集成
   - 用户注册和登录

4. **前后端联调**
   - 实现实际的 API 调用
   - 处理错误和加载状态
   - 添加请求拦截器

### Phase 2: 功能完善
- [ ] 术语库自动识别和高亮
- [ ] 版本管理和对比
- [ ] 多用户协作
- [ ] 导出功能（PDF/DOCX）
- [ ] 搜索功能

### Phase 3: 性能优化
- [ ] 前端代码分割和懒加载
- [ ] 后端缓存策略
- [ ] 数据库查询优化
- [ ] 负载测试

### Phase 4: 上线和扩展
- [ ] 用户界面打磨
- [ ] 安全审计
- [ ] 性能监控
- [ ] 成本优化
- [ ] 移动应用开发

---

## 📊 API 设计示例

### 翻译 API

```bash
# 创建翻译任务
POST /api/translations
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "AWS VPC Documentation",
  "sourceUrl": "https://docs.aws.amazon.com/vpc/...",
  "sourceFormat": "url",
  "sourceLanguage": "en",
  "targetLanguage": "zh"
}

Response:
{
  "id": "uuid",
  "title": "AWS VPC Documentation",
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00Z",
  "paragraphs": []
}
```

```bash
# 翻译文档
POST /api/translations/{id}/translate
Authorization: Bearer {token}
Content-Type: application/json

{
  "mode": "professional",
  "provider": "gemini"  # "gemini" | "claude" | "openai"
}

Response:
{
  "id": "uuid",
  "status": "completed",
  "translatedParagraphs": 5,
  "paragraphs": [
    {
      "id": "para1",
      "type": "heading",
      "original": "Introduction to AWS VPC",
      "translated": "AWS VPC 简介",
      "translationStatus": "completed",
      "confidence": 0.95
    }
  ]
}
```

---

## 🔐 环境变量配置

创建 `backend/.env` 文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=ai_translator

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=7d

# LLM APIs
GEMINI_API_KEY=your-api-key-here
CLAUDE_API_KEY=your-api-key-here
OPENAI_API_KEY=your-api-key-here

# OAuth (可选)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 获取 API 密钥

1. **Google Gemini API**
   - 访问: https://ai.google.dev/
   - 获取免费 API 密钥

2. **Anthropic Claude API**
   - 访问: https://console.anthropic.com
   - 申请访问权限

3. **OpenAI API**
   - 访问: https://platform.openai.com/api-keys
   - 创建 API 密钥

---

## 🧪 测试

```bash
# 后端单元测试
cd backend
npm run test

# 集成测试
npm run test:e2e

# 前端测试
cd ../frontend
npm run test
```

---

## 📈 性能指标（目标）

| 指标 | 目标 | 当前 |
|------|------|------|
| 文档加载时间 | < 3s | - |
| 翻译时间 (1000词) | < 10s | - |
| 术语识别准确率 | > 90% | - |
| API 响应时间 | < 500ms | - |
| 前端 Lighthouse | > 90 | - |

---

## 💰 成本分析

### 月度运营成本估算

| 项目 | 免费用户 | Pro | 企业 |
|------|---------|-----|------|
| LLM 调用 | < $0.01 | $0.13-0.50 | $1-5 |
| 基础设施 | $0 | $435 | $1000+ |
| 存储 | < 1GB | < 100GB | 无限 |

### 成本优化建议

1. **LLM 选择**: 默认使用 Gemini（最便宜）
2. **缓存策略**: 两层缓存（内存 + Redis）
3. **请求优化**: 文本分割、批量处理
4. **基础设施**: 使用 Spot 实例、CDN

---

## 🐛 常见问题

### Q: 如何快速测试翻译功能？
A: 前端首页已包含模拟数据。点击"开始翻译"即可看到双栏编辑器。

### Q: 后端依赖安装失败怎么办？
A: 使用 `npm install --legacy-peer-deps` 或等待下一个主版本发布。

### Q: 如何集成自己的 LLM API？
A: 修改 `backend/src/modules/translation/services/ai-translation.service.ts` 中的相应函数。

### Q: 前后端如何通信？
A: 前端已配置基础 axios 实例，需在 `frontend/src/api/client.ts` 中完成集成。

---

## 📞 支持

- 📚 查看 `ARCHITECTURE.md` 了解系统设计
- 🔍 查看 `IMPLEMENTATION_EXAMPLES.md` 了解代码示例
- 📊 查看 `PROJECT_EXECUTION_PLAN.md` 了解项目计划
- 💡 查看 `TECHNOLOGY_DECISIONS.md` 了解技术决策

---

## 📄 许可证

MIT

---

**最后更新**: 2024年11月25日
**版本**: 1.0 (MVP 前端完成)
