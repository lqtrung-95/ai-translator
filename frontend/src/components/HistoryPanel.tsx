"use client";

import { X, History, Trash2, Clock, ArrowRight } from 'lucide-react';
import { useTranslationStore, TranslationHistoryItem } from '@/store/translation';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const languages: Record<string, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  fr: 'Français',
  de: 'Deutsch',
};

const modeLabels: Record<string, string> = {
  professional: '专业',
  casual: '通俗',
  summary: '总结',
};

export const HistoryPanel = ({ isOpen, onClose }: HistoryPanelProps) => {
  const { translationHistory, removeFromHistory, clearHistory, loadHistoryItem } = useTranslationStore();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (date.toDateString() === now.toDateString()) return '今天';
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const handleLoadItem = (item: TranslationHistoryItem) => {
    loadHistoryItem(item);
    onClose();
  };

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

                {/* Source Text */}
                <p className="text-sm text-[var(--foreground)] line-clamp-2 mb-1">
                  {item.sourceText}
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

