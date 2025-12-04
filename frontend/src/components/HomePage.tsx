'use client';

import { useState } from 'react';
import { Upload, Link2, Loader2, FileText, Cloud, Shield, Zap } from 'lucide-react';
import { useTranslationStore } from '@/store/translation';

interface HomePageProps {
  onTranslationStart: (data: { type: 'url' | 'file'; content: string }) => Promise<boolean>;
  isLoading: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ onTranslationStart, isLoading }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
  const { translationMode, setTranslationMode } = useTranslationStore();

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      alert('请输入有效的 URL');
      return;
    }

    const success = await onTranslationStart({
      type: 'url',
      content: inputUrl,
    });

    // Only clear URL on success
    if (success) {
      setInputUrl('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('文件大小不能超过 5MB');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('请选择文件');
      return;
    }

    // Read file as text
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await onTranslationStart({
        type: 'file',
        content: content,
      });
      // Only clear file on success
      if (success) {
        setSelectedFile(null);
      }
    };
    reader.onerror = () => {
      alert('读取文件失败');
    };
    reader.readAsText(selectedFile);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)] tracking-tight">
          文档翻译
        </h2>
        <p className="text-[var(--muted)] text-sm sm:text-base max-w-lg mx-auto">
          输入云服务文档 URL 或上传文件，AI 将自动解析并翻译
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeTab === 'url'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-500/10'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
            }`}
          >
            <Link2 size={18} />
            输入 URL
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeTab === 'file'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-500/10'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
            }`}
          >
            <Upload size={18} />
            上传文件
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {activeTab === 'url' ? (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  文档链接
                </label>
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://docs.aws.amazon.com/..."
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <p className="mt-2 text-xs text-[var(--muted)]">
                  支持 AWS、GCP、OCI、Kubernetes 等云服务官方文档
                </p>
                <p className="mt-1 text-xs text-amber-600">
                  💡 请输入具体文档页面链接，例如：docs.aws.amazon.com/lambda/latest/dg/welcome.html
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !inputUrl.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-[var(--border)] disabled:text-[var(--muted)] text-white rounded-xl font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    解析中...
                  </>
                ) : (
                  '开始翻译'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleFileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  选择文件
                </label>
                <label
                  htmlFor="file-input"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[var(--border)] rounded-xl hover:border-blue-400 hover:bg-blue-500/10 cursor-pointer transition-all duration-200"
                >
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".html,.htm,.md,.markdown,.txt,.text"
                    className="hidden"
                    id="file-input"
                  />
                  <FileText size={32} className="text-[var(--muted)] mb-3" />
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {selectedFile ? selectedFile.name : '点击或拖动文件到此'}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    支持 HTML, Markdown, TXT 格式 · 最大 5MB
                  </p>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || !selectedFile}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-[var(--border)] disabled:text-[var(--muted)] text-white rounded-xl font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    处理中...
                  </>
                ) : (
                  '开始翻译'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Mode Selector */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 border-t border-[var(--border)]">
          <p className="text-sm font-medium text-[var(--foreground)] mb-3">翻译模式</p>
          <div className="grid grid-cols-3 gap-3">
            <ModeOption
              title="专业精确"
              description="技术文档"
              selected={translationMode === 'professional'}
              onClick={() => setTranslationMode('professional')}
            />
            <ModeOption
              title="通俗解释"
              description="初学者"
              selected={translationMode === 'casual'}
              onClick={() => setTranslationMode('casual')}
            />
            <ModeOption
              title="总结模式"
              description="关键要点"
              selected={translationMode === 'summary'}
              onClick={() => setTranslationMode('summary')}
            />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] hover:border-blue-400/50 hover:shadow-sm transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
            <Zap size={20} className="text-amber-600" />
          </div>
          <h3 className="font-medium text-[var(--foreground)] mb-1">快速解析</h3>
          <p className="text-sm text-[var(--muted)]">10秒内自动提取文档结构</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] hover:border-blue-400/50 hover:shadow-sm transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
            <Cloud size={20} className="text-blue-600" />
          </div>
          <h3 className="font-medium text-[var(--foreground)] mb-1">云术语库</h3>
          <p className="text-sm text-[var(--muted)]">内置 AWS/GCP/OCI 专业术语</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] hover:border-blue-400/50 hover:shadow-sm transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
            <Shield size={20} className="text-green-600" />
          </div>
          <h3 className="font-medium text-[var(--foreground)] mb-1">隐私安全</h3>
          <p className="text-sm text-[var(--muted)]">文档加密传输，不存储内容</p>
        </div>
      </div>
    </div>
  );
};

interface ModeOptionProps {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

const ModeOption: React.FC<ModeOptionProps> = ({ title, description, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
      selected
        ? 'border-blue-500 bg-blue-500/10'
        : 'border-[var(--border)] bg-[var(--surface)] hover:border-blue-400/50'
    }`}
  >
    <p className={`font-medium text-sm ${selected ? 'text-blue-600' : 'text-[var(--foreground)]'}`}>
      {title}
    </p>
    <p className="text-xs text-[var(--muted)] mt-0.5">{description}</p>
  </button>
);
