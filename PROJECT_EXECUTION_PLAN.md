# 项目执行计划 - 详细里程碑和任务分解

## 📅 项目时间表总览

```
Phase 1: MVP (6周)
├─ Week 1-2: 基础设施
├─ Week 3-4: 核心UI和解析
└─ Week 5-6: AI集成和优化

Phase 2: 功能完善 (6周)
├─ Week 7-8: 术语库系统
├─ Week 9-10: 多LLM支持
└─ Week 11-12: 性能和测试

Phase 3: 企业功能 (4周)
├─ Week 13: 权限管理
├─ Week 14-15: 计费系统
└─ Week 16: 部署优化

总耗时: 4个月
```

---

## Phase 1: MVP (核心翻译功能)

### Week 1-2: 基础设施和认证 (20天)

#### Week 1: 项目初始化和数据库

**前端任务**：
- [ ] 初始化 Next.js 14 项目
  ```bash
  npx create-next-app@latest ai-translator --typescript --tailwind --app
  ```
  - 配置 TypeScript strict mode
  - 安装基础依赖：zustand, axios, react-icons
  - 搭建文件夹结构

- [ ] 设置 Tailwind CSS 和主题系统
  - 创建 light/dark 主题
  - 定义全局样式变量
  - 配置响应式断点

- [ ] 创建项目基础布局
  - 公共 Layout 组件
  - 导航栏 Header
  - 路由结构

**后端任务**：
- [ ] 初始化 Nest.js 项目
  ```bash
  nest new ai-translator-api --strict --package-manager npm
  ```

- [ ] 配置数据库连接
  - 安装 TypeORM, PostgreSQL driver
  - 创建 ormconfig.ts
  - 初始化数据库

- [ ] 建立基础 Entity
  ```typescript
  // 创建以下 entities
  - User.entity.ts
  - Document.entity.ts
  - TranslationTask.entity.ts
  - TranslationSegment.entity.ts
  - TerminologyBase.entity.ts
  - Term.entity.ts
  ```

- [ ] 设置 Docker 环境
  ```bash
  docker-compose up -d  # PostgreSQL + Redis
  ```

**DevOps任务**：
- [ ] 创建 GitHub 仓库和 Project Board
- [ ] 配置基础 CI/CD (GitHub Actions)
  - Lint 检查
  - 类型检查
  - 基础测试框架

**交付物**：
- 可运行的前后端开发环境
- 数据库架构确定
- 项目管理看板就绪

---

#### Week 2: 认证系统实现

**后端任务**：
- [ ] 实现用户模块
  ```typescript
  // services/user.service.ts
  - create(dto)
  - findByEmail(email)
  - findById(id)
  - updateProfile(id, dto)
  - delete(id)
  ```

- [ ] 实现认证模块
  ```typescript
  // modules/auth/
  ├── auth.service.ts
  │   ├── register()
  │   ├── login()
  │   ├── validateUser()
  │   ├── refreshToken()
  │   └── logout()
  ├── auth.controller.ts
  │   ├── POST /auth/register
  │   ├── POST /auth/login
  │   ├── POST /auth/refresh
  │   └── POST /auth/logout
  ├── guards/jwt-auth.guard.ts
  ├── strategies/jwt.strategy.ts
  └── dto/
      ├── register.dto.ts
      ├── login.dto.ts
      └── refresh.dto.ts
  ```

- [ ] JWT 配置
  ```typescript
  // config/jwt.config.ts
  - 密钥管理
  - Token 过期时间设置
  - Refresh token 逻辑
  ```

- [ ] 添加 OAuth2 集成（Google）
  ```typescript
  // strategies/google-oauth.strategy.ts
  - Google 认证流程
  - Profile 映射到本地用户
  - Token 生成
  ```

**前端任务**：
- [ ] 创建认证 Hook
  ```typescript
  // hooks/useAuth.ts
  - login(email, password)
  - register(email, password, name)
  - logout()
  - refreshToken()
  - getCurrentUser()
  ```

- [ ] 实现认证页面
  ```typescript
  // app/auth/
  ├── login/page.tsx
  ├── register/page.tsx
  └── callback/page.tsx
  ```

- [ ] 创建受保护路由
  ```typescript
  // middleware.ts
  - 检查JWT有效性
  - 自动刷新过期Token
  - 重定向未认证用户
  ```

- [ ] API 客户端工具
  ```typescript
  // lib/api.ts
  - 自动添加Authorization header
  - 处理刷新Token逻辑
  - 错误拦截和统一处理
  ```

**测试任务**：
- [ ] 编写认证测试
  ```typescript
  // tests/auth.spec.ts
  - 用户注册成功
  - 用户登录成功
  - 无效密码拒绝
  - Token 刷新
  - 过期Token处理
  ```

**交付物**：
- 完整的用户认证系统
- OAuth2 集成
- 前后端测试通过
- API文档更新

---

### Week 3-4: 前端编辑器UI和文档解析 (20天)

#### Week 3: 前端编辑器组件

**主要目标**：实现双栏编辑器基础框架

**任务分解**：

1. **DualPaneEditor 主组件** (2天)
   ```typescript
   // components/editor/DualPaneEditor.tsx
   - 容器布局
   - 宽度调整逻辑
   - 滚动同步
   - 状态管理集成

   交付物：
   ✅ 双栏布局可正常显示
   ✅ 分割线可拖动调整宽度
   ✅ 垂直滚动同步工作
   ```

2. **SourcePane 组件** (1.5天)
   ```typescript
   // components/editor/SourcePane.tsx
   - 段落列表展示
   - 高亮激活段落
   - 点击选择
   - 虚拟滚动（支持千段+）

   交付物：
   ✅ 能加载并显示1000+段落
   ✅ 性能稳定（帧率 >30fps）
   ```

3. **TargetPane 组件** (2天)
   ```typescript
   // components/editor/TargetPane.tsx
   - 可编辑文本框
   - 保存逻辑
   - AI建议显示
   - 术语提示预留

   交付物：
   ✅ 文本编辑功能
   ✅ 双向数据绑定
   ```

4. **EditorToolbar 组件** (1.5天)
   ```typescript
   // components/editor/EditorToolbar.tsx
   - 文件操作（新建、打开、保存）
   - 翻译配置（语言选择、LLM选择）
   - 分割策略选择
   - 导出选项

   交付物：
   ✅ UI完整美观
   ✅ 配置项功能可用
   ```

5. **TranslationStatusBar 组件** (1天)
   ```typescript
   // components/editor/TranslationStatusBar.tsx
   - 进度条
   - 统计信息（总/完成段落数）
   - 操作按钮（开始/暂停/停止）

   交付物：
   ✅ 实时显示翻译进度
   ```

6. **Zustand 状态管理** (1.5天)
   ```typescript
   // store/translation.store.ts
   - 创建主翻译Store
   - 段落CRUD操作
   - 翻译配置管理
   - 持久化配置

   交付物：
   ✅ 状态管理完整
   ✅ 页面刷新不丢失数据
   ```

**前端完成指标**：
```
- 编辑器UI加载时间 < 2s
- 滚动帧率 ≥ 60fps
- 段落编辑响应延迟 < 100ms
- 代码覆盖率 > 70%
```

---

#### Week 4: 文档上传和解析

**后端任务**：

1. **文件上传 Controller** (1.5天)
   ```typescript
   // modules/documents/documents.controller.ts
   @Post()
   async uploadDocument()

   功能：
   - 接收文件上传
   - 验证文件格式
   - 上传到 GCS/S3
   - 返回文档ID

   测试：
   ✅ 上传PDF成功
   ✅ 上传HTML成功
   ✅ 超大文件处理
   ✅ 不支持格式拒绝
   ```

2. **DocumentParsingService** (3天)
   ```typescript
   // modules/documents/services/document-parsing.service.ts

   策略实现：
   ├─ PDF策略
   │  └─ 使用 pdf-parse
   ├─ HTML策略
   │  └─ 使用 cheerio
   ├─ Markdown策略
   │  └─ 使用 remark
   └─ Word策略
      └─ 使用 mammoth

   文本分割：
   ├─ SentenceSegmenter
   ├─ ParagraphSegmenter (默认)
   └─ CustomSegmenter

   交付物：
   ✅ 支持3种格式
   ✅ 智能文本分割
   ✅ 保留格式信息
   ```

3. **任务队列集成** (1.5天)
   ```typescript
   // services/translation-queue.service.ts
   使用 BullMQ：
   - 将解析任务加入队列
   - 异步处理（不阻塞用户请求）
   - 失败重试逻辑

   交付物：
   ✅ 大文件可后台解析
   ✅ 用户能获取进度
   ```

4. **文档管理 API** (1.5天)
   ```typescript
   // 实现完整 CRUD
   GET    /api/v1/documents          - 列表
   GET    /api/v1/documents/:id      - 详情
   GET    /api/v1/documents/:id/content - 获取解析内容
   PUT    /api/v1/documents/:id      - 更新
   DELETE /api/v1/documents/:id      - 删除

   交付物：
   ✅ API测试通过
   ```

**前端任务**：

1. **文件上传组件** (1.5天)
   ```typescript
   // components/documents/DocumentUploader.tsx
   功能：
   - 拖拽上传
   - 点击选择
   - 上传进度显示
   - 错误提示

   交付物：
   ✅ 用户友好的上传界面
   ✅ 支持多种上传方式
   ```

2. **URL输入组件** (1天)
   ```typescript
   // components/documents/UrlInput.tsx
   功能：
   - URL输入框
   - 格式验证
   - 后台爬取
   - 爬取进度显示
   ```

3. **集成到编辑器** (1.5天)
   ```typescript
   // 侧边栏或模态框集成
   - 打开/新建文档流程
   - 文档加载到编辑器
   - 错误处理

   交付物：
   ✅ 完整上传→加载流程
   ```

**交付物清单**：
- ✅ 支持 PDF/HTML/Markdown 上传
- ✅ 文本自动分割
- ✅ 编辑器成功加载文档
- ✅ 进度提示
- ✅ 错误处理完善

---

### Week 5-6: AI翻译集成和优化 (20天)

#### Week 5: AI翻译基础集成

**后端任务**：

1. **Gemini 集成** (2天)
   ```typescript
   // providers/gemini.provider.ts
   功能：
   - 初始化 Google Generative AI 客户端
   - 单段落翻译
   - 流式翻译
   - 错误处理

   测试：
   ✅ API连接成功
   ✅ 翻译结果正确
   ✅ Token限制处理
   ```

2. **AITranslationService** (1.5天)
   ```typescript
   // services/ai-translation.service.ts
   功能：
   - 提供商选择
   - 提示词优化
   - 成本估计
   - 缓存集成

   交付物：
   ✅ 核心翻译逻辑完成
   ```

3. **翻译任务 Controller** (1.5天)
   ```typescript
   // modules/translations/translations.controller.ts
   POST   /api/v1/translations       - 创建任务
   GET    /api/v1/translations       - 列表
   GET    /api/v1/translations/:id   - 详情
   SSE    /api/v1/translations/:id/stream - 流式翻译

   交付物：
   ✅ API完整
   ✅ 支持流式传输
   ```

4. **流式翻译实现** (1.5天)
   ```typescript
   // 使用 Server-Sent Events
   功能：
   - 客户端订阅流
   - 服务器推送翻译块
   - 自动重连
   - 错误恢复

   测试：
   ✅ 流式数据正确接收
   ✅ 断网自动重连
   ```

**前端任务**：

1. **翻译设置面板** (1day)
   ```typescript
   // components/translation/TranslationSettings.tsx
   配置项：
   - 目标语言选择
   - LLM选择（当前只有Gemini）
   - 翻译风格（正式/非正式/技术）
   - 自定义指令

   交付物：
   ✅ 设置UI完成
   ```

2. **翻译触发和流式显示** (2天)
   ```typescript
   // hooks/useTranslation.ts
   功能：
   - 提交翻译请求
   - 连接 SSE 流
   - 实时更新段落
   - 错误处理

   交付物：
   ✅ 翻译请求能成功发送
   ✅ 结果实时显示
   ```

3. **进度条和状态** (1day)
   ```typescript
   // 实时显示：
   - 已翻译/总段落数
   - 百分比进度
   - 操作按钮（暂停/继续/停止）

   交付物：
   ✅ 用户能看到实时进度
   ```

**测试任务**：
- [ ] E2E 测试：从上传到翻译完成
  ```bash
  使用 Playwright 或 Cypress
  场景：
  1. 上传文档
  2. 选择翻译设置
  3. 点击开始翻译
  4. 验证翻译结果
  ```

**交付物清单**：
- ✅ 第一个翻译成功
- ✅ 实时流式显示
- ✅ 错误处理完善
- ✅ 用户体验完整

---

#### Week 6: 性能优化和发布前准备

**优化任务**：

1. **前端性能** (1.5天)
   ```typescript
   // 虚拟滚动优化
   - 实现大文档虚拟滚列表
   - 测试1000+段落性能
   - 帧率检查

   // 代码分割
   - 动态导入编辑器组件
   - 预加载关键资源

   交付物：
   ✅ LCP < 2.5s
   ✅ 帧率 ≥ 60fps
   ```

2. **后端缓存** (1day)
   ```typescript
   // Redis 集成
   - 缓存解析后的文档
   - 缓存翻译结果
   - 缓存用户配置

   交付物：
   ✅ 重复翻译速度快5倍
   ```

3. **错误处理和日志** (1day)
   ```typescript
   // 完整的错误处理
   - API错误响应格式化
   - 前端错误边界
   - 日志记录

   交付物：
   ✅ 任何失败都有清晰错误提示
   ```

4. **文档和演示** (1day)
   ```
   - API 文档生成 (Swagger)
   - README 更新
   - 部署指南编写
   - 演示脚本准备
   ```

**测试完整性检查** (2天)：
- [ ] 单元测试覆盖率 > 70%
- [ ] 集成测试全部通过
- [ ] E2E 测试完成
- [ ] 性能基准确立
- [ ] 安全审计基础项通过

**交付物**：
- ✅ 完整的MVP系统
- ✅ 支持PDF/HTML/Markdown上传
- ✅ 使用Gemini翻译
- ✅ 双栏实时编辑
- ✅ 翻译历史记录
- ✅ 部署就绪

---

## Phase 2: 功能完善 (6周)

### Week 7-8: 术语库系统 (10天)

**后端任务** (4天)：

```typescript
// 数据库 Entity 完成
✅ TerminologyBase
✅ Term

// 核心服务 (terminology.service.ts)
- createTerminologyBase()
- addTerm()
- matchTerms()          // 关键功能
- importTerms()
- exportTerms()
- updateTerm()
- deleteTerm()

// API endpoints
POST   /api/v1/terminology-bases
GET    /api/v1/terminology-bases
POST   /api/v1/terminology-bases/:id/terms
GET    /api/v1/terminology-bases/:id/terms
POST   /api/v1/terminology-bases/:id/match
PUT    /api/v1/terminology-bases/:id/terms/:termId
DELETE /api/v1/terminology-bases/:id/terms/:termId

// 术语匹配算法
- 精确匹配
- 模糊匹配 (Levenshtein距离)
- 批量匹配
```

**前端任务** (5天)：

```typescript
// 术语库管理页面
app/dashboard/terminology/
├── page.tsx              // 术语库列表
├── [id]/page.tsx         // 术语库详情
├── [id]/import.tsx       // 导入CSV
└── [id]/export.tsx       // 导出

// 术语库管理组件
components/terminology/
├── TerminologyBaseList.tsx
├── TerminologyForm.tsx
├── TermList.tsx
├── TermForm.tsx
├── TermImporter.tsx
└── TerminologyMatcher.tsx

// Hook
hooks/useTerminology.ts
- 创建、更新、删除术语库
- 术语CRUD
- 批量操作

// 集成到翻译编辑器
components/translation/TerminologyPanel.tsx
- 显示当前使用的术语库
- 段落级别术语匹配提示
- 快速替换功能
```

**交付物**：
- ✅ 完整术语库CRUD
- ✅ 术语库在翻译中起作用
- ✅ CSV导入/导出
- ✅ 模糊匹配工作

---

### Week 9-10: 多LLM支持 (10天)

**后端任务** (4天)：

```typescript
// Claude 集成
providers/claude.provider.ts
- 实现 IAIProvider 接口
- 支持 Claude 3 系列模型

// GPT-4 集成
providers/openai.provider.ts
- 实现 IAIProvider 接口
- 支持 GPT-4/GPT-3.5

// LLM 工厂
ai/ai-provider.factory.ts
- 根据选择返回相应 provider
- 成本估计对比

// 成本追踪
services/cost-tracking.service.ts
- 按提供商统计成本
- 按用户统计成本
- 月度报表

// API 扩展
PUT /api/v1/translations/:id/provider  // 切换提供商
GET /api/v1/llm-providers              // 获取可用提供商列表
POST /api/v1/cost-estimate             // 估计翻译成本
```

**前端任务** (4天)：

```typescript
// LLM 选择器组件
components/ai/AIProviderSelector.tsx
- 显示可用的 LLM 列表
- 显示成本对比
- 显示质量评分
- 实时成本预估

// 成本显示
components/ai/CostDisplay.tsx
- 显示本次翻译预估成本
- 显示月度已用成本
- 显示配额使用情况

// 扩展翻译设置
components/translation/TranslationSettings.tsx
- 新增 LLM 选择
- 新增成本预估显示
- 选择合适的质量/成本平衡

// Hook
hooks/useLLMCost.ts
- 获取成本预估
- 订阅成本更新
```

**测试任务** (2天)：
```
- 每个 LLM 提供商的翻译测试
- 成本计算精度验证
- 多提供商切换测试
- 错误处理（API Key无效等）
```

**交付物**：
- ✅ 支持 3 个 LLM 提供商
- ✅ 用户可灵活选择
- ✅ 成本追踪准确
- ✅ UI清晰展示成本对比

---

### Week 11-12: 版本管理和性能优化 (10天)

**后端任务** (3day)：

```typescript
// 翻译历史持久化
services/translation-history.service.ts
- 完整的翻译历史记录
- 版本对比功能
- 历史恢复

// API
POST   /api/v1/translations/:id/save-version
GET    /api/v1/translations/:id/versions
GET    /api/v1/translations/:id/versions/:versionId
POST   /api/v1/translations/:id/restore-version
```

**前端任务** (4day)：

```typescript
// 版本管理面板
components/translation/VersionPanel.tsx
- 显示历史版本列表
- 版本对比视图
- 快速恢复按钮

// 对比视图
components/translation/ComparisonView.tsx
- 显示两个版本的差异
- 高亮变更部分

// Hook
hooks/useTranslationHistory.ts
- 获取历史版本
- 版本对比
- 恢复版本
```

**性能优化** (3day)：

```typescript
// 数据库查询优化
- 添加必要的索引
- 分析查询计划
- 优化N+1查询

// 缓存策略升级
- 两层缓存（In-Memory + Redis）
- 缓存失效策略优化
- 预热热点数据

// 前端优化
- 代码分割完善
- 资源预加载策略
- 图片和资源优化

// 监控基准建立
- 性能指标收集
- 基准数据记录
- 告警规则配置
```

**交付物**：
- ✅ 完整的版本管理系统
- ✅ 版本对比和恢复
- ✅ 性能基准确立
- ✅ 监控系统就绪

---

## Phase 3: 企业级功能 (4周)

### Week 13: 用户权限和团队协作

```typescript
// RBAC 权限系统
entities/role.entity.ts
entities/permission.entity.ts

// API
POST   /api/v1/teams
GET    /api/v1/teams
POST   /api/v1/teams/:id/members
GET    /api/v1/teams/:id/members
PUT    /api/v1/teams/:id/members/:userId

// 前端
pages/team-management/
components/TeamSettings.tsx
components/MemberManagement.tsx
```

---

### Week 14-15: 订阅和计费

```typescript
// Stripe 集成
services/stripe.service.ts
- 创建订阅
- 处理webhook
- 发票生成

// API
POST   /api/v1/subscriptions
GET    /api/v1/subscriptions/current
POST   /api/v1/subscriptions/cancel

// 前端
pages/billing/
components/PricingPlans.tsx
components/BillingHistory.tsx
```

---

### Week 16: 部署和监控完善

```
- Kubernetes 部署脚本
- 监控告警配置
- 灾难恢复计划
- 文档完善
```

---

## 风险管理矩阵

| 风险 | 概率 | 影响 | 缓解策略 |
|------|------|------|---------|
| LLM API 成本爆增 | 高 | 高 | 配额管理 + 缓存 |
| 文档解析失败 | 中 | 中 | 多策略降级 + OCR备选 |
| 翻译质量不达预期 | 中 | 高 | 多模型对标 + 人工审核 |
| 性能不满足需求 | 中 | 中 | 提前进行压测 |
| 数据安全问题 | 低 | 极高 | 安全审计 + 加密存储 |

---

## 成功指标

### 功能完成度
- Week 6 EOF: MVP 功能 100%
- Week 12 EOF: Phase 2 功能 95%+
- Week 16 EOF: 企业功能 90%+

### 性能指标
- API P95 延迟 < 200ms
- 编辑器首屏加载 < 2.5s
- 翻译错误率 < 2%

### 代码质量
- 单元测试覆盖率 > 80%
- 代码审查通过率 100%
- 技术债得分 A

### 用户体验
- 用户任务完成率 > 95%
- 系统可用性 > 99.5%
- 用户满意度 > 4.5/5

