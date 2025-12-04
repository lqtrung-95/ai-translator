"use client";

import { X, History, Trash2, Clock, ArrowRight, FileText, Sparkles, Eye, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslationStore, TranslationHistoryItem } from '@/store/translation';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentLoad?: (item: TranslationHistoryItem) => void;
  isInline?: boolean;
}

const languages: Record<string, string> = {
  en: 'EN',
  zh: '中',
  ja: '日',
  ko: '한',
  fr: 'FR',
  de: 'DE',
};

const modeLabels: Record<string, string> = {
  professional: '专业',
  casual: '通俗',
  summary: '总结',
};

export const HistoryPanel = ({ isOpen, onClose, onDocumentLoad, isInline = false }: HistoryPanelProps) => {
  const { translationHistory, removeFromHistory, clearHistory, loadHistoryItem } = useTranslationStore();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (date.toDateString() === now.toDateString()) return '今天';
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const handleLoadItem = (item: TranslationHistoryItem) => {
    if (item.type === 'document') {
      // For document items, load the saved document data
      if (item.documentData && onDocumentLoad) {
        onDocumentLoad(item);
        onClose();
      } else {
        toast('文档数据不可用', { icon: '📄' });
      }
    } else {
      // For instant translation, load into the translator
      loadHistoryItem(item);
      onClose();
    }
  };

  // Inline mode for sidebar
  if (isInline) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-2">
            <History size={18} className="text-blue-600" />
            <h3 className="font-semibold text-sm text-[var(--foreground)]">翻译历史</h3>
            <span className="text-[10px] text-[var(--muted)] bg-[var(--background)] px-1.5 py-0.5 rounded-full">
              {translationHistory.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Clear all button */}
            {translationHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="清空历史"
              >
                <Trash2 size={16} />
              </button>
            )}
            {/* Close button - only on mobile */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors cursor-pointer lg:hidden"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto bg-[var(--background)]">
          {translationHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
              <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center mb-3">
                <Clock size={20} className="text-[var(--muted)]" />
              </div>
              <p className="text-[var(--muted)] text-sm">暂无翻译历史</p>
              <p className="text-[var(--muted)] text-xs mt-1">翻译内容会自动保存</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {translationHistory.map((item) => (
                <div
                  key={item.id}
                  className="group p-3 hover:bg-[var(--surface)] transition-colors cursor-pointer"
                  onClick={() => handleLoadItem(item)}
                >
                  {/* Type & Time Row */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {item.type === 'document' ? (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded text-[10px]">
                          <FileText size={10} />
                          文档
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded text-[10px]">
                          <Sparkles size={10} />
                          即时
                        </span>
                      )}
                      <span className="text-[10px] text-[var(--muted)]">
                        {languages[item.sourceLanguage]}→{languages[item.targetLanguage]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[var(--muted)]">{formatTime(item.timestamp)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[var(--muted)] hover:text-red-500 transition-all cursor-pointer"
                        title="删除"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Document Title */}
                  {item.type === 'document' && item.documentTitle && (
                    <p className="text-sm font-medium text-[var(--foreground)] line-clamp-1 mb-0.5">
                      {item.documentTitle}
                    </p>
                  )}

                  {/* Content Preview */}
                  <p className="text-xs text-[var(--foreground)] line-clamp-2 mb-0.5">
                    {item.type === 'document' ? (
                      <span className="text-[var(--muted)] group-hover:text-blue-600 transition-colors flex items-center gap-1">
                        <span className="line-clamp-1">{item.documentUrl || item.sourceText}</span>
                        <Eye size={10} className="opacity-0 group-hover:opacity-100 flex-shrink-0" />
                      </span>
                    ) : (
                      item.sourceText
                    )}
                  </p>

                  {/* Translation Preview */}
                  <p className="text-[11px] text-[var(--muted)] line-clamp-1">
                    → {item.translatedText}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Original sliding panel mode (for backwards compatibility)
  return (
    <div
      className={`fixed left-0 top-0 h-full w-80 bg-[var(--surface)] border-r border-[var(--border)] shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <History size={20} className="text-blue-600" />
          <h3 className="font-semibold text-[var(--foreground)]">翻译历史</h3>
          <span className="text-xs text-[var(--muted)] bg-[var(--background)] px-2 py-0.5 rounded-full">
            {translationHistory.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Clear All Button */}
      {translationHistory.length > 0 && (
        <div className="px-4 py-2 border-b border-[var(--border)]">
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            清空历史
          </button>
        </div>
      )}

      {/* History List */}
      <div className="overflow-y-auto h-[calc(100%-120px)]">
        {translationHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-full bg-[var(--background)] flex items-center justify-center mb-4">
              <Clock size={28} className="text-[var(--muted)]" />
            </div>
            <p className="text-[var(--muted)] text-sm">暂无翻译历史</p>
            <p className="text-[var(--muted)] text-xs mt-1">翻译内容会自动保存在这里</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {translationHistory.map((item) => (
              <div
                key={item.id}
                className="group p-4 hover:bg-[var(--background)] transition-colors cursor-pointer"
                onClick={() => handleLoadItem(item)}
              >
                {/* Meta Info */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    {item.type === 'document' ? (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded text-[10px]">
                        <FileText size={10} />
                        文档
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded text-[10px]">
                        <Sparkles size={10} />
                        即时
                      </span>
                    )}
                    <span>{languages[item.sourceLanguage] || item.sourceLanguage}</span>
                    <ArrowRight size={12} />
                    <span>{languages[item.targetLanguage] || item.targetLanguage}</span>
                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded text-[10px]">
                      {modeLabels[item.mode] || item.mode}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Document Title */}
                {item.type === 'document' && item.documentTitle && (
                  <p className="text-sm font-medium text-[var(--foreground)] line-clamp-1 mb-1">
                    {item.documentTitle}
                  </p>
                )}

                {/* Source Text / URL */}
                <p className={`text-sm ${item.type === 'document' ? 'text-[var(--muted)]' : 'text-[var(--foreground)]'} line-clamp-2 mb-1`}>
                  {item.type === 'document' && item.documentUrl ? (
                    <span className="flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                      {item.documentUrl}
                      <Eye size={12} className="opacity-0 group-hover:opacity-100 flex-shrink-0" />
                    </span>
                  ) : item.sourceText}
                </p>

                {/* Translated Text */}
                <p className="text-xs text-[var(--muted)] line-clamp-2">
                  {item.translatedText}
                </p>

                {/* Time */}
                <p className="text-[10px] text-[var(--muted)] mt-2">
                  {formatTime(item.timestamp)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
