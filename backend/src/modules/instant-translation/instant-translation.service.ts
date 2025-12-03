import { Injectable } from '@nestjs/common';
import {
  AITranslationService,
  TranslationMode,
  TranslationResponse,
} from '../translation/services/ai-translation.service';
import { GlossaryService } from '../glossary/glossary.service';

interface InstantTranslationOptions {
  text: string;
  mode?: TranslationMode;
  provider?: 'gemini' | 'claude' | 'openai';
  context?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
}

@Injectable()
export class InstantTranslationService {
  constructor(
    private readonly aiTranslationService: AITranslationService,
    private readonly glossaryService: GlossaryService,
  ) {}

  async translate(options: InstantTranslationOptions): Promise<TranslationResponse> {
    let relevantTerms = [];
    let glossaryContext = '';

    try {
      // 1. 尝试获取术语（如果数据库可用）
      const { terms } = await this.glossaryService.findAll(1000, 0);

      // 2. 筛选出原文中出现的术语
      relevantTerms = terms.filter(term =>
        options.text.toLowerCase().includes(term.english.toLowerCase())
      );

      // 3. 构建术语上下文
      if (relevantTerms.length > 0) {
        glossaryContext = 'Glossary Terms (Must use these translations):\n' +
          relevantTerms.map(t => `- ${t.english}: ${t.chinese}`).join('\n');
      }
    } catch (error) {
      // 如果数据库不可用，继续翻译但不使用术语
      console.log('Glossary service unavailable, continuing without terms');
    }

    // 4. 合并上下文
    const fullContext = options.context
      ? `${options.context}\n\n${glossaryContext}`
      : glossaryContext;

    const result = await this.aiTranslationService.translate(
      {
        content: options.text,
        mode: options.mode || 'professional',
        context: fullContext,
        glossary: relevantTerms, // 传递给 Service 以便 Mock 模式使用
        sourceLanguage: options.sourceLanguage,
        targetLanguage: options.targetLanguage,
      },
      options.provider || 'gemini'
    );

    return result;
  }
}
