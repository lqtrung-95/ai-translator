'use client';

import { useEffect } from 'react';
import { X, Moon, Sun, Monitor, Zap, Check } from 'lucide-react';
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
    groq: { status: '已连接', statusColor: 'text-green-600' },
    gemini: { status: '需要 API Key', statusColor: 'text-amber-600' },
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
      <div className="relative bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">设置</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
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
                      ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                      : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]'
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
            <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
              <div className="flex items-center gap-2">
                <Zap size={16} />
                AI 翻译引擎
              </div>
            </label>
            <div className="space-y-2">
              {[
                { id: 'groq' as AIProvider, label: 'Groq (Llama 3.3)', desc: '推荐 · 免费额度最高' },
                { id: 'gemini' as AIProvider, label: 'Google Gemini', desc: '性价比高' },
                { id: 'claude' as AIProvider, label: 'Anthropic Claude', desc: '质量最优' },
                { id: 'openai' as AIProvider, label: 'OpenAI GPT-4', desc: '企业首选' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setAIProvider(option.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    aiProvider === option.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-[var(--border)] hover:border-[var(--muted)]'
                  }`}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${aiProvider === option.id ? 'text-blue-600' : 'text-[var(--foreground)]'}`}>
                        {option.label}
                      </p>
                      {aiProvider === option.id && (
                        <Check size={16} className="text-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)]">{option.desc}</p>
                  </div>
                  <span className={`text-xs font-medium ${providerInfo[option.id].statusColor}`}>
                    {providerInfo[option.id].status}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">
              当前选择: <span className="font-medium text-blue-600">{aiProvider.toUpperCase()}</span> - 翻译时将使用此引擎
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[var(--background)] border-t border-[var(--border)]">
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
