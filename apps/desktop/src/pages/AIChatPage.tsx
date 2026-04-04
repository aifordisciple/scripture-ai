// apps/desktop/src/pages/AIChatPage.tsx
/**
 * AI Chat page for desktop app
 *
 * Provides AI assistant features:
 * - Verse interpretation
 * - Devotional content
 * - Prayer guidance
 * - Study assistance
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, BookOpen, Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import { chatApi } from '@scripture-ai/core';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

type ChatMode = 'chat' | 'interpret' | 'devotional' | 'prayer';

interface ChatModeOption {
  id: ChatMode;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const CHAT_MODES: ChatModeOption[] = [
  { id: 'chat', label: '自由对话', icon: <Sparkles className="w-4 h-4" />, description: '与AI助手自由交流' },
  { id: 'interpret', label: '经文解读', icon: <BookOpen className="w-4 h-4" />, description: '深入理解圣经经文' },
  { id: 'devotional', label: '灵修内容', icon: <Bot className="w-4 h-4" />, description: '获取每日灵修材料' },
  { id: 'prayer', label: '祷告引导', icon: <Sparkles className="w-4 h-4" />, description: '祷告方向的指引' },
];

interface AIChatPageProps {
  context?: {
    bookId?: string;
    chapter?: number;
    verses?: number[];
  };
}

export function AIChatPage({ context }: AIChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>('chat');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Get system prompt based on mode
  const getSystemPrompt = useCallback(() => {
    const prompts: Record<ChatMode, string> = {
      chat: '你是一个友善的圣经学习助手，帮助用户理解圣经和信仰问题。',
      interpret: '你是一个圣经学者，帮助用户深入理解经文的背景、含义和应用。请用中文回答，结合历史背景和神学见解。',
      devotional: '你是一个灵修指导者，为用户提供每日灵修内容，包括经文默想、祷告要点和生活应用。',
      prayer: '你是一个祷告同伴，帮助用户找到祷告的方向和内容，引导他们与神建立更深的连接。',
    };
    return prompts[mode];
  }, [mode]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Build messages for API
      const chatMessages = [
        { role: 'system' as const, content: getSystemPrompt() },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userMessage.content },
      ];

      // Call API with streaming
      const response = await chatApi.chat(
        chatMessages.filter((m): m is { role: 'user' | 'assistant'; content: string } => m.role !== 'system'),
        {
          bookId: context?.bookId,
          chapter: context?.chapter,
          verses: context?.verses,
          mode,
        }
      );

      if (!response.ok) {
        throw new Error('请求失败');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  // Update message in place
                  setMessages(prev => prev.map(m =>
                    m.id === loadingMessage.id
                      ? { ...m, content: fullContent, isLoading: false }
                      : m
                  ));
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }

      // If no streaming, try regular response
      if (!fullContent) {
        const data = await response.json();
        fullContent = data.content || data.message || '抱歉，我无法生成回复。';
      }

      // Final update
      setMessages(prev => prev.map(m =>
        m.id === loadingMessage.id
          ? { ...m, content: fullContent, isLoading: false }
          : m
      ));

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(m =>
        m.id === loadingMessage.id
          ? { ...m, content: '抱歉，发生了错误。请检查网络连接后重试。', isLoading: false }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, mode, context, getSystemPrompt]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Copy message
  const copyMessage = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="chat-page">
      {/* Header */}
      <header className="chat-header">
        <div className="header-title">
          <Bot className="w-6 h-6" />
          <h2>AI助手</h2>
        </div>
        <div className="chat-modes">
          {CHAT_MODES.map(m => (
            <button
              key={m.id}
              className={`mode-btn ${mode === m.id ? 'active' : ''}`}
              onClick={() => setMode(m.id)}
              title={m.description}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </div>
        {messages.length > 0 && (
          <button className="clear-btn" onClick={clearChat} title="清空对话">
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </header>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <Bot className="w-16 h-16 text-muted" />
            <h3>开始对话</h3>
            <p>选择一个模式，然后输入你的问题或想法</p>
            <div className="quick-actions">
              <button onClick={() => setInput('请解释创世记1:1的含义')}>
                解读创世记1:1
              </button>
              <button onClick={() => setInput('今天有什么灵修内容推荐？')}>
                灵修推荐
              </button>
              <button onClick={() => setInput('请为我的工作祷告')}>
                祷告请求
              </button>
            </div>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-avatar">
                {message.role === 'user' ? (
                  <User className="w-5 h-5" />
                ) : (
                  <Bot className="w-5 h-5" />
                )}
              </div>
              <div className="message-content">
                {message.isLoading ? (
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : (
                  <>
                    <div className="message-text">{message.content}</div>
                    {message.role === 'assistant' && (
                      <button
                        className="copy-btn"
                        onClick={() => copyMessage(message.content, message.id)}
                      >
                        {copiedId === message.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="输入你的问题..."
          rows={3}
          disabled={isLoading}
        />
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}