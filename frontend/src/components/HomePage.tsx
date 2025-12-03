'use client';

import { useState } from 'react';
import { Upload, Link2, Loader2, FileText } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* 导航栏 */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">文档翻译</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-600 hover:text-gray-900">文档</button>
          <button className="text-gray-600 hover:text-gray-900">历史</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            登录
          </button>
        </div>
      </nav>

      {/* 主体内容 */}
      <div className="max-w-4xl mx-auto px-4 py-20">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            专业的云文档 AI 翻译
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            快速准确地翻译 AWS、GCP、Azure 等云服务官方文档
          </p>
          <p className="text-gray-500">支持自动术语识别、代码块保留、格式完整</p>
        </div>

        {/* 输入卡片 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          {/* 标签页 */}
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('url')}
              className={`px-4 py-3 font-semibold transition ${
                activeTab === 'url'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Link2 size={18} />
                输入 URL
              </div>
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`px-4 py-3 font-semibold transition ${
                activeTab === 'file'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Upload size={18} />
                上传文件
              </div>
            </button>
          </div>

          {/* URL 输入 */}
          {activeTab === 'url' && (
            <form onSubmit={handleUrlSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    文档链接
                  </label>
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="例: https://docs.aws.amazon.com/..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    支持 AWS、GCP、Azure 等云厂商的官方文档链接
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              </div>
            </form>
          )}

          {/* 文件上传 */}
          {activeTab === 'file' && (
            <form onSubmit={handleFileSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择文件
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.html,.md,.markdown,.docx"
                      className="hidden"
                      id="file-input"
                    />
                    <label
                      htmlFor="file-input"
                      className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer bg-gray-50 hover:bg-blue-50 transition"
                    >
                      <div className="text-center">
                        <FileText size={32} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700">
                          {selectedFile ? selectedFile.name : '点击或拖动文件到此'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          支持 PDF, HTML, Markdown, Word 格式
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !selectedFile}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              </div>
            </form>
          )}

          {/* 翻译选项 */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-4">翻译模式</p>
            <div className="grid grid-cols-3 gap-4">
              <ModeOption
                title="专业精确"
                description="适合技术文档翻译"
                selected={translationMode === 'professional'}
                onClick={() => setTranslationMode('professional')}
              />
              <ModeOption
                title="通俗解释"
                description="适合初学者理解"
                selected={translationMode === 'casual'}
                onClick={() => setTranslationMode('casual')}
              />
              <ModeOption
                title="总结模式"
                description="提取关键要点"
                selected={translationMode === 'summary'}
                onClick={() => setTranslationMode('summary')}
              />
            </div>
          </div>
        </div>

        {/* 功能特性 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '⚡',
              title: '快速解析',
              desc: '10秒内自动提取文档结构和内容',
            },
            {
              icon: '🎯',
              title: '精准翻译',
              description: '云行业专属术语库，准确率 >90%',
            },
            {
              icon: '🔒',
              title: '隐私保护',
              desc: '文档永不存储，加密传输',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
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
    className={`p-4 rounded-lg border-2 transition text-left ${
      selected
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 bg-white hover:border-gray-300'
    }`}
  >
    <p className="font-semibold text-gray-900">{title}</p>
    <p className="text-xs text-gray-600 mt-1">{description}</p>
  </button>
);
