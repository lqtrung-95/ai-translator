import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TranslationDocument } from './entities/translation-document.entity';
import { TranslationParagraph } from './entities/translation-paragraph.entity';
import { AITranslationService, TranslationMode } from './services/ai-translation.service';
import { CreateTranslationDto, UpdateTranslationDto } from './dto/translation.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TranslationService {
  constructor(
    @InjectRepository(TranslationDocument)
    private documentRepository: Repository<TranslationDocument>,
    @InjectRepository(TranslationParagraph)
    private paragraphRepository: Repository<TranslationParagraph>,
    private aiTranslationService: AITranslationService
  ) {}

  /**
   * 创建翻译任务
   */
  async createTranslation(userId: string, dto: CreateTranslationDto): Promise<TranslationDocument> {
    const document = this.documentRepository.create({
      id: uuidv4(),
      userId,
      title: dto.title,
      sourceUrl: dto.sourceUrl,
      sourceLanguage: dto.sourceLanguage || 'en',
      targetLanguage: dto.targetLanguage || 'zh',
      sourceFormat: dto.sourceFormat || 'url',
      status: 'pending',
      metadata: dto.metadata || {},
      totalParagraphs: dto.paragraphs?.length || 0,
    });

    const savedDocument = await this.documentRepository.save(document);

    // 如果提供了段落，保存段落
    if (dto.paragraphs && dto.paragraphs.length > 0) {
      const paragraphs = dto.paragraphs.map((para, index) => {
        const paragraph = new TranslationParagraph();
        paragraph.id = uuidv4();
        paragraph.documentId = savedDocument.id;
        paragraph.order = index;
        paragraph.type = (para.type || 'paragraph') as any;
        paragraph.original = para.original;
        paragraph.translationStatus = 'pending';
        paragraph.glossaryTerms = para.glossaryTerms || [];
        return paragraph;
      });

      await this.paragraphRepository.save(paragraphs);
      savedDocument.paragraphs = paragraphs;
    }

    return savedDocument;
  }

  /**
   * 获取文档
   */
  async getDocument(id: string, userId: string): Promise<TranslationDocument> {
    const document = await this.documentRepository.findOne({
      where: { id, userId },
      relations: ['paragraphs'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  /**
   * 获取用户的所有文档
   */
  async getUserDocuments(userId: string, limit: number = 20, offset: number = 0) {
    return this.documentRepository.find({
      where: { userId },
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 翻译单个段落
   */
  async translateParagraph(
    documentId: string,
    paragraphId: string,
    mode: TranslationMode = 'professional',
    provider: 'gemini' | 'claude' | 'openai' = 'gemini'
  ): Promise<TranslationParagraph> {
    const paragraph = await this.paragraphRepository.findOne({
      where: { id: paragraphId, documentId },
    });

    if (!paragraph) {
      throw new NotFoundException('Paragraph not found');
    }

    // 跳过代码块和表格
    if (['code', 'table'].includes(paragraph.type)) {
      paragraph.translated = paragraph.original;
      paragraph.translationStatus = 'completed';
      return this.paragraphRepository.save(paragraph);
    }

    paragraph.translationStatus = 'translating';
    await this.paragraphRepository.save(paragraph);

    try {
      const result = await this.aiTranslationService.translate(
        {
          content: paragraph.original,
          mode,
        },
        provider
      );

      paragraph.translated = result.translated;
      paragraph.confidence = result.confidence;
      paragraph.translationStatus = 'completed';
    } catch (error) {
      paragraph.translationStatus = 'error';
      console.error('Translation error:', error);
    }

    return this.paragraphRepository.save(paragraph);
  }

  /**
   * 翻译整个文档
   */
  async translateDocument(
    documentId: string,
    userId: string,
    mode: TranslationMode = 'professional',
    provider: 'gemini' | 'claude' | 'openai' = 'gemini'
  ): Promise<TranslationDocument> {
    const document = await this.getDocument(documentId, userId);

    // 更新状态为处理中
    document.status = 'processing';
    await this.documentRepository.save(document);

    // 翻译所有段落
    const translationPromises = document.paragraphs.map((para) =>
      this.translateParagraph(documentId, para.id, mode, provider)
    );

    const translatedParagraphs = await Promise.all(translationPromises);

    // 更新文档状态
    document.status = 'completed';
    document.translatedParagraphs = translatedParagraphs.filter(
      (p) => p.translationStatus === 'completed'
    ).length;
    document.paragraphs = translatedParagraphs;

    return this.documentRepository.save(document);
  }

  /**
   * 更新译文
   */
  async updateTranslation(
    documentId: string,
    paragraphId: string,
    dto: UpdateTranslationDto,
    userId: string
  ): Promise<TranslationParagraph> {
    const document = await this.getDocument(documentId, userId);
    const paragraph = document.paragraphs.find((p) => p.id === paragraphId);

    if (!paragraph) {
      throw new NotFoundException('Paragraph not found');
    }

    if (dto.translated) {
      paragraph.translated = dto.translated;
    }
    if (dto.notes) {
      paragraph.notes = dto.notes;
    }

    return this.paragraphRepository.save(paragraph);
  }

  /**
   * 删除文档
   */
  async deleteDocument(id: string, userId: string): Promise<void> {
    const document = await this.getDocument(id, userId);
    await this.documentRepository.remove(document);
  }
}
