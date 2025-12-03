'use client';

import { useState } from 'react';
import { Check, Edit2, RotateCcw, ChevronDown, ChevronUp, Copy, CheckCircle2 } from 'lucide-react';
import { Paragraph } from '@/types';

interface DualEditorProps {
  paragraphs: Paragraph[];
  onParagraphUpdate: (id: string, translated: string) => void;
}

export const DualEditor: React.FC<DualEditorProps> = ({ paragraphs, onParagraphUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleStartEdit = (paragraph: Paragraph) => {
    setEditingId(paragraph.id);
    setEditValue(paragraph.translated || '');
  };

  const handleSaveEdit = (id: string) => {
    onParagraphUpdate(id, editValue);
    setEditingId(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'heading':
        return 'text-lg font-semibold text-slate-900';
      case 'code':
        return 'font-mono text-sm bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto';
      default:
        return 'text-slate-700 leading-relaxed';
    }
  };

  const completedCount = paragraphs.filter(p => p.translationStatus === 'completed').length;
  const progress = (completedCount / paragraphs.length) * 100;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">翻译进度</span>
          <span className="text-sm text-slate-500">{completedCount} / {paragraphs.length} 段落</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Editor Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 h-full">
          {/* Source Column */}
          <div className="border-r border-slate-200 bg-white">
            <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-3">
              <h3 className="text-sm font-semibold text-slate-700">原文 (English)</h3>
            </div>
            <div className="p-6 space-y-6">
              {paragraphs.map((para) => (
                <div
                  key={para.id}
                  className={`${para.type === 'code' ? getTypeStyles('code') : ''}`}
                >
                  {para.type === 'code' ? (
                    <pre className="whitespace-pre-wrap">{para.original}</pre>
                  ) : (
                    <p className={getTypeStyles(para.type)}>{para.original}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Translation Column */}
          <div className="bg-slate-50/50">
            <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-6 py-3">
              <h3 className="text-sm font-semibold text-slate-700">译文 (中文)</h3>
            </div>
            <div className="p-6 space-y-6">
              {paragraphs.map((para) => (
                <div key={para.id} className="group relative">
                  {editingId === para.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full p-4 border border-blue-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none min-h-[120px]"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveEdit(para.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                          <Check size={16} />
                          保存
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`${
                          para.type === 'code'
                            ? getTypeStyles('code')
                            : `p-4 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white transition-all ${getTypeStyles(para.type)}`
                        }`}
                      >
                        {para.type === 'code' ? (
                          <pre className="whitespace-pre-wrap">{para.translated}</pre>
                        ) : (
                          <p>{para.translated}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(para.translated || '', para.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="复制"
                        >
                          {copiedId === para.id ? (
                            <CheckCircle2 size={16} className="text-green-500" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => handleStartEdit(para)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="编辑"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>

                      {/* Glossary Terms */}
                      {para.glossaryTerms && para.glossaryTerms.length > 0 && (
                        <div className="mt-3">
                          <button
                            onClick={() => toggleExpand(para.id)}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            {expandedIds.has(para.id) ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                            {para.glossaryTerms.length} 个术语
                          </button>
                          {expandedIds.has(para.id) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {para.glossaryTerms.map((term) => (
                                <span
                                  key={term.id}
                                  className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium"
                                  title={term.explanation}
                                >
                                  {term.english} → {term.chinese}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Status Indicator */}
                      {para.translationStatus === 'completed' && (
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-xs">
                            <CheckCircle2 size={12} />
                            已完成
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
