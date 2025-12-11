import { NextRequest, NextResponse } from "next/server";
import {
  parseUrl,
  parseContentAsync,
  ParsedDocument,
  ParsedParagraph,
} from "../_lib/document-parser";

type TranslationMode = "professional" | "casual" | "summary";

interface DocumentTranslateRequest {
  type: "url" | "content";
  content: string; // URL or raw content
  sourceLanguage?: string;
  targetLanguage?: string;
  mode?: TranslationMode;
  provider?: "groq" | "gemini" | "claude" | "openai";
}

interface TranslatedDocument extends ParsedDocument {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: string;
  updatedAt: string;
}

// POST: Parse and translate a document
export async function POST(request: NextRequest) {
  try {
    const body: DocumentTranslateRequest = await request.json();
    const {
      type,
      content,
      sourceLanguage = "en",
      targetLanguage = "zh",
      mode = "professional",
      provider = "groq",
    } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // 1. Parse the document
    let parsedDoc: ParsedDocument;

    if (type === "url") {
      try {
        parsedDoc = await parseUrl(content);
      } catch (error: any) {
        return NextResponse.json(
          {
            error: `Failed to fetch URL: ${error.message}`,
          },
          { status: 400 }
        );
      }
    } else {
      try {
        parsedDoc = await parseContentAsync(content, "upload");
      } catch (error: any) {
        return NextResponse.json(
          {
            error: `Failed to parse file: ${error.message}`,
          },
          { status: 400 }
        );
      }
    }

    if (parsedDoc.paragraphs.length === 0) {
      return NextResponse.json(
        {
          error:
            "No translatable content found in the document. Try a specific documentation page instead of the homepage.",
        },
        { status: 400 }
      );
    }

    // Limit paragraphs to avoid timeout (max 30 for reasonable response time)
    const maxParagraphs = 30;
    if (parsedDoc.paragraphs.length > maxParagraphs) {
      console.log(
        `Limiting from ${parsedDoc.paragraphs.length} to ${maxParagraphs} paragraphs`
      );
      parsedDoc.paragraphs = parsedDoc.paragraphs.slice(0, maxParagraphs);
    }

    console.log(
      `Translating ${parsedDoc.paragraphs.length} paragraphs from: ${parsedDoc.title}`
    );

    // 2. Translate all paragraphs
    const translatedParagraphs = await translateParagraphs(
      parsedDoc.paragraphs,
      sourceLanguage,
      targetLanguage,
      mode,
      provider
    );

    // 3. Build response
    const translatedDoc: TranslatedDocument = {
      id: Date.now().toString(),
      title: parsedDoc.title,
      paragraphs: translatedParagraphs,
      metadata: parsedDoc.metadata,
      sourceLanguage,
      targetLanguage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(translatedDoc);
  } catch (error: any) {
    console.error("Document translation error:", error);
    return NextResponse.json(
      {
        error: error.message || "Document translation failed",
      },
      { status: 500 }
    );
  }
}

// Translate all paragraphs with batching (multiple paragraphs per API call)
async function translateParagraphs(
  paragraphs: ParsedParagraph[],
  sourceLanguage: string,
  targetLanguage: string,
  mode: TranslationMode,
  provider: string
): Promise<ParsedParagraph[]> {
  // Separate code blocks (no translation needed) from text
  const textParagraphs: ParsedParagraph[] = [];
  const codeParagraphs: Map<number, ParsedParagraph> = new Map();
  
  paragraphs.forEach((p, idx) => {
    if (p.type === "code") {
      codeParagraphs.set(idx, { ...p, translated: p.original, translationStatus: "completed" as const });
    } else {
      textParagraphs.push(p);
    }
  });

  // Batch 10 paragraphs per API call to minimize requests
  const batchSize = 10;
  const translatedTexts: Map<string, string> = new Map();

  for (let i = 0; i < textParagraphs.length; i += batchSize) {
    const batch = textParagraphs.slice(i, i + batchSize);
    console.log(`Translating batch ${Math.floor(i / batchSize) + 1}: ${batch.length} paragraphs`);
    
    try {
      const translations = await translateBatch(
        batch.map(p => p.original),
        sourceLanguage,
        targetLanguage,
        mode,
        provider
      );
      
      batch.forEach((p, idx) => {
        translatedTexts.set(p.id, translations[idx] || `[Translation failed] ${p.original}`);
      });
    } catch (error) {
      console.error(`Batch translation failed:`, error);
      batch.forEach(p => {
        translatedTexts.set(p.id, `[Translation failed] ${p.original}`);
      });
    }
    
    // Small delay between batches to be safe
    if (i + batchSize < textParagraphs.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Rebuild results in original order
  return paragraphs.map((p, idx) => {
    if (codeParagraphs.has(idx)) {
      return codeParagraphs.get(idx)!;
    }
    const translated = translatedTexts.get(p.id);
    return {
      ...p,
      translated: translated || p.original,
      translationStatus: (translated && !translated.startsWith("[Translation failed]") ? "completed" : "error") as "completed" | "error",
    };
  });
}

// Translate multiple texts in a single API call
async function translateBatch(
  texts: string[],
  sourceLanguage: string,
  targetLanguage: string,
  mode: TranslationMode,
  provider: string
): Promise<string[]> {
  const prompt = buildBatchPrompt(texts, mode, sourceLanguage, targetLanguage);
  
  // Groq - Best free tier: 30 RPM, 14,400 RPD
  const groqKey = process.env.GROQ_API_KEY;
  if (provider === "groq" && groqKey && !groqKey.startsWith("your-")) {
    console.log(`Translating with Groq: ${texts.length} texts`);
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a professional translator. Follow the output format exactly." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 8192,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Groq API error: ${res.status} - ${errorText}`);
      throw new Error(`Groq API error: ${res.status}`);
    }

    const data = await res.json();
    const responseText = data.choices?.[0]?.message?.content?.trim();
    if (!responseText) throw new Error("Empty response from Groq");
    
    return parseBatchResponse(responseText, texts.length);
  }

  // // Gemini fallback (commented out for testing Groq)
  // const geminiKey = process.env.GEMINI_API_KEY;
  // if (provider === "gemini" && geminiKey && !geminiKey.startsWith("your-")) {
  //   const res = await fetch(
  //     `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
  //     {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         contents: [{ parts: [{ text: prompt }] }],
  //         generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
  //         safetySettings: [
  //           { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  //           { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  //           { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  //           { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
  //         ],
  //       }),
  //     }
  //   );

  //   if (!res.ok) {
  //     const errorText = await res.text();
  //     console.error(`Gemini API error: ${res.status} - ${errorText}`);
  //     throw new Error(`Gemini API error: ${res.status}`);
  //   }

  //   const data = await res.json();
  //   const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  //   if (!responseText) throw new Error("Empty response from Gemini");
  //   
  //   return parseBatchResponse(responseText, texts.length);
  // }

  // Claude fallback
  const claudeKey = process.env.CLAUDE_API_KEY;
  if (provider === "claude" && claudeKey && !claudeKey.startsWith("your-")) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": claudeKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
    const data = await res.json();
    const responseText = data.content?.[0]?.text?.trim();
    if (!responseText) throw new Error("Empty response from Claude");
    
    return parseBatchResponse(responseText, texts.length);
  }

  // OpenAI fallback
  const openaiKey = process.env.OPENAI_API_KEY;
  if (provider === "openai" && openaiKey && !openaiKey.startsWith("your-")) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a professional translator. Follow the format exactly." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 8192,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    const responseText = data.choices?.[0]?.message?.content?.trim();
    if (!responseText) throw new Error("Empty response from OpenAI");
    
    return parseBatchResponse(responseText, texts.length);
  }

  throw new Error(`Translation provider '${provider}' is not configured.`);
}

// Build prompt for batch translation
function buildBatchPrompt(
  texts: string[],
  mode: TranslationMode,
  sourceLang: string,
  targetLang: string
): string {
  const languageNames: Record<string, string> = {
    en: "English", zh: "Chinese", ja: "Japanese", ko: "Korean", fr: "French", de: "German",
  };

  const sourceLanguage = languageNames[sourceLang] || sourceLang;
  const targetLanguage = languageNames[targetLang] || targetLang;

  const modeInstructions: Record<TranslationMode, string> = {
    professional: "Be precise and professional. Keep technical terms with original in parentheses.",
    casual: "Use simple, easy-to-understand language.",
    summary: "Summarize while translating, keep only key points.",
  };

  const numberedTexts = texts.map((t, i) => `[${i + 1}] ${t}`).join("\n\n");

  return `Translate the following ${texts.length} texts from ${sourceLanguage} to ${targetLanguage}.
${modeInstructions[mode]}

IMPORTANT: Output ONLY the translations in the exact same numbered format [1], [2], etc.
Do not add any explanations or extra text.

${numberedTexts}

Translations:`;
}

// Parse batch response back into individual translations
function parseBatchResponse(response: string, expectedCount: number): string[] {
  const results: string[] = [];
  
  // Try to parse numbered format [1], [2], etc.
  for (let i = 1; i <= expectedCount; i++) {
    const pattern = new RegExp(`\\[${i}\\]\\s*([\\s\\S]*?)(?=\\[${i + 1}\\]|$)`, 'i');
    const match = response.match(pattern);
    if (match && match[1]) {
      results.push(match[1].trim());
    } else {
      // Fallback: split by double newlines if numbered format fails
      const parts = response.split(/\n\n+/);
      if (parts[i - 1]) {
        results.push(parts[i - 1].replace(/^\[\d+\]\s*/, '').trim());
      } else {
        results.push('');
      }
    }
  }
  
  return results;
}

