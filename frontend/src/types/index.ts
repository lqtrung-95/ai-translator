// 翻译相关类型
export interface TranslationDocument {
  id: string;
  title: string;
  sourceUrl?: string;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: string;
  updatedAt: string;
  paragraphs: Paragraph[];
  metadata: DocumentMetadata;
}

export interface Paragraph {
  id: string;
  order: number;
  type: 'heading' | 'paragraph' | 'code' | 'table' | 'list' | 'note' | 'warning' | 'tip';
  original: string;
  translated?: string;
  translationStatus: 'pending' | 'translating' | 'completed' | 'error';
  glossaryTerms: GlossaryTerm[];
  notes?: string;
}

export interface DocumentMetadata {
  format: 'url' | 'pdf' | 'html' | 'markdown';
  source: string;
  extractedAt: string;
  totalParagraphs: number;
  documentStructure?: DocumentStructure;
}

export interface DocumentStructure {
  title?: string;
  headings: HeadingNode[];
  codeBlocks: number;
  tables: number;
  images: number;
}

export interface HeadingNode {
  level: number;
  text: string;
  id: string;
}

// 术语库相关类型
export interface GlossaryTerm {
  id: string;
  english: string;
  chinese: string;
  category: string; // 'infrastructure' | 'security' | 'database' | etc
  explanation: string;
  examples?: string[];
  relatedTerms?: string[];
}

export interface TermMatch {
  term: GlossaryTerm;
  position: number; // 在原文中的位置
  length: number;
}

// 用户相关类型
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface TranslationHistory {
  id: string;
  userId: string;
  documentId: string;
  title: string;
  sourceUrl?: string;
  translatedAt: string;
  status: 'completed' | 'in_progress';
}

// AI翻译模式
export type TranslationMode = 'professional' | 'casual' | 'summary';

export interface TranslationRequest {
  content: string;
  mode: TranslationMode;
  glossary?: GlossaryTerm[];
  context?: string;
}

export interface TranslationResponse {
  original: string;
  translated: string;
  glossaryHighlights: TermMatch[];
  confidence: number; // 0-1
  alternativeTranslations?: string[];
}

export interface InstantTranslationResult {
  translated: string;
  confidence: number;
  provider: 'gemini' | 'claude' | 'openai';
}

// UI相关类型
export interface UIState {
  isLoading: boolean;
  error?: string;
  success?: string;
  selectedParagraph?: string;
}
