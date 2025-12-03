'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText?: string;
  onSendMessage?: (message: string) => Promise<string>;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onClose,
  selectedText,
  onSendMessage,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 调用外部 API 或本地处理
      const response = onSendMessage
        ? await onSendMessage(inputValue)
        : await generateResponse(inputValue, selectedText);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '抱歉，处理请求时出错了。请重试。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    '解释这段话是什么意思',
    '给我一个实际例子',
    '用简单的语言重新解释',
    '相关的术语有哪些',
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-2xl flex flex-col z-50">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">AI 助手</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition"
        >
          <X size={20} className="text-gray-600" />
        </button>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <MessageCircle size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-600 font-semibold mb-4">询问任何相关问题</p>
            <div className="space-y-2">
              {suggestedQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputValue(question)}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  • {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs rounded-lg px-4 py-2 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <span
                  className={`text-xs mt-1 block ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 size={16} className="text-gray-600 animate-spin" />
              <span className="text-sm text-gray-600">思考中...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-gray-200 p-4 space-y-3"
      >
        {selectedText && (
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-xs font-semibold text-yellow-900 mb-1">选中的文本</p>
            <p className="text-xs text-yellow-800 line-clamp-2">{selectedText}</p>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入你的问题..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

// 简单的响应生成函数（演示用）
async function generateResponse(question: string, context?: string): Promise<string> {
  // 这里会调用实际的 API
  // 目前返回模拟响应
  return `这是对 "${question}" 的回答。${context ? `相关上下文: ${context.substring(0, 50)}...` : ''}`;
}
