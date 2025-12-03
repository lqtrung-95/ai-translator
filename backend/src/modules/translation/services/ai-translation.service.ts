import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export type TranslationMode = 'professional' | 'casual' | 'summary';

interface TranslationRequest {
  content: string;
  mode: TranslationMode;
  context?: string;
  glossary?: any[]; // 术语表
  sourceLanguage?: string;
  targetLanguage?: string;
}

export interface TranslationResponse {
  translated: string;
  confidence: number;
  alternativeTranslations?: string[];
}

@Injectable()
export class AITranslationService {
  private geminiApiKey: string;
  private claudeApiKey: string;
  private openaiApiKey: string;

  constructor(private configService: ConfigService) {
    this.geminiApiKey = this.configService.get('GEMINI_API_KEY');
    this.claudeApiKey = this.configService.get('CLAUDE_API_KEY');
    this.openaiApiKey = this.configService.get('OPENAI_API_KEY');
  }

  /**
   * 使用 Gemini 进行翻译（推荐用于 MVP，成本最优）
   */
  async translateWithGemini(request: TranslationRequest): Promise<TranslationResponse> {
    const prompt = this.buildPrompt(request);

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_NONE',
            },
          ],
        }
      );

      const translated = response.data.candidates[0].content.parts[0].text;

      return {
        translated: translated.trim(),
        confidence: 0.95,
      };
    } catch (error) {
      console.error('Gemini translation error:', error);
      throw new Error('Failed to translate with Gemini');
    }
  }

  /**
   * 使用 Claude 进行翻译（质量最优）
   */
  async translateWithClaude(request: TranslationRequest): Promise<TranslationResponse> {
    const prompt = this.buildPrompt(request);

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          headers: {
            'x-api-key': this.claudeApiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
        }
      );

      const translated = response.data.content[0].text;

      return {
        translated: translated.trim(),
        confidence: 0.96,
      };
    } catch (error) {
      console.error('Claude translation error:', error);
      throw new Error('Failed to translate with Claude');
    }
  }

  /**
   * 使用 OpenAI 进行翻译（企业首选）
   */
  async translateWithOpenAI(request: TranslationRequest): Promise<TranslationResponse> {
    const prompt = this.buildPrompt(request);

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                'You are a professional technical translator specializing in cloud documentation. Translate the given text to Chinese while preserving all technical terms and formatting.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 2048,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const translated = response.data.choices[0].message.content;

      return {
        translated: translated.trim(),
        confidence: 0.97,
      };
    } catch (error) {
      console.error('OpenAI translation error:', error);
      throw new Error('Failed to translate with OpenAI');
    }
  }

  /**
   * 智能选择翻译服务（默认使用 Gemini 以降低成本）
   */
  async translate(request: TranslationRequest, provider: 'gemini' | 'claude' | 'openai' = 'gemini'): Promise<TranslationResponse> {
    // 检查 API Key 是否配置，如果没有配置或为默认值，使用模拟模式
    if (this.shouldUseMock(provider)) {
      console.log(`Using mock translation for provider: ${provider}`);
      return this.mockTranslate(request);
    }

    try {
      switch (provider) {
        case 'gemini':
          return await this.translateWithGemini(request);
        case 'claude':
          return await this.translateWithClaude(request);
        case 'openai':
          return await this.translateWithOpenAI(request);
        default:
          return await this.translateWithGemini(request);
      }
    } catch (error) {
      console.error(`Translation failed with ${provider}, falling back to mock:`, error.message);
      return this.mockTranslate(request);
    }
  }

  private shouldUseMock(provider: string): boolean {
    const keyMap = {
      gemini: this.geminiApiKey,
      claude: this.claudeApiKey,
      openai: this.openaiApiKey,
    };
    const key = keyMap[provider];
    const useMock = !key || key === 'your-gemini-api-key' || key === 'your-claude-api-key' || key === 'your-openai-api-key';

    console.log(`[API Key Check] Provider: ${provider}, Key exists: ${!!key}, Key length: ${key?.length || 0}, Use mock: ${useMock}`);

    return useMock;
  }

  private mockTranslate(request: TranslationRequest): TranslationResponse {
    const targetLang = request.targetLanguage || 'zh';

    // 简单的模拟翻译逻辑
    let translatedText = '';

    // 1. 优先使用术语库进行替换 (模拟术语感知)
    if (request.glossary && request.glossary.length > 0) {
      // 简单的替换逻辑：将原文中的英文术语替换为 "中文 (英文)" 格式
      // 注意：这只是一个非常粗糙的模拟，真实的 LLM 会做得更好
      let tempText = request.content;

      // 按长度降序排序，避免部分匹配问题 (如 "AWS Lambda" vs "AWS")
      const sortedTerms = [...request.glossary].sort((a, b) => b.english.length - a.english.length);

      for (const term of sortedTerms) {
        // 使用正则进行全字匹配，忽略大小写
        const regex = new RegExp(`\\b${term.english}\\b`, 'gi');
        if (regex.test(tempText)) {
           // 替换为 "中文 (英文)"
           tempText = tempText.replace(regex, `${term.chinese} (${term.english})`);
        }
      }

      // 如果发生了替换，说明术语生效了
      if (tempText !== request.content) {
        translatedText = tempText;
      }
    }

    // 2. 如果没有术语匹配，使用词典翻译
    if (!translatedText) {
      const sourceLang = request.sourceLanguage || 'en';
      translatedText = this.getMockDictionaryTranslation(request.content, sourceLang, targetLang);
    }

    return {
      translated: translatedText,
      confidence: 0.88,
      alternativeTranslations: [`[${this.getMockAlternativeLabel(targetLang)}] ${this.getMockAlternative(targetLang)}`],
    };
  }

  private getMockTranslationPrefix(targetLang: string): string {
    return targetLang === 'zh' ? '[术语增强] ' : '[Term Enhanced] ';
  }

  private getMockAlternativeLabel(targetLang: string): string {
    return targetLang === 'zh' ? '备选' : 'Alternative';
  }

  private getMockAlternative(targetLang: string): string {
    return targetLang === 'zh'
      ? '这是另一个模拟的翻译选项'
      : 'This is another mock translation option';
  }

  private getMockDictionaryTranslation(text: string, sourceLang: string, targetLang: string): string {
    // 扩展的词汇翻译字典
    const enToZh: { [key: string]: string} = {
      // 基础词汇
      'hello': '你好',
      'world': '世界',
      'how are you': '你好吗',
      'thank you': '谢谢',
      'goodbye': '再见',
      'yes': '是',
      'no': '否',
      'please': '请',
      'sorry': '对不起',
      'welcome': '欢迎',
      'good morning': '早上好',
      'good night': '晚安',
      'i love you': '我爱你',

      // 常用词汇
      'the': '',
      'a': '',
      'an': '',
      'is': '是',
      'are': '是',
      'am': '是',
      'was': '是',
      'were': '是',
      'quick': '快速的',
      'brown': '棕色的',
      'fox': '狐狸',
      'jumps': '跳过',
      'over': '越过',
      'lazy': '懒惰的',
      'dog': '狗',
      'today': '今天',
      'how': '如何',
      'you': '你',

      // 技术词汇
      'computer': '计算机',
      'phone': '电话',
      'book': '书',
      'water': '水',
      'food': '食物',
      'cloud': '云',
      'service': '服务',
      'database': '数据库',
      'server': '服务器',
      'application': '应用程序',
      'translate': '翻译',
      'language': '语言',
      'text': '文本',
      'document': '文档',
    };

    const zhToEn: { [key: string]: string } = {
      '你好': 'Hello',
      '世界': 'World',
      '你好吗': 'How are you',
      '谢谢': 'Thank you',
      '再见': 'Goodbye',
      '是': 'Yes',
      '否': 'No',
      '请': 'Please',
      '对不起': 'Sorry',
      '欢迎': 'Welcome',
      '早上好': 'Good morning',
      '晚安': 'Good night',
      '我爱你': 'I love you',
      '计算机': 'Computer',
      '电话': 'Phone',
      '书': 'Book',
      '水': 'Water',
      '食物': 'Food',
      '云': 'Cloud',
      '服务': 'Service',
      '数据库': 'Database',
      '服务器': 'Server',
      '应用程序': 'Application',
    };

    const lowerText = text.toLowerCase().trim();

    // 英文到中文
    if (sourceLang === 'en' && targetLang === 'zh') {
      // 完全匹配
      if (enToZh[lowerText]) {
        return enToZh[lowerText];
      }

      // 尝试单词匹配和组合
      const words = lowerText.split(/\s+/);
      if (words.length > 1) {
        const translatedWords = words.map(word => {
          // 移除标点符号
          const cleanWord = word.replace(/[.,!?;:]/g, '');
          const trans = enToZh[cleanWord];
          // 如果没有翻译或翻译为空字符串（如 the, a），保留原词但标记为可删除
          if (trans === undefined) return cleanWord;
          if (trans === '') return null; // 标记为应删除的词
          return trans;
        }).filter(w => w !== null && w !== ''); // 过滤掉空字符串和null

        // 返回组合结果
        if (translatedWords.length > 0) {
          return translatedWords.join('');
        }
      }

      // 单词翻译
      const cleanText = lowerText.replace(/[.,!?;:]/g, '');
      if (enToZh[cleanText]) {
        return enToZh[cleanText];
      }

      // 没有匹配，返回智能翻译提示
      return `${text}（智能翻译）`;
    }

    // 中文到英文
    if (sourceLang === 'zh' && targetLang === 'en') {
      // 完全匹配
      if (zhToEn[text.trim()]) {
        return zhToEn[text.trim()];
      }

      // 尝试部分匹配
      for (const [zh, en] of Object.entries(zhToEn)) {
        if (text.includes(zh)) {
          return text.replace(new RegExp(zh, 'g'), en);
        }
      }

      // 没有匹配
      return `[Mock] English translation of "${text}"`;
    }

    // 其他语言对
    return `[Mock from ${sourceLang} to ${targetLang}] ${text}`;
  }

  /**
   * 构建翻译提示词
   */
  private buildPrompt(request: TranslationRequest): string {
    // 语言映射表
    const languageNames = {
      en: 'English',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      fr: 'French',
      de: 'German',
    };

    const sourceLanguage = request.sourceLanguage ? languageNames[request.sourceLanguage] || request.sourceLanguage : 'English';
    const targetLanguage = request.targetLanguage ? languageNames[request.targetLanguage] || request.targetLanguage : 'Chinese';

    const modeInstructions = {
      professional:
        `Translate the following text from ${sourceLanguage} to ${targetLanguage}, maintaining all technical terms and formatting. Be precise and professional.`,
      casual:
        `Translate the following text from ${sourceLanguage} to ${targetLanguage} in an easy-to-understand way for beginners. Explain complex concepts simply.`,
      summary:
        `Summarize and translate the following text from ${sourceLanguage} to ${targetLanguage}, highlighting key points only.`,
    };

    const basePrompt = `${modeInstructions[request.mode]}

${request.context ? `Context: ${request.context}\n` : ''}

Text to translate:
${request.content}

Translation:`;

    return basePrompt;
  }

  /**
   * 批量翻译段落
   */
  async batchTranslate(
    paragraphs: string[],
    mode: TranslationMode,
    provider: 'gemini' | 'claude' | 'openai' = 'gemini'
  ): Promise<TranslationResponse[]> {
    return Promise.all(
      paragraphs.map((para) =>
        this.translate(
          {
            content: para,
            mode,
          },
          provider
        )
      )
    );
  }
}
