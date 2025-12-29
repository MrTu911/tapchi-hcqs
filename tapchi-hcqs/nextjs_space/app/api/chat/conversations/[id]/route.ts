/**
 * API: Chat Conversation Detail
 * Lấy chi tiết hội thoại và tin nhắn
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/chat/conversations/[id]
 * Lấy chi tiết hội thoại và danh sách tin nhắn
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const userId = session.uid;

    // Kiểm tra xem người dùng có phải là thành viên của hội thoại không
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id,
        participants: {
          some: {
            userId,
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
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Cập nhật lastReadAt cho người dùng
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: id,
        userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/conversations/[id]
 * Rời khỏi hội thoại (set isActive = false)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const userId = session.uid;

    // Kiểm tra xem người dùng có phải là thành viên không
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Not a participant of this conversation' },
        { status: 403 }
      );
    }

    // Đánh dấu người dùng rời khỏi hội thoại
    await prisma.conversationParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã rời khỏi hội thoại',
    });
  } catch (error) {
    console.error('Error leaving conversation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to leave conversation' },
      { status: 500 }
    );
  }
}
