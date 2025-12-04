'use client';

import { useState, useEffect } from 'react';
import { X, Search, Plus, Edit2, Trash2, Check, BookOpen, Loader2 } from 'lucide-react';
import { apiClient } from '@/api/client';
import { GlossaryTerm } from '@/types';

interface GlossaryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'sidebar' | 'modal';
}

const categories = [
  { id: 'all', label: '全部', color: 'slate' },
  { id: 'infrastructure', label: '基础设施', color: 'blue' },
  { id: 'compute', label: '计算', color: 'violet' },
  { id: 'storage', label: '存储', color: 'amber' },
  { id: 'networking', label: '网络', color: 'green' },
  { id: 'security', label: '安全', color: 'red' },
];

export const GlossaryPanel: React.FC<GlossaryPanelProps> = ({ isOpen, onClose, mode = 'sidebar' }) => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([
    { id: '1', english: 'VPC', chinese: '虚拟私有云', category: 'networking', explanation: 'Virtual Private Cloud' },
    { id: '2', english: 'EC2', chinese: '弹性计算云', category: 'compute', explanation: 'Elastic Compute Cloud' },
    { id: '3', english: 'S3', chinese: '简单存储服务', category: 'storage', explanation: 'Simple Storage Service' },
    { id: '4', english: 'IAM', chinese: '身份访问管理', category: 'security', explanation: 'Identity and Access Management' },
    { id: '5', english: 'Lambda', chinese: 'Lambda 函数', category: 'compute', explanation: 'Serverless compute service' },
    { id: '6', english: 'CloudFront', chinese: '内容分发网络', category: 'networking', explanation: 'Content Delivery Network' },
    { id: '7', english: 'RDS', chinese: '关系数据库服务', category: 'storage', explanation: 'Relational Database Service' },
    { id: '8', english: 'EKS', chinese: '弹性Kubernetes服务', category: 'infrastructure', explanation: 'Elastic Kubernetes Service' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);
  const [newTerm, setNewTerm] = useState({
    english: '',
    chinese: '',
    category: 'infrastructure',
    explanation: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchTerms();
    }
  }, [isOpen]);

  const getDefaultTerms = (): GlossaryTerm[] => [
    { id: '1', english: 'VPC', chinese: '虚拟私有云', category: 'networking', explanation: 'Virtual Private Cloud' },
    { id: '2', english: 'EC2', chinese: '弹性计算云', category: 'compute', explanation: 'Elastic Compute Cloud' },
    { id: '3', english: 'S3', chinese: '简单存储服务', category: 'storage', explanation: 'Simple Storage Service' },
    { id: '4', english: 'IAM', chinese: '身份访问管理', category: 'security', explanation: 'Identity and Access Management' },
    { id: '5', english: 'Lambda', chinese: 'Lambda 函数', category: 'compute', explanation: 'Serverless compute service' },
    { id: '6', english: 'CloudFront', chinese: '内容分发网络', category: 'networking', explanation: 'Content Delivery Network' },
    { id: '7', english: 'RDS', chinese: '关系数据库服务', category: 'storage', explanation: 'Relational Database Service' },
    { id: '8', english: 'EKS', chinese: '弹性Kubernetes服务', category: 'infrastructure', explanation: 'Elastic Kubernetes Service' },
  ];

  const fetchTerms = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getGlossary();
      // Ensure response is an array
      if (Array.isArray(response)) {
        setTerms(response as GlossaryTerm[]);
      } else {
        setTerms(getDefaultTerms());
      }
    } catch (error) {
      console.error('Failed to fetch glossary:', error);
      setTerms(getDefaultTerms());
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTerm = async () => {
    if (!newTerm.english || !newTerm.chinese) return;

    try {
      const response = await apiClient.addGlossaryTerm(newTerm) as unknown as GlossaryTerm;
      setTerms((prev) => [...prev, response]);
      setNewTerm({ english: '', chinese: '', category: 'infrastructure', explanation: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add term:', error);
      // Add locally on error
      const mockTerm: GlossaryTerm = {
        id: Date.now().toString(),
        ...newTerm,
      };
      setTerms((prev) => [...prev, mockTerm]);
      setNewTerm({ english: '', chinese: '', category: 'infrastructure', explanation: '' });
      setShowAddForm(false);
    }
  };

  const handleDeleteTerm = async (id: string) => {
    try {
      await apiClient.deleteGlossaryTerm(id);
      setTerms((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete term:', error);
      setTerms((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const filteredTerms = terms.filter((term) => {
    const matchesSearch =
      term.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.chinese.includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.color || 'slate';
  };

  if (!isOpen) return null;

  // Modal mode for mobile
  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-lg max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <BookOpen size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">术语库</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{terms.length} 个术语</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 space-y-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索术语..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Terms List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 size={24} className="animate-spin text-blue-600" />
              </div>
            ) : filteredTerms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <BookOpen size={32} className="mb-2" />
                <p className="text-sm">没有找到术语</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredTerms.map((term) => (
                  <div
                    key={term.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900 dark:text-white">{term.english}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-blue-600 font-medium">{term.chinese}</span>
                    </div>
                    {term.explanation && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{term.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Sidebar mode for desktop
  return (
    <aside className="w-96 h-[calc(100vh-64px)] bg-white border-l border-slate-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">术语库</h3>
            <p className="text-xs text-slate-500">{terms.length} 个术语</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      {/* Search & Add */}
      <div className="p-4 space-y-3 border-b border-slate-100">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索术语..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all cursor-pointer"
        >
          <Plus size={18} />
          添加术语
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={newTerm.english}
              onChange={(e) => setNewTerm({ ...newTerm, english: e.target.value })}
              placeholder="英文术语"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <input
              type="text"
              value={newTerm.chinese}
              onChange={(e) => setNewTerm({ ...newTerm, chinese: e.target.value })}
              placeholder="中文翻译"
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <select
            value={newTerm.category}
            onChange={(e) => setNewTerm({ ...newTerm, category: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            {categories.filter((c) => c.id !== 'all').map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newTerm.explanation}
            onChange={(e) => setNewTerm({ ...newTerm, explanation: e.target.value })}
            placeholder="说明 (可选)"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddTerm}
              disabled={!newTerm.english || !newTerm.chinese}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Check size={16} />
              添加
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Terms List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={24} className="animate-spin text-blue-600" />
          </div>
        ) : filteredTerms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <BookOpen size={32} className="mb-2" />
            <p className="text-sm">没有找到术语</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredTerms.map((term) => (
              <div
                key={term.id}
                className="group p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all cursor-default"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900">{term.english}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-blue-600 font-medium">{term.chinese}</span>
                    </div>
                    {term.explanation && (
                      <p className="text-xs text-slate-500 truncate">{term.explanation}</p>
                    )}
                    <span
                      className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-${getCategoryColor(term.category)}-100 text-${getCategoryColor(term.category)}-700`}
                    >
                      {categories.find((c) => c.id === term.category)?.label || term.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDeleteTerm(term.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
