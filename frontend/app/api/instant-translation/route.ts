import { NextRequest, NextResponse } from 'next/server';

type TranslationMode = 'professional' | 'casual' | 'summary';

interface TranslationRequest {
  text: string;
  mode?: TranslationMode;
  provider?: 'gemini' | 'claude' | 'openai';
  sourceLanguage?: string;
  targetLanguage?: string;
  context?: string;
}

interface TranslationResponse {
  translated: string;
  confidence: number;
  provider: string;
}

// Glossary terms for context
const glossaryTerms = [
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
    const { text, mode = 'professional', provider = 'gemini', sourceLanguage = 'en', targetLanguage = 'zh', context } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Find relevant glossary terms
    const relevantTerms = glossaryTerms.filter(term =>
      text.toLowerCase().includes(term.english.toLowerCase())
    );

    const glossaryContext = relevantTerms.length > 0
      ? 'Glossary Terms (Must use these translations):\n' + relevantTerms.map(t => `- ${t.english}: ${t.chinese}`).join('\n')
      : '';

    const fullContext = context ? `${context}\n\n${glossaryContext}` : glossaryContext;

    // Try real translation, fall back to mock
    const result = await translate({ text, mode, provider, sourceLanguage, targetLanguage, context: fullContext });

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
}): Promise<TranslationResponse> {
  const { text, mode, provider, sourceLanguage, targetLanguage, context } = opts;

  // Check for API keys
  const geminiKey = process.env.GEMINI_API_KEY;
  const claudeKey = process.env.CLAUDE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const prompt = buildPrompt(text, mode, sourceLanguage, targetLanguage, context);

  // Try Gemini
  if (provider === 'gemini' && geminiKey && !geminiKey.startsWith('your-')) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
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

  // Try Claude
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

  // Try OpenAI
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
            { role: 'system', content: 'You are a professional technical translator.' },
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

  // Mock fallback
  return mockTranslate(text, sourceLanguage, targetLanguage);
}

function buildPrompt(text: string, mode: TranslationMode, sourceLang: string, targetLang: string, context: string): string {
  const langNames: Record<string, string> = { en: 'English', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', fr: 'French', de: 'German' };
  const targetLocal: Record<string, string> = { en: 'English', zh: '中文', ja: '日本語', ko: '한국어', fr: 'Français', de: 'Deutsch' };

  const src = langNames[sourceLang] || sourceLang;
  const tgt = langNames[targetLang] || targetLang;
  const local = targetLocal[targetLang] || tgt;

  const instructions: Record<TranslationMode, string> = {
    professional: `Translate from ${src} to ${tgt}. Response must be in ${local}. Keep technical terms. Output only the translation.`,
    casual: `Translate from ${src} to ${tgt} for beginners. Response must be in ${local}. Explain simply. Output only the translation.`,
    summary: `Summarize and translate from ${src} to ${tgt}. Response must be in ${local}. Output only the summary.`,
  };

  return `${instructions[mode]}\n\n${context ? `Context: ${context}\n\n` : ''}Text:\n${text}\n\n${local}:`;
}

function mockTranslate(text: string, sourceLang: string, targetLang: string): TranslationResponse {
  const dict: Record<string, string> = {
    hello: '你好', world: '世界', 'how are you': '你好吗', 'thank you': '谢谢',
    cloud: '云', service: '服务', database: '数据库', server: '服务器',
  };

  if (sourceLang === 'en' && targetLang === 'zh') {
    const lower = text.toLowerCase();
    if (dict[lower]) return { translated: dict[lower], confidence: 0.88, provider: 'mock' };

    const words = lower.split(/\s+/).map(w => dict[w] || w).join('');
    return { translated: words || `${text}（智能翻译）`, confidence: 0.88, provider: 'mock' };
  }

  return { translated: `[Mock] ${text}`, confidence: 0.88, provider: 'mock' };
}

