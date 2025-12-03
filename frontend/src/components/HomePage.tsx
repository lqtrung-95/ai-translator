'use client';

import { useState } from 'react';
import { Upload, Link2, Loader2, FileText, Cloud, Shield, Zap } from 'lucide-react';
import { useTranslationStore } from '@/store/translation';

interface HomePageProps {
  onTranslationStart: (data: { type: 'url' | 'file'; content: string }) => void;
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

    onTranslationStart({
      type: 'url',
      content: inputUrl,
    });

    setInputUrl('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('请选择文件');
      return;
    }

    onTranslationStart({
      type: 'file',
      content: selectedFile.name,
    });

    setSelectedFile(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
          文档翻译
        </h2>
        <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
          输入云服务文档 URL 或上传文件，AI 将自动解析并翻译
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeTab === 'url'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Link2 size={18} />
            输入 URL
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeTab === 'file'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  文档链接
                </label>
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://docs.aws.amazon.com/..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <p className="mt-2 text-xs text-slate-500">
                  支持 AWS、GCP、Azure、Kubernetes 等云服务官方文档
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !inputUrl.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  选择文件
                </label>
                <label
                  htmlFor="file-input"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all duration-200"
                >
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.html,.md,.markdown,.docx"
                    className="hidden"
                    id="file-input"
                  />
                  <FileText size={32} className="text-slate-400 mb-3" />
                  <p className="text-sm font-medium text-slate-700">
                    {selectedFile ? selectedFile.name : '点击或拖动文件到此'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    支持 PDF, HTML, Markdown, Word
                  </p>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || !selectedFile}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
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
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 border-t border-slate-100">
          <p className="text-sm font-medium text-slate-700 mb-3">翻译模式</p>
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
          <p className="text-sm text-[var(--muted)]">内置 AWS/GCP/Azure 专业术语</p>
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
        ? 'border-blue-500 bg-blue-50'
        : 'border-slate-200 bg-white hover:border-slate-300'
    }`}
  >
    <p className={`font-medium text-sm ${selected ? 'text-blue-700' : 'text-slate-900'}`}>
      {title}
    </p>
    <p className="text-xs text-slate-500 mt-0.5">{description}</p>
  </button>
);
