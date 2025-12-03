# 云文档AI翻译平台 - 完整技术架构设计

## 📋 目录
1. [系统概览](#系统概览)
2. [前端架构设计](#前端架构设计)
3. [后端架构设计](#后端架构设计)
4. [数据库设计](#数据库设计)
5. [第三方集成](#第三方集成)
6. [开发优先级和里程碑](#开发优先级和里程碑)
7. [技术风险和解决方案](#技术风险和解决方案)

---

## 系统概览

### 核心价值主张
- 支持多格式文档上传（PDF、HTML、Markdown、Word）
- 实时翻译预览（双栏阅读界面）
- 支持多个LLM服务商（Gemini、Claude、GPT）
- 术语库管理和一致性检查
- 翻译历史和版本管理

### 技术栈概览

```
┌─────────────────────────────────────────────────────────────────┐
│                     前端层 (Browser)                             │
│  Next.js 14 + React 18 + TypeScript + Tailwind CSS/MUI          │
├─────────────────────────────────────────────────────────────────┤
│                    API网关 & 服务                               │
│  RESTful API + WebSocket (实时翻译流)                           │
├─────────────────────────────────────────────────────────────────┤
│                      业务逻辑层                                  │
│  认证 | 文档解析 | 翻译编排 | 术语库 | 历史记录                 │
├─────────────────────────────────────────────────────────────────┤
│                      数据层                                      │
│  PostgreSQL (主数据) | Redis (缓存) | GCS/S3 (文件存储)         │
├─────────────────────────────────────────────────────────────────┤
│                      外部集成                                    │
│  Google Gemini | Anthropic Claude | OpenAI GPT | OAuth2 Provider│
└─────────────────────────────────────────────────────────────────┘
```

---

## 前端架构设计

### 1. 项目结构

```
frontend/
├── app/                          # Next.js 应用目录结构
│   ├── layout.tsx                # 全局布局
│   ├── page.tsx                  # 首页
│   ├── dashboard/
│   │   ├── layout.tsx            # 仪表板布局
│   │   ├── page.tsx              # 主翻译界面
│   │   ├── history/              # 翻译历史页面
│   │   └── terminology/          # 术语库管理
│   ├── auth/
│   │   ├── login/page.tsx        # 登录页
│   │   ├── register/page.tsx     # 注册页
│   │   └── callback/page.tsx     # OAuth回调
│   ├── api/                      # API路由（BFF层）
│   │   ├── auth/
│   │   ├── documents/
│   │   ├── translations/
│   │   └── terminology/
│   └── error.tsx & not-found.tsx # 错误页面
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx            # 顶部导航
│   │   ├── Sidebar.tsx           # 侧边栏（文件列表）
│   │   └── Footer.tsx            # 底部
│   │
│   ├── editor/
│   │   ├── DualPaneEditor.tsx    # 双栏编辑器核心组件
│   │   ├── SourcePane.tsx        # 左栏（原文）
│   │   ├── TargetPane.tsx        # 右栏（译文）
│   │   ├── EditorToolbar.tsx     # 编辑工具栏
│   │   └── TranslationStatusBar.tsx # 翻译进度条
│   │
│   ├── documents/
│   │   ├── DocumentUploader.tsx  # 文件上传组件
│   │   ├── UrlInput.tsx          # URL输入组件
│   │   ├── DocumentPreview.tsx   # 文档预览
│   │   └── DocumentList.tsx      # 文档列表
│   │
│   ├── translation/
│   │   ├── TranslationSettings.tsx  # 翻译设置（LLM选择、语言、风格）
│   │   ├── TerminologyPanel.tsx     # 术语库面板
│   │   ├── ContextualMenu.tsx       # 右键菜单（段落操作）
│   │   └── SegmentControls.tsx      # 段落级别控制
│   │
│   ├── common/
│   │   ├── Button.tsx, Input.tsx, Modal.tsx  # 通用组件
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── Toast.tsx               # 通知组件
│   │
│   └── ai/
│       ├── AIProviderSelector.tsx  # LLM选择器
│       └── TranslationSuggestion.tsx # 翻译建议卡片
│
├── lib/
│   ├── api.ts                    # API客户端工具类
│   ├── auth.ts                   # 认证逻辑
│   ├── document-parser.ts        # 文档解析（前端侧）
│   ├── storage.ts                # 本地存储工具
│   ├── utils.ts                  # 通用工具函数
│   └── constants.ts              # 常量定义
│
├── hooks/
│   ├── useAuth.ts                # 认证Hook
│   ├── useDocument.ts            # 文档管理Hook
│   ├── useTranslation.ts         # 翻译业务逻辑Hook
│   ├── useTerminology.ts         # 术语库Hook
│   ├── useWebSocket.ts           # WebSocket连接Hook
│   └── useLocalStorage.ts        # 本地存储Hook
│
├── store/                        # Zustand 状态管理
│   ├── auth.store.ts             # 认证状态
│   ├── document.store.ts         # 文档状态
│   ├── translation.store.ts      # 翻译状态
│   ├── ui.store.ts               # UI状态（主题、布局等）
│   └── index.ts                  # 统一导出
│
├── types/
│   ├── index.ts                  # 核心类型定义
│   ├── api.ts                    # API相关类型
│   ├── document.ts               # 文档相关类型
│   └── translation.ts            # 翻译相关类型
│
├── styles/
│   ├── globals.css               # 全局样式
│   ├── tailwind.config.ts        # Tailwind配置
│   └── theme/
│       ├── light.ts              # 浅色主题
│       └── dark.ts               # 深色主题
│
├── config/
│   ├── api.config.ts             # API端点配置
│   ├── ai-providers.config.ts    # AI服务商配置
│   └── env.ts                    # 环境变量验证
│
├── middleware.ts                 # Next.js 中间件（认证、日志）
├── next.config.js                # Next.js配置
├── tailwind.config.ts            # Tailwind CSS配置
├── tsconfig.json                 # TypeScript配置
├── package.json
└── .env.local                    # 环境变量
```

### 2. 双栏阅读界面组件设计

#### DualPaneEditor 核心组件架构

```typescript
// components/editor/DualPaneEditor.tsx
interface DualPaneEditorProps {
  documentId: string;
  sourceLanguage: string;
  targetLanguage: string;
  onTranslationChange: (segmentId: string, translation: string) => void;
}

interface EditorState {
  segments: TranslationSegment[];        // 分割后的文本段落
  activeSegmentId: string | null;        // 当前选中段落
  syncScroll: boolean;                   // 双栏滚动同步
  showComparison: boolean;               // 显示对比视图
  autoTranslate: boolean;                // 自动翻译
  translationProgress: {
    total: number;
    completed: number;
  };
}

// 文本分割策略
type SegmentStrategy = 'sentence' | 'paragraph' | 'section' | 'custom';

// 翻译段落数据结构
interface TranslationSegment {
  id: string;                     // 唯一标识
  sourceText: string;             // 原文
  targetText: string;             // 译文
  type: 'text' | 'heading' | 'code' | 'list' | 'table'; // 段落类型
  context?: string;               // 上下文（前后段落）
  metadata?: {
    formatting: FormattingInfo;
    terminology: TerminologyMatch[];
    aiSuggestion?: string;
    locked: boolean;              // 锁定段落（不自动翻译）
  };
}
```

#### 关键设计决策

| 功能 | 实现方案 | 原因 |
|------|--------|------|
| **双栏同步滚动** | 使用Intersection Observer API + ResizeObserver | 性能更优，无需计算滚动距离 |
| **文本分割** | 多种策略（句子/段落/自定义），后端返回 | 前后端协作，减少前端复杂度 |
| **实时翻译** | WebSocket + 流式传输 | 提升用户体验，显示翻译过程 |
| **样式同步** | 保留原文格式标记，前端渲染 | 支持富文本（加粗、斜体、链接等） |
| **性能优化** | 虚拟滚动（virtualization）+ 懒加载 | 处理大文档（>1000段） |

#### 组件层级设计

```
DualPaneEditor (容器组件)
├── EditorToolbar (工具栏)
│   ├── LLMSelector (AI服务选择)
│   ├── LanguagePair (语言对选择)
│   ├── SegmentationSelector (分割策略)
│   └── ExportButton (导出)
│
├── MainContent (主内容区)
│   ├── SourcePane (左栏)
│   │   ├── VirtualList (虚拟列表)
│   │   │   └── SegmentItem[] (段落项)
│   │   └── Resizer (调整器)
│   │
│   ├── Resizer (分割线)
│   │   └── DragHandle (拖动把手)
│   │
│   └── TargetPane (右栏)
│       ├── VirtualList (虚拟列表)
│       │   └── EditableSegment[]
│       │       ├── TargetText (可编辑)
│       │       ├── AISuggestion (建议)
│       │       ├── TerminologyHints (术语提示)
│       │       └── SegmentActions (操作)
│       └── Resizer
│
├── ContextPanel (侧边面板)
│   ├── TerminologyPanel (术语库)
│   ├── GlossaryMatches (术语匹配)
│   └── SegmentHistory (段落历史)
│
└── TranslationStatusBar (状态栏)
    ├── Progress (进度)
    ├── Stats (统计)
    └── Actions (操作按钮)
```

### 3. 状态管理方案 - Zustand

选择理由：
- ✅ 轻量级（<2KB）
- ✅ TypeScript支持好
- ✅ 无Provider嵌套
- ✅ 支持中间件和持久化
- ✅ 学习曲线平缓

```typescript
// store/translation.store.ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface TranslationStore {
  // 状态
  currentDocument: Document | null;
  segments: TranslationSegment[];
  activeSegmentId: string | null;
  translationProgress: { total: number; completed: number };

  // AI配置
  selectedLLM: 'gemini' | 'claude' | 'gpt4';
  targetLanguage: string;
  translationStyle: 'formal' | 'casual' | 'technical';
  customPrompt?: string;

  // 术语库
  activeTerminologyId: string | null;
  terminologyMatches: Map<string, TermMatch[]>;

  // 操作
  setDocument: (doc: Document) => void;
  updateSegment: (id: string, translation: string) => void;
  setActiveSegment: (id: string | null) => void;
  startTranslation: () => void;
  pauseTranslation: () => void;

  // 工具方法
  getSegmentContext: (id: string) => { prev?: string; next?: string };
  getTerminologyForSegment: (id: string) => TermMatch[];
}

export const useTranslationStore = create<TranslationStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        currentDocument: null,
        segments: [],
        activeSegmentId: null,
        // ... 其他初始状态

        // 操作
        setDocument: (doc) => set({ currentDocument: doc, segments: [] }),
        updateSegment: (id, translation) =>
          set((state) => ({
            segments: state.segments.map(s =>
              s.id === id ? { ...s, targetText: translation } : s
            ),
          })),
        // ... 其他操作

        // 工具方法
        getSegmentContext: (id) => {
          const segments = get().segments;
          const index = segments.findIndex(s => s.id === id);
          return {
            prev: index > 0 ? segments[index - 1].sourceText : undefined,
            next: index < segments.length - 1 ? segments[index + 1].sourceText : undefined,
          };
        },
      }),
      {
        name: 'translation-store',
        partialize: (state) => ({
          segments: state.segments,
          translationProgress: state.translationProgress,
        }),
      }
    )
  )
);

// store/document.store.ts - 文档存储
// store/auth.store.ts - 认证存储
// store/ui.store.ts - UI状态存储
```

### 4. UI 组件库选择

#### Tailwind CSS + shadcn/ui 方案（推荐）

```
优势：
✅ 快速开发，高度可定制
✅ 文件大小小，性能优
✅ 暗色模式原生支持
✅ 响应式设计简洁
✅ 社区活跃，组件库多
✅ 配合 shadcn/ui 获得美观组件

劣势：
❌ 学习曲线较陡
❌ 某些复杂组件需自己组合

配置示例：
```

```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        brand: {
          light: '#F0F9FF',
          dark: '#0F172A',
        },
      },
      spacing: {
        'editor-gutter': '60px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

#### Material-UI 备选方案

```
适用场景：
- 企业级复杂应用
- 需要预设完整组件库
- 团队熟悉Material设计系统

推荐组件：
- Drawer（侧边栏）
- AppBar（顶部导航）
- Table（术语库表格）
- Dialog（确认框）
- Snackbar（通知）
```

### 5. 文件上传和URL解析前端处理

```typescript
// components/documents/DocumentUploader.tsx
interface DocumentUploaderProps {
  onDocumentSelected: (file: File | string) => Promise<void>;
  supportedFormats: string[];
  maxFileSize: number; // MB
}

// 前端处理流程
const handleFileUpload = async (file: File) => {
  // 1. 验证
  validateFile(file);

  // 2. 本地预处理
  const preview = await generatePreview(file);

  // 3. 上传到后端
  const response = await uploadDocument(file);

  // 4. 获取解析结果
  const parsed = await fetchParsedDocument(response.documentId);

  // 5. 加载到编辑器
  store.setDocument(parsed);
};

const handleUrlInput = async (url: string) => {
  // 1. URL验证
  validateUrl(url);

  // 2. 后端请求（服务端爬取）
  const response = await api.fetchAndParseUrl(url, {
    targetLanguage: store.targetLanguage,
    strategy: 'cheerio' | 'puppeteer', // 由后端决策
  });

  // 3. 加载编辑器
  store.setDocument(response);
};

// 前端应负责的部分
const frontendResponsibilities = {
  // ✅ 客户端验证
  validateFile: (file) => {
    if (file.size > MAX_FILE_SIZE) throw new Error('文件过大');
    if (!SUPPORTED_FORMATS.includes(file.type)) throw new Error('格式不支持');
  },

  // ✅ 生成预览（小文件）
  generatePreview: async (file) => {
    if (file.type === 'application/pdf') return previewPDF(file);
    if (file.type === 'text/html') return previewHTML(file);
    // ...
  },

  // ✅ 处理上传进度
  trackUploadProgress: (event) => {
    const percentage = (event.loaded / event.total) * 100;
    updateProgressBar(percentage);
  },

  // ✅ 错误处理和重试
  uploadWithRetry: async (file, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await uploadDocument(file);
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await delay(Math.pow(2, i) * 1000); // 指数退避
      }
    }
  },
};
```

---

## 后端架构设计

### 1. 技术栈选择

```
运行时：Node.js 20 LTS / Python 3.11
框架：Nest.js (TS) / FastAPI (Python)
推荐：Nest.js（优势在于企业级支持、装饰器模式、深度集成）

主要包：
├── @nestjs/core & common         # 核心框架
├── @nestjs/typeorm               # ORM（PostgreSQL）
├── @nestjs/jwt & passport        # 认证
├── @nestjs/websockets            # WebSocket（实时翻译流）
├── axios                          # HTTP客户端（调用LLM API）
├── openai & @anthropic/sdk       # LLM SDK
├── cheerio & puppeteer           # 文档爬取
├── pdf-parse & docx              # 文档解析
├── bullmq                         # 任务队列
└── pino                           # 日志
```

### 2. API 端点设计 (RESTful)

#### 认证模块

```
POST   /api/v1/auth/register              注册用户
POST   /api/v1/auth/login                 用户登录
POST   /api/v1/auth/refresh-token         刷新令牌
POST   /api/v1/auth/logout                登出
POST   /api/v1/auth/oauth/google/callback OAuth回调
GET    /api/v1/auth/me                    获取当前用户信息
```

#### 文档模块

```
POST   /api/v1/documents                  上传/创建文档
GET    /api/v1/documents                  列表文档
GET    /api/v1/documents/:id              获取文档详情
PUT    /api/v1/documents/:id              更新文档信息
DELETE /api/v1/documents/:id              删除文档
GET    /api/v1/documents/:id/content      获取解析后的内容
POST   /api/v1/documents/:id/parse        重新解析文档
```

#### 翻译模块

```
POST   /api/v1/translations               创建翻译任务
GET    /api/v1/translations/:id           获取翻译任务
PUT    /api/v1/translations/:id/segment   更新单个段落翻译
PATCH  /api/v1/translations/:id/status    更新翻译状态
POST   /api/v1/translations/:id/export    导出翻译结果
GET    /api/v1/translations               列表翻译历史

WebSocket：
ws://api/v1/translations/:id/stream       实时翻译流
```

#### 术语库模块

```
POST   /api/v1/terminology-bases          创建术语库
GET    /api/v1/terminology-bases          列表术语库
POST   /api/v1/terminology-bases/:id/terms  添加术语
GET    /api/v1/terminology-bases/:id/terms  查询术语
PUT    /api/v1/terminology-bases/:id/terms/:termId  更新术语
DELETE /api/v1/terminology-bases/:id/terms/:termId  删除术语
POST   /api/v1/terminology-bases/:id/match     术语匹配API
```

#### 完整API响应设计

```typescript
// 标准响应包装
interface ApiResponse<T> {
  success: boolean;
  code: string;           // 'SUCCESS' | 'VALIDATION_ERROR' | 'UNAUTHORIZED' | ...
  message: string;
  data?: T;
  errors?: FieldError[];
  meta?: {
    timestamp: number;
    traceId: string;
    version: string;
  };
}

interface FieldError {
  field: string;
  message: string;
  code: string;
}

// 分页响应
interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 使用示例
GET /api/v1/translations?page=1&pageSize=20
=>
{
  "success": true,
  "code": "SUCCESS",
  "data": {
    "items": [...],
    "pagination": { ... }
  }
}

POST /api/v1/translations
=>
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "errors": [
    { "field": "targetLanguage", "message": "Invalid language code", "code": "INVALID_ENUM" }
  ]
}
```

### 3. 文档解析模块

#### 架构设计

```
DocumentParsingService
├── ParseStrategyFactory
│   ├── PDFStrategy
│   ├── HTMLStrategy
│   ├── MarkdownStrategy
│   ├── WordStrategy
│   └── URLStrategy
│
├── TextSegmentationService
│   ├── SentenceSegmenter
│   ├── ParagraphSegmenter
│   ├── SectionSegmenter
│   └── CustomSegmenter
│
├── FormattingPreserver
│   ├── markdownFormatter.preserve()    # 保留Markdown格式
│   ├── htmlFormatter.convert()          # HTML转结构化格式
│   └── codeBlockHandler.extract()       # 代码块特殊处理
│
└── QualityChecker
    ├── validateStructure()
    ├── detectLanguage()
    └── estimateComplexity()
```

#### 实现示例

```typescript
// services/document-parsing.service.ts
import * as pdf from 'pdf-parse';
import * as cheerio from 'cheerio';
import * as docx from 'docx-parse';

@Injectable()
export class DocumentParsingService {
  async parseDocument(
    file: Buffer,
    format: string,
    options: ParseOptions
  ): Promise<ParsedDocument> {
    const strategy = this.getStrategy(format);
    const rawContent = await strategy.extract(file);

    // 保留格式信息
    const structured = await this.structureContent(rawContent, format);

    // 分割文本
    const segments = await this.segmentText(
      structured.content,
      options.segmentationStrategy
    );

    return {
      id: generateId(),
      title: structured.title,
      language: structured.detectedLanguage,
      segments,
      metadata: structured.metadata,
    };
  }

  private getStrategy(format: string): IParseStrategy {
    switch (format.toLowerCase()) {
      case 'pdf':
        return new PDFStrategy();
      case 'html':
        return new HTMLStrategy();
      case 'markdown':
        return new MarkdownStrategy();
      case 'docx':
        return new WordStrategy();
      default:
        throw new UnsupportedFormatError(format);
    }
  }

  async segmentText(
    content: string,
    strategy: SegmentationStrategy
  ): Promise<TextSegment[]> {
    switch (strategy) {
      case 'sentence':
        return this.segmentBySentence(content);
      case 'paragraph':
        return this.segmentByParagraph(content);
      case 'section':
        return this.segmentBySection(content);
      default:
        return this.segmentByParagraph(content);
    }
  }

  private segmentBySentence(content: string): TextSegment[] {
    // 使用 nlp 库处理复杂案例
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());

    return sentences.map((sentence, idx) => ({
      id: `seg-${idx}`,
      sourceText: sentence.trim(),
      type: 'sentence',
      index: idx,
    }));
  }

  private segmentByParagraph(content: string): TextSegment[] {
    const paragraphs = content
      .split(/\n\n+/)
      .filter(p => p.trim().length > 0);

    return paragraphs.map((para, idx) => ({
      id: `seg-${idx}`,
      sourceText: para.trim(),
      type: 'paragraph',
      index: idx,
    }));
  }
}

// strategies/pdf.strategy.ts
export class PDFStrategy implements IParseStrategy {
  async extract(file: Buffer): Promise<string> {
    const data = await pdf(file);
    return data.text;
  }
}

// strategies/html.strategy.ts
export class HTMLStrategy implements IParseStrategy {
  async extract(file: Buffer): Promise<ParsedHTML> {
    const html = file.toString('utf-8');
    const $ = cheerio.load(html);

    // 移除脚本和样式
    $('script, style').remove();

    // 提取主要内容
    const content = this.extractMainContent($);

    return {
      title: $('title').text(),
      content,
      links: $('a').map((_, el) => $(el).attr('href')).get(),
      images: $('img').map((_, el) => $(el).attr('src')).get(),
    };
  }

  private extractMainContent($: any): string {
    // 优先使用 article, main, content 标签
    const main = $('article, main, [role="main"]').first();
    if (main.length > 0) return main.text();

    // 否则提取 body
    return $('body').text();
  }
}

// strategies/markdown.strategy.ts
export class MarkdownStrategy implements IParseStrategy {
  async extract(file: Buffer): Promise<MarkdownParsed> {
    const content = file.toString('utf-8');

    return {
      raw: content,
      ast: parseMarkdownAST(content),
      codeBlocks: this.extractCodeBlocks(content),
      tables: this.extractTables(content),
    };
  }

  private extractCodeBlocks(content: string) {
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        code: match[2],
      });
    }

    return blocks;
  }
}
```

### 4. AI 翻译集成层

#### 多服务商支持架构

```typescript
// interfaces/ai-provider.interface.ts
export interface IAIProvider {
  name: 'gemini' | 'claude' | 'gpt4';

  translate(
    text: string,
    options: TranslationOptions
  ): Promise<string>;

  translateStream(
    text: string,
    options: TranslationOptions
  ): AsyncIterable<string>;

  getModels(): string[];

  validateCredentials(): Promise<boolean>;

  estimateCost(text: string): EstimatedCost;
}

// services/ai-translation.service.ts
@Injectable()
export class AITranslationService {
  private providers: Map<string, IAIProvider> = new Map();

  constructor(
    private geminiProvider: GeminiProvider,
    private claudeProvider: ClaudeProvider,
    private openaiProvider: OpenAIProvider,
  ) {
    this.providers.set('gemini', geminiProvider);
    this.providers.set('claude', claudeProvider);
    this.providers.set('gpt4', openaiProvider);
  }

  async translate(
    segments: TextSegment[],
    config: TranslationConfig
  ): Promise<TranslationResult[]> {
    const provider = this.getProvider(config.provider);

    // 构建优化的提示词
    const prompt = this.buildTranslationPrompt(segments, config);

    // 应用术语库约束
    const constrainedPrompt = this.applyTerminologyConstraints(
      prompt,
      config.terminologyId
    );

    // 调用翻译
    const results = [];
    for (const segment of segments) {
      const translation = await provider.translate(
        segment.sourceText,
        {
          ...config,
          context: this.getSegmentContext(segment),
        }
      );

      results.push({
        segmentId: segment.id,
        sourceText: segment.sourceText,
        targetText: translation,
        provider: config.provider,
        model: config.model,
      });
    }

    return results;
  }

  async *translateStream(
    segment: TextSegment,
    config: TranslationConfig
  ): AsyncIterable<string> {
    const provider = this.getProvider(config.provider);

    const prompt = this.buildTranslationPrompt([segment], config);

    for await (const chunk of provider.translateStream(
      segment.sourceText,
      { ...config, context: this.getSegmentContext(segment) }
    )) {
      yield chunk;
    }
  }

  private buildTranslationPrompt(
    segments: TextSegment[],
    config: TranslationConfig
  ): string {
    const style = config.translationStyle || 'neutral';
    const domain = config.domain || 'general';

    return `
You are a professional translator specializing in ${domain} content.

Target Language: ${config.targetLanguage}
Translation Style: ${style}
${config.customInstructions ? `Custom Instructions:\n${config.customInstructions}` : ''}

Text to translate:
${segments.map(s => s.sourceText).join('\n\n')}

Provide accurate, natural translations maintaining the original formatting and meaning.
${config.preserveFormatting ? 'Preserve all formatting (bold, italic, links, etc.).' : ''}
`;
  }

  private async applyTerminologyConstraints(
    prompt: string,
    terminologyId: string
  ): Promise<string> {
    if (!terminologyId) return prompt;

    const terms = await this.getTerminology(terminologyId);

    const glossary = terms
      .map(t => `${t.source} → ${t.target}`)
      .join('\n');

    return `${prompt}

GLOSSARY (MUST USE):
${glossary}
`;
  }

  private getSegmentContext(segment: TextSegment) {
    // 返回前后段落，帮助AI理解上下文
    return {
      text: segment.sourceText,
      precedingSegments: [],  // 实现中从存储获取
      followingSegments: [],
    };
  }

  private getProvider(name: string): IAIProvider {
    const provider = this.providers.get(name);
    if (!provider) throw new UnsupportedProviderError(name);
    return provider;
  }
}

// providers/gemini.provider.ts
export class GeminiProvider implements IAIProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async translate(
    text: string,
    options: TranslationOptions
  ): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: options.model || 'gemini-pro'
    });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: options.prompt || text }],
      }],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.3,  // 翻译应该是确定性的
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_UNSPECIFIED,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    return result.response.text();
  }

  async *translateStream(
    text: string,
    options: TranslationOptions
  ): AsyncIterable<string> {
    const model = this.client.getGenerativeModel({
      model: options.model || 'gemini-pro'
    });

    const stream = await model.generateContentStream(
      options.prompt || text
    );

    for await (const event of stream.stream) {
      const chunk = event.candidates?.[0]?.content?.parts?.[0]?.text;
      if (chunk) yield chunk;
    }
  }

  getModels(): string[] {
    return ['gemini-pro', 'gemini-pro-vision'];
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-pro' });
      await model.generateContent('Test');
      return true;
    } catch {
      return false;
    }
  }

  estimateCost(text: string): EstimatedCost {
    const inputTokens = Math.ceil(text.length / 4);
    const outputTokens = Math.ceil(text.length / 3); // 估计

    return {
      input: inputTokens * 0.000125,   // Gemini Pro 输入价格
      output: outputTokens * 0.000375, // Gemini Pro 输出价格
      total: (inputTokens * 0.000125) + (outputTokens * 0.000375),
    };
  }
}

// providers/claude.provider.ts
export class ClaudeProvider implements IAIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async translate(text: string, options: TranslationOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: options.model || 'claude-3-sonnet-20240229',
      max_tokens: 2048,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: options.prompt || text,
        },
      ],
    });

    return response.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('');
  }

  async *translateStream(
    text: string,
    options: TranslationOptions
  ): AsyncIterable<string> {
    const stream = await this.client.messages.stream({
      model: options.model || 'claude-3-sonnet-20240229',
      max_tokens: 2048,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: options.prompt || text,
        },
      ],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }

  getModels(): string[] {
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch {
      return false;
    }
  }

  estimateCost(text: string): EstimatedCost {
    // Claude pricing varies by model, using Claude 3 Sonnet as default
    const inputTokens = Math.ceil(text.length / 4);
    const outputTokens = Math.ceil(text.length / 3);

    return {
      input: inputTokens * 0.003,     // 输入
      output: outputTokens * 0.015,   // 输出
      total: (inputTokens * 0.003) + (outputTokens * 0.015),
    };
  }
}

// providers/openai.provider.ts
export class OpenAIProvider implements IAIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async translate(text: string, options: TranslationOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'user',
          content: options.prompt || text,
        },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    });

    return response.choices[0].message.content || '';
  }

  async *translateStream(
    text: string,
    options: TranslationOptions
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: options.model || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'user',
          content: options.prompt || text,
        },
      ],
      temperature: 0.3,
      max_tokens: 2048,
      stream: true,
    });

    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta?.content || '';
    }
  }

  getModels(): string[] {
    return [
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-3.5-turbo',
    ];
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10,
      });
      return true;
    } catch {
      return false;
    }
  }

  estimateCost(text: string): EstimatedCost {
    // GPT-4 pricing
    const inputTokens = Math.ceil(text.length / 4);
    const outputTokens = Math.ceil(text.length / 3);

    return {
      input: inputTokens * 0.03,
      output: outputTokens * 0.06,
      total: (inputTokens * 0.03) + (outputTokens * 0.06),
    };
  }
}
```

### 5. 术语库系统

```typescript
// entities/terminology.entity.ts
@Entity('terminology_bases')
export class TerminologyBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  name: string; // 术语库名称

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'private' })
  visibility: 'private' | 'shared' | 'public'; // 可见性

  @OneToMany(() => Term, term => term.terminologyBase, { cascade: true })
  terms: Term[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('terms')
export class Term {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TerminologyBase, term => term.terms, { onDelete: 'CASCADE' })
  terminologyBase: TerminologyBase;

  @Column()
  sourceLanguage: string;

  @Column()
  targetLanguage: string;

  @Column()
  sourceText: string; // 原文术语

  @Column()
  targetText: string; // 翻译术语

  @Column('text', { nullable: true })
  context?: string; // 用法示例

  @Column('text', { nullable: true })
  notes?: string; // 备注

  @Column({ type: 'float', default: 0 })
  frequency: number; // 使用频率（用于排序）

  @Column({ type: 'int', default: 0 })
  usageCount: number; // 使用次数统计

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// services/terminology.service.ts
@Injectable()
export class TerminologyService {
  constructor(
    private readonly termRepo: Repository<Term>,
    private readonly baseRepo: Repository<TerminologyBase>,
  ) {}

  // 创建术语库
  async createTerminologyBase(
    userId: string,
    dto: CreateTerminologyBaseDto
  ): Promise<TerminologyBase> {
    const base = this.baseRepo.create({
      userId,
      ...dto,
    });
    return this.baseRepo.save(base);
  }

  // 添加术语
  async addTerm(
    baseId: string,
    dto: CreateTermDto
  ): Promise<Term> {
    const term = this.termRepo.create({
      terminologyBase: { id: baseId },
      ...dto,
    });
    return this.termRepo.save(term);
  }

  // 术语匹配（核心功能）
  async matchTerms(
    text: string,
    baseId: string,
    options?: { sourceLanguage?: string; targetLanguage?: string }
  ): Promise<TermMatch[]> {
    const terms = await this.termRepo.find({
      where: {
        terminologyBase: { id: baseId },
        ...(options?.sourceLanguage && { sourceLanguage: options.sourceLanguage }),
        ...(options?.targetLanguage && { targetLanguage: options.targetLanguage }),
      },
    });

    const matches: TermMatch[] = [];

    for (const term of terms) {
      // 精确匹配
      if (text.includes(term.sourceText)) {
        matches.push({
          term,
          matchType: 'exact',
          confidence: 1.0,
        });
      }
      // 模糊匹配（Levenshtein距离）
      else if (this.fuzzyMatch(text, term.sourceText, 0.8)) {
        matches.push({
          term,
          matchType: 'fuzzy',
          confidence: this.calculateSimilarity(text, term.sourceText),
        });
      }
    }

    // 按置信度排序
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  private fuzzyMatch(source: string, target: string, threshold: number): boolean {
    const distance = this.levenshteinDistance(source.toLowerCase(), target.toLowerCase());
    const maxLength = Math.max(source.length, target.length);
    const similarity = 1 - (distance / maxLength);
    return similarity >= threshold;
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (s2[i - 1] === s1[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[len2][len1];
  }

  private calculateSimilarity(s1: string, s2: string): number {
    const distance = this.levenshteinDistance(s1.toLowerCase(), s2.toLowerCase());
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - (distance / maxLength);
  }

  // 批量导入术语
  async importTerms(
    baseId: string,
    file: Express.Multer.File
  ): Promise<{ imported: number; failed: number }> {
    const text = file.buffer.toString('utf-8');
    const lines = text.split('\n');

    let imported = 0;
    let failed = 0;

    for (const line of lines) {
      const [source, target, context] = line.split('\t');
      if (!source || !target) {
        failed++;
        continue;
      }

      try {
        await this.addTerm(baseId, {
          sourceText: source,
          targetText: target,
          context,
        });
        imported++;
      } catch {
        failed++;
      }
    }

    return { imported, failed };
  }

  // 导出术语库
  async exportTerms(baseId: string, format: 'csv' | 'json'): Promise<string> {
    const terms = await this.termRepo.find({
      where: { terminologyBase: { id: baseId } },
    });

    if (format === 'csv') {
      const csv = [
        'Source,Target,Context,Notes',
        ...terms.map(t =>
          `"${t.sourceText}","${t.targetText}","${t.context || ''}","${t.notes || ''}"`
        ),
      ].join('\n');
      return csv;
    } else {
      return JSON.stringify(terms, null, 2);
    }
  }
}
```

### 6. 用户认证和历史记录管理

```typescript
// strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}

// services/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // 检查用户是否存在
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('用户已存在');
    }

    // 创建用户
    const user = await this.userService.create({
      email: dto.email,
      password: await this.hashPassword(dto.password),
      name: dto.name,
    });

    return this.generateTokens(user);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误');
    }

    return this.generateTokens(user);
  }

  async validateOAuthUser(
    provider: string,
    profile: any
  ): Promise<User> {
    let user = await this.userService.findByOAuthProvider(provider, profile.id);

    if (!user) {
      user = await this.userService.create({
        email: profile.emails?.[0]?.value || `${profile.id}@${provider}.local`,
        name: profile.displayName,
        oauthProvider: provider,
        oauthId: profile.id,
      });
    }

    return user;
  }

  private generateTokens(user: User): AuthResponse {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

// entities/translation-history.entity.ts
@Entity('translation_histories')
export class TranslationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  documentId: string;

  @Column()
  documentTitle: string;

  @Column({ length: 10 })
  sourceLanguage: string;

  @Column({ length: 10 })
  targetLanguage: string;

  @Column({ type: 'text' })
  sourceContent: string; // 原文快照

  @Column({ type: 'text' })
  targetContent: string; // 译文快照

  @Column()
  provider: string; // 使用的AI服务商

  @Column()
  model: string; // 使用的AI模型

  @Column({ type: 'int' })
  totalSegments: number;

  @Column({ type: 'int' })
  translatedSegments: number;

  @Column({ type: 'float' })
  estimatedCost: number; // 预估费用

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    segmentationStrategy: string;
    translationStyle: string;
    terminologyUsed: boolean;
  };

  @Column({ type: 'varchar', default: 'completed' })
  status: 'pending' | 'in_progress' | 'completed' | 'failed';

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// services/translation-history.service.ts
@Injectable()
export class TranslationHistoryService {
  constructor(
    private readonly historyRepo: Repository<TranslationHistory>,
  ) {}

  async recordTranslation(
    userId: string,
    data: CreateTranslationHistoryDto
  ): Promise<TranslationHistory> {
    const history = this.historyRepo.create({
      userId,
      ...data,
    });
    return this.historyRepo.save(history);
  }

  async getHistory(
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResult<TranslationHistory>> {
    const [items, total] = await this.historyRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async getHistoryDetail(
    userId: string,
    historyId: string
  ): Promise<TranslationHistory> {
    const history = await this.historyRepo.findOne({
      where: { id: historyId, userId },
    });

    if (!history) {
      throw new NotFoundException('翻译记录不存在');
    }

    return history;
  }

  async getStatistics(userId: string): Promise<UserStatistics> {
    const histories = await this.historyRepo.find({
      where: { userId, status: 'completed' },
    });

    return {
      totalTranslations: histories.length,
      totalSegments: histories.reduce((sum, h) => sum + h.totalSegments, 0),
      totalCost: histories.reduce((sum, h) => sum + h.estimatedCost, 0),
      languagePairs: this.groupLanguagePairs(histories),
      providers: this.groupProviders(histories),
    };
  }

  private groupLanguagePairs(histories: TranslationHistory[]) {
    const pairs = new Map<string, number>();

    for (const history of histories) {
      const key = `${history.sourceLanguage}-${history.targetLanguage}`;
      pairs.set(key, (pairs.get(key) || 0) + 1);
    }

    return Array.from(pairs.entries()).map(([key, count]) => ({
      pair: key,
      count,
    }));
  }

  private groupProviders(histories: TranslationHistory[]) {
    const providers = new Map<string, number>();

    for (const history of histories) {
      providers.set(history.provider, (providers.get(history.provider) || 0) + 1);
    }

    return Array.from(providers.entries()).map(([provider, count]) => ({
      provider,
      count,
    }));
  }
}
```

---

## 数据库设计

### 1. PostgreSQL Schema

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),

  -- 订阅信息
  subscription_tier VARCHAR(50) DEFAULT 'free', -- free, pro, enterprise
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  monthly_translation_limit INT DEFAULT 10000, -- 免费版每月10k段落
  monthly_translation_used INT DEFAULT 0,

  -- 首选项
  default_language_pair JSONB, -- {"source": "en", "target": "zh"}
  preferred_ai_provider VARCHAR(50),
  theme VARCHAR(20) DEFAULT 'light',

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
);

-- 文档表
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT,          -- GCS/S3 URL
  file_size INT,          -- 字节
  file_format VARCHAR(50), -- pdf, html, md, docx
  detected_language VARCHAR(10),

  -- 解析后的内容（存储结构化数据）
  parsed_content JSONB,   -- { "segments": [...], "metadata": {...} }
  content_hash VARCHAR(64), -- 用于去重

  status VARCHAR(50) DEFAULT 'uploaded', -- uploaded, parsing, parsed, failed
  error_message TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP, -- 软删除

  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
);

-- 翻译任务表
CREATE TABLE translation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- 翻译配置
  source_language VARCHAR(10) NOT NULL,
  target_language VARCHAR(10) NOT NULL,
  ai_provider VARCHAR(50) NOT NULL, -- gemini, claude, gpt4
  ai_model VARCHAR(100),
  translation_style VARCHAR(50), -- formal, casual, technical
  custom_instructions TEXT,

  -- 术语库
  terminology_base_id UUID REFERENCES terminology_bases(id),
  preserve_formatting BOOLEAN DEFAULT TRUE,

  -- 进度
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, failed
  total_segments INT,
  translated_segments INT DEFAULT 0,
  progress_percentage FLOAT DEFAULT 0,

  -- 成本追踪
  estimated_cost DECIMAL(10, 4),
  actual_cost DECIMAL(10, 4),

  -- 时间
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- 翻译段落表（核心表）
CREATE TABLE translation_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES translation_tasks(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id),

  segment_index INT NOT NULL, -- 段落顺序
  source_text TEXT NOT NULL,
  target_text TEXT,

  -- 段落信息
  segment_type VARCHAR(50), -- text, heading, code, list, table
  locked BOOLEAN DEFAULT FALSE, -- 锁定不翻译

  -- AI建议
  ai_suggestion TEXT,
  suggestion_model VARCHAR(100),
  suggestion_quality_score FLOAT, -- 0-1

  -- 人工编辑
  edited_by_user BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP,
  edit_history JSONB, -- 编辑历史记录

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_task_id (task_id),
  INDEX idx_segment_index (task_id, segment_index),
  UNIQUE (task_id, segment_index)
);

-- 术语库表
CREATE TABLE terminology_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,
  visibility VARCHAR(50) DEFAULT 'private', -- private, shared, public

  source_language VARCHAR(10),
  target_language VARCHAR(10),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_name (name)
);

-- 术语表
CREATE TABLE terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terminology_base_id UUID NOT NULL REFERENCES terminology_bases(id) ON DELETE CASCADE,

  source_text VARCHAR(500) NOT NULL,
  target_text VARCHAR(500) NOT NULL,
  context TEXT, -- 使用示例
  notes TEXT,

  frequency FLOAT DEFAULT 0, -- 使用频率
  usage_count INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_terminology_id (terminology_base_id),
  INDEX idx_source_text (source_text),
  INDEX idx_usage_count (usage_count DESC)
);

-- 翻译历史表
CREATE TABLE translation_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES translation_tasks(id),

  document_title VARCHAR(255),
  source_language VARCHAR(10),
  target_language VARCHAR(10),

  source_content_snapshot TEXT,
  target_content_snapshot TEXT,

  ai_provider VARCHAR(50),
  ai_model VARCHAR(100),

  total_segments INT,
  translated_segments INT,
  estimated_cost DECIMAL(10, 4),

  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- 用户活动日志表（审计）
CREATE TABLE user_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  action VARCHAR(100),
  resource_type VARCHAR(50), -- document, translation, terminology
  resource_id UUID,

  details JSONB,
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

### 2. 缓存策略 - Redis

```typescript
// cache/redis.config.ts
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

export const cacheConfig = CacheModule.register({
  store: redisStore,
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  ttl: 3600, // 默认1小时
  auth_pass: process.env.REDIS_PASSWORD,
});

// 缓存键设计
export const CacheKeys = {
  // 用户相关
  USER_PROFILE: (userId: string) => `user:${userId}:profile`,
  USER_STATS: (userId: string) => `user:${userId}:stats`,

  // 文档相关
  DOCUMENT_PARSED: (docId: string) => `doc:${docId}:parsed`,
  DOCUMENT_CONTENT: (docId: string) => `doc:${docId}:content`,

  // 翻译相关
  TRANSLATION_TASK: (taskId: string) => `trans:${taskId}:task`,
  TRANSLATION_SEGMENTS: (taskId: string) => `trans:${taskId}:segments`,

  // 术语库相关
  TERMINOLOGY_BASE: (baseId: string) => `term:${baseId}:base`,
  TERMINOLOGY_TERMS: (baseId: string) => `term:${baseId}:terms`,
  TERMINOLOGY_MATCHES: (baseId: string, text: string) =>
    `term:${baseId}:matches:${hashText(text)}`,

  // LLM配额相关
  LLM_USAGE: (provider: string, month: string) =>
    `llm:${provider}:usage:${month}`,

  // Session相关
  SESSION: (sessionId: string) => `session:${sessionId}`,
};

// services/cache.service.ts
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl || 3600000); // ms
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    // 删除匹配pattern的所有键
    const keys = await this.cacheManager.store.keys(`${pattern}*`);
    for (const key of keys) {
      await this.cacheManager.del(key);
    }
  }

  // 缓存穿透保护
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    let value = await this.get<T>(key);
    if (value) return value;

    // 获取值
    value = await fetcher();

    // 缓存，空值缓存较短时间防止穿透
    const cacheTtl = value ? (ttl || 3600000) : 600000; // 空值10分钟
    await this.set(key, value || null, cacheTtl);

    return value;
  }

  // 缓存雪崩防护（加入随机偏移）
  async setWithJitter<T>(
    key: string,
    value: T,
    baseTtl: number
  ): Promise<void> {
    const jitter = Math.random() * 0.1 * baseTtl; // 10%随机
    await this.set(key, value, baseTtl + jitter);
  }
}

// 缓存失效策略
export class CacheInvalidationStrategy {
  static invalidateOnUpdate(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // 根据操作类型失效缓存
      if (propertyKey.includes('update') || propertyKey.includes('create')) {
        const entityId = args[0]?.id || args[1]?.id;
        // 失效相关缓存
      }

      return result;
    };
  }
}
```

### 3. 文件存储 - GCS/S3

```typescript
// config/storage.config.ts
export interface StorageConfig {
  provider: 'gcs' | 's3';
  bucket: string;
  region?: string;
  credentials: {
    projectId?: string;
    keyFilename?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
}

// services/storage.service.ts
@Injectable()
export class StorageService {
  private storage: Storage;

  constructor(private configService: ConfigService) {
    const provider = this.configService.get('STORAGE_PROVIDER', 'gcs');

    if (provider === 'gcs') {
      this.storage = new GCSStorage(
        this.configService.get('GCS_PROJECT_ID'),
        this.configService.get('GCS_KEY_FILE')
      );
    } else {
      this.storage = new S3Storage(
        this.configService.get('AWS_ACCESS_KEY_ID'),
        this.configService.get('AWS_SECRET_ACCESS_KEY'),
        this.configService.get('AWS_REGION')
      );
    }
  }

  async upload(
    file: Express.Multer.File,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const key = this.generateKey(file.originalname, options);

    const result = await this.storage.upload({
      key,
      buffer: file.buffer,
      contentType: file.mimetype,
      metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
        ...options?.metadata,
      },
    });

    return {
      url: result.url,
      key,
      size: file.size,
      uploadedAt: new Date(),
    };
  }

  async download(key: string): Promise<Buffer> {
    return this.storage.download(key);
  }

  async delete(key: string): Promise<void> {
    await this.storage.delete(key);
  }

  private generateKey(originalName: string, options?: UploadOptions): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = originalName.split('.').pop();

    const path = options?.path || 'uploads';
    return `${path}/${timestamp}-${random}.${ext}`;
  }
}

// storage/gcs.storage.ts
export class GCSStorage implements IStorage {
  private bucket: Bucket;

  constructor(projectId: string, keyFilename: string) {
    const storage = new Storage({ projectId, keyFilename });
    this.bucket = storage.bucket(process.env.GCS_BUCKET!);
  }

  async upload(params: StorageParams): Promise<StorageResult> {
    const file = this.bucket.file(params.key);

    await file.save(params.buffer, {
      metadata: {
        contentType: params.contentType,
        metadata: params.metadata,
      },
    });

    // 生成签名URL（24小时有效）
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 24 * 60 * 60 * 1000,
    });

    return {
      url,
      key: params.key,
    };
  }

  async download(key: string): Promise<Buffer> {
    const file = this.bucket.file(key);
    const [buffer] = await file.download();
    return buffer;
  }

  async delete(key: string): Promise<void> {
    await this.bucket.file(key).delete();
  }
}

// storage/s3.storage.ts
export class S3Storage implements IStorage {
  private s3: AWS.S3;
  private bucket: string;

  constructor(accessKeyId: string, secretAccessKey: string, region: string) {
    this.s3 = new AWS.S3({
      accessKeyId,
      secretAccessKey,
      region,
    });
    this.bucket = process.env.AWS_S3_BUCKET!;
  }

  async upload(params: StorageParams): Promise<StorageResult> {
    const result = await this.s3.putObject({
      Bucket: this.bucket,
      Key: params.key,
      Body: params.buffer,
      ContentType: params.contentType,
      Metadata: params.metadata,
    }).promise();

    const url = this.s3.getSignedUrl('getObject', {
      Bucket: this.bucket,
      Key: params.key,
      Expires: 24 * 60 * 60, // 24小时
    });

    return { url, key: params.key };
  }

  async download(key: string): Promise<Buffer> {
    const result = await this.s3.getObject({
      Bucket: this.bucket,
      Key: key,
    }).promise();

    return result.Body as Buffer;
  }

  async delete(key: string): Promise<void> {
    await this.s3.deleteObject({
      Bucket: this.bucket,
      Key: key,
    }).promise();
  }
}
```

---

## 第三方集成

### 1. LLM API 选择对比

| 维度 | Gemini | Claude | GPT-4 |
|-----|--------|--------|-------|
| **定价** | $0.000125/输入K $0.000375/输出K | $0.003/输入K $0.015/输出K | $0.03/输入K $0.06/输出K |
| **上下文长度** | 1M tokens | 200K tokens | 128K tokens |
| **翻译质量** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **响应速度** | 快 | 中等 | 中等 |
| **API稳定性** | 较好 | 很好 | 很好 |
| **成本效益** | 最优 | 高质量高成本 | 高成本 |
| **适用场景** | 大量翻译任务 | 复杂/学术翻译 | 高端用户 |

**推荐方案**：
- **MVP阶段**：使用 Gemini（成本最低，质量可接受）
- **Pro用户**：提供Claude选项（质量更好）
- **企业用户**：支持GPT-4（最高质量）

### 2. 认证方案 - OAuth2

```typescript
// auth/oauth.strategy.ts
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GithubStrategy } from 'passport-github2';

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(GoogleStrategy) {
  constructor(
    private authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const user = await this.authService.validateOAuthUser('google', profile);
    return {
      user,
      accessToken,
      refreshToken,
    };
  }
}

@Injectable()
export class GithubOAuthStrategy extends PassportStrategy(GithubStrategy) {
  constructor(
    private authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get('GITHUB_CLIENT_ID'),
      clientSecret: configService.get('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const user = await this.authService.validateOAuthUser('github', profile);
    return {
      user,
      accessToken,
      refreshToken,
    };
  }
}

// controllers/auth.controller.ts
@Controller('api/v1/auth')
export class AuthController {
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('oauth/google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('oauth/google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: Request) {
    const { user, accessToken, refreshToken } = req.user;

    // 重定向回前端，携带令牌
    return `${this.configService.get('FRONTEND_URL')}/auth/callback?token=${accessToken}&refresh=${refreshToken}`;
  }

  @Get('oauth/github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {}

  @Get('oauth/github/callback')
  @UseGuards(AuthGuard('github'))
  githubAuthRedirect(@Req() req: Request) {
    const { user, accessToken, refreshToken } = req.user;
    return `${this.configService.get('FRONTEND_URL')}/auth/callback?token=${accessToken}&refresh=${refreshToken}`;
  }

  @Post('refresh-token')
  @UseGuards(AuthGuard('jwt'))
  async refreshToken(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.authService.generateTokens(user);
  }
}
```

### 3. 文档爬取 - Cheerio vs Puppeteer

| 特性 | Cheerio | Puppeteer |
|------|---------|-----------|
| **用途** | 静态HTML解析 | 浏览器自动化 |
| **性能** | ⭐⭐⭐⭐⭐ 超快 | ⭐⭐ 较慢 |
| **内存占用** | ⭐⭐⭐⭐⭐ 低 | ⭐⭐ 高 |
| **JavaScript渲染** | ❌ 不支持 | ✅ 支持 |
| **大规模爬取** | ✅ 推荐 | ❌ 不推荐 |
| **复杂交互** | ❌ 不行 | ✅ 可以 |

**使用策略**：

```typescript
// services/url-fetcher.service.ts
@Injectable()
export class UrlFetcherService {
  async fetchAndParse(
    url: string,
    options: FetchOptions
  ): Promise<ParsedDocument> {
    // 第一步：检测是否需要JS渲染
    const requiresJS = await this.checkIfRequiresJS(url);

    let html: string;

    if (requiresJS) {
      // 使用 Puppeteer 处理动态内容
      html = await this.fetchWithPuppeteer(url);
    } else {
      // 使用 Cheerio 处理静态HTML（快速）
      html = await this.fetchWithCheerio(url);
    }

    // 解析HTML
    const parsed = await this.parseHTML(html);

    return parsed;
  }

  private async checkIfRequiresJS(url: string): Promise<boolean> {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
      });

      const html = response.data;

      // 检查是否包含大量JS框架迹象
      const reactPattern = /react|vue|angular|nextjs|nuxt/i;
      const jsFrameworks = html.match(reactPattern);

      // 检查是否内容为空（典型的CSR迹象）
      const contentLength = html.replace(/<[^>]*>/g, '').trim().length;

      return jsFrameworks !== null && contentLength < 500;
    } catch {
      // 出错时默认使用Puppeteer（更保险）
      return true;
    }
  }

  private async fetchWithCheerio(url: string): Promise<string> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 ...',
      },
      timeout: 10000,
    });

    return response.data;
  }

  private async fetchWithPuppeteer(url: string): Promise<string> {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox'],
    });

    try {
      const page = await browser.newPage();

      // 设置视口和用户代理
      await page.setViewport({ width: 1280, height: 720 });
      await page.setUserAgent('Mozilla/5.0 ...');

      // 导航并等待加载
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // 获取渲染后的HTML
      const html = await page.content();

      await page.close();
      return html;
    } finally {
      await browser.close();
    }
  }

  private async parseHTML(html: string): Promise<ParsedDocument> {
    const $ = cheerio.load(html);

    // 移除脚本和样式
    $('script, style').remove();

    const title = $('title').text() || $('h1').first().text();
    const content = this.extractMainContent($);

    return {
      title,
      content,
      segments: this.segmentContent(content),
    };
  }
}

// 使用场景判断
const urlFetchStrategy = {
  // 静态网站 → Cheerio
  'medium.com': 'cheerio',          // ❌ 但Medium通过JS加载，需检测
  'github.com': 'cheerio',          // ✅ 静态
  'wikipedia.org': 'cheerio',       // ✅ 静态

  // 动态网站 → Puppeteer
  'example.com/spa': 'puppeteer',   // ✅ React SPA
  'medium.com/stories': 'puppeteer', // ✅ 动态加载
  'app.example.com': 'puppeteer',   // ✅ Web应用
};
```

---

## 开发优先级和里程碑

### Phase 1: MVP (6周)

**目标**：核心翻译功能可用

#### Week 1-2: 基础设施和认证
- [ ] Next.js 项目初始化（前端框架、路由、布局）
- [ ] Nest.js 项目初始化（后端框架、数据库连接）
- [ ] PostgreSQL 数据库建表
- [ ] 用户认证（注册、登录、JWT）
- [ ] OAuth 集成（Google登录）

#### Week 3: 前端编辑器UI
- [ ] 实现 DualPaneEditor 基础组件
- [ ] 文件上传组件
- [ ] 基础样式（Tailwind + shadcn/ui）
- [ ] 状态管理（Zustand）

#### Week 4: 后端文档解析
- [ ] 实现 DocumentParsingService
- [ ] 支持格式：HTML、Markdown、PDF基础
- [ ] 文本分割（段落级别）
- [ ] 文件上传到GCS/S3

#### Week 5: AI翻译集成
- [ ] 选择 Gemini 作为初始提供商
- [ ] 实现 AITranslationService
- [ ] 单段落翻译功能
- [ ] WebSocket 流式翻译

#### Week 6: 联调和优化
- [ ] 前后端联调
- [ ] 性能优化
- [ ] 错误处理和日志
- [ ] 基础测试

**交付物**：
- 可上传文档、翻译单篇文章的工作原型
- 支持2-3种文档格式
- 翻译质量可接受（Gemini）

---

### Phase 2: 核心功能完善 (6周)

#### Week 7-8: 术语库系统
- [ ] TerminologyService 完整实现
- [ ] 术语库UI（管理、导入、导出）
- [ ] 术语匹配和注入提示词

#### Week 9: 翻译历史和版本管理
- [ ] TranslationHistoryService
- [ ] 历史记录UI
- [ ] 比较视图功能

#### Week 10: 多LLM支持
- [ ] Claude 集成
- [ ] GPT-4 集成
- [ ] LLM选择器UI
- [ ] 成本估计

#### Week 11: 文档管理
- [ ] 完整文档格式支持（Word、LaTeX）
- [ ] 文档预览功能
- [ ] 文档列表和搜索

#### Week 12: 性能优化和测试
- [ ] 缓存策略部署（Redis）
- [ ] 虚拟滚动支持大文档
- [ ] 单元测试和E2E测试

**交付物**：
- 完整的翻译工作流
- 术语库管理
- 多LLM支持

---

### Phase 3: 企业级功能 (4周)

#### Week 13: 用户管理和权限
- [ ] 角色基访问控制（RBAC）
- [ ] 团队共享功能
- [ ] 审计日志

#### Week 14: 订阅和计费
- [ ] 定价层设计（Free/Pro/Enterprise）
- [ ] Stripe 集成
- [ ] 额度管理和限流

#### Week 15: 高级分析
- [ ] 翻译成本分析
- [ ] 使用统计
- [ ] 仪表板

#### Week 16: 部署和优化
- [ ] Docker 容器化
- [ ] K8s 部署配置
- [ ] 监控和告警（Datadog/New Relic）

**交付物**：
- 生产级系统
- 企业级功能完整

---

### 优先级矩阵

```
┌─────────────────────────────────────────────────────────┐
│                   优先级 vs 工作量矩阵                     │
├─────────────────────────────────────────────────────────┤
│                                                    HIGH  │
│                                                   EFFORT │
│                                                         │
│  ┌─────────────┐                   ┌──────────────┐    │
│  │  多LLM支持  │                   │ 企业级权限   │    │
│  │   (中优先)   │                   │  (低优先)    │    │
│  └─────────────┘                   └──────────────┘    │
│                                                         │
│         ┌──────────────────────────────────┐            │
│  LOW    │  文档格式支持  术语库  版本管理  │    LOW     │
│ EFFORT  │      (高优先)   (中)   (中)     │   BENEFIT  │
│         └──────────────────────────────────┘            │
│                                                         │
│  ┌──────────────────┐      ┌──────────────┐            │
│  │ 双栏编辑器UI     │      │  历史记录    │            │
│  │  (最高优先级)     │      │ (中优先级)   │            │
│  │ JWT认证 上传 翻译 │      │              │            │
│  └──────────────────┘      └──────────────┘            │
│                                                         │
└─────────────────────────────────────────────────────────┘
   LOW EFFORT                              HIGH EFFORT
   HIGH BENEFIT                            LOW BENEFIT
```

---

## 技术风险和解决方案

### 1. LLM API 成本风险

**风险**：翻译大量文档导致API成本爆增

**解决方案**：
```typescript
// services/cost-control.service.ts
@Injectable()
export class CostControlService {
  // 1. 缓存翻译结果
  async cacheTranslation(
    sourceText: string,
    targetLanguage: string,
    translation: string
  ) {
    const key = this.hashKey(sourceText, targetLanguage);
    await this.redis.set(key, translation, 7 * 24 * 60 * 60); // 7天
  }

  // 2. 批处理请求（减少API调用次数）
  async batchTranslate(segments: TextSegment[], config: TranslationConfig) {
    // 分组处理，每批最多20个段落
    const batchSize = 20;
    for (let i = 0; i < segments.length; i += batchSize) {
      const batch = segments.slice(i, i + batchSize);
      await this.aiService.translateBatch(batch, config);
    }
  }

  // 3. 配额管理
  async checkQuota(userId: string, provider: string): Promise<boolean> {
    const user = await this.userService.findById(userId);
    const monthlyKey = `${provider}:${new Date().toISOString().slice(0, 7)}`;
    const usage = await this.redis.get(`usage:${userId}:${monthlyKey}`);

    return (usage || 0) < user.monthlyLimit;
  }

  // 4. 成本预估和提示
  async estimateAndWarn(
    segments: TextSegment[],
    provider: string
  ): Promise<EstimatedCost> {
    const estimator = this.getEstimator(provider);
    const totalCost = segments.reduce((sum, seg) =>
      sum + estimator.estimate(seg.sourceText), 0
    );

    if (totalCost > WARNING_THRESHOLD) {
      // 发送通知给用户
      await this.notificationService.sendWarning({
        userId: currentUser.id,
        message: `预估费用 $${totalCost}，是否继续？`,
      });
    }

    return { totalCost, breakdown: estimator.breakdown(segments) };
  }

  // 5. 智能提供商选择
  async selectOptimalProvider(
    segments: TextSegment[],
    preferences: { quality: number; costSensitive: number }
  ): Promise<string> {
    const providers = ['gemini', 'claude', 'gpt4'];

    const scores = providers.map(p => ({
      provider: p,
      cost: this.estimateCost(segments, p),
      quality: this.getQualityScore(p),
      score: this.calculateScore(p, preferences),
    }));

    return scores.sort((a, b) => b.score - a.score)[0].provider;
  }
}
```

### 2. 文档解析失败风险

**风险**：复杂PDF或特殊格式导致解析失败

**解决方案**：
```typescript
// 多策略降级
async parseDocumentWithFallback(
  file: Buffer,
  format: string
): Promise<ParsedDocument> {
  const strategies = [
    new NativeStrategy(),      // 原生解析
    new OCRStrategy(),         // 图文识别（if PDF无可提取文本）
    new ManualReviewStrategy(), // 手动审查队列
  ];

  for (const strategy of strategies) {
    try {
      return await strategy.parse(file, format);
    } catch (error) {
      logger.warn(`Strategy ${strategy.name} failed:`, error);
      continue;
    }
  }

  // 都失败则上报
  throw new DocumentParsingFailedError(file.originalname);
}

// OCR 降级处理
class OCRStrategy {
  async parse(file: Buffer, format: string): Promise<ParsedDocument> {
    if (format !== 'pdf') throw new Error('Only PDF supported');

    // 使用 Tesseract 进行OCR
    const pages = await extractPDFPages(file);
    const textPages = [];

    for (const page of pages) {
      const text = await recognizeText(page);
      textPages.push(text);
    }

    return {
      title: 'OCR Extracted Document',
      content: textPages.join('\n\n'),
      metadata: { extractedViaOCR: true },
    };
  }
}
```

### 3. 翻译质量风险

**风险**：AI翻译存在错误、术语不一致

**解决方案**：
```typescript
// 翻译质量检查
@Injectable()
export class TranslationQualityService {
  // 1. 自动质量评分
  async scoreTranslation(
    sourceText: string,
    targetText: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<QualityScore> {
    const scores = {
      completeness: await this.checkCompleteness(sourceText, targetText),
      terminology: await this.checkTerminologyConsistency(targetText),
      grammar: await this.checkGrammar(targetText, targetLanguage),
      formatting: this.checkFormattingPreservation(sourceText, targetText),
      overall: 0,
    };

    scores.overall = (
      scores.completeness * 0.3 +
      scores.terminology * 0.3 +
      scores.grammar * 0.2 +
      scores.formatting * 0.2
    );

    return scores;
  }

  // 2. 多模型验证
  async validateWithMultipleModels(
    text: string,
    targetLanguage: string
  ): Promise<ValidationResult> {
    const providers = ['gemini', 'claude'];
    const translations = {};

    for (const provider of providers) {
      translations[provider] = await this.aiService.translate(
        text, { provider, targetLanguage }
      );
    }

    // 比较翻译结果的相似度
    const similarity = this.calculateSimilarity(
      translations.gemini,
      translations.claude
    );

    return {
      primaryTranslation: translations.gemini,
      alternativeTranslations: translations,
      confidence: similarity, // 高相似度 = 高置信度
    };
  }

  // 3. 人工审查队列
  async flagForHumanReview(
    segmentId: string,
    reason: string,
    qualityScore: number
  ) {
    if (qualityScore < REVIEW_THRESHOLD) {
      await this.reviewQueueService.add({
        segmentId,
        reason,
        priority: 'high',
      });
    }
  }

  // 4. 用户反馈循环
  async collectFeedback(
    translationId: string,
    segmentId: string,
    feedback: TranslationFeedback
  ) {
    await this.feedbackService.save(feedback);

    // 用于改进提示词
    if (feedback.quality === 'poor') {
      await this.promptOptimizationService.recordFailure(feedback);
    }
  }
}
```

### 4. 并发和扩展性风险

**风险**：高并发翻译请求导致系统过载

**解决方案**：
```typescript
// services/translation-queue.service.ts
@Injectable()
export class TranslationQueueService {
  private queue: BullQueue<TranslationJob>;

  constructor() {
    this.queue = new Queue('translations', {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    });

    // 并发控制：最多同时处理5个
    this.queue.process(5, this.processTranslation.bind(this));
  }

  async submitTranslation(
    taskId: string,
    segments: TextSegment[]
  ): Promise<JobId> {
    return this.queue.add(
      {
        taskId,
        segments,
        priority: this.calculatePriority(segments),
      },
      {
        priority: this.calculatePriority(segments),
        delay: 0,
      }
    );
  }

  private async processTranslation(job: Job<TranslationJob>) {
    // 更新进度
    await job.updateProgress(0);

    const { taskId, segments } = job.data;
    const batchSize = 10;

    for (let i = 0; i < segments.length; i += batchSize) {
      const batch = segments.slice(i, i + batchSize);

      try {
        await this.aiService.translateBatch(batch);

        const progress = Math.min(100, ((i + batchSize) / segments.length) * 100);
        await job.updateProgress(progress);
      } catch (error) {
        throw error; // 自动重试
      }
    }

    return { taskId, status: 'completed' };
  }

  private calculatePriority(segments: TextSegment[]): number {
    // 短文档优先处理
    return segments.length < 100 ? 10 : 5;
  }
}

// 限流
@Injectable()
export class RateLimitingService {
  async checkRateLimit(userId: string, provider: string): Promise<boolean> {
    const key = `ratelimit:${userId}:${provider}`;
    const current = await this.redis.incr(key);

    if (current === 1) {
      // 首次请求，设置过期时间
      await this.redis.expire(key, 60); // 60秒内最多100个请求
    }

    return current <= 100;
  }
}
```

### 5. 数据安全和隐私风险

**风险**：用户文档和翻译内容可能泄露

**解决方案**：
```typescript
// 加密策略
@Injectable()
export class EncryptionService {
  // 敏感数据加密存储
  async encryptSensitiveContent(
    content: string,
    userId: string
  ): Promise<string> {
    const encryptionKey = await this.deriveKeyFromUserId(userId);
    return this.encrypt(content, encryptionKey);
  }

  // 传输加密
  setupTLS() {
    // 所有API使用HTTPS
    // WebSocket使用WSS
  }

  // 审计日志
  async logAccessToDocument(userId: string, documentId: string) {
    await this.auditLogService.log({
      action: 'DOCUMENT_ACCESS',
      userId,
      documentId,
      timestamp: new Date(),
      ipAddress: getClientIp(),
    });
  }
}

// 数据隐私
@Injectable()
export class PrivacyService {
  // 数据最小化
  async getDocumentForTranslation(
    userId: string,
    documentId: string
  ): Promise<DocumentForTranslation> {
    // 只返回必要的字段
    return {
      id: documentId,
      segments: [...],
      // ❌ 不返回：userId, uploadedAt, metadata等非必需字段
    };
  }

  // 定期清理
  async deleteOldTranslationHistory(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await this.historyRepo.delete({
      createdAt: LessThan(cutoffDate),
      visibility: 'private', // 仅删除私有记录
    });
  }

  // GDPR合规
  async exportUserData(userId: string): Promise<UserDataExport> {
    return {
      user: await this.userService.findById(userId),
      documents: await this.documentService.findByUserId(userId),
      translations: await this.translationService.findByUserId(userId),
      terminology: await this.terminologyService.findByUserId(userId),
    };
  }

  async deleteUserData(userId: string) {
    // 级联删除所有用户数据
    await this.userService.delete(userId);
  }
}
```

### 6. 监控和告警

```typescript
// monitoring/metrics.ts
import { Histogram, Counter, Gauge } from 'prom-client';

export const metrics = {
  // 翻译性能
  translationDuration: new Histogram({
    name: 'translation_duration_seconds',
    help: 'Translation processing time',
    buckets: [1, 5, 10, 30, 60],
    labelNames: ['provider', 'language_pair'],
  }),

  // API 延迟
  apiLatency: new Histogram({
    name: 'api_latency_ms',
    help: 'API response time',
    buckets: [10, 50, 100, 500, 1000],
    labelNames: ['endpoint', 'method'],
  }),

  // 错误率
  translationErrors: new Counter({
    name: 'translation_errors_total',
    help: 'Total translation errors',
    labelNames: ['provider', 'error_type'],
  }),

  // 成本追踪
  translationCost: new Counter({
    name: 'translation_cost_total',
    help: 'Total translation cost in USD',
    labelNames: ['provider'],
  }),

  // 并发数
  activeTranslations: new Gauge({
    name: 'active_translations',
    help: 'Currently active translation tasks',
  }),
};

// 告警规则
export const alertRules = [
  {
    name: 'HighErrorRate',
    query: 'rate(translation_errors_total[5m]) > 0.05',
    severity: 'critical',
  },
  {
    name: 'HighLatency',
    query: 'histogram_quantile(0.95, api_latency_ms) > 1000',
    severity: 'warning',
  },
  {
    name: 'HighCost',
    query: 'rate(translation_cost_total[1h]) > 100',
    severity: 'info',
  },
];
```

---

## 总结和建议

### 核心架构优势

✅ **模块化设计**：前后端解耦，便于扩展
✅ **多LLM支持**：灵活选择，成本可控
✅ **可扩展缓存**：Redis缓存减少API调用
✅ **完整权限体系**：支持多租户和团队协作
✅ **生产就绪**：日志、监控、告警完备

### 立即行动项

1. **确认LLM选择**：与团队讨论选择Gemini/Claude/GPT-4
2. **环境准备**：申请GCP/AWS账号，获取API密钥
3. **团队分工**：前端2人、后端2人、DevOps1人
4. **项目管理**：使用GitHub Projects或Jira进行进度追踪

### 技术债务管理

- Week 4: 建立单元测试框架
- Week 8: 性能基准测试
- Week 12: 安全审计
- Week 16: 技术文档完整化

### 下一步

1. 创建 GitHub 项目和Issue模板
2. 建立前后端开发规范文档
3. 准备开发环境和CI/CD流程
4. 进行技术选型最终确认
