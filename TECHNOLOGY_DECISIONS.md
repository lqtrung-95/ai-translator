# 技术决策和对标分析

## 📊 核心技术栈对比分析

### 1. 前端框架选择

#### Next.js 13/14 vs Remix vs Vite + React

| 指标 | Next.js 14 | Remix | Vite + React |
|------|-----------|-------|-------------|
| **构建速度** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **路由系统** | App Router (优秀) | 文件约定 (优秀) | 需三方库 |
| **SSR支持** | ✅ 完美 | ✅ 默认SSR | ⚠️ 需配置 |
| **部署简易性** | ⭐⭐⭐⭐⭐ Vercel | ⭐⭐⭐ | ⭐⭐⭐ |
| **学习曲线** | 平缓 | 平缓 | 陡峭 |
| **社区生态** | ⭐⭐⭐⭐⭐ 最活跃 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **适合翻译编辑** | ✅ 推荐 | ❌ 不优 | ❌ 不优 |

**决策原因**：
✅ App Router 非常适合复杂的单页面应用（编辑器）
✅ 内置API Routes可快速实现BFF层
✅ Image优化对于文档预览有帮助
✅ 社区插件最多，成熟度最高

**特定配置**：
```javascript
// next.config.js - 针对翻译编辑器优化
module.exports = {
  experimental: {
    turbopack: true,  // 极速开发
    optimizePackageImports: [
    'zustand',
      'react-icons',
      'ui-library',
    ],
  },
  compiler: {
    removeConsole: true,  // 生产环保
  },
  webpack: (config, { isServer }) => {
    // 支持大文件上传
    config.optimization.splitChunks.cacheGroups = {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        reuseExistingChunk: true,
      },
    };
    return config;
  },
};
```

---

### 2. 后端框架选择

#### Nest.js vs FastAPI vs Express

| 指标 | Nest.js | FastAPI | Express |
|------|---------|---------|---------|
| **性能** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **类型安全** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ |
| **企业级功能** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **文档质量** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **开发速度** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **扩展性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **生态成熟度** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Nest.js 特殊优势**（for this project）：
- 装饰器模式完美适配翻译管道（Pipeline）
- 模块化架构易于团队并行开发
- TypeORM深度集成
- 依赖注入便于测试

**FastAPI 适用场景**：
- 如果团队熟悉Python
- 数据处理密集（XML/JSON转换）
- 原型快速迭代

**决策**：**Nest.js** (TypeScript生态一致性最优)

---

### 3. 数据库选择

#### PostgreSQL vs MongoDB vs Firestore

| 特性 | PostgreSQL | MongoDB | Firestore |
|------|-----------|---------|-----------|
| **结构化数据** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **JSONB支持** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **事务支持** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ (4.0+) | ⭐⭐ |
| **查询灵活性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **扩展性** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **成本** (small) | 💰 低 | 💰 低 | 💰💰 中等 |
| **维护成本** | 💰 中 | 💰 低 | 💰 低 |

**为什么选PostgreSQL**：

1. **翻译数据特性**：
   - 用户、文档、翻译任务需强关系
   - JSONB存储灵活的segment元数据
   - 支持复杂查询（历史记录对比）

2. **术语库要求**：
   - 需要精准的文本搜索（LIKE / ILIKE）
   - 全文搜索支持（tsvector）
   - 模糊匹配优化（Levenshtein距离）

3. **ACID事务**：
   - 翻译过程中数据一致性关键
   - 支持审计日志需要

```sql
-- 性能优化示例
CREATE INDEX idx_terms_source_tsvector
  ON terms
  USING GIN (to_tsvector('english', source_text));

CREATE INDEX idx_segments_created
  ON translation_segments (task_id, created_at DESC);

-- 搜索示例
SELECT * FROM terms
WHERE to_tsvector('english', source_text) @@
      plainto_tsquery('english', 'machine learning');
```

---

### 4. 实时通信选择

#### WebSocket vs Server-Sent Events vs Long Polling

| 方案 | WebSocket | SSE | Long Polling |
|------|-----------|-----|-------------|
| **双向通信** | ✅ 原生 | ❌ 单向 | ⚠️ 模拟 |
| **延迟** | < 100ms | < 200ms | 1-5s |
| **浏览器支持** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **服务器负载** | 中等 | 低 | 高 |
| **实现复杂度** | 中等 | 简单 | 简单 |

**翻译应用选择**：
- **主流模式**：SSE（翻译是单向流）
  - 客户端提交 → 服务器流式返回翻译
  - 降低服务器连接数
  - 自动重连支持好

```typescript
// SSE实现示例
@Sse(':id/stream')
streamTranslation(@Param('id') id: string): Observable<MessageEvent> {
  return new Observable(observer => {
    // 每当有新翻译块时
    observeTranslationUpdates(id).subscribe({
      next: (chunk: string) => {
        observer.next({ data: { chunk, segmentId: '...' } });
      },
      error: err => observer.error(err),
      complete: () => observer.complete(),
    });
  });
}

// 前端客户端
const eventSource = new EventSource(`/api/v1/translations/${id}/stream`);
eventSource.addEventListener('message', (event) => {
  const { chunk, segmentId } = JSON.parse(event.data);
  updateSegment(segmentId, prevText + chunk);
});
```

**备选方案**：WebSocket for 交互式特性（如实时协作）

---

### 5. 缓存策略选择

#### Redis vs Memcached vs In-Process

| 特性 | Redis | Memcached | In-Process |
|------|-------|-----------|-----------|
| **数据持久化** | ✅ RDB/AOF | ❌ | ⚠️ |
| **数据结构** | ⭐⭐⭐⭐⭐ 丰富 | ⭐⭐ | ⭐⭐⭐ |
| **场景灵活性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **分布式部署** | ✅ 集群 | ✅ 集群 | ❌ |
| **延迟** | < 1ms | < 1ms | < 0.1ms |

**翻译应用缓存策略**：

```
L1缓存：In-Process (LRU)
  → 热门语言对配置
  → 用户偏好设置
  → 频繁访问的术语

L2缓存：Redis (Distributed)
  → 翻译结果（同source+target+provider）
  → 用户会话
  → 文档解析结果

冷数据：数据库
```

---

### 6. 文件存储选择

#### GCS vs S3 vs MinIO

| 特性 | GCS | S3 | MinIO |
|------|-----|----|----- -|
| **成本** | 💰 低 | 💰 低 | ✅ 自建免费 |
| **可靠性** | ⭐⭐⭐⭐⭐ 99.99% | ⭐⭐⭐⭐⭐ 99.99% | ⭐⭐⭐ |
| **易用性** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **集成工具** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **大文件上传** | ✅ | ✅ | ✅ |

**建议**：
- **初期**：GCS (Gemini API同生态)
- **规模化**：S3 (工具链最完善)
- **成本控制**：MinIO (自建，内网传输快)

```typescript
// 统一接口
interface StorageProvider {
  upload(file: Buffer, path: string): Promise<url>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
}

// 可轻松切换
const storage = process.env.STORAGE === 'gcs'
  ? new GCSProvider()
  : new S3Provider();
```

---

## 📈 LLM提供商深度对比

### Gemini 最优原因分析

```
成本对比（每百万token）：
  Gemini Pro:        $0.50 输入 / $1.50 输出
  Claude 3 Sonnet:   $3.00 输入 / $15.00 输出
  GPT-4 Turbo:       $30.00 输入 / $60.00 输出

对翻译任务的影响（假设100万输入tokens）：
  Gemini:     $0.50 + $0.75 (输出) = $1.25
  Claude:     $3.00 + $7.50 = $10.50
  GPT-4:      $30.00 + $30.00 = $60.00

成本比例：
  Claude vs Gemini: 8.4x
  GPT-4 vs Gemini: 48x
```

### 翻译质量实测数据

假设翻译技术指标评估（BLEU score）：
- **Gemini Pro**: 42-45 (不俗)
- **Claude 3 Sonnet**: 46-48 (优秀)
- **GPT-4**: 48-50 (最优)

**建议分层方案**：
```
免费用户 (月1000段)     → Gemini
         成本: ~$0.50/月

Pro用户 (月100k段)    → Gemini (优化提示词)
         成本: ~$50/月

企业用户 (月1M段)     → Gemini + Claude混合
         质量权衡
         成本: ~$800/月

高端用户 (无限制)     → 支持GPT-4
         成本: 用户承担
```

---

## 🔒 安全架构决策

### 认证流程选择

```
选项1：JWT + Refresh Token (推荐)
  ✅ 无状态，易扩展
  ✅ 适合API服务
  ✅ 移动应用友好
  ❌ Token泄露无法立即撤销

选项2：Session + Cookie
  ✅ 安全性高
  ✅ CSRF防护简单
  ❌ 服务器状态管理复杂
  ❌ 分布式部署困难

选项3：OAuth2 + PKCE
  ✅ 标准化
  ✅ 第三方集成优
  ❌ 复杂度高
```

**决策**：JWT + Refresh Token (单独Redis维护黑名单)

```typescript
// 增强JWT安全
interface EnhancedJWT {
  sub: string;        // 用户ID
  email: string;
  roles: string[];
  sessionId: string;  // 关键：用于撤销
  iat: number;        // 签发时间
  exp: number;        // 过期时间
  jti: string;        // JWT ID（唯一）
}

// 登出时加入黑名单
async logout(jti: string) {
  await redis.setex(`jwt_blacklist:${jti}`, 3600, 'revoked');
}

// 验证时检查黑名单
async validateJWT(token: string) {
  const decoded = jwt.decode(token);
  const isBlacklisted = await redis.exists(`jwt_blacklist:${decoded.jti}`);
  if (isBlacklisted) throw new UnauthorizedException();
  // ...
}
```

---

### 数据加密决策

| 层级 | 方案 | 实现 |
|------|------|------|
| **传输层** | TLS 1.3 | HTTPS + WSS |
| **存储层** | 列加密 | pgcrypto 扩展 |
| **应用层** | 字段级加密 | 敏感数据AES-256 |

**关键字段加密**：
```sql
-- PostgreSQL 加密示例
ALTER TABLE translation_segments
ADD COLUMN target_text_encrypted BYTEA;

CREATE OR REPLACE FUNCTION encrypt_segment_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.target_text_encrypted := pgp_sym_encrypt(
    NEW.target_text,
    current_setting('app.encryption_key')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_encrypt_segment
BEFORE INSERT OR UPDATE ON translation_segments
FOR EACH ROW
EXECUTE FUNCTION encrypt_segment_text();
```

---

## 🚀 性能优化决策

### 加载性能目标 (Core Web Vitals)

| 指标 | 目标 | 手段 |
|------|------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 代码分割、图片优化 |
| **FID** (First Input Delay) | < 100ms | 减少JS、异步处理 |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 预留空间、稳定布局 |

```typescript
// 编辑器性能优化
const DualPaneEditor = lazy(() => import('./DualPaneEditor'));

// 虚拟滚动
<VirtualList
  items={segments}
  itemHeight={120}
  overscanCount={5}
  renderItem={renderSegment}
/>

// 记忆化
const EditableSegment = memo(EditableSegmentComponent, (prev, next) => {
  return (
    prev.segment.id === next.segment.id &&
    prev.isActive === next.isActive &&
    prev.segment.targetText === next.segment.targetText
  );
});

// Web Worker 处理大型解析
const worker = new Worker('/workers/document-parser.js');
worker.postMessage({ file, format });
worker.onmessage = (e) => {
  const parsed = e.data;
  updateUI(parsed);
};
```

### 翻译响应优化

```typescript
// 流式传输 vs 完整传输
// ❌ 原始方案：等待完整翻译后返回
const translation = await aiService.translate(text);
res.send(translation);

// ✅ 优化方案：实时流式返回
for await (const chunk of aiService.translateStream(text)) {
  res.write(formatSSE(chunk));  // Server-Sent Events
}
res.end();

// 客户端立即显示翻译进度
const eventSource = new EventSource('/api/.../stream');
eventSource.onmessage = (e) => {
  appendToTranslation(e.data.chunk);  // 实时更新
};
```

---

## 📊 监控和可观测性

### Observability 三支柱

```
   Metrics (Prometheus)
       ↓
   ┌──────────┐
   │ 翻译系统 │
   └──────────┘
       ↓
   Logs (ELK / Loki)  +  Traces (Jaeger)
```

**关键指标定义**：

```typescript
// 翻译SLA指标
const metrics = {
  // 延迟
  translation_latency_p95: percentile(latencies, 0.95),
  ai_api_latency_p99: percentile(apiLatencies, 0.99),

  // 吞吐量
  segments_translated_per_minute: counter / elapsed,
  concurrent_translations: gauge,

  // 错误
  translation_error_rate: errors / total,
  ai_provider_error_breakdown: groupBy(provider),

  // 成本
  daily_api_spend: sum(costs),
  cost_per_segment: totalCost / totalSegments,

  // 质量
  human_edit_rate: editedSegments / totalSegments,
  user_satisfaction: averageRating,
};

// 告警规则
const alerts = [
  {
    name: 'HighErrorRate',
    condition: 'translation_error_rate > 0.05',
    severity: 'critical',
    action: 'notify_on_call_engineer',
  },
  {
    name: 'SlowTranslation',
    condition: 'translation_latency_p95 > 10s',
    severity: 'warning',
  },
  {
    name: 'HighCost',
    condition: 'daily_api_spend > budget_daily',
    severity: 'info',
    action: 'notify_finance',
  },
];
```

---

## 🛠️ DevOps 架构决策

### 容器编排选择

| 平台 | 适用场景 | 学习曲线 |
|------|---------|---------|
| **Docker Compose** | 本地开发、小团队 | 简单 |
| **Kubernetes** | 生产规模、自动扩展 | 陡峭 |
| **Heroku/Railway** | 快速MVP | 最简单 |

**推荐路径**：
```
Phase 1 (MVP):      Docker Compose
           ↓
Phase 2 (Scaling):  ECS on AWS / Cloud Run on GCP
           ↓
Phase 3 (Enterprise): Kubernetes
```

### CI/CD 流程

```
Git Push
    ↓
[GitHub Actions]
  ├─ Lint & Format Check
  ├─ Unit Tests
  ├─ E2E Tests (Playwright)
  └─ Security Scan (Snyk)
    ↓ ✅ Pass
[Build & Push Images]
  ├─ Build: node:20-alpine
  ├─ Build: node:20-alpine (frontend)
  └─ Push to: ghcr.io/org/app:sha
    ↓
[Deploy to Staging]
  ├─ Run migrations
  ├─ Smoke tests
  └─ Performance baseline
    ↓ ✅ Pass
[Approval Gate]
    ↓ 🟢 Approved
[Deploy to Production]
  ├─ Blue-Green Deployment
  ├─ Health checks
  └─ Gradual rollout (10% → 50% → 100%)
    ↓
[Post-Deploy Monitoring]
  ├─ Error rate monitoring
  ├─ Performance metrics
  └─ User feedback
```

---

## 📋 技术债管理

### Code Quality 工具栈

```typescript
// ESLint + Prettier
{
  "eslintConfig": {
    "extends": [
      "next/core-web-vitals",
      "plugin:@typescript-eslint/recommended",
      "plugin:sonarjs/recommended"
    ],
    "rules": {
      "complexity": ["warn", 10],
      "max-lines": ["warn", 300],
      "no-console": process.env.NODE_ENV === 'production' ? 'error' : 'warn'
    }
  }
}

// SonarQube 代码分析
// pre-commit hooks:
//   - lint-staged: 仅检查变更文件
//   - husky: commit前运行检查
```

### 定期维护计划

```
每周：
  - 依赖更新检查 (dependabot)
  - 安全补丁应用

每月：
  - 性能回归测试
  - 技术债评估
  - 代码覆盖率检查 (>80%)

每季度：
  - 依赖重大版本升级评估
  - 基础设施优化审查
  - 灾备演练
```

---

## 💡 决策总结表

| 决策项 | 选择 | 理由 |
|-------|------|------|
| **前端框架** | Next.js 14 | 最优开发体验 + 企业级支持 |
| **后端框架** | Nest.js | TypeScript统一 + 企业级功能 |
| **主数据库** | PostgreSQL | ACID + JSONB + 全文搜索 |
| **缓存** | Redis | 分布式 + 丰富数据结构 |
| **消息队列** | BullMQ | 简单可靠 + 可视化 |
| **主LLM** | Gemini | 成本最优 + 质量可接受 |
| **实时通信** | SSE | 单向流最优 |
| **文件存储** | GCS/S3 | 可靠性最高 |
| **容器化** | Docker | 业界标准 |
| **部署** | Docker Compose (dev) + K8s (prod) | 灵活可扩展 |
| **监控** | Prometheus + Grafana | 开源完善 |
| **日志** | ELK Stack | 成熟稳定 |
| **认证** | JWT + Refresh Token | 无状态 + 易扩展 |

