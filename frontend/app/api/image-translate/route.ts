import { NextRequest, NextResponse } from 'next/server';

interface ImageTranslateRequest {
  image: string; // Base64 encoded image
  sourceLanguage?: string;
  targetLanguage?: string;
  mode?: 'professional' | 'casual' | 'summary';
}

export async function POST(request: NextRequest) {
  try {
    const body: ImageTranslateRequest = await request.json();
    const { 
      image, 
      sourceLanguage = 'auto', 
      targetLanguage = 'zh',
      mode = 'professional'
    } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey || groqKey.startsWith('your-')) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    const languageNames: Record<string, string> = {
      en: 'English',
      zh: 'Simplified Chinese (简体中文)',
      ja: 'Japanese',
      ko: 'Korean',
      fr: 'French',
      de: 'German',
      ru: 'Russian',
      es: 'Spanish',
      vi: 'Vietnamese',
      auto: 'the original language',
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;
    const sourceLangName = sourceLanguage === 'auto' ? 'the detected language' : (languageNames[sourceLanguage] || sourceLanguage);

    const modeInstructions: Record<string, string> = {
      professional: `You are a cloud computing expert translator. Translate precisely and professionally. 
Keep technical terms like AWS, GCP, Azure, Kubernetes, Docker, Lambda, EC2, S3, etc. with original in parentheses.
For cloud-specific terminology, provide accurate technical translations.`,
      casual: `You are a friendly cloud computing expert. Translate in simple, easy-to-understand language.
Explain technical cloud concepts briefly when needed.`,
      summary: `You are a cloud computing expert. Extract and summarize the key points from the image.
Focus on the main technical content and translate the summary.`,
    };

    const prompt = `${modeInstructions[mode]}

Task: 
1. First, extract ALL text visible in this image
2. Then translate the extracted text from ${sourceLangName} to ${targetLangName}

Format your response as:
---EXTRACTED TEXT---
[The original text from the image]

---TRANSLATION---
[The translated text in ${targetLangName}]

If there's no text in the image, respond with "No text found in image."`;

    // Call Groq Vision API
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Groq Vision API error: ${res.status} - ${errorText}`);
      return NextResponse.json({ error: `Vision API error: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    const responseText = data.choices?.[0]?.message?.content?.trim();

    if (!responseText) {
      return NextResponse.json({ error: 'No response from vision model' }, { status: 500 });
    }

    // Parse the response
    let extractedText = '';
    let translatedText = '';

    if (responseText.includes('---EXTRACTED TEXT---') && responseText.includes('---TRANSLATION---')) {
      const parts = responseText.split('---TRANSLATION---');
      extractedText = parts[0].replace('---EXTRACTED TEXT---', '').trim();
      translatedText = parts[1]?.trim() || '';
    } else {
      // Fallback: treat entire response as translation
      translatedText = responseText;
    }

    return NextResponse.json({
      extractedText,
      translatedText,
      provider: 'groq-vision',
      model: 'llama-4-scout-17b',
    });
  } catch (error: any) {
    console.error('Image translation error:', error);
    return NextResponse.json({ error: error.message || 'Image translation failed' }, { status: 500 });
  }
}

