'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Paragraph } from '@/types';
import { useTranslationStore } from '@/store/translation';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, Copy, RotateCcw } from 'lucide-react';

interface DualEditorProps {
  paragraphs: Paragraph[];
  onParagraphUpdate?: (id: string, translated: string) => void;
}

export const DualEditor: React.FC<DualEditorProps> = ({ paragraphs, onParagraphUpdate }) => {
  const [syncScroll, setSyncScroll] = useState(true);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const { selectedParagraphId, setSelectedParagraphId, viewMode } = useTranslationStore();

  // 同步滚动
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>, direction: 'left' | 'right') => {
      if (!syncScroll) return;

      const source = e.currentTarget;
      const target = direction === 'left' ? rightPanelRef.current : leftPanelRef.current;

      if (target) {
        target.scrollTop = source.scrollTop;
        target.scrollLeft = source.scrollLeft;
      }
    },
    [syncScroll]
  );

  const renderContent = (text: string) => {
    if (!text) return <p className="text-gray-400">暂无内容</p>;

    // 简单的语法高亮处理
    if (text.includes('```') || text.includes('```')) {
      return <ReactMarkdown>{text}</ReactMarkdown>;
    }

    return <p className="whitespace-pre-wrap">{text}</p>;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSyncScroll(!syncScroll)}
            className={`px-3 py-1 rounded text-sm ${
              syncScroll ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {syncScroll ? '✓' : '✗'} 同步滚动
          </button>

          <select
            value={viewMode}
            onChange={(e) => useTranslationStore.setState({ viewMode: e.target.value as any })}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="split">双栏</option>
            <option value="original">仅原文</option>
            <option value="translated">仅译文</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          共 {paragraphs.length} 段 · 已翻译 {paragraphs.filter((p) => p.translated).length} 段
        </div>
      </div>

      {/* 编辑器面板 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 原文面板 */}
        {(viewMode === 'split' || viewMode === 'original') && (
          <div
            ref={leftPanelRef}
            onScroll={(e) => handleScroll(e, 'left')}
            className="flex-1 overflow-auto border-r border-gray-200"
          >
            <div className="p-6 max-w-4xl mx-auto">
              <h2 className="text-sm font-semibold text-gray-600 mb-4">原文 (English)</h2>
              <div className="space-y-4">
                {paragraphs.map((para) => (
                  <ParagraphItem
                    key={para.id}
                    paragraph={para}
                    isSelected={selectedParagraphId === para.id}
                    onSelect={() => setSelectedParagraphId(para.id)}
                    type="original"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 译文面板 */}
        {(viewMode === 'split' || viewMode === 'translated') && (
          <div
            ref={rightPanelRef}
            onScroll={(e) => handleScroll(e, 'right')}
            className="flex-1 overflow-auto"
          >
            <div className="p-6 max-w-4xl mx-auto">
              <h2 className="text-sm font-semibold text-gray-600 mb-4">译文 (中文)</h2>
              <div className="space-y-4">
                {paragraphs.map((para) => (
                  <ParagraphItem
                    key={para.id}
                    paragraph={para}
                    isSelected={selectedParagraphId === para.id}
                    onSelect={() => setSelectedParagraphId(para.id)}
                    type="translated"
                    onUpdate={onParagraphUpdate}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ParagraphItemProps {
  paragraph: Paragraph;
  isSelected: boolean;
  onSelect: () => void;
  type: 'original' | 'translated';
  onUpdate?: (id: string, translated: string) => void;
}

const ParagraphItem: React.FC<ParagraphItemProps> = ({
  paragraph,
  isSelected,
  onSelect,
  type,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(paragraph.translated || '');

  const handleSave = () => {
    onUpdate?.(paragraph.id, editValue);
    setIsEditing(false);
  };

  const handleCopy = () => {
    const text = type === 'original' ? paragraph.original : paragraph.translated || '';
    navigator.clipboard.writeText(text);
  };

  const content = type === 'original' ? paragraph.original : paragraph.translated;

  const isPending = type === 'translated' && paragraph.translationStatus === 'pending';
  const isTranslating = type === 'translated' && paragraph.translationStatus === 'translating';

  return (
    <div
      className={`p-4 rounded-lg border-2 transition cursor-pointer ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      {/* 标签 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase">
          {paragraph.type}
        </span>
        {isTranslating && (
          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
            翻译中...
          </span>
        )}
        {isPending && (
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
            等待翻译
          </span>
        )}
      </div>

      {/* 内容区域 */}
      {!isEditing ? (
        <div className="text-gray-700 leading-relaxed">
          {isPending ? (
            <p className="text-gray-400 italic">等待翻译...</p>
          ) : isTranslating ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-gray-500 italic">翻译处理中...</span>
            </div>
          ) : (
            renderContent(content)
          )}
        </div>
      ) : (
        <textarea
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full p-2 border border-blue-300 rounded font-mono text-sm resize-none"
          rows={4}
        />
      )}

      {/* 操作按钮 */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
        {type === 'translated' && (
          <>
            {!isEditing ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  编辑
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy();
                  }}
                  className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded flex items-center gap-1"
                >
                  <Copy size={12} /> 复制
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  className="text-xs px-2 py-1 text-green-600 hover:bg-green-50 rounded"
                >
                  保存
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(false);
                    setEditValue(paragraph.translated || '');
                  }}
                  className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
                >
                  取消
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function renderContent(text: string | undefined) {
  if (!text) {
    return <p className="text-gray-400">暂无内容</p>;
  }

  // 如果包含代码块，使用 Markdown 渲染
  if (text.includes('```')) {
    return <ReactMarkdown>{text}</ReactMarkdown>;
  }

  // 否则保留原始格式
  return <p className="whitespace-pre-wrap text-sm">{text}</p>;
}
