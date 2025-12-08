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
  provider?: "gemini" | "claude" | "openai";
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
      provider = "gemini",
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

// Translate all paragraphs with batching
async function translateParagraphs(
  paragraphs: ParsedParagraph[],
  sourceLanguage: string,
  targetLanguage: string,
  mode: TranslationMode,
  provider: string
): Promise<ParsedParagraph[]> {
  const results: ParsedParagraph[] = [];

  // Process in batches of 10 for faster performance
  const batchSize = 10;

  for (let i = 0; i < paragraphs.length; i += batchSize) {
    const batch = paragraphs.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (paragraph) => {
        // Skip code blocks - just mark as completed
        if (paragraph.type === "code") {
          return {
            ...paragraph,
            translated: paragraph.original,
            translationStatus: "completed" as const,
          };
        }

        try {
          const translated = await translateText(
            paragraph.original,
            sourceLanguage,
            targetLanguage,
            mode,
            provider
          );

          return {
            ...paragraph,
            translated,
            translationStatus: "completed" as const,
          };
        } catch (error) {
          console.error(
            `Failed to translate paragraph ${paragraph.id}:`,
            error
          );
          return {
            ...paragraph,
            translated: `[Translation failed] ${paragraph.original}`,
            translationStatus: "error" as const,
          };
        }
      })
    );

    results.push(...batchResults);
  }

  return results;
}

// Translate a single text
async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  mode: TranslationMode,
  provider: string
): Promise<string> {
  const prompt = buildPrompt(text, mode, sourceLanguage, targetLanguage);

  // Try Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (provider === "gemini" && geminiKey && !geminiKey.startsWith("your-")) {
    try {
      console.log(`Translating with Gemini: ${text.substring(0, 50)}...`);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
            safetySettings: [
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_NONE",
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_NONE",
              },
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE",
              },
            ],
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Gemini API error: ${res.status} - ${errorText}`);
        throw new Error(`Gemini API error: ${res.status}`);
      }

      const data = await res.json();
      console.log("Gemini response:", JSON.stringify(data).substring(0, 200));

      const translated =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (translated) {
        return translated;
      } else {
        console.error("Gemini response missing translation:", data);
        throw new Error("Gemini response missing translation content");
      }
    } catch (e) {
      console.error("Gemini error:", e);
      throw e;
    }
  }

  // Try Claude
  const claudeKey = process.env.CLAUDE_API_KEY;
  if (provider === "claude" && claudeKey && !claudeKey.startsWith("your-")) {
    try {
      console.log(`Translating with Claude: ${text.substring(0, 50)}...`);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": claudeKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Claude API error: ${res.status} - ${errorText}`);
        throw new Error(`Claude API error: ${res.status}`);
      }

      const data = await res.json();
      const translated = data.content?.[0]?.text?.trim();
      if (translated) {
        return translated;
      } else {
        console.error("Claude response missing translation:", data);
        throw new Error("Claude response missing translation content");
      }
    } catch (e) {
      console.error("Claude error:", e);
      throw e;
    }
  }

  // Try OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (provider === "openai" && openaiKey && !openaiKey.startsWith("your-")) {
    try {
      console.log(`Translating with OpenAI: ${text.substring(0, 50)}...`);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are a professional technical translator. Translate accurately and preserve formatting.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 2048,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`OpenAI API error: ${res.status} - ${errorText}`);
        throw new Error(`OpenAI API error: ${res.status}`);
      }

      const data = await res.json();
      const translated = data.choices?.[0]?.message?.content?.trim();
      if (translated) {
        return translated;
      } else {
        console.error("OpenAI response missing translation:", data);
        throw new Error("OpenAI response missing translation content");
      }
    } catch (e) {
      console.error("OpenAI error:", e);
      throw e;
    }
  }

  // No provider available or configured
  throw new Error(
    `Translation provider '${provider}' is not configured. Please check your API keys in environment variables.`
  );
}

function buildPrompt(
  text: string,
  mode: TranslationMode,
  sourceLang: string,
  targetLang: string
): string {
  const languageNames: Record<string, string> = {
    en: "English",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    fr: "French",
    de: "German",
  };

  const targetLanguageLocal: Record<string, string> = {
    en: "English",
    zh: "中文",
    ja: "日本語",
    ko: "한국어",
    fr: "Français",
    de: "Deutsch",
  };

  const sourceLanguage = languageNames[sourceLang] || sourceLang;
  const targetLanguage = languageNames[targetLang] || targetLang;
  const targetLocal = targetLanguageLocal[targetLang] || targetLanguage;

  const modeInstructions: Record<TranslationMode, string> = {
    professional: `Translate the following text from ${sourceLanguage} to ${targetLanguage}.
Be precise and professional. Keep technical terms with original in parentheses.
Output only the translation, nothing else.`,
    casual: `Translate from ${sourceLanguage} to ${targetLanguage} in a simple, easy-to-understand way.
Explain technical concepts briefly. Output only the translation.`,
    summary: `Summarize and translate from ${sourceLanguage} to ${targetLanguage}.
Keep only key points. Output only the summary.`,
  };

  return `${modeInstructions[mode]}

Text:
${text}

${targetLocal}:`;
}
