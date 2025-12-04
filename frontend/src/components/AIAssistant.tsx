'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiClient } from '@/api/client';
import { useTranslationStore } from '@/store/translation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'sidebar' | 'modal';
}

const suggestions = [
  '解释 VPC 和 Subnet 的区别',
  '什么是 IAM Role？',
  'Lambda 冷启动如何优化？',
  'S3 存储类型有哪些？',
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, mode = 'sidebar' }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '我是一名专业的云服务技术助手，旨在为您提供云服务相关的技术支持和解答。',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { aiProvider } = useTranslationStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '我是一名专业的云服务技术助手，旨在为您提供云服务相关的技术支持和解答。',
        timestamp: new Date(),
      },
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation context for the AI
      const conversationHistory = messages
        .slice(-6) // Last 6 messages for context
        .map(m => `${m.role === 'user' ? '用户' : 'AI助手'}: ${m.content}`)
        .join('\n');

      // Use the translation API with a special prompt for chat
      const response = await apiClient.instantTranslate({
        text: `你是一个专业的云服务技术助手。请用中文回答用户的问题。保持回答简洁、专业、有帮助。

对话历史：
${conversationHistory}

用户新问题：${userInput}

请直接回答用户的问题，不要重复问题：`,
        mode: 'professional',
        sourceLanguage: 'zh',
        targetLanguage: 'zh',
        provider: aiProvider,
      });

      const data = response as any;
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.translated || '抱歉，我无法处理这个请求。请稍后再试。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI Assistant error:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，出现了一些问题。请稍后再试。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
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

  // Modal mode for mobile
  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-lg max-h-[85vh] bg-[var(--surface)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">AI 助手</h3>
                <p className="text-xs text-[var(--muted)]">解答技术问题</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-2 rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="清空对话"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
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
                      : 'bg-[var(--background)] text-[var(--foreground)] rounded-bl-md'
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
                <div className="bg-[var(--background)] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-[var(--muted)]" />
                    <span className="text-sm text-[var(--muted)]">思考中...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-[var(--muted)] mb-2">快速提问</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1.5 bg-[var(--background)] hover:bg-blue-500/10 text-[var(--foreground)] hover:text-blue-600 rounded-full text-xs transition-colors cursor-pointer border border-[var(--border)]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-[var(--border)]">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入问题..."
                rows={1}
                className="flex-1 px-4 py-3 border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] bg-[var(--background)] placeholder-[var(--muted)] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                style={{ maxHeight: '120px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-[var(--border)] text-white disabled:text-[var(--muted)] rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar mode for desktop
  return (
    <aside className="w-96 h-[calc(100vh-64px)] bg-[var(--surface)] border-l border-[var(--border)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">AI 助手</h3>
            <p className="text-xs text-[var(--muted)]">解答技术问题</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className="p-2 rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="清空对话"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
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
                  : 'bg-[var(--background)] text-[var(--foreground)] rounded-bl-md'
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
            <div className="bg-[var(--background)] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-[var(--muted)]" />
                <span className="text-sm text-[var(--muted)]">思考中...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-[var(--muted)] mb-2">快速提问</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 bg-[var(--background)] hover:bg-blue-500/10 text-[var(--foreground)] hover:text-blue-600 rounded-full text-xs transition-colors cursor-pointer border border-[var(--border)]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入问题..."
            rows={1}
            className="flex-1 px-4 py-3 border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] bg-[var(--background)] placeholder-[var(--muted)] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-[var(--border)] text-white disabled:text-[var(--muted)] rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

