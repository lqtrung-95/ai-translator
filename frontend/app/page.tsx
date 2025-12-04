'use client';

import { useState, useEffect } from 'react';
import { BookOpen, MessageCircle, Settings, Languages, FileText, ArrowLeft, Sparkles, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { InstantTranslator } from '@/components/InstantTranslator';
import { HomePage } from '@/components/HomePage';
import { DualEditor } from '@/components/DualEditor';
import { AIAssistant } from '@/components/AIAssistant';
import { GlossaryPanel } from '@/components/GlossaryPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { SettingsModal, applyTheme } from '@/components/SettingsModal';
import { useTranslationStore } from '@/store/translation';
import { TranslationDocument, Paragraph } from '@/types';
import { apiClient } from '@/api/client';

type AppState = 'instant' | 'editor' | 'document';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('instant');
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const {
    currentDocument,
    setCurrentDocument,
    showAIAssistant,
    setShowAIAssistant,
    showGlossary,
    setShowGlossary,
    theme,
  } = useTranslationStore();

  // Apply theme on initial load
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleTranslationStart = async (data: { type: 'url' | 'file'; content: string }): Promise<boolean> => {
    setIsLoadingDocument(true);

    try {
      const { translationMode, aiProvider, addToHistory } = useTranslationStore.getState();
      
      // Call the real API
      const response = await apiClient.documentTranslate({
        type: data.type === 'url' ? 'url' : 'content',
        content: data.content,
        sourceLanguage: 'en',
        targetLanguage: 'zh',
        mode: translationMode,
        provider: aiProvider,
      }) as any;

      // Transform response to match TranslationDocument type
      const translatedDoc: TranslationDocument = {
        id: response.id,
        title: response.title,
        sourceUrl: data.type === 'url' ? data.content : undefined,
        sourceLanguage: response.sourceLanguage || 'en',
        targetLanguage: response.targetLanguage || 'zh',
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        paragraphs: response.paragraphs.map((p: any) => ({
          ...p,
          glossaryTerms: p.glossaryTerms || [],
        })),
        metadata: {
          format: response.metadata?.format || (data.type === 'url' ? 'url' : 'html'),
          source: response.metadata?.source || data.content,
          extractedAt: response.metadata?.extractedAt || new Date().toISOString(),
          totalParagraphs: response.paragraphs.length,
        },
      };

      // Add to history with full document data
      addToHistory({
        sourceText: data.type === 'url' ? data.content : `[文件] ${data.content.slice(0, 100)}...`,
        translatedText: `${response.paragraphs.length} 段落已翻译`,
        sourceLanguage: 'en',
        targetLanguage: 'zh',
        mode: translationMode,
        provider: aiProvider,
        type: 'document',
        documentTitle: response.title,
        documentUrl: data.type === 'url' ? data.content : undefined,
        documentData: translatedDoc,
      });

      setCurrentDocument(translatedDoc);
      setAppState('editor');
      toast.success('文档翻译完成！');
      return true;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || '处理文档失败，请重试';
      toast.error(errorMessage);
      console.error('Error processing document:', error);
      return false;
    } finally {
      setIsLoadingDocument(false);
    }
  };

  const handleParagraphUpdate = (id: string, translated: string) => {
    const doc = useTranslationStore.getState().currentDocument;
    if (doc) {
      const updatedDoc: TranslationDocument = {
        ...doc,
        paragraphs: doc.paragraphs.map((p) =>
          p.id === id ? { ...p, translated, translationStatus: 'completed' } : p
        ),
      };
      setCurrentDocument(updatedDoc);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {appState === 'editor' ? (
                <button
                  onClick={() => {
                    setCurrentDocument(null);
                    setAppState('instant');
                  }}
                  className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={20} />
                  <span className="font-medium">返回</span>
                </button>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Languages size={20} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-[var(--foreground)] tracking-tight">CloudTranslate</h1>
                    <p className="text-[10px] text-[var(--muted)] -mt-0.5">AI-Powered Translation</p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            {appState !== 'editor' && (
              <nav className="hidden sm:flex items-center bg-[var(--background)] rounded-full p-1">
                <button
                  onClick={() => setAppState('instant')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                    appState === 'instant'
                      ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Sparkles size={16} />
                  即时翻译
                </button>
                <button
                  onClick={() => setAppState('document')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                    appState === 'document'
                      ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <FileText size={16} />
                  文档翻译
                </button>
              </nav>
            )}

            {/* Editor Title */}
            {appState === 'editor' && currentDocument && (
              <h2 className="text-sm font-medium text-[var(--muted)] truncate max-w-md">
                {currentDocument.title}
              </h2>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                  showHistory
                    ? 'bg-blue-500/10 text-blue-600'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
                }`}
                title="翻译历史"
              >
                <History size={20} />
              </button>
              <button
                onClick={() => setShowGlossary(!showGlossary)}
                className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                  showGlossary
                    ? 'bg-blue-500/10 text-blue-600'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
                }`}
                title="术语库"
              >
                <BookOpen size={20} />
              </button>
              <button
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                  showAIAssistant
                    ? 'bg-blue-500/10 text-blue-600'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
                }`}
                title="AI 助手"
              >
                <MessageCircle size={20} />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2.5 rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-all duration-200 cursor-pointer"
                title="设置"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {appState !== 'editor' && (
          <div className="sm:hidden border-t border-[var(--border)] px-4 py-2">
            <nav className="flex items-center bg-[var(--background)] rounded-full p-1">
              <button
                onClick={() => setAppState('instant')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                  appState === 'instant'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted)]'
                }`}
              >
                <Sparkles size={16} />
                即时翻译
              </button>
              <button
                onClick={() => setAppState('document')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                  appState === 'document'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted)]'
                }`}
              >
                <FileText size={16} />
                文档翻译
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex">
        <div className="flex-1">
          {appState === 'editor' ? (
            <div className="h-[calc(100vh-4rem)] overflow-hidden">
              {currentDocument ? (
                <DualEditor
                  paragraphs={currentDocument.paragraphs}
                  onParagraphUpdate={handleParagraphUpdate}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[var(--muted)] text-sm">加载中...</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
              {appState === 'instant' ? (
                <InstantTranslator />
              ) : (
                <HomePage onTranslationStart={handleTranslationStart} isLoading={isLoadingDocument} />
              )}
            </div>
          )}
        </div>

        {/* Side Panels */}
        <AIAssistant
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
        />
        <GlossaryPanel
          isOpen={showGlossary}
          onClose={() => setShowGlossary(false)}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* History Panel */}
      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onDocumentLoad={(item) => {
          if (item.documentData) {
            setCurrentDocument(item.documentData);
            setAppState('editor');
          }
        }}
      />

      {/* Overlay for History Panel */}
      {showHistory && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}

