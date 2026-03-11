"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Share2, BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BIBLE_BOOKS } from "@/lib/constants";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 5 seconds
    pollIntervalRef.current = setInterval(fetchMessages, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [churchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/church/${churchId}/chat?limit=50`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "刚刚";
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString("zh-CN");
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
          小组交流
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              还没有消息，来说点什么吧！
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
                        {msg.user.name || "匿名用户"}
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

        {/* Input */}
        <div className="flex gap-2 shrink-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="输入消息..."
            disabled={sending}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={sending || !input.trim()} size="icon">
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