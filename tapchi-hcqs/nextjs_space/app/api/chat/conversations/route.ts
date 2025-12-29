/**
 * API: Chat Conversations
 * Quản lý hội thoại (tạo mới, lấy danh sách)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canChat, getAllowedRoles, validateConversationParticipants } from '@/lib/chat-guard';
import { z } from 'zod';

// Validation schema
const createConversationSchema = z.object({
  participantIds: z.array(z.string()).min(1, 'Cần ít nhất 1 người tham gia'),
  type: z.enum(['private', 'group', 'system']).default('private'),
  title: z.string().optional(),
});

/**
 * GET /api/chat/conversations
 * Lấy danh sách hội thoại của người dùng hiện tại
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.uid;

    // Lấy danh sách hội thoại mà người dùng tham gia
    const conversations = await prisma.chatConversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId,
            isActive: true,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                org: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Tính số tin nhắn chưa đọc cho mỗi hội thoại
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants.find(p => p.userId === userId);
        
        const unreadCount = await prisma.chatMessage.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            createdAt: { gt: participant?.lastReadAt || new Date(0) },
          },
        });

        return {
          ...conv,
          unreadCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: conversationsWithUnread,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/conversations
 * Tạo hội thoại mới hoặc tìm hội thoại đã tồn tại
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createConversationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { participantIds, type, title } = validation.data;
    const userId = session.uid;

    // Thêm người dùng hiện tại vào danh sách nếu chưa có
    const allParticipantIds = Array.from(new Set([userId, ...participantIds]));

    // Lấy thông tin người dùng
    const users = await prisma.user.findMany({
      where: {
        id: { in: allParticipantIds },
        isActive: true,
      },
      select: {
        id: true,
        role: true,
        fullName: true,
      },
    });

    if (users.length !== allParticipantIds.length) {
      return NextResponse.json(
        { success: false, error: 'Một số người dùng không tồn tại hoặc không hoạt động' },
        { status: 400 }
      );
    }

    // Kiểm tra quyền chat
    const currentUser = users.find(u => u.id === userId);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 400 }
      );
    }

    // Validate participants theo quy tắc blind review
    const participantRoles = users.map(u => u.role);
    const validation2 = validateConversationParticipants(participantRoles);
    
    if (!validation2.valid) {
      return NextResponse.json(
        { success: false, error: validation2.reason },
        { status: 403 }
      );
    }

    // Nếu là private chat (2 người), kiểm tra xem đã có hội thoại chưa
    if (type === 'private' && allParticipantIds.length === 2) {
      const existingConversation = await prisma.chatConversation.findFirst({
        where: {
          type: 'private',
          participants: {
            every: {
              userId: { in: allParticipantIds },
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  role: true,
                  org: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      });

      if (existingConversation && existingConversation.participants.length === 2) {
        return NextResponse.json({
          success: true,
          data: existingConversation,
          message: 'Hội thoại đã tồn tại',
        });
      }
    }

    // Tạo hội thoại mới
    const conversation = await prisma.chatConversation.create({
      data: {
        type,
        title,
        participants: {
          create: allParticipantIds.map(id => ({
            userId: id,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                org: true,
              },
            },
          },
        },
        messages: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: conversation,
        message: 'Tạo hội thoại thành công',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
