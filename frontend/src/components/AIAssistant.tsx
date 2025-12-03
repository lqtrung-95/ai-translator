'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const suggestions = [
  '解释 VPC 和 Subnet 的区别',
  '什么是 IAM Role？',
  'Lambda 冷启动如何优化？',
  'S3 存储类型有哪些？',
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是 AI 翻译助手，可以帮助你理解云服务文档中的技术概念、解释术语，或回答翻译相关问题。',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(input),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="w-96 h-[calc(100vh-64px)] bg-white border-l border-slate-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">AI 助手</h3>
            <p className="text-xs text-slate-500">解答技术问题</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                message.role === 'user'
                  ? 'bg-blue-600'
                  : 'bg-gradient-to-br from-violet-500 to-purple-600'
              }`}
            >
              {message.role === 'user' ? (
                <User size={16} className="text-white" />
              ) : (
                <Bot size={16} className="text-white" />
              )}
            </div>
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-slate-100 text-slate-800 rounded-bl-md'
              }`}
            >
              <div className="markdown-body text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-slate-500" />
                <span className="text-sm text-slate-500">思考中...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-slate-500 mb-2">快速提问</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs transition-colors cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入问题..."
            rows={1}
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

function generateMockResponse(question: string): string {
  const lowerQ = question.toLowerCase();

  if (lowerQ.includes('vpc') || lowerQ.includes('subnet')) {
    return `**VPC (Virtual Private Cloud)** 是您在 AWS 云中的私有虚拟网络，相当于传统数据中心的网络。

**Subnet (子网)** 是 VPC 内的 IP 地址范围分段：
• 公有子网：可直接访问互联网
• 私有子网：无法直接访问互联网

简单来说：VPC 是整个网络，Subnet 是网络中的分区。`;
  }

  if (lowerQ.includes('iam') || lowerQ.includes('role')) {
    return `**IAM Role** 是一种 AWS 身份，具有特定权限策略。

与用户不同，Role 没有长期凭证，而是提供临时安全凭证。

常见用途：
• EC2 实例访问 S3
• Lambda 函数调用其他 AWS 服务
• 跨账户访问`;
  }

  if (lowerQ.includes('lambda') || lowerQ.includes('冷启动')) {
    return `**Lambda 冷启动优化方法：**

1. **预置并发** - 保持实例预热
2. **减小部署包大小** - 加快加载
3. **选择合适的运行时** - Python/Node.js 启动较快
4. **优化初始化代码** - 将耗时操作移到处理函数内
5. **使用 SnapStart** (Java) - 显著减少启动时间`;
  }

  if (lowerQ.includes('s3') || lowerQ.includes('存储')) {
    return `**S3 存储类型：**

• **Standard** - 频繁访问，高可用
• **Intelligent-Tiering** - 自动分层优化成本
• **Standard-IA** - 不频繁访问，较低成本
• **One Zone-IA** - 单可用区，更低成本
• **Glacier** - 归档存储，检索需时间
• **Glacier Deep Archive** - 最低成本，检索最慢`;
  }

  return `这是一个很好的问题！

在云服务文档翻译中，理解上下文非常重要。建议您：

1. 查看相关术语的官方定义
2. 参考术语库中的标准翻译
3. 结合具体场景理解含义

如果您有更具体的问题，请随时提问！`;
}
