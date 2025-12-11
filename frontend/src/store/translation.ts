import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  TranslationDocument,
  Paragraph,
  GlossaryTerm,
  User,
  TranslationMode,
  InstantTranslationResult,
} from '@/types';

export type Theme = 'light' | 'dark' | 'system';
export type AIProvider = 'groq' | 'gemini' | 'claude' | 'openai';

export interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  mode: TranslationMode;
  timestamp: number;
  provider: AIProvider;
  type: 'instant' | 'document';
  documentTitle?: string;
  documentUrl?: string;
  // Store full document for document type
  documentData?: TranslationDocument;
}

interface TranslationState {
  // 当前文档状态
  currentDocument: TranslationDocument | null;
  isLoadingDocument: boolean;
  documentError: string | null;

  // 翻译过程状态
  isTranslating: boolean;
  translationProgress: number; // 0-100
  translationMode: TranslationMode;

  // 即时翻译状态
  quickSourceText: string;
  quickTranslatedText: string;
  quickSourceLanguage: string;
  quickTargetLanguage: string;
  isQuickTranslating: boolean;
  quickError: string | null;
  lastQuickResult: InstantTranslationResult | null;

  // UI状态
  selectedParagraphId: string | null;
  showGlossary: boolean;
  showAIAssistant: boolean;
  viewMode: 'split' | 'original' | 'translated';

  // 用户状态
  currentUser: User | null;
  isAuthenticated: boolean;

  // 术语库
  customGlossary: GlossaryTerm[];

  // 翻译历史
  translationHistory: TranslationHistoryItem[];

  // 设置
  theme: Theme;
  aiProvider: AIProvider;
  autoDetectLanguage: boolean;
  saveHistory: boolean;

  // 操作方法
  setCurrentDocument: (doc: TranslationDocument | null) => void;
  setIsLoadingDocument: (loading: boolean) => void;
  setDocumentError: (error: string | null) => void;
  setIsTranslating: (translating: boolean) => void;
  setTranslationProgress: (progress: number) => void;
  setTranslationMode: (mode: TranslationMode) => void;
  setSelectedParagraphId: (id: string | null) => void;
  setShowGlossary: (show: boolean) => void;
  setShowAIAssistant: (show: boolean) => void;
  setViewMode: (mode: 'split' | 'original' | 'translated') => void;
  setCurrentUser: (user: User | null) => void;
  setIsAuthenticated: (auth: boolean) => void;
  addCustomTerm: (term: GlossaryTerm) => void;
  updateParagraph: (id: string, updates: Partial<Paragraph>) => void;

  setQuickSourceText: (text: string) => void;
  setQuickTranslatedText: (text: string) => void;
  setQuickLanguages: (source: string, target: string) => void;
  setQuickError: (error: string | null) => void;
  setIsQuickTranslating: (loading: boolean) => void;
  setLastQuickResult: (result: InstantTranslationResult | null) => void;
  resetQuickState: () => void;

  // 设置方法
  setTheme: (theme: Theme) => void;
  setAIProvider: (provider: AIProvider) => void;
  setAutoDetectLanguage: (auto: boolean) => void;
  setSaveHistory: (save: boolean) => void;

  // 历史记录方法
  addToHistory: (item: Omit<TranslationHistoryItem, 'id' | 'timestamp'>) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  loadHistoryItem: (item: TranslationHistoryItem) => void;

  reset: () => void;
}

const initialState = {
  currentDocument: null,
  isLoadingDocument: false,
  documentError: null,
  isTranslating: false,
  translationProgress: 0,
  translationMode: 'professional' as TranslationMode,
  quickSourceText: '',
  quickTranslatedText: '',
  quickSourceLanguage: 'en',
  quickTargetLanguage: 'zh',
  isQuickTranslating: false,
  quickError: null,
  lastQuickResult: null,
  selectedParagraphId: null,
  showGlossary: false,
  showAIAssistant: false,
  viewMode: 'split' as const,
  currentUser: null,
  isAuthenticated: false,
  customGlossary: [],
  translationHistory: [],
  // 设置默认值
  theme: 'system' as Theme,
  aiProvider: 'groq' as AIProvider,
  autoDetectLanguage: true,
  saveHistory: true,
};

export const useTranslationStore = create<TranslationState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setCurrentDocument: (doc) => set({ currentDocument: doc }),
        setIsLoadingDocument: (loading) => set({ isLoadingDocument: loading }),
        setDocumentError: (error) => set({ documentError: error }),
        setIsTranslating: (translating) => set({ isTranslating: translating }),
        setTranslationProgress: (progress) => set({ translationProgress: progress }),
        setTranslationMode: (mode) => set({ translationMode: mode }),
        setSelectedParagraphId: (id) => set({ selectedParagraphId: id }),
        setShowGlossary: (show) => set({ showGlossary: show }),
        setShowAIAssistant: (show) => set({ showAIAssistant: show }),
        setViewMode: (mode) => set({ viewMode: mode }),
        setCurrentUser: (user) => set({ currentUser: user }),
        setIsAuthenticated: (auth) => set({ isAuthenticated: auth }),

        addCustomTerm: (term) =>
          set((state) => {
            const exists = state.customGlossary.find((t) => t.id === term.id);
            if (exists) return state;
            return { customGlossary: [...state.customGlossary, term] };
          }),

        updateParagraph: (id, updates) =>
          set((state) => {
            if (!state.currentDocument) return state;
            return {
              currentDocument: {
                ...state.currentDocument,
                paragraphs: state.currentDocument.paragraphs.map((p) =>
                  p.id === id ? { ...p, ...updates } : p
                ),
              },
            };
          }),

        setQuickSourceText: (text) => set({ quickSourceText: text }),
        setQuickTranslatedText: (text) => set({ quickTranslatedText: text }),
        setQuickLanguages: (source, target) =>
          set({ quickSourceLanguage: source, quickTargetLanguage: target }),
        setQuickError: (error) => set({ quickError: error }),
        setIsQuickTranslating: (loading) => set({ isQuickTranslating: loading }),
        setLastQuickResult: (result) => set({ lastQuickResult: result }),
        resetQuickState: () =>
          set({
            quickSourceText: '',
            quickTranslatedText: '',
            isQuickTranslating: false,
            quickError: null,
            lastQuickResult: null,
          }),

        // 设置方法
        setTheme: (theme) => set({ theme }),
        setAIProvider: (provider) => set({ aiProvider: provider }),
        setAutoDetectLanguage: (auto) => set({ autoDetectLanguage: auto }),
        setSaveHistory: (save) => set({ saveHistory: save }),

        // 历史记录方法
        addToHistory: (item) =>
          set((state) => {
            if (!state.saveHistory) return state;
            const newItem: TranslationHistoryItem = {
              ...item,
              id: Date.now().toString(),
              timestamp: Date.now(),
            };
            // Keep only last 50 items, but limit document items to 10 (they're large)
            let history = [newItem, ...state.translationHistory];
            const documentItems = history.filter(h => h.type === 'document');
            if (documentItems.length > 10) {
              // Remove oldest document items beyond 10
              const oldestDocIds = documentItems.slice(10).map(d => d.id);
              history = history.filter(h => !oldestDocIds.includes(h.id));
            }
            return { translationHistory: history.slice(0, 50) };
          }),
        removeFromHistory: (id) =>
          set((state) => ({
            translationHistory: state.translationHistory.filter((h) => h.id !== id),
          })),
        clearHistory: () => set({ translationHistory: [] }),
        loadHistoryItem: (item) =>
          set({
            quickSourceText: item.sourceText,
            quickTranslatedText: item.translatedText,
            quickSourceLanguage: item.sourceLanguage,
            quickTargetLanguage: item.targetLanguage,
            translationMode: item.mode,
          }),

        reset: () => set(initialState),
      }),
      {
        name: 'translation-store',
        partialize: (state) => ({
          customGlossary: state.customGlossary,
          translationMode: state.translationMode,
          viewMode: state.viewMode,
          quickSourceLanguage: state.quickSourceLanguage,
          quickTargetLanguage: state.quickTargetLanguage,
          // 持久化设置
          theme: state.theme,
          aiProvider: state.aiProvider,
          autoDetectLanguage: state.autoDetectLanguage,
          saveHistory: state.saveHistory,
          // 持久化历史
          translationHistory: state.translationHistory,
        }),
      }
    )
  )
);
