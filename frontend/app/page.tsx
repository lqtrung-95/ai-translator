'use client';

import { useState, useEffect } from 'react';
import { BookOpen, MessageCircle, Settings } from 'lucide-react';
import { InstantTranslator } from '@/components/InstantTranslator';
import { HomePage } from '@/components/HomePage';
import { DualEditor } from '@/components/DualEditor';
import { AIAssistant } from '@/components/AIAssistant';
import { GlossaryPanel } from '@/components/GlossaryPanel';
import { useTranslationStore } from '@/store/translation';
import { TranslationDocument, Paragraph } from '@/types';

type AppState = 'instant' | 'editor' | 'document';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('instant');
  const isDocumentMode = appState === 'document' || appState === 'editor';
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);

  const {
    currentDocument,
    setCurrentDocument,
    showAIAssistant,
    setShowAIAssistant,
    showGlossary,
    setShowGlossary,
  } = useTranslationStore();

  // 模拟文档处理流程
  const handleTranslationStart = async (data: { type: 'url' | 'file'; content: string }) => {
    setIsLoadingDocument(true);
    setDocumentError(null);

    try {
      // 模拟 API 调用延迟
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 生成模拟文档
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
    <div className="flex h-screen bg-gray-100">
      {/* 主要内容 */}
      <div className="flex-1 flex flex-col">
        {appState === 'instant' ? (
          <div className="p-8 overflow-auto">
            <div className="max-w-5xl mx-auto">
              <div className="mb-6 flex items-center justify-between">
                <nav className="flex gap-4">
                  <button
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      appState === 'instant'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                    onClick={() => setAppState('instant')}
                  >
                    即时翻译
                  </button>
                  <button
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      isDocumentMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                    onClick={() => setAppState('document')}
                  >
                    文档翻译
                  </button>
                </nav>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowGlossary(!showGlossary)}
                    className={`p-2 rounded-lg transition ${
                      showGlossary
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="术语库"
                  >
                    <BookOpen size={20} />
                  </button>

                  <button
                    onClick={() => setShowAIAssistant(!showAIAssistant)}
                    className={`p-2 rounded-lg transition ${
                      showAIAssistant
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="AI 助手"
                  >
                    <MessageCircle size={20} />
                  </button>
                </div>
              </div>
              {appState === 'instant' ? (
                <InstantTranslator />
              ) : appState === 'document' ? (
                <HomePage onTranslationStart={handleTranslationStart} isLoading={isLoadingDocument} />
              ) : null}
            </div>
          </div>
        ) : (
          <>
            {/* 编辑器顶部栏 */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setCurrentDocument(null);
                    setAppState('document');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2"
                >
                  ← 返回
                </button>
                <h1 className="text-xl font-bold text-gray-900 truncate">
                  {currentDocument?.title || '文档'}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowGlossary(!showGlossary)}
                  className={`p-2 rounded-lg transition ${
                    showGlossary
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="术语库"
                >
                  <BookOpen size={20} />
                </button>

                <button
                  onClick={() => setShowAIAssistant(!showAIAssistant)}
                  className={`p-2 rounded-lg transition ${
                    showAIAssistant
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="AI 助手"
                >
                  <MessageCircle size={20} />
                </button>

                <button
                  className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                  title="设置"
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>

            {/* 编辑器内容 */}
            <div className="flex-1 overflow-hidden">
              {currentDocument ? (
                <DualEditor
                  paragraphs={currentDocument.paragraphs}
                  onParagraphUpdate={handleParagraphUpdate}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  加载中...
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 右侧面板 */}
      <AIAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
      />

      <GlossaryPanel
        isOpen={showGlossary}
        onClose={() => setShowGlossary(false)}
      />
    </div>
  );
}

// 生成模拟段落数据
function generateMockParagraphs(): Paragraph[] {
  return [
    {
      id: '1',
      order: 1,
      type: 'heading',
      original: 'Introduction to AWS VPC',
      translated:
        'AWS VPC 简介',
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
      translated:
        '{...} (代码块无需翻译)',
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