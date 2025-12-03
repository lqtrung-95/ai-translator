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
        }),
      }
    )
  )
);
