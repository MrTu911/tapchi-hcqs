
'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Send, MessageSquare, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  senderId: string
  receiverId: string
  message: string
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    fullName: string
    role: string
  }
}

interface MessageChatboxProps {
  submissionId: string
  authorId: string
  authorName: string
  submissionTitle: string
  currentUserId: string
}

export default function MessageChatbox({ 
  submissionId, 
  authorId, 
  authorName,
  submissionTitle,
  currentUserId
}: MessageChatboxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?submissionId=${submissionId}`)
      const result = await response.json()

      if (response.ok) {
        setMessages(result.data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchMessages, 30000)
    return () => clearInterval(interval)
  }, [submissionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !currentUserId) {
      return
    }

    setIsSending(true)

    try {
      // Determine receiver: if current user is author, send to editors, else send to author
      const isAuthor = currentUserId === authorId
      const receiverId = isAuthor 
        ? messages.find(m => m.sender.role.includes('EDITOR'))?.senderId || authorId 
        : authorId

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionId,
          receiverId,
          message: newMessage.trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message')
      }

      setMessages([...messages, result.data])
      setNewMessage('')
      toast.success('Tin nhắn đã được gửi')
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error(error.message || 'Không thể gửi tin nhắn')
    } finally {
      setIsSending(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'AUTHOR': 'Tác giả',
      'SECTION_EDITOR': 'Biên tập viên',
      'MANAGING_EDITOR': 'Biên tập viên',
      'EIC': 'Tổng biên tập',
      'SYSADMIN': 'Quản trị viên'
    }
    return labels[role] || role
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card id="messages">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Tin nhắn trao đổi
        </CardTitle>
        <CardDescription>
          Giao tiếp trực tiếp với {currentUserId === authorId ? 'biên tập viên' : 'tác giả'} về bài viết này
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Messages List */}
          <div className="h-[400px] overflow-y-auto border rounded-lg p-4 space-y-4 bg-muted/20">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Chưa có tin nhắn nào</p>
                  <p className="text-xs">Bắt đầu cuộc trò chuyện bên dưới</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.senderId === currentUserId
                
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}>
                        {getInitials(msg.sender.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex-1 space-y-1 ${isOwnMessage ? 'items-end' : ''}`}>
                      <div className={`flex items-center gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                        <p className="text-sm font-medium">{msg.sender.fullName}</p>
                        <Badge variant="outline" className="text-xs">
                          {getRoleLabel(msg.sender.role)}
                        </Badge>
                      </div>
                      
                      <div
                        className={`
                          inline-block max-w-[80%] p-3 rounded-lg text-sm
                          ${isOwnMessage 
                            ? 'bg-blue-500 text-white ml-auto' 
                            : 'bg-white border'}
                        `}
                      >
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      
                      <p className={`text-xs text-muted-foreground ${isOwnMessage ? 'text-right' : ''}`}>
                        {new Date(msg.createdAt).toLocaleDateString('vi-VN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="space-y-3">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhập tin nhắn của bạn..."
              rows={3}
              disabled={isSending}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Tin nhắn sẽ được gửi đến {currentUserId === authorId ? 'biên tập viên' : authorName}
              </p>
              <Button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                size="sm"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Gửi tin nhắn
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
