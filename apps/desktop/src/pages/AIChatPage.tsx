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
import { invoke } from '@tauri-apps/api/core';
import { Send, Bot, User, BookOpen, Sparkles, RefreshCw, Copy, Check, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { chatApi } from '@scripture-ai/core';
import ReactMarkdown from 'react-markdown';
import { getAuthAdapter } from '@scripture-ai/native';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  mode: string;
  created_at: string;
  updated_at?: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
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

  // Chat session state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSessionList, setShowSessionList] = useState(false);
  const [userId, setUserId] = useState<string>('local-user');

  // Get user ID on mount
  useEffect(() => {
    async function loadUserId() {
      try {
        const auth = getAuthAdapter();
        const id = await auth.getUserId?.() || 'local-user';
        setUserId(id);
      } catch {
        setUserId('local-user');
      }
    }
    loadUserId();
  }, []);

  // Load sessions on mount
  useEffect(() => {
    if (userId) {
      loadSessions();
    }
  }, [userId]);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId]);

  const loadSessions = async () => {
    try {
      const loadedSessions = await invoke<ChatSession[]>('db_get_chat_sessions', { userId });
      setSessions(loadedSessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const loadedMessages = await invoke<ChatMessage[]>('db_get_chat_messages', { sessionId });
      const convertedMessages: Message[] = loadedMessages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.created_at),
      }));
      setMessages(convertedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const createNewSession = async () => {
    const sessionId = `session-${Date.now()}`;
    const session: ChatSession = {
      id: sessionId,
      user_id: userId,
      title: '新对话',
      mode: mode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await invoke('db_save_chat_session', { session });
      setSessions(prev => [session, ...prev]);
      setCurrentSessionId(sessionId);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await invoke('db_delete_chat_session', { id: sessionId });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const saveMessage = async (sessionId: string, message: Message) => {
    try {
      const chatMessage: ChatMessage = {
        id: message.id,
        session_id: sessionId,
        role: message.role,
        content: message.content,
        created_at: message.timestamp.toISOString(),
      };
      await invoke('db_save_chat_message', { message: chatMessage });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  const updateSessionTitle = async (sessionId: string, title: string) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        const updated = { ...session, title, updated_at: new Date().toISOString() };
        await invoke('db_save_chat_session', { session: updated });
        setSessions(prev => prev.map(s => s.id === sessionId ? updated : s));
      }
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle context changes - auto-switch to interpret mode and pre-fill prompt
  useEffect(() => {
    if (context?.bookId && context?.verses && context.verses.length > 0) {
      // Switch to interpret mode
      setMode('interpret');

      // Pre-fill input with verse question
      const verseStr = context.verses.length === 1
        ? `${context.verses[0]}节`
        : `${context.verses[0]}-${context.verses[context.verses.length - 1]}节`;
      setInput(`请帮我解读这段经文的含义：`);
    }
  }, [context]);

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

    // Create session if not exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = `session-${Date.now()}`;
      const session: ChatSession = {
        id: sessionId,
        user_id: userId,
        title: input.trim().slice(0, 30) + (input.trim().length > 30 ? '...' : ''),
        mode: mode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      try {
        await invoke('db_save_chat_session', { session });
        setSessions(prev => [session, ...prev]);
        setCurrentSessionId(sessionId);
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Save user message
    await saveMessage(sessionId, userMessage);

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

      // Final update and save to database
      const assistantMessage: Message = {
        id: loadingMessage.id,
        role: 'assistant',
        content: fullContent,
        timestamp: new Date(),
      };

      setMessages(prev => prev.map(m =>
        m.id === loadingMessage.id
          ? { ...m, content: fullContent, isLoading: false }
          : m
      ));

      // Save assistant message to database
      await saveMessage(sessionId!, assistantMessage);

      // Update session's updated_at timestamp
      const sessionTitle = messages.length === 0
        ? userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : '')
        : undefined;
      if (sessionTitle) {
        await updateSessionTitle(sessionId!, sessionTitle);
      }

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
  }, [input, isLoading, messages, mode, context, getSystemPrompt, currentSessionId, userId]);

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
      {/* Session List Sidebar */}
      {showSessionList && (
        <div className="session-sidebar">
          <div className="session-sidebar-header">
            <h3>对话历史</h3>
            <button
              className="close-sidebar-btn"
              onClick={() => setShowSessionList(false)}
            >
              ×
            </button>
          </div>
          <button className="new-session-btn" onClick={createNewSession}>
            <Plus className="w-4 h-4" />
            <span>新对话</span>
          </button>
          <div className="session-list">
            {sessions.length === 0 ? (
              <div className="no-sessions">暂无对话历史</div>
            ) : (
              sessions.map(session => (
                <div
                  key={session.id}
                  className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentSessionId(session.id);
                    setShowSessionList(false);
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="session-title">{session.title}</span>
                  <button
                    className="delete-session-btn"
                    onClick={(e) => deleteSession(session.id, e)}
                    title="删除对话"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="chat-header">
        <div className="header-title">
          <button
            className="session-toggle-btn"
            onClick={() => setShowSessionList(!showSessionList)}
            title="对话历史"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <Bot className="w-6 h-6" />
          <h2>AI助手</h2>
          {currentSessionId && (
            <span className="session-badge">
              {sessions.find(s => s.id === currentSessionId)?.title || '当前对话'}
            </span>
          )}
          {context?.bookId && (
            <span className="context-badge">
              <BookOpen className="w-4 h-4" />
              {context.bookId} {context.chapter}章
              {context.verses && context.verses.length > 0 && (
                <span>: {context.verses[0]}-{context.verses[context.verses.length - 1]}节</span>
              )}
            </span>
          )}
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
                    <div className="message-text">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
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