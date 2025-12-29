/**
 * API: Chat Messages
 * Gửi và nhận tin nhắn
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const sendMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1, 'Nội dung tin nhắn không được để trống').max(5000, 'Tin nhắn quá dài (tối đa 5000 ký tự)'),
});

/**
 * GET /api/chat/messages?conversationId=xxx&limit=50&before=xxx
 * Lấy danh sách tin nhắn trong hội thoại (pagination)
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

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // Message ID for pagination

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'conversationId is required' },
        { status: 400 }
      );
    }

    const userId = session.uid;

    // Kiểm tra xem người dùng có phải là thành viên không
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Not a participant of this conversation' },
        { status: 403 }
      );
    }

    // Lấy tin nhắn
    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId,
        ...(before && {
          createdAt: {
            lt: (await prisma.chatMessage.findUnique({ where: { id: before } }))?.createdAt,
          },
        }),
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            role: true,
            org: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: messages.reverse(), // Đảo ngược để hiển thị từ cũ đến mới
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/messages
 * Gửi tin nhắn mới
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
    const validation = sendMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { conversationId, content } = validation.data;
    const userId = session.uid;

    // Kiểm tra xem người dùng có phải là thành viên không
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Not a participant of this conversation' },
        { status: 403 }
      );
    }

    // Tạo tin nhắn mới
    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: userId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            role: true,
            org: true,
          },
        },
      },
    });

    // Cập nhật thời gian cập nhật của hội thoại
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Cập nhật lastReadAt cho người gửi
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    // TODO: Tích hợp WebSocket/Pusher để gửi realtime
    // globalThis.io?.to(`conversation_${conversationId}`).emit('new_message', message);

    return NextResponse.json(
      {
        success: true,
        data: message,
        message: 'Đã gửi tin nhắn',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
