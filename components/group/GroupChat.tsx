"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Share2, BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BIBLE_BOOKS } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";

interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  type: string;
  metadata: {
    bookId?: string;
    chapter?: number;
    verse?: number;
    content?: string;
  } | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface GroupChatProps {
  churchId: string;
  currentUserId?: string;
  onShareVerse?: (bookId: string, chapter: number) => void;
}

export function GroupChat({ churchId, currentUserId, onShareVerse }: GroupChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchMessages();
    pollIntervalRef.current = setInterval(fetchMessages, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [churchId]);

  useEffect(() => {
    const markAsRead = async () => {
      try {
        await fetch(`/api/church/${churchId}/chat`, {
          method: 'PUT'
        });
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    };

    markAsRead();
  }, [churchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/church/${churchId}/chat?limit=50`);
      const data = await res.json();
      if (data.messages) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMessages = data.messages.filter((m: ChatMessage) => !existingIds.has(m.id));
          if (newMessages.length === 0) return prev;
          return [...prev, ...newMessages];
        });
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/church/${churchId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: input.trim(),
          type: "TEXT"
        })
      });
      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        setInput("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const shareVerse = async (bookId: string, chapter: number, verseContent: string) => {
    setSending(true);
    try {
      const res = await fetch(`/api/church/${churchId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: verseContent,
          type: "SHARE_VERSE",
          metadata: { bookId, chapter, content: verseContent }
        })
      });
      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }
    } catch (error) {
      console.error("Failed to share verse:", error);
    } finally {
      setSending(false);
    }
  };

  // [P2-1] i18n: 使用 t() 替代硬编码中文时间格式
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('group.justNow');
    if (diffMins < 60) return t('group.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('group.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('group.daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

  const getBookName = (id: string) => BIBLE_BOOKS.find(b => b.id === id)?.name || id;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Loader2 className="w-6 h-6 mx-auto animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[400px]">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          {t('group.chatTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-3 mb-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              {t('group.noMessages')}
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  msg.userId === currentUserId ? "justify-end" : "justify-start"
                )}
              >
                {msg.type === "SYSTEM" ? (
                  <div className="text-center text-xs text-muted-foreground py-2 w-full">
                    {msg.content}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2",
                      msg.userId === currentUserId
                        ? "bg-indigo-500 text-white rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    )}
                  >
                    {msg.userId !== currentUserId && (
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {msg.user.name || t('group.anonymousUser')}
                      </p>
                    )}
                    {msg.type === "SHARE_VERSE" && msg.metadata && (
                      <div className="mb-2 p-2 bg-white/10 rounded-lg text-sm">
                        <p className="font-medium text-indigo-200 text-xs mb-1">
                          <BookOpen className="w-3 h-3 inline mr-1" />
                          {getBookName(msg.metadata.bookId || "")} {msg.metadata.chapter}
                        </p>
                        <p className="text-xs opacity-90 line-clamp-2">
                          {msg.metadata.content}
                        </p>
                      </div>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-[10px] opacity-60 mt-1">
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 shrink-0 items-end">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // 自动增长高度
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={t('group.inputPlaceholder')}
            disabled={sending}
            rows={1}
            className="flex-1 resize-none max-h-32 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button onClick={sendMessage} disabled={sending || !input.trim()} size="icon" className="shrink-0">
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}