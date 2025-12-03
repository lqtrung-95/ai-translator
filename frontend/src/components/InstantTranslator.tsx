"use client";

import { useCallback, useMemo } from 'react';
import { Loader2, ArrowLeftRight, Volume2, Copy, History } from 'lucide-react';
import { useTranslationStore } from '@/store/translation';
import { apiClient } from '@/api/client';
import { TranslationMode } from '@/types';

const languages = [
  { code: 'en', label: '英语' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日语' },
  { code: 'ko', label: '韩语' },
  { code: 'fr', label: '法语' },
  { code: 'de', label: '德语' },
];

export const InstantTranslator = () => {
  const {
    quickSourceText,
    quickTranslatedText,
    quickSourceLanguage,
    quickTargetLanguage,
    translationMode,
    isQuickTranslating,
    quickError,
    setQuickSourceText,
    setQuickTranslatedText,
    setQuickLanguages,
    setTranslationMode,
    setQuickError,
    setIsQuickTranslating,
    setLastQuickResult,
  } = useTranslationStore();

  const swapLanguages = () => {
    setQuickLanguages(quickTargetLanguage, quickSourceLanguage);
    setQuickSourceText(quickTranslatedText || quickSourceText);
    setQuickTranslatedText('');
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
      });

      // 修复：apiClient 拦截器已经返回了 response.data，所以这里不需要再访问 .data
      // 我们将其转换为 any 以绕过类型检查，或者应该更新 apiClient 的类型定义
      const data = response as any;

      setQuickTranslatedText(data.translated);
      setLastQuickResult({
        translated: data.translated,
        confidence: data.confidence,
        provider: (data.provider || 'gemini') as 'gemini' | 'claude' | 'openai',
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
    setQuickError,
    setIsQuickTranslating,
    setQuickTranslatedText,
    setLastQuickResult,
  ]);

  const canTranslate = useMemo(() => quickSourceText.trim().length > 0, [quickSourceText]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <LanguageSelector
            label="源语言"
            value={quickSourceLanguage}
            onChange={(value) => setQuickLanguages(value, quickTargetLanguage)}
          />
          <button
            onClick={swapLanguages}
            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <ArrowLeftRight size={20} />
          </button>
          <LanguageSelector
            label="目标语言"
            value={quickTargetLanguage}
            onChange={(value) => setQuickLanguages(quickSourceLanguage, value)}
          />
        </div>

        <textarea
          value={quickSourceText}
          onChange={(e) => setQuickSourceText(e.target.value)}
          placeholder="在这里输入或粘贴要翻译的文本..."
          className="w-full min-h-[160px] border border-gray-200 rounded-2xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {quickSourceText.length} / 2000 字符
          </div>
          <div className="flex items-center gap-2">
            <ModeButton
              label="专业精确"
              active={translationMode === 'professional'}
              onClick={() => setTranslationMode('professional')}
            />
            <ModeButton
              label="通俗解释"
              active={translationMode === 'casual'}
              onClick={() => setTranslationMode('casual')}
            />
            <ModeButton
              label="总结模式"
              active={translationMode === 'summary'}
              onClick={() => setTranslationMode('summary')}
            />
            <button
              onClick={handleTranslate}
              disabled={!canTranslate || isQuickTranslating}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {isQuickTranslating ? <Loader2 className="animate-spin" size={16} /> : '翻译'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 min-h-[200px]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">翻译结果</div>
          <div className="flex items-center gap-2 text-gray-500">
            <button className="p-2 hover:text-blue-600" onClick={() => quickTranslatedText && navigator.clipboard.writeText(quickTranslatedText)}>
              <Copy size={18} />
            </button>
            <button className="p-2 hover:text-blue-600">
              <Volume2 size={18} />
            </button>
            <button className="p-2 hover:text-blue-600">
              <History size={18} />
            </button>
          </div>
        </div>
        {quickError ? (
          <div className="text-red-500 text-sm">{quickError}</div>
        ) : (
          <p className="text-gray-900 text-lg whitespace-pre-wrap">
            {quickTranslatedText || '翻译结果将显示在这里'}
          </p>
        )}
      </div>
    </div>
  );
};

const LanguageSelector = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) => (
  <div className="flex flex-col">
    <span className="text-sm text-gray-500 mb-1">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-900"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  </div>
);

const ModeButton = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-sm ${
      active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
    }`}
  >
    {label}
  </button>
);
