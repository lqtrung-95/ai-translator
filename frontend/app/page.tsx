'use client';

import { useState, useEffect } from 'react';
import { BookOpen, MessageCircle, Settings, Languages, FileText, ArrowLeft, Sparkles } from 'lucide-react';
import { InstantTranslator } from '@/components/InstantTranslator';
import { HomePage } from '@/components/HomePage';
import { DualEditor } from '@/components/DualEditor';
import { AIAssistant } from '@/components/AIAssistant';
import { GlossaryPanel } from '@/components/GlossaryPanel';
import { SettingsModal, applyTheme } from '@/components/SettingsModal';
import { useTranslationStore } from '@/store/translation';
import { TranslationDocument, Paragraph } from '@/types';

type AppState = 'instant' | 'editor' | 'document';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('instant');
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

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

  const handleTranslationStart = async (data: { type: 'url' | 'file'; content: string }) => {
    setIsLoadingDocument(true);
    setDocumentError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockDocument: TranslationDocument = {
        id: Date.now().toString(),
        title: `${data.type === 'url' ? 'URL' : 'File'} - ${data.content}`,
        sourceUrl: data.type === 'url' ? data.content : undefined,
        sourceLanguage: 'en',
        targetLanguage: 'zh',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paragraphs: generateMockParagraphs(),
        metadata: {
          format: data.type === 'url' ? 'url' : 'html',
          source: data.content,
          extractedAt: new Date().toISOString(),
          totalParagraphs: 5,
        },
      };

      setCurrentDocument(mockDocument);
      setAppState('editor');
    } catch (error) {
      setDocumentError('处理文档失败，请重试');
      console.error('Error processing document:', error);
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
                    <p className="text-[10px] text-[var(--muted)] -mt-0.5">AI-Powered Documentation</p>
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
            <div className="h-[calc(100vh-64px)]">
              {currentDocument ? (
                <DualEditor
                  paragraphs={currentDocument.paragraphs}
                  onParagraphUpdate={handleParagraphUpdate}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm">加载中...</p>
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
    </div>
  );
}

function generateMockParagraphs(): Paragraph[] {
  return [
    {
      id: '1',
      order: 1,
      type: 'heading',
      original: 'Introduction to AWS VPC',
      translated: 'AWS VPC 简介',
      translationStatus: 'completed',
      glossaryTerms: [
        {
          id: 'vpc1',
          english: 'VPC',
          chinese: '虚拟私有云',
          category: 'infrastructure',
          explanation: 'Virtual Private Cloud',
        },
      ],
    },
    {
      id: '2',
      order: 2,
      type: 'paragraph',
      original:
        'Amazon Virtual Private Cloud (Amazon VPC) enables you to launch AWS resources into a virtual network that you\'ve defined.',
      translated:
        'Amazon VPC 允许您在您定义的虚拟网络中启动 AWS 资源。',
      translationStatus: 'completed',
      glossaryTerms: [],
    },
    {
      id: '3',
      order: 3,
      type: 'paragraph',
      original:
        'You have complete control over your virtual networking environment, including selection of your own IP address range, creation of subnets, and configuration of route tables and network gateways.',
      translated: '您可以完全控制虚拟网络环境，包括选择 IP 地址范围、创建子网、配置路由表和网络网关。',
      translationStatus: 'completed',
      glossaryTerms: [],
    },
    {
      id: '4',
      order: 4,
      type: 'code',
      original: `{
  "VpcId": "vpc-0ee975135d3f2598d",
  "CidrBlock": "10.0.0.0/16",
  "IsDefault": false
}`,
      translated: '{...} (代码块无需翻译)',
      translationStatus: 'completed',
      glossaryTerms: [],
    },
    {
      id: '5',
      order: 5,
      type: 'paragraph',
      original:
        'Additionally, you can use multiple layers of security, such as security groups and network access control lists, to help control access to Amazon EC2 instances in each subnet.',
      translated: '您还可以使用安全组和网络访问控制列表等多层安全，来控制对每个子网中 EC2 实例的访问。',
      translationStatus: 'completed',
      glossaryTerms: [],
    },
  ];
}
