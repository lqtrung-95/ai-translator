import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

type TranslationMode = 'professional' | 'casual' | 'summary';

interface TranslationRequest {
  text: string;
  mode?: TranslationMode;
  provider?: 'groq' | 'gemini' | 'claude' | 'openai';
  sourceLanguage?: string;
  targetLanguage?: string;
  context?: string;
}

interface TranslationResponse {
  translated: string;
  confidence: number;
  provider: string;
  alternativeTranslations?: string[];
}

interface GlossaryTerm {
  english: string;
  chinese: string;
}

// Fallback glossary terms if DB unavailable
const fallbackGlossaryTerms: GlossaryTerm[] = [
  { english: 'EC2 (Elastic Compute Cloud)', chinese: '弹性计算云' },
  { english: 'S3 (Simple Storage Service)', chinese: '简单存储服务' },
  { english: 'AWS Lambda', chinese: 'AWS Lambda' },
  { english: 'RDS (Relational Database Service)', chinese: '关系数据库服务' },
  { english: 'VPC (Virtual Private Cloud)', chinese: '虚拟私有云' },
  { english: 'IAM (Identity and Access Management)', chinese: '身份与访问管理' },
  { english: 'CloudFront', chinese: 'CloudFront' },
  { english: 'DynamoDB', chinese: 'DynamoDB' },
  { english: 'CloudWatch', chinese: 'CloudWatch' },
  { english: 'CloudFormation', chinese: 'CloudFormation' },
  { english: 'Compute Engine', chinese: '计算引擎' },
  { english: 'Cloud Storage', chinese: '云存储' },
  { english: 'BigQuery', chinese: 'BigQuery' },
  { english: 'GKE (Google Kubernetes Engine)', chinese: 'Google Kubernetes Engine' },
  { english: 'Load Balancer', chinese: '负载均衡器' },
  { english: 'Auto Scaling', chinese: '自动伸缩' },
];

export async function POST(request: NextRequest) {
  try {
    const body: TranslationRequest = await request.json();
    const { text, mode = 'professional', provider = 'groq', sourceLanguage = 'en', targetLanguage = 'zh', context } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // 1. Fetch glossary terms from Supabase (with fallback)
    let glossaryTerms: GlossaryTerm[] = fallbackGlossaryTerms;
    try {
      const supabase = createServerClient();
      const { data } = await supabase
        .from('glossary_terms')
        .select('english, chinese')
        .limit(1000);
      if (data && data.length > 0) {
        glossaryTerms = data;
      }
    } catch (error) {
      console.log('Glossary service unavailable, using fallback terms');
    }

    // 2. Find relevant glossary terms in the text
    const relevantTerms = glossaryTerms.filter(term =>
      text.toLowerCase().includes(term.english.toLowerCase())
    );

    // 3. Build glossary context
    const glossaryContext = relevantTerms.length > 0
      ? 'Glossary Terms (Must use these translations):\n' + relevantTerms.map(t => `- ${t.english}: ${t.chinese}`).join('\n')
      : '';

    // 4. Merge context
    const fullContext = context ? `${context}\n\n${glossaryContext}` : glossaryContext;

    // 5. Translate
    const result = await translate({
      text,
      mode,
      provider,
      sourceLanguage,
      targetLanguage,
      context: fullContext,
      glossary: relevantTerms,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}

async function translate(opts: {
  text: string;
  mode: TranslationMode;
  provider: string;
  sourceLanguage: string;
  targetLanguage: string;
  context: string;
  glossary: GlossaryTerm[];
}): Promise<TranslationResponse> {
  const { text, mode, provider, sourceLanguage, targetLanguage, context, glossary } = opts;

  // Check for API keys
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const claudeKey = process.env.CLAUDE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const prompt = buildPrompt(text, mode, sourceLanguage, targetLanguage, context);

  // Try Groq (Best free tier: 30 RPM)
  if (provider === 'groq' && groqKey && !groqKey.startsWith('your-')) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a professional translator. Output only the translation, nothing else.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 2048,
        }),
      });
      const data = await res.json();
      const translated = data.choices?.[0]?.message?.content?.trim();
      if (translated) {
        return { translated, confidence: 0.94, provider: 'groq' };
      }
    } catch (e) {
      console.error('Groq error:', e);
    }
  }

  // Try Gemini
  if (provider === 'gemini' && geminiKey && !geminiKey.startsWith('your-')) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
            safetySettings: [
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            ],
          }),
        }
      );
      const data = await res.json();
      const translated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (translated) {
        return { translated, confidence: 0.95, provider: 'gemini' };
      }
    } catch (e) {
      console.error('Gemini error:', e);
    }
  }

  // Try Claude (same as backend: claude-3-sonnet-20240229)
  if (provider === 'claude' && claudeKey && !claudeKey.startsWith('your-')) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      const translated = data.content?.[0]?.text?.trim();
      if (translated) {
        return { translated, confidence: 0.96, provider: 'claude' };
      }
    } catch (e) {
      console.error('Claude error:', e);
    }
  }

  // Try OpenAI (same as backend: gpt-4)
  if (provider === 'openai' && openaiKey && !openaiKey.startsWith('your-')) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a professional technical translator specializing in cloud documentation. Translate the given text to Chinese while preserving all technical terms and formatting.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 2048,
        }),
      });
      const data = await res.json();
      const translated = data.choices?.[0]?.message?.content?.trim();
      if (translated) {
        return { translated, confidence: 0.97, provider: 'openai' };
      }
    } catch (e) {
      console.error('OpenAI error:', e);
    }
  }

  // Mock fallback (same logic as backend)
  return mockTranslate(text, sourceLanguage, targetLanguage, glossary);
}

// Build prompt (same as backend)
function buildPrompt(text: string, mode: TranslationMode, sourceLang: string, targetLang: string, context: string): string {
  const languageNames: Record<string, string> = {
    en: 'English',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    fr: 'French',
    de: 'German',
  };

  const targetLanguageLocal: Record<string, string> = {
    en: 'English',
    zh: '中文',
    ja: '日本語',
    ko: '한국어',
    fr: 'Français',
    de: 'Deutsch',
  };

  const sourceLanguage = languageNames[sourceLang] || sourceLang;
  const targetLanguage = languageNames[targetLang] || targetLang;
  const targetLocal = targetLanguageLocal[targetLang] || targetLanguage;

  const modeInstructions: Record<TranslationMode, string> = {
    professional: `Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
IMPORTANT: Your entire response must be in ${targetLocal}. Do not include any English explanations.
Maintain all technical terms (keep original term in parentheses if needed). Be precise and professional.
Output only the translation, nothing else.`,
    casual: `Translate the following text from ${sourceLanguage} to ${targetLanguage} in an easy-to-understand way for beginners.
IMPORTANT: Your entire response must be in ${targetLocal}. Do not include any English text except for technical terms.
Explain complex concepts simply, but explain them in ${targetLocal}.
Output only the translation/explanation in ${targetLocal}.`,
    summary: `Summarize and translate the following text from ${sourceLanguage} to ${targetLanguage}.
IMPORTANT: Your entire response must be in ${targetLocal}. Do not include any English text except for technical terms.
Highlight key points only. Output only the summary in ${targetLocal}.`,
  };

  return `${modeInstructions[mode]}

${context ? `Context: ${context}\n` : ''}
Text to translate:
${text}

${targetLocal}:`;
}

// Mock translation (same logic as backend)
function mockTranslate(text: string, sourceLang: string, targetLang: string, glossary: GlossaryTerm[]): TranslationResponse {
  let translatedText = '';

  // 1. Try glossary-aware translation first
  if (glossary && glossary.length > 0) {
    let tempText = text;
    // Sort by length descending to avoid partial matches (e.g., "AWS Lambda" vs "AWS")
    const sortedTerms = [...glossary].sort((a, b) => b.english.length - a.english.length);

    for (const term of sortedTerms) {
      const regex = new RegExp(`\\b${escapeRegex(term.english)}\\b`, 'gi');
      if (regex.test(tempText)) {
        tempText = tempText.replace(regex, `${term.chinese} (${term.english})`);
      }
    }

    if (tempText !== text) {
      translatedText = tempText;
    }
  }

  // 2. If no glossary match, use dictionary translation
  if (!translatedText) {
    translatedText = getMockDictionaryTranslation(text, sourceLang, targetLang);
  }

  const altLabel = targetLang === 'zh' ? '备选' : 'Alternative';
  const altText = targetLang === 'zh' ? '这是另一个模拟的翻译选项' : 'This is another mock translation option';

  return {
    translated: translatedText,
    confidence: 0.88,
    provider: 'mock',
    alternativeTranslations: [`[${altLabel}] ${altText}`],
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getMockDictionaryTranslation(text: string, sourceLang: string, targetLang: string): string {
  const enToZh: Record<string, string> = {
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

  const zhToEn: Record<string, string> = {
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

  // English to Chinese
  if (sourceLang === 'en' && targetLang === 'zh') {
    // Exact match
    if (enToZh[lowerText]) {
      return enToZh[lowerText];
    }

    // Word-by-word translation
    const words = lowerText.split(/\s+/);
    if (words.length > 1) {
      const translatedWords = words.map(word => {
        const cleanWord = word.replace(/[.,!?;:]/g, '');
        const trans = enToZh[cleanWord];
        if (trans === undefined) return cleanWord;
        if (trans === '') return null;
        return trans;
      }).filter(w => w !== null && w !== '');

      if (translatedWords.length > 0) {
        return translatedWords.join('');
      }
    }

    // Single word
    const cleanText = lowerText.replace(/[.,!?;:]/g, '');
    if (enToZh[cleanText]) {
      return enToZh[cleanText];
    }

    return `${text}（智能翻译）`;
  }

  // Chinese to English
  if (sourceLang === 'zh' && targetLang === 'en') {
    if (zhToEn[text.trim()]) {
      return zhToEn[text.trim()];
    }

    for (const [zh, en] of Object.entries(zhToEn)) {
      if (text.includes(zh)) {
        return text.replace(new RegExp(zh, 'g'), en);
      }
    }

    return `[Mock] English translation of "${text}"`;
  }

  // Other language pairs
  return `[Mock from ${sourceLang} to ${targetLang}] ${text}`;
}
