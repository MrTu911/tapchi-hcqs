"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare,
  Send,
  Plus,
  Search,
  Loader2,
  Users,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  org?: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    role: string;
  };
}

interface Conversation {
  id: string;
  type: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  participants: Array<{
    user: User;
  }>;
  messages: Message[];
  unreadCount?: number;
}

export default function MessagesPage() {
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentUserId = session?.id;
  
  // Fetch session
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      console.log('[Messages] fetchSession response:', data);
      if (data.success && data.data && data.data.user) {
        setSession(data.data.user);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setSessionLoading(false);
    }
  };

  // Fetch conversations
  const fetchConversations = async () => {
    if (!session?.id) {
      console.log('[Messages] No session, skipping fetchConversations');
      return;
    }
    
    console.log('[Messages] fetchConversations called');
    setLoading(true);
    try {
      const res = await fetch('/api/chat/conversations');
      const data = await res.json();
      console.log('[Messages] fetchConversations response:', data);
      if (data.success && Array.isArray(data.data)) {
        setConversations(data.data);
      } else {
        console.error('[Messages] fetchConversations failed:', data);
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    if (!conversationId) return;
    
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
        scrollToBottom();
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  // Search users to start a new chat
  const searchUsers = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setUsers([]);
      return;
    }
    
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Lọc ra những người dùng không phải là mình
        setUsers(data.data.filter((u: User) => u.id !== currentUserId));
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    }
  };

  // Create new conversation
  const createConversation = async () => {
    if (!selectedUserId) {
      toast.error('Vui lòng chọn người để trò chuyện');
      return;
    }

    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantIds: [selectedUserId],
          type: 'private',
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Tạo hội thoại thành công');
        setIsNewChatOpen(false);
        setSelectedUserId('');
        setSearchQuery('');
        setUsers([]);
        await fetchConversations();
        setActiveConversation(data.data);
        setMessages([]);
      } else {
        toast.error(data.error || 'Không thể tạo hội thoại');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!messageInput.trim() || !activeConversation) return;

    setSending(true);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          content: messageInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages([...messages, data.data]);
        setMessageInput('');
        scrollToBottom();
        // Cập nhật tin nhắn cuối trong sidebar
        fetchConversations();
      } else {
        toast.error(data.error || 'Không thể gửi tin nhắn');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    fetchMessages(conv.id);
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.title) return conv.title;
    
    if (!conv.participants || !Array.isArray(conv.participants)) {
      return 'Hội thoại';
    }
    
    const otherParticipants = conv.participants
      .filter(p => p && p.user && p.user.id !== currentUserId)
      .map(p => p.user.fullName || 'Unknown');
    
    return otherParticipants.join(', ') || 'Hội thoại';
  };

  const getRoleBadgeColor = (role: string) => {
    const roleColors: Record<string, string> = {
      AUTHOR: 'bg-blue-100 text-blue-800',
      EDITOR: 'bg-green-100 text-green-800',
      SECTION_EDITOR: 'bg-purple-100 text-purple-800',
      MANAGING_EDITOR: 'bg-orange-100 text-orange-800',
      REVIEWER: 'bg-pink-100 text-pink-800',
      EIC: 'bg-red-100 text-red-800',
      SYSADMIN: 'bg-gray-100 text-gray-800',
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      AUTHOR: 'Tác giả',
      EDITOR: 'Biên tập',
      SECTION_EDITOR: 'BT Chuyên mục',
      MANAGING_EDITOR: 'Tổng Biên tập',
      REVIEWER: 'Phản biện',
      EIC: 'Tổng Chủ biên',
      SYSADMIN: 'Quản trị',
    };
    return roleLabels[role] || role;
  };

  // Auto-refresh messages (polling every 5 seconds)
  useEffect(() => {
    if (activeConversation) {
      const interval = setInterval(() => {
        fetchMessages(activeConversation.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeConversation]);

  // Initial load
  useEffect(() => {
    fetchSession();
  }, []);
  
  useEffect(() => {
    if (session) {
      fetchConversations();
    }
  }, [session]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (sessionLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Đang tải phiên làm việc...</p>
        </div>
      </div>
    );
  }

  if (!session?.id) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Vui lòng đăng nhập để sử dụng chức năng tin nhắn.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tin nhắn</h1>
          <p className="text-muted-foreground mt-1">
            Trò chuyện với biên tập viên và đồng nghiệp
          </p>
        </div>
        
        {/* New Chat Button */}
        <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Cuộc trò chuyện mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bắt đầu cuộc trò chuyện mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm người dùng theo tên hoặc email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {users.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedUserId === user.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user.fullName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.org && (
                            <p className="text-xs text-muted-foreground mt-1">{user.org}</p>
                          )}
                        </div>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <Button
                onClick={createConversation}
                disabled={!selectedUserId}
                className="w-full"
              >
                Tạo cuộc trò chuyện
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-16rem)]">
        {/* Conversations Sidebar */}
        <Card className="col-span-12 md:col-span-4 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <MessageSquare className="h-4 w-4 mr-2" />
              Hội thoại ({conversations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-y-auto h-[calc(100vh-20rem)]">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Chưa có hội thoại nào</p>
                  <p className="text-sm mt-1">Tạo cuộc trò chuyện mới để bắt đầu</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-4 border-b cursor-pointer transition-colors ${
                      activeConversation?.id === conv.id
                        ? 'bg-primary/5 border-l-4 border-l-primary'
                        : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {getConversationName(conv)}
                        </p>
                        {conv.messages && conv.messages.length > 0 && conv.messages[0] && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {conv.messages[0].sender?.fullName || 'Unknown'}: {conv.messages[0].content}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.updatedAt), {
                              addSuffix: true,
                              locale: vi,
                            })}
                          </span>
                        </div>
                      </div>
                      {conv.unreadCount && conv.unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="col-span-12 md:col-span-8 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {getConversationName(activeConversation)}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {activeConversation.participants.length} thành viên
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              
              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Chưa có tin nhắn nào</p>
                      <p className="text-sm mt-1">Gửi tin nhắn đầu tiên của bạn</p>
                    </div>
                  </div>
                ) : (
                  (messages || []).map((msg) => {
                    if (!msg || !msg.id) return null;
                    const isOwn = msg.sender?.id === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {!isOwn && msg.sender && (
                            <p className="text-xs font-medium mb-1">
                              {msg.sender.fullName || 'Unknown'}
                              <Badge
                                className={`ml-2 text-[10px] ${getRoleBadgeColor(msg.sender.role || '')}`}
                              >
                                {getRoleLabel(msg.sender.role || '')}
                              </Badge>
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content || ''}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              isOwn ? 'text-primary-foreground/70' : 'text-gray-500'
                            }`}
                          >
                            {msg.createdAt && formatDistanceToNow(new Date(msg.createdAt), {
                              addSuffix: true,
                              locale: vi,
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Message Input */}
              <Separator />
              <div className="p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={sending || !messageInput.trim()}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Chọn một cuộc trò chuyện</p>
                <p className="text-sm mt-1">Hoặc tạo cuộc trò chuyện mới để bắt đầu</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
