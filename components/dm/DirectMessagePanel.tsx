"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Loader2,
  User,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";

interface Conversation {
  userId: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  type: string;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
  receiver: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface DirectMessagePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUserId?: string;
}

export function DirectMessagePanel({ open, onOpenChange, initialUserId }: DirectMessagePanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<Conversation["user"] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { t, locale } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (open && !selectedUser) {
      fetchConversations();
    }
  }, [open, selectedUser]);

  // Load messages when user selected + mark conversation as read
  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
      markConversationRead(selectedUser.id);
    }
  }, [selectedUser]);

  const markConversationRead = async (userId: string) => {
    try {
      const res = await fetch("/api/dm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        // Update local unread count by subtracting this conversation's unread count
        const conv = conversations.find(c => c.userId === userId);
        if (conv && conv.unreadCount > 0) {
          setConversations(prev =>
            prev.map(c =>
              c.userId === userId ? { ...c, unreadCount: 0 } : c
            )
          );
        }
      }
    } catch (error) {
      console.error("Mark conversation read error:", error);
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle initial user
  useEffect(() => {
    if (initialUserId && open) {
      // Find user info and start conversation
      fetchAndSelectUser(initialUserId);
    }
  }, [initialUserId, open]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dm");
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Fetch conversations error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/dm?userId=${userId}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Fetch messages error:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchAndSelectUser = async (userId: string) => {
    // 先从已有对话列表中查找
    const conv = conversations.find(c => c.userId === userId);
    if (conv) {
      setSelectedUser(conv.user);
      return;
    }
    // 不在对话列表中时，直接从API获取用户信息并创建新对话
    try {
      const res = await fetch(`/api/dm?userId=${userId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
      // 从消息中提取用户信息
      if (data.messages && data.messages.length > 0) {
        const otherUser = data.messages[0].sender.id === userId
          ? data.messages[0].sender
          : data.messages[0].receiver;
        setSelectedUser(otherUser);
      } else {
        // 无历史消息，从用户API获取信息
        const userRes = await fetch(`/api/user?id=${userId}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setSelectedUser({
            id: userId,
            name: userData.name || userData.email || userId,
            image: userData.image || null,
          });
        } else {
          // 最终兜底：用ID作为名称
          setSelectedUser({ id: userId, name: userId, image: null });
        }
      }
    } catch (error) {
      console.error('Failed to fetch user for initial conversation:', error);
      setSelectedUser({ id: userId, name: userId, image: null });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    const tempMessage = newMessage;
    setNewMessage("");

    try {
      const res = await fetch("/api/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: tempMessage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        // Update conversation list
        fetchConversations();
      }
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    // [P2-1修复] 根据用户语言选择 date-fns locale
    return formatDistanceToNow(d, { addSuffix: true, locale: locale === 'zh' ? zhCN : enUS });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const filteredConversations = conversations.filter(c =>
    c.user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b shrink-0">
          {selectedUser ? (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedUser(null)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Avatar className="w-8 h-8">
                <AvatarImage src={selectedUser.image || undefined} />
                <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
              </Avatar>
              <SheetTitle className="text-left">
                {selectedUser.name || t('dm.user')}
              </SheetTitle>
            </div>
          ) : (
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {t('dm.title')}
            </SheetTitle>
          )}
        </SheetHeader>

        {selectedUser ? (
          // Chat view
          <>
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">{t('dm.startChat', { name: selectedUser.name || t('dm.user') })}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender.id !== selectedUser?.id;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          isOwn ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] px-3 py-2 rounded-lg",
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}
                          >
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder={t('dm.inputPlaceholder')}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Conversation list
          <>
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('dm.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                  <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">
                    {searchQuery ? t('dm.noContactsFound') : t('dm.noConversations')}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.userId}
                      onClick={() => setSelectedUser(conv.user)}
                      className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={conv.user.image || undefined} />
                        <AvatarFallback>{getInitials(conv.user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold truncate">
                            {conv.user.name || t('dm.user')}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conv.lastMessageTime)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}