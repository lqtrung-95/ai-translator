'use client';

import { useState, useEffect } from 'react';
import { X, Search, Plus, BookOpen, Loader2 } from 'lucide-react';
import { GlossaryTerm } from '@/types';
import { useTranslationStore } from '@/store/translation';
import { apiClient } from '@/api/client';

interface GlossaryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTerms?: GlossaryTerm[];
  onTermSelect?: (term: GlossaryTerm) => void;
}

export const GlossaryPanel: React.FC<GlossaryPanelProps> = ({
  isOpen,
  onClose,
  defaultTerms = [],
  onTermSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTerm, setNewTerm] = useState<Partial<GlossaryTerm>>({});
  const [backendTerms, setBackendTerms] = useState<GlossaryTerm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { customGlossary, addCustomTerm } = useTranslationStore();

  // 从后端加载术语
  useEffect(() => {
    if (isOpen) {
      const fetchTerms = async () => {
        setIsLoading(true);
        try {
          const response = await apiClient.getGlossary(100, 0);
          // @ts-ignore - 拦截器处理
          const data = response as any;
          if (data && data.terms) {
            setBackendTerms(data.terms);
          }
        } catch (error) {
          console.error('Failed to fetch glossary terms:', error);
          // 如果失败，回退到默认的几个术语
          setBackendTerms(DEFAULT_GLOSSARY);
        } finally {
          setIsLoading(false);
        }
      };
      fetchTerms();
    }
  }, [isOpen]);

  const allTerms = [...backendTerms, ...customGlossary];

  const filteredTerms = allTerms.filter((term) => {
    const matchesSearch =
      term.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.chinese.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(allTerms.map((t) => t.category)));

  const handleAddTerm = () => {
    if (newTerm.english && newTerm.chinese && newTerm.category) {
      const term: GlossaryTerm = {
        id: Date.now().toString(),
        english: newTerm.english,
        chinese: newTerm.chinese,
        category: newTerm.category,
        explanation: newTerm.explanation || '',
        examples: newTerm.examples || [],
      };
      addCustomTerm(term);
      setNewTerm({});
      setShowAddForm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-96 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-40">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">术语库</h2>
          <span className="ml-auto text-xs text-gray-500">
            {filteredTerms.length} / {allTerms.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="p-4 space-y-3 border-b border-gray-200">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索术语..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 分类筛选 */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`text-xs px-3 py-1 rounded-full transition ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1 rounded-full transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 术语列表 */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500 gap-2">
            <Loader2 className="animate-spin" size={20} />
            <span>加载术语库...</span>
          </div>
        ) : filteredTerms.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            未找到匹配的术语
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTerms.map((term) => (
              <TermCard
                key={term.id}
                term={term}
                isCustom={customGlossary.some((t) => t.id === term.id)}
                onSelect={() => onTermSelect?.(term)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 底部操作 */}
      <div className="border-t border-gray-200 p-3">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-semibold"
        >
          <Plus size={16} />
          添加自定义术语
        </button>

        {showAddForm && (
          <div className="mt-3 space-y-2 bg-blue-50 p-3 rounded-lg">
            <input
              type="text"
              placeholder="英文"
              value={newTerm.english || ''}
              onChange={(e) =>
                setNewTerm({ ...newTerm, english: e.target.value })
              }
              className="w-full px-2 py-1 border border-blue-200 rounded text-sm"
            />
            <input
              type="text"
              placeholder="中文"
              value={newTerm.chinese || ''}
              onChange={(e) =>
                setNewTerm({ ...newTerm, chinese: e.target.value })
              }
              className="w-full px-2 py-1 border border-blue-200 rounded text-sm"
            />
            <select
              value={newTerm.category || ''}
              onChange={(e) =>
                setNewTerm({ ...newTerm, category: e.target.value })
              }
              className="w-full px-2 py-1 border border-blue-200 rounded text-sm"
            >
              <option value="">选择分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAddTerm}
                className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewTerm({});
                }}
                className="flex-1 px-2 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface TermCardProps {
  term: GlossaryTerm;
  isCustom: boolean;
  onSelect: () => void;
}

const TermCard: React.FC<TermCardProps> = ({ term, isCustom, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900">{term.english}</p>
          <p className="text-xs text-gray-600">{term.chinese}</p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded ${
            isCustom
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {isCustom ? '自定义' : term.category}
        </span>
      </div>

      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
          <p className="text-xs text-gray-700">{term.explanation}</p>
          {term.examples && term.examples.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">例子:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {term.examples.map((ex, idx) => (
                  <li key={idx} className="ml-3">
                    • {ex}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 默认术语库
const DEFAULT_GLOSSARY: GlossaryTerm[] = [
  {
    id: '1',
    english: 'VPC',
    chinese: '虚拟私有云',
    category: 'infrastructure',
    explanation: 'Virtual Private Cloud 是云服务提供商提供的隔离网络环境',
    examples: ['AWS VPC', 'GCP VPC Network'],
  },
  {
    id: '2',
    english: 'IAM',
    chinese: '身份和访问管理',
    category: 'security',
    explanation: 'Identity and Access Management 用于管理用户权限和访问控制',
    examples: ['AWS IAM Roles', 'GCP IAM Policies'],
  },
  {
    id: '3',
    english: 'RDS',
    chinese: '关系数据库服务',
    category: 'database',
    explanation: 'Relational Database Service 是托管的数据库服务',
    examples: ['AWS RDS for MySQL', 'AWS RDS for PostgreSQL'],
  },
  {
    id: '4',
    english: 'S3',
    chinese: '简单存储服务',
    category: 'storage',
    explanation: 'Simple Storage Service 是对象存储服务',
    examples: ['存储文件、图片、视频等'],
  },
  {
    id: '5',
    english: 'Lambda',
    chinese: '无服务器计算',
    category: 'compute',
    explanation: '允许运行代码而无需管理服务器的服务',
    examples: ['事件驱动的函数执行'],
  },
  {
    id: '6',
    english: 'API Gateway',
    chinese: 'API 网关',
    category: 'integration',
    explanation: '用于创建、发布和管理 API 的服务',
    examples: ['REST API', 'WebSocket API'],
  },
  {
    id: '7',
    english: 'ACL',
    chinese: '访问控制列表',
    category: 'security',
    explanation: '定义允许或拒绝特定操作的规则',
    examples: ['VPC ACLs', 'S3 Bucket ACLs'],
  },
  {
    id: '8',
    english: 'Firewall',
    chinese: '防火墙',
    category: 'security',
    explanation: '网络安全工具，控制进出流量',
    examples: ['AWS Security Groups', 'Azure Network Security Groups'],
  },
];
