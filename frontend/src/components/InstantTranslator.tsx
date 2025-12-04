"use client";

import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { Loader2, ArrowLeftRight, Copy, Check, ChevronDown, BookMarked, Code2, Brain, X } from 'lucide-react';
import { useTranslationStore } from '@/store/translation';
import { apiClient } from '@/api/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const languages = [
  { code: 'en', label: 'English', flag: 'us' },
  { code: 'zh', label: '中文', flag: 'cn' },
  { code: 'ja', label: '日本語', flag: 'jp' },
  { code: 'ko', label: '한국어', flag: 'kr' },
  { code: 'fr', label: 'Français', flag: 'fr' },
  { code: 'de', label: 'Deutsch', flag: 'de' },
];

// Custom Language Selector with flags
interface LanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
  align?: 'left' | 'right';
}

const LanguageSelector = ({ value, onChange, align = 'left' }: LanguageSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = languages.find(l => l.code === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--foreground)] cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
      >
        <span className={`fi fi-${selected?.flag} fis rounded-sm`} style={{ width: '20px', height: '15px' }} />
        <span>{selected?.label}</span>
        <ChevronDown size={16} className={`text-[var(--muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className={`absolute top-full mt-1 ${align === 'right' ? 'right-0' : 'left-0'} z-50 min-w-[160px] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg py-1 overflow-hidden`}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                onChange(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                lang.code === value
                  ? 'bg-blue-500/10 text-blue-600 font-medium'
                  : 'text-[var(--foreground)] hover:bg-[var(--background)]'
              }`}
            >
              <span className={`fi fi-${lang.flag} fis rounded-sm`} style={{ width: '20px', height: '15px' }} />
              <span>{lang.label}</span>
              {lang.code === value && <Check size={14} className="ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const modes = [
  { id: 'professional', label: '专业精确', desc: '保留技术术语' },
  { id: 'casual', label: '通俗解释', desc: '易于理解' },
  { id: 'summary', label: '总结概括', desc: '提取要点' },
] as const;

export const InstantTranslator = () => {
  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);
  const {
    quickSourceText,
    quickTranslatedText,
    quickSourceLanguage,
    quickTargetLanguage,
    translationMode,
    isQuickTranslating,
    quickError,
    aiProvider,
    setQuickSourceText,
    setQuickTranslatedText,
    setQuickLanguages,
    setTranslationMode,
    setQuickError,
    setIsQuickTranslating,
    setLastQuickResult,
    addToHistory,
  } = useTranslationStore();

  const swapLanguages = () => {
    setQuickLanguages(quickTargetLanguage, quickSourceLanguage);
    setQuickSourceText(quickTranslatedText || quickSourceText);
    setQuickTranslatedText('');
  };

  const handleCopySource = async () => {
    if (quickSourceText) {
      await navigator.clipboard.writeText(quickSourceText);
      setCopiedSource(true);
      setTimeout(() => setCopiedSource(false), 2000);
    }
  };

  const handleCopyTarget = async () => {
    if (quickTranslatedText) {
      await navigator.clipboard.writeText(quickTranslatedText);
      setCopiedTarget(true);
      setTimeout(() => setCopiedTarget(false), 2000);
    }
  };

  const handleClear = () => {
    setQuickSourceText('');
    setQuickTranslatedText('');
    setQuickError(null);
  };

  const handleTranslate = useCallback(async () => {
    if (!quickSourceText.trim()) {
      setQuickError('请输入要翻译的内容');
      return;
    }
    try {
      setQuickError(null);
      setIsQuickTranslating(true);
      const response = await apiClient.instantTranslate({
        text: quickSourceText,
        mode: translationMode,
        sourceLanguage: quickSourceLanguage,
        targetLanguage: quickTargetLanguage,
        provider: aiProvider, // Use selected AI provider from settings
      });

      const data = response as any;

      setQuickTranslatedText(data.translated);
      setLastQuickResult({
        translated: data.translated,
        confidence: data.confidence,
        provider: (data.provider || aiProvider) as 'gemini' | 'claude' | 'openai',
      });
      // Add to history
      addToHistory({
        sourceText: quickSourceText,
        translatedText: data.translated,
        sourceLanguage: quickSourceLanguage,
        targetLanguage: quickTargetLanguage,
        mode: translationMode,
        provider: aiProvider,
        type: 'instant',
      });
    } catch (error: any) {
      console.error('Translation error', error);
      setQuickError(error?.response?.data?.message || '翻译失败，请稍后再试');
    } finally {
      setIsQuickTranslating(false);
    }
  }, [
    quickSourceText,
    quickSourceLanguage,
    quickTargetLanguage,
    translationMode,
    aiProvider,
    setQuickError,
    setIsQuickTranslating,
    setQuickTranslatedText,
    setLastQuickResult,
  ]);

  const canTranslate = useMemo(() => quickSourceText.trim().length > 0, [quickSourceText]);

  const sourceLang = languages.find(l => l.code === quickSourceLanguage);
  const targetLang = languages.find(l => l.code === quickTargetLanguage);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)] tracking-tight">
          智能翻译
        </h2>
        <p className="text-[var(--muted)] text-sm sm:text-base">
          专为云服务文档优化，支持 AWS、GCP、OCI 等技术术语
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-full text-xs text-[var(--muted)]">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          引擎: {aiProvider === 'gemini' ? 'Google Gemini' : aiProvider === 'claude' ? 'Claude' : 'GPT-4'}
        </div>
      </div>

      {/* Translation Card */}
      <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
        {/* Language Selector Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-[var(--background)] border-b border-[var(--border)]">
          {/* Source Language */}
          <LanguageSelector
            value={quickSourceLanguage}
            onChange={(code) => setQuickLanguages(code, quickTargetLanguage)}
            align="left"
          />

          {/* Swap Button */}
          <button
            onClick={swapLanguages}
            className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-blue-600 hover:border-blue-400 hover:bg-blue-500/10 transition-all duration-200 cursor-pointer"
            title="交换语言"
          >
            <ArrowLeftRight size={18} />
          </button>

          {/* Target Language */}
          <LanguageSelector
            value={quickTargetLanguage}
            onChange={(code) => setQuickLanguages(quickSourceLanguage, code)}
            align="right"
          />
        </div>

        {/* Translation Areas */}
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
          {/* Source Input */}
          <div className="relative">
            <textarea
              value={quickSourceText}
              onChange={(e) => {
                setQuickSourceText(e.target.value);
                if (quickTranslatedText) {
                  setQuickTranslatedText('');
                }
              }}
              placeholder="输入或粘贴要翻译的文本..."
              className="w-full h-72 sm:h-80 lg:h-[420px] p-5 sm:p-6 bg-transparent text-[var(--foreground)] placeholder-[var(--muted)] resize-none focus:outline-none text-base leading-relaxed"
            />
            {/* Source Actions */}
            <div className="absolute top-4 right-4 flex items-center gap-1">
              {quickSourceText && (
                <>
                  <button
                    onClick={handleCopySource}
                    className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-all cursor-pointer"
                    title="复制原文"
                  >
                    {copiedSource ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={handleClear}
                    className="p-2 rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                    title="清空"
                  >
                    <X size={16} />
                  </button>
                </>
              )}
            </div>
            <div className="absolute bottom-4 left-5 text-xs text-[var(--muted)]">
              {quickSourceText.length} / 2000
            </div>
          </div>

          {/* Translation Output */}
          <div className="relative bg-[var(--background)]/50">
            {isQuickTranslating ? (
              <div className="h-72 sm:h-80 lg:h-[420px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={24} className="text-blue-600 animate-spin" />
                  <span className="text-sm text-[var(--muted)]">翻译中...</span>
                </div>
              </div>
            ) : quickError ? (
              <div className="h-72 sm:h-80 lg:h-[420px] flex items-center justify-center p-6">
                <p className="text-red-500 text-sm text-center">{quickError}</p>
              </div>
            ) : (
              <div className="h-72 sm:h-80 lg:h-[420px] p-5 sm:p-6 overflow-auto">
                {quickTranslatedText ? (
                  <div className="markdown-body text-[var(--foreground)] text-base leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {quickTranslatedText}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-[var(--muted)] text-base">翻译结果将显示在这里</p>
                )}
              </div>
            )}
            
            {/* Copy Button */}
            {quickTranslatedText && !isQuickTranslating && (
              <button
                onClick={handleCopyTarget}
                className="absolute top-4 right-4 p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-all cursor-pointer"
                title="复制翻译"
              >
                {copiedTarget ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 px-5 sm:px-6 py-4 bg-[var(--background)] border-t border-[var(--border)]">
          {/* Mode Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setTranslationMode(mode.id)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  translationMode === mode.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:border-blue-400 hover:text-[var(--foreground)]'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Translate Button */}
          <button
            onClick={handleTranslate}
            disabled={!canTranslate || isQuickTranslating}
            className="flex items-center justify-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-[var(--border)] disabled:text-[var(--muted)] text-white rounded-xl font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed shadow-sm hover:shadow-md disabled:shadow-none"
          >
            {isQuickTranslating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                翻译中
              </>
            ) : (
              '开始翻译'
            )}
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] hover:border-blue-400/50 hover:shadow-sm transition-all duration-200 cursor-default">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
            <BookMarked size={20} className="text-blue-600" />
          </div>
          <h3 className="font-medium text-[var(--foreground)] mb-1">术语识别</h3>
          <p className="text-sm text-[var(--muted)]">自动识别云服务专业术语</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] hover:border-blue-400/50 hover:shadow-sm transition-all duration-200 cursor-default">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3">
            <Code2 size={20} className="text-indigo-600" />
          </div>
          <h3 className="font-medium text-[var(--foreground)] mb-1">格式保留</h3>
          <p className="text-sm text-[var(--muted)]">保持代码块和 Markdown 格式</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] hover:border-blue-400/50 hover:shadow-sm transition-all duration-200 cursor-default">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3">
            <Brain size={20} className="text-violet-600" />
          </div>
          <h3 className="font-medium text-[var(--foreground)] mb-1">上下文理解</h3>
          <p className="text-sm text-[var(--muted)]">AI 理解技术文档语境</p>
        </div>
      </div>
    </div>
  );
};
