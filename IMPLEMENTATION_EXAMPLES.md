# 代码实现示例 - 核心模块参考

## 目录
1. [前端核心组件](#前端核心组件)
2. [后端API路由](#后端api路由)
3. [数据库初始化](#数据库初始化)
4. [环境配置](#环境配置)
5. [部署配置](#部署配置)

---

## 前端核心组件

### 1. DualPaneEditor 完整实现

```typescript
// components/editor/DualPaneEditor.tsx
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslationStore } from '@/store/translation.store';
import { SourcePane } from './SourcePane';
import { TargetPane } from './TargetPane';
import { EditorToolbar } from './EditorToolbar';
import { TranslationStatusBar } from './TranslationStatusBar';
import { Resizer } from './Resizer';

interface DualPaneEditorProps {
  documentId: string;
}

export const DualPaneEditor: React.FC<DualPaneEditorProps> = ({ documentId }) => {
  const [paneWidth, setPaneWidth] = useState(50); // 百分比
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    segments,
    activeSegmentId,
    translationProgress,
    setActiveSegment,
    updateSegment,
  } = useTranslationStore();

  // 双栏同步滚动
  const handleSourceScroll = useCallback((scrollPercentage: number) => {
    // 计算目标栏应该滚动的位置
    const targetPane = document.getElementById('target-pane') as HTMLDivElement;
    if (targetPane) {
      targetPane.scrollTop = (targetPane.scrollHeight - targetPane.clientHeight) * scrollPercentage;
    }
  }, []);

  // 调整栏宽度
  const handleResizerDrag = useCallback((delta: number) => {
    setPaneWidth((prev) => {
      const newWidth = prev + (delta / (containerRef.current?.clientWidth || 1)) * 100;
      return Math.max(20, Math.min(80, newWidth)); // 限制20%-80%
    });
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col h-screen bg-gray-50">
      {/* 工具栏 */}
      <EditorToolbar />

      {/* 主编辑区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 源文本栏 */}
        <div style={{ width: `${paneWidth}%` }} className="border-r">
          <SourcePane
            id="source-pane"
            segments={segments}
            activeSegmentId={activeSegmentId}
            onSegmentClick={(id) => setActiveSegment(id)}
            onScroll={handleSourceScroll}
          />
        </div>

        {/* 调整器 */}
        <Resizer onDrag={handleResizerDrag} />

        {/* 目标文本栏 */}
        <div style={{ width: `${100 - paneWidth}%` }} className="overflow-hidden">
          <TargetPane
            id="target-pane"
            segments={segments}
            activeSegmentId={activeSegmentId}
            onSegmentClick={(id) => setActiveSegment(id)}
            onTranslationChange={(id, text) => updateSegment(id, text)}
          />
        </div>
      </div>

      {/* 状态栏 */}
      <TranslationStatusBar
        total={translationProgress.total}
        completed={translationProgress.completed}
      />
    </div>
  );
};
```

### 2. SourcePane 组件

```typescript
// components/editor/SourcePane.tsx
'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { TranslationSegment } from '@/types';
import { VirtualList } from '@/components/common/VirtualList';

interface SourcePaneProps {
  id: string;
  segments: TranslationSegment[];
  activeSegmentId: string | null;
  onSegmentClick: (id: string) => void;
  onScroll: (percentage: number) => void;
}

export const SourcePane: React.FC<SourcePaneProps> = ({
  id,
  segments,
  activeSegmentId,
  onSegmentClick,
  onScroll,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const maxScroll = scrollHeight - clientHeight;
    const percentage = maxScroll > 0 ? scrollTop / maxScroll : 0;

    onScroll(percentage);
  }, [onScroll]);

  // 当activeSegmentId改变时，自动滚动到该段落
  useEffect(() => {
    if (!activeSegmentId || !scrollRef.current) return;

    const element = document.querySelector(`[data-segment-id="${activeSegmentId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeSegmentId]);

  return (
    <div
      id={id}
      ref={scrollRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto bg-white p-4"
    >
      <VirtualList
        items={segments}
        itemKey={(segment) => segment.id}
        renderItem={(segment) => (
          <div
            key={segment.id}
            data-segment-id={segment.id}
            onClick={() => onSegmentClick(segment.id)}
            className={`mb-4 p-3 rounded cursor-pointer transition-colors ${
              activeSegmentId === segment.id
                ? 'bg-blue-100 border-l-4 border-blue-500'
                : 'hover:bg-gray-100'
            }`}
          >
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {segment.sourceText}
            </p>

            {/* 段落元数据 */}
            {segment.metadata && (
              <div className="mt-2 text-xs text-gray-500">
                <span className="inline-block mr-2 px-2 py-1 bg-gray-200 rounded">
                  {segment.type}
                </span>
                {segment.metadata.locked && (
                  <span className="inline-block px-2 py-1 bg-yellow-100 rounded">
                    🔒 Locked
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        height={800}
        itemHeight={120}
      />
    </div>
  );
};
```

### 3. TargetPane 组件（可编辑）

```typescript
// components/editor/TargetPane.tsx
'use client';

import React, { useCallback, useState } from 'react';
import { TranslationSegment } from '@/types';
import { VirtualList } from '@/components/common/VirtualList';
import { EditableSegment } from './EditableSegment';

interface TargetPaneProps {
  id: string;
  segments: TranslationSegment[];
  activeSegmentId: string | null;
  onSegmentClick: (id: string) => void;
  onTranslationChange: (id: string, text: string) => void;
}

export const TargetPane: React.FC<TargetPaneProps> = ({
  id,
  segments,
  activeSegmentId,
  onSegmentClick,
  onTranslationChange,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      id={id}
      ref={scrollRef}
      className="h-full overflow-y-auto bg-gradient-to-r from-blue-50 to-white p-4"
    >
      <VirtualList
        items={segments}
        itemKey={(segment) => segment.id}
        renderItem={(segment) => (
          <EditableSegment
            key={segment.id}
            segment={segment}
            isActive={activeSegmentId === segment.id}
            isEditing={editingId === segment.id}
            onSegmentClick={() => onSegmentClick(segment.id)}
            onStartEditing={() => setEditingId(segment.id)}
            onFinishEditing={() => setEditingId(null)}
            onTranslationChange={(text) => {
              onTranslationChange(segment.id, text);
              setEditingId(null);
            }}
          />
        )}
        height={800}
        itemHeight={140}
      />
    </div>
  );
};
```

### 4. EditableSegment 子组件

```typescript
// components/editor/EditableSegment.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { TranslationSegment } from '@/types';
import { useTerminologyStore } from '@/store/terminology.store';

interface EditableSegmentProps {
  segment: TranslationSegment;
  isActive: boolean;
  isEditing: boolean;
  onSegmentClick: () => void;
  onStartEditing: () => void;
  onFinishEditing: () => void;
  onTranslationChange: (text: string) => void;
}

export const EditableSegment: React.FC<EditableSegmentProps> = ({
  segment,
  isActive,
  isEditing,
  onSegmentClick,
  onStartEditing,
  onFinishEditing,
  onTranslationChange,
}) => {
  const [text, setText] = useState(segment.targetText);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { getTerminologyForSegment } = useTerminologyStore();

  const terminology = getTerminologyForSegment(segment.id);

  useEffect(() => {
    setText(segment.targetText);
  }, [segment.targetText]);

  return (
    <div
      onClick={onSegmentClick}
      className={`mb-4 p-3 rounded transition-all ${
        isActive ? 'bg-blue-200 border-l-4 border-blue-600 shadow-md' : 'bg-white hover:shadow'
      }`}
    >
      {isEditing ? (
        <div className="space-y-2">
          {/* 编辑框 */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            rows={3}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter translation..."
          />

          {/* 术语提示 */}
          {terminology.length > 0 && (
            <div className="bg-yellow-50 p-2 rounded text-xs">
              <strong>术语建议:</strong>
              <ul className="mt-1 space-y-1">
                {terminology.map((term) => (
                  <li key={term.id} className="text-gray-700">
                    {term.sourceText} → <span className="font-bold text-blue-600">{term.targetText}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI建议 */}
          {segment.metadata?.aiSuggestion && (
            <div className="bg-green-50 p-2 rounded text-xs">
              <strong>AI建议:</strong>
              <p className="text-gray-700 mt-1">{segment.metadata.aiSuggestion}</p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTranslationChange(text);
              }}
              className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setText(segment.targetText);
                onFinishEditing();
              }}
              className="px-3 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div onClick={(e) => { e.stopPropagation(); onStartEditing(); }}>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap hover:bg-blue-50 p-2 rounded cursor-text">
            {text || '(Empty translation)'}
          </p>

          {/* 质量指示 */}
          {segment.metadata?.aiSuggestion && (
            <div className="mt-2 text-xs text-green-600">✓ AI translated</div>
          )}
        </div>
      )}
    </div>
  );
};
```

### 5. Zustand Store 示例

```typescript
// store/translation.store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { TranslationSegment, Document } from '@/types';

interface TranslationState {
  // 状态
  currentDocument: Document | null;
  segments: TranslationSegment[];
  activeSegmentId: string | null;
  isTranslating: boolean;

  // 翻译配置
  sourceLanguage: string;
  targetLanguage: string;
  selectedProvider: 'gemini' | 'claude' | 'gpt4';
  translationStyle: 'formal' | 'casual' | 'technical';

  // 进度
  totalSegments: number;
  translatedSegments: number;

  // 方法
  setDocument: (doc: Document, segments: TranslationSegment[]) => void;
  setActiveSegment: (id: string | null) => void;
  updateSegment: (id: string, translation: string) => void;
  startTranslation: () => void;
  stopTranslation: () => void;
  updateProgress: (translated: number) => void;
  setConfig: (config: Partial<TranslationState>) => void;
}

export const useTranslationStore = create<TranslationState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        currentDocument: null,
        segments: [],
        activeSegmentId: null,
        isTranslating: false,
        sourceLanguage: 'en',
        targetLanguage: 'zh',
        selectedProvider: 'gemini',
        translationStyle: 'formal',
        totalSegments: 0,
        translatedSegments: 0,

        // 操作
        setDocument: (doc, segments) =>
          set({
            currentDocument: doc,
            segments,
            totalSegments: segments.length,
            translatedSegments: 0,
            activeSegmentId: segments[0]?.id || null,
          }),

        setActiveSegment: (id) =>
          set({ activeSegmentId: id }),

        updateSegment: (id, translation) =>
          set((state) => ({
            segments: state.segments.map((s) =>
              s.id === id ? { ...s, targetText: translation } : s
            ),
            translatedSegments:
              state.segments[state.segments.findIndex((s) => s.id === id)]?.targetText
                ? state.translatedSegments
                : state.translatedSegments + 1,
          })),

        startTranslation: () => set({ isTranslating: true }),
        stopTranslation: () => set({ isTranslating: false }),

        updateProgress: (translated) =>
          set({ translatedSegments: translated }),

        setConfig: (config) => set(config),
      }),
      {
        name: 'translation-store',
        partialize: (state) => ({
          sourceLanguage: state.sourceLanguage,
          targetLanguage: state.targetLanguage,
          selectedProvider: state.selectedProvider,
          translationStyle: state.translationStyle,
        }),
      }
    ),
    { name: 'TranslationStore' }
  )
);
```

---

## 后端API路由

### 1. 文档模块 - Controller

```typescript
// src/modules/documents/documents.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto, ParseDocumentDto } from './dto';

@Controller('api/v1/documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // 上传文档
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'text/html',
          'text/markdown',
          'text/plain',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Unsupported file format'), false);
        }
      },
    })
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateDocumentDto,
    @Req() req: any
  ) {
    return this.documentsService.uploadDocument(
      req.user.userId,
      file,
      dto
    );
  }

  // 列表文档
  @Get()
  async listDocuments(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('search') search?: string
  ) {
    return this.documentsService.listDocuments(
      req.user.userId,
      { page, pageSize },
      search
    );
  }

  // 获取文档详情
  @Get(':id')
  async getDocument(
    @Param('id') id: string,
    @Req() req: any
  ) {
    return this.documentsService.getDocument(id, req.user.userId);
  }

  // 获取解析后的内容
  @Get(':id/content')
  async getDocumentContent(
    @Param('id') id: string,
    @Req() req: any
  ) {
    return this.documentsService.getDocumentContent(id, req.user.userId);
  }

  // 重新解析文档
  @Post(':id/parse')
  async parseDocument(
    @Param('id') id: string,
    @Body() dto: ParseDocumentDto,
    @Req() req: any
  ) {
    return this.documentsService.reparseDocument(id, req.user.userId, dto);
  }

  // 更新文档
  @Put(':id')
  async updateDocument(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @Req() req: any
  ) {
    return this.documentsService.updateDocument(id, req.user.userId, dto);
  }

  // 删除文档
  @Delete(':id')
  async deleteDocument(
    @Param('id') id: string,
    @Req() req: any
  ) {
    return this.documentsService.deleteDocument(id, req.user.userId);
  }
}
```

### 2. 文档服务 - Service

```typescript
// src/modules/documents/documents.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Document } from './entities/document.entity';
import { StorageService } from '@/storage/storage.service';
import { DocumentParsingService } from './document-parsing.service';
import { CacheService } from '@/cache/cache.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentRepo: Repository<Document>,
    private storageService: StorageService,
    private parsingService: DocumentParsingService,
    private cacheService: CacheService,
  ) {}

  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    dto: CreateDocumentDto
  ) {
    // 1. 上传文件到存储
    const uploadResult = await this.storageService.upload(file, {
      path: `documents/${userId}`,
      metadata: { userId, originalName: file.originalname },
    });

    // 2. 创建数据库记录
    const document = this.documentRepo.create({
      userId,
      title: dto.title || file.originalname,
      description: dto.description,
      fileUrl: uploadResult.url,
      fileSize: file.size,
      fileFormat: this.getFileFormat(file.mimetype),
      status: 'parsing',
    });

    const saved = await this.documentRepo.save(document);

    // 3. 异步解析文档
    this.parsingService.parseDocument(
      saved.id,
      file.buffer,
      document.fileFormat,
      {
        segmentationStrategy: dto.segmentationStrategy || 'paragraph',
      }
    ).catch((error) => {
      // 更新状态为失败
      this.documentRepo.update(saved.id, {
        status: 'failed',
        errorMessage: error.message,
      });
    });

    return saved;
  }

  async listDocuments(
    userId: string,
    pagination: { page: number; pageSize: number },
    search?: string
  ) {
    const query = this.documentRepo.createQueryBuilder('doc')
      .where('doc.userId = :userId', { userId })
      .andWhere('doc.deletedAt IS NULL');

    if (search) {
      query.andWhere('doc.title LIKE :search', { search: `%${search}%` });
    }

    const [items, total] = await query
      .orderBy('doc.createdAt', 'DESC')
      .skip((pagination.page - 1) * pagination.pageSize)
      .take(pagination.pageSize)
      .getManyAndCount();

    return {
      items,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages: Math.ceil(total / pagination.pageSize),
      },
    };
  }

  async getDocument(id: string, userId: string) {
    const document = await this.documentRepo.findOne({
      where: { id, userId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async getDocumentContent(id: string, userId: string) {
    // 权限检查
    const document = await this.getDocument(id, userId);

    if (document.status !== 'parsed') {
      throw new BadRequestException('Document is still parsing');
    }

    // 从缓存获取
    const cacheKey = `doc:${id}:content`;
    let content = await this.cacheService.get(cacheKey);

    if (!content) {
      content = document.parsedContent;
      await this.cacheService.set(cacheKey, content, 7 * 24 * 60 * 60 * 1000); // 7天
    }

    return content;
  }

  async reparseDocument(
    id: string,
    userId: string,
    dto: ParseDocumentDto
  ) {
    const document = await this.getDocument(id, userId);

    // 更新状态
    await this.documentRepo.update(id, { status: 'parsing' });

    // 清除缓存
    await this.cacheService.del(`doc:${id}:content`);

    // 重新解析
    const file = await this.storageService.download(
      this.extractKeyFromUrl(document.fileUrl)
    );

    this.parsingService.parseDocument(
      id,
      file,
      document.fileFormat,
      {
        segmentationStrategy: dto.segmentationStrategy || 'paragraph',
      }
    );

    return { message: 'Document reparsing started' };
  }

  async updateDocument(
    id: string,
    userId: string,
    dto: UpdateDocumentDto
  ) {
    await this.getDocument(id, userId); // 权限检查

    await this.documentRepo.update(id, dto);

    return this.getDocument(id, userId);
  }

  async deleteDocument(id: string, userId: string) {
    const document = await this.getDocument(id, userId);

    // 软删除
    await this.documentRepo.update(id, {
      deletedAt: new Date(),
    });

    // 异步删除文件
    this.storageService.delete(this.extractKeyFromUrl(document.fileUrl)).catch(
      (error) => console.error('File deletion failed:', error)
    );

    return { message: 'Document deleted' };
  }

  private getFileFormat(mimetype: string): string {
    const mimeToFormat: Record<string, string> = {
      'application/pdf': 'pdf',
      'text/html': 'html',
      'text/markdown': 'markdown',
      'text/plain': 'text',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    };

    return mimeToFormat[mimetype] || 'unknown';
  }

  private extractKeyFromUrl(url: string): string {
    // 从URL提取存储键
    return url.split('/').slice(-1)[0];
  }
}
```

### 3. 翻译模块 - Controller

```typescript
// src/modules/translations/translations.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  UseGuards,
  Body,
  Req,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { TranslationsService } from './translations.service';
import { CreateTranslationDto, UpdateSegmentDto } from './dto';

@Controller('api/v1/translations')
@UseGuards(JwtAuthGuard)
export class TranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  // 创建翻译任务
  @Post()
  async createTranslation(
    @Body() dto: CreateTranslationDto,
    @Req() req: any
  ) {
    return this.translationsService.createTranslation(req.user.userId, dto);
  }

  // 列表翻译任务
  @Get()
  async listTranslations(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20
  ) {
    return this.translationsService.listTranslations(
      req.user.userId,
      { page, pageSize }
    );
  }

  // 获取翻译任务详情
  @Get(':id')
  async getTranslation(
    @Param('id') id: string,
    @Req() req: any
  ) {
    return this.translationsService.getTranslation(id, req.user.userId);
  }

  // 更新单个段落
  @Put(':id/segment')
  async updateSegment(
    @Param('id') id: string,
    @Body() dto: UpdateSegmentDto,
    @Req() req: any
  ) {
    return this.translationsService.updateSegment(id, req.user.userId, dto);
  }

  // 实时翻译流 (SSE)
  @Sse(':id/stream')
  streamTranslation(
    @Param('id') id: string,
    @Req() req: any
  ): Observable<MessageEvent> {
    return this.translationsService.getTranslationStream(id, req.user.userId);
  }

  // 导出翻译结果
  @Post(':id/export')
  async exportTranslation(
    @Param('id') id: string,
    @Query('format') format: 'pdf' | 'docx' | 'markdown',
    @Req() req: any
  ) {
    return this.translationsService.exportTranslation(id, req.user.userId, format);
  }
}
```

### 4. 翻译服务 - Service

```typescript
// src/modules/translations/translations.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject, Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { TranslationTask } from './entities/translation-task.entity';
import { TranslationSegment } from './entities/translation-segment.entity';
import { AITranslationService } from '@/ai/ai-translation.service';
import { DocumentsService } from '@/documents/documents.service';
import { QueueService } from '@/queue/queue.service';

@Injectable()
export class TranslationsService {
  private translationStreams: Map<string, Subject<MessageEvent>> = new Map();

  constructor(
    @InjectRepository(TranslationTask)
    private taskRepo: Repository<TranslationTask>,
    @InjectRepository(TranslationSegment)
    private segmentRepo: Repository<TranslationSegment>,
    private aiService: AITranslationService,
    private documentsService: DocumentsService,
    private queueService: QueueService,
  ) {}

  async createTranslation(
    userId: string,
    dto: CreateTranslationDto
  ): Promise<TranslationTask> {
    // 1. 验证文档存在且属于当前用户
    const document = await this.documentsService.getDocument(dto.documentId, userId);

    if (document.status !== 'parsed') {
      throw new BadRequestException('Document must be parsed first');
    }

    // 2. 获取文档内容
    const content = await this.documentsService.getDocumentContent(dto.documentId, userId);

    // 3. 创建翻译任务
    const task = this.taskRepo.create({
      userId,
      documentId: dto.documentId,
      sourceLanguage: content.language,
      targetLanguage: dto.targetLanguage,
      aiProvider: dto.aiProvider,
      aiModel: dto.aiModel,
      translationStyle: dto.translationStyle,
      customInstructions: dto.customInstructions,
      terminologyBaseId: dto.terminologyBaseId,
      status: 'pending',
      totalSegments: content.segments.length,
    });

    const savedTask = await this.taskRepo.save(task);

    // 4. 创建翻译段落记录
    const segments = content.segments.map((seg, index) =>
      this.segmentRepo.create({
        taskId: savedTask.id,
        documentId: dto.documentId,
        segmentIndex: index,
        sourceText: seg.sourceText,
        segmentType: seg.type,
      })
    );

    await this.segmentRepo.save(segments);

    // 5. 估计成本
    const costEstimate = await this.aiService.estimateCost(
      content.segments,
      dto.aiProvider
    );

    await this.taskRepo.update(savedTask.id, {
      estimatedCost: costEstimate.total,
    });

    // 6. 提交到队列处理
    this.queueService.submitTranslationJob({
      taskId: savedTask.id,
      segments: content.segments,
      config: {
        targetLanguage: dto.targetLanguage,
        provider: dto.aiProvider,
        model: dto.aiModel,
        translationStyle: dto.translationStyle,
        terminologyBaseId: dto.terminologyBaseId,
      },
    });

    return this.getTranslation(savedTask.id, userId);
  }

  async updateSegment(
    taskId: string,
    userId: string,
    dto: UpdateSegmentDto
  ) {
    // 权限检查
    const task = await this.taskRepo.findOne({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException('Translation task not found');
    }

    // 更新段落
    const segment = await this.segmentRepo.findOne({
      where: { id: dto.segmentId, taskId },
    });

    if (!segment) {
      throw new NotFoundException('Segment not found');
    }

    segment.targetText = dto.targetText;
    segment.editedByUser = true;
    segment.editedAt = new Date();

    if (!segment.editHistory) {
      segment.editHistory = [];
    }

    segment.editHistory.push({
      timestamp: new Date(),
      previousText: segment.targetText,
      newText: dto.targetText,
    });

    await this.segmentRepo.save(segment);

    return segment;
  }

  getTranslationStream(
    taskId: string,
    userId: string
  ): Observable<MessageEvent> {
    // 检查权限
    const task = await this.taskRepo.findOne({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException('Translation task not found');
    }

    // 创建或获取现有Stream
    let stream = this.translationStreams.get(taskId);

    if (!stream) {
      stream = new Subject<MessageEvent>();
      this.translationStreams.set(taskId, stream);

      // 开始实时翻译
      this.processTranslationStream(taskId, stream);
    }

    return stream.asObservable();
  }

  private async processTranslationStream(
    taskId: string,
    stream: Subject<MessageEvent>
  ) {
    try {
      const task = await this.taskRepo.findOne({ where: { id: taskId } });
      const segments = await this.segmentRepo.find({
        where: { taskId },
        order: { segmentIndex: 'ASC' },
      });

      let translatedCount = 0;

      for (const segment of segments) {
        // 流式翻译单个段落
        let fullText = '';

        for await (const chunk of this.aiService.translateStream(segment, {
          targetLanguage: task.targetLanguage,
          provider: task.aiProvider,
          model: task.aiModel,
          translationStyle: task.translationStyle,
        })) {
          fullText += chunk;

          // 发送数据到客户端
          stream.next({
            data: {
              segmentId: segment.id,
              chunk,
              fullText,
              progress: {
                current: translatedCount,
                total: segments.length,
              },
            },
          } as MessageEvent);
        }

        // 保存翻译结果
        segment.targetText = fullText;
        await this.segmentRepo.save(segment);

        translatedCount++;

        // 更新任务进度
        await this.taskRepo.update(taskId, {
          translatedSegments: translatedCount,
          progressPercentage: (translatedCount / segments.length) * 100,
        });
      }

      // 标记完成
      await this.taskRepo.update(taskId, {
        status: 'completed',
        completedAt: new Date(),
      });

      stream.complete();
      this.translationStreams.delete(taskId);
    } catch (error) {
      stream.error(error);
      this.translationStreams.delete(taskId);
    }
  }

  async getTranslation(
    id: string,
    userId: string
  ): Promise<TranslationTask> {
    const task = await this.taskRepo.findOne({
      where: { id, userId },
      relations: ['segments'],
    });

    if (!task) {
      throw new NotFoundException('Translation task not found');
    }

    return task;
  }

  async listTranslations(
    userId: string,
    pagination: { page: number; pageSize: number }
  ) {
    const [items, total] = await this.taskRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    });

    return {
      items,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages: Math.ceil(total / pagination.pageSize),
      },
    };
  }

  async exportTranslation(
    id: string,
    userId: string,
    format: 'pdf' | 'docx' | 'markdown'
  ) {
    const task = await this.getTranslation(id, userId);
    const segments = await this.segmentRepo.find({
      where: { taskId: id },
      order: { segmentIndex: 'ASC' },
    });

    let content: string;

    switch (format) {
      case 'markdown':
        content = this.formatAsMarkdown(segments);
        break;
      case 'docx':
        return await this.formatAsDocx(segments);
      case 'pdf':
        return await this.formatAsPdf(segments);
      default:
        throw new BadRequestException('Unsupported format');
    }

    return content;
  }

  private formatAsMarkdown(segments: TranslationSegment[]): string {
    return segments
      .map((seg) => `\n${seg.targetText}`)
      .join('\n\n');
  }

  private async formatAsDocx(segments: TranslationSegment[]) {
    // 使用 docx 库生成Word文档
    // ... 实现细节
  }

  private async formatAsPdf(segments: TranslationSegment[]) {
    // 使用 pdf-lib 生成PDF
    // ... 实现细节
  }
}
```

---

## 数据库初始化

### 1. TypeORM Migration 脚本

```typescript
// src/database/migrations/1_initial_schema.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitialSchema1704067200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // 创建users表
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'subscription_tier',
            type: 'varchar',
            default: "'free'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          new TableIndex({
            name: 'idx_users_email',
            columnNames: ['email'],
          }),
        ],
      })
    );

    // 创建documents表
    await queryRunner.createTable(
      new Table({
        name: 'documents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'file_url',
            type: 'text',
          },
          {
            name: 'file_format',
            type: 'varchar',
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'uploaded'",
          },
          {
            name: 'parsed_content',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      })
    );

    // 创建translation_tasks表
    await queryRunner.createTable(
      new Table({
        name: 'translation_tasks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'document_id',
            type: 'uuid',
          },
          {
            name: 'source_language',
            type: 'varchar',
          },
          {
            name: 'target_language',
            type: 'varchar',
          },
          {
            name: 'ai_provider',
            type: 'varchar',
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'pending'",
          },
          {
            name: 'total_segments',
            type: 'int',
          },
          {
            name: 'translated_segments',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['document_id'],
            referencedTableName: 'documents',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      })
    );

    // 创建translation_segments表
    await queryRunner.createTable(
      new Table({
        name: 'translation_segments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'task_id',
            type: 'uuid',
          },
          {
            name: 'segment_index',
            type: 'int',
          },
          {
            name: 'source_text',
            type: 'text',
          },
          {
            name: 'target_text',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'segment_type',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['task_id'],
            referencedTableName: 'translation_tasks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          new TableIndex({
            name: 'idx_translation_segments_task',
            columnNames: ['task_id', 'segment_index'],
            isUnique: true,
          }),
        ],
      })
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('translation_segments');
    await queryRunner.dropTable('translation_tasks');
    await queryRunner.dropTable('documents');
    await queryRunner.dropTable('users');
  }
}
```

### 2. 数据库配置

```typescript
// src/database/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export function getDatabaseConfig(configService: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USER', 'postgres'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME', 'ai_translator'),
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    migrations: [__dirname + '/../migrations/*.{js,ts}'],
    migrationsRun: true,
    synchronize: false,
    logging: configService.get('NODE_ENV') === 'development',
  };
}
```

---

## 环境配置

### 1. .env.example

```bash
# 服务器配置
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=ai_translator

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/oauth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/oauth/github/callback

# 文件存储
STORAGE_PROVIDER=gcs  # gcs或s3
GCS_PROJECT_ID=your-project-id
GCS_KEY_FILE=/path/to/service-account-key.json
GCS_BUCKET=ai-translator-documents

# 或使用 S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=us-east-1

# AI服务商
GEMINI_API_KEY=your-gemini-api-key
CLAUDE_API_KEY=your-claude-api-key
OPENAI_API_KEY=your-openai-api-key

# 监控和日志
LOG_LEVEL=info
SENTRY_DSN=
DATADOG_API_KEY=

# 功能特性
ENABLE_MULTI_LANGUAGE=true
ENABLE_TERMINOLOGY_MATCHING=true
ENABLE_USER_FEEDBACK=true
```

### 2. 配置加载

```typescript
// src/config/configuration.ts
export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV,
    port: parseInt(process.env.PORT || '3000', 10),
    apiUrl: process.env.API_URL,
    frontendUrl: process.env.FRONTEND_URL,
  },
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRATION || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackUrl: process.env.GITHUB_CALLBACK_URL,
    },
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'gcs',
    gcs: {
      projectId: process.env.GCS_PROJECT_ID,
      keyFile: process.env.GCS_KEY_FILE,
      bucket: process.env.GCS_BUCKET,
    },
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
    },
  },
  aiProviders: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  },
});
```

---

## 部署配置

### 1. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
      POSTGRES_DB: ai_translator
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: development
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: postgres123
      DB_NAME: ai_translator
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run start:dev

  frontend:
    build: ./frontend
    ports:
      - '3001:3000'
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
  redis_data:
```

### 2. Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-translator-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-translator-api
  template:
    metadata:
      labels:
        app: ai-translator-api
    spec:
      containers:
      - name: api
        image: ai-translator:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: ai-translator-api
spec:
  selector:
    app: ai-translator-api
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 3. GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Run tests
      run: npm run test:cov
      env:
        DB_HOST: localhost
        DB_USER: postgres
        DB_PASSWORD: postgres

    - name: Upload coverage
      uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
    - uses: actions/checkout@v3
    - uses: docker/setup-buildx-action@v2
    - uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
        cache-from: type=registry,ref=ghcr.io/${{ github.repository }}:buildcache
        cache-to: type=registry,ref=ghcr.io/${{ github.repository }}:buildcache,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - name: Deploy to production
      run: |
        # 部署脚本
        kubectl set image deployment/ai-translator-api \
          api=ghcr.io/${{ github.repository }}:${{ github.sha }} \
          -n production
```

---

## 快速开发指南

### 本地开发启动

```bash
# 1. 克隆项目
git clone https://github.com/your-org/ai-translator.git
cd ai-translator

# 2. 启动Docker Compose
docker-compose up -d

# 3. 等待服务就绪
docker-compose ps

# 4. 运行数据库迁移
docker-compose exec backend npm run migration:run

# 5. 启动前端（新终端）
cd frontend
npm install
npm run dev

# 6. 访问应用
# 前端: http://localhost:3001
# API: http://localhost:3000
# 数据库: localhost:5432
# Redis: localhost:6379
```

### 构建项目镜像

```bash
# 后端
docker build -t ai-translator-api:latest ./backend

# 前端
docker build -t ai-translator-web:latest ./frontend

# 推送到Docker Hub
docker push your-registry/ai-translator-api:latest
docker push your-registry/ai-translator-web:latest
```

