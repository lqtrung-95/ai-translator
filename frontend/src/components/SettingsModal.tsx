'use client';

import { useEffect } from 'react';
import { X, Moon, Sun, Monitor, Globe, Zap, Database, Check } from 'lucide-react';
import { useTranslationStore, Theme, AIProvider } from '@/store/translation';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to apply theme
export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // System preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    theme,
    aiProvider,
    autoDetectLanguage,
    saveHistory,
    setTheme,
    setAIProvider,
    setAutoDetectLanguage,
    setSaveHistory,
  } = useTranslationStore();

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  if (!isOpen) return null;

  const providerInfo: Record<AIProvider, { status: string; statusColor: string }> = {
    gemini: { status: '已连接', statusColor: 'text-green-600' },
    claude: { status: '需要 API Key', statusColor: 'text-amber-600' },
    openai: { status: '需要 API Key', statusColor: 'text-amber-600' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">设置</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              主题
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light' as Theme, label: '浅色', icon: Sun },
                { id: 'dark' as Theme, label: '深色', icon: Moon },
                { id: 'system' as Theme, label: '系统', icon: Monitor },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    theme === option.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <option.icon size={20} />
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Provider */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              <div className="flex items-center gap-2">
                <Zap size={16} />
                AI 翻译引擎
              </div>
            </label>
            <div className="space-y-2">
              {[
                { id: 'gemini' as AIProvider, label: 'Google Gemini', desc: '推荐 · 性价比最高' },
                { id: 'claude' as AIProvider, label: 'Anthropic Claude', desc: '质量最优' },
                { id: 'openai' as AIProvider, label: 'OpenAI GPT-4', desc: '企业首选' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setAIProvider(option.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    aiProvider === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${aiProvider === option.id ? 'text-blue-700' : 'text-slate-900'}`}>
                        {option.label}
                      </p>
                      {aiProvider === option.id && (
                        <Check size={16} className="text-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{option.desc}</p>
                  </div>
                  <span className={`text-xs font-medium ${providerInfo[option.id].statusColor}`}>
                    {providerInfo[option.id].status}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              当前选择: <span className="font-medium text-blue-600">{aiProvider.toUpperCase()}</span> - 翻译时将使用此引擎
            </p>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">自动检测语言</p>
                  <p className="text-xs text-slate-500">自动识别输入文本的语言</p>
                </div>
              </div>
              <button
                onClick={() => setAutoDetectLanguage(!autoDetectLanguage)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  autoDetectLanguage ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                    autoDetectLanguage ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database size={18} className="text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">保存翻译历史</p>
                  <p className="text-xs text-slate-500">本地保存最近的翻译记录</p>
                </div>
              </div>
              <button
                onClick={() => setSaveHistory(!saveHistory)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  saveHistory ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                    saveHistory ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
