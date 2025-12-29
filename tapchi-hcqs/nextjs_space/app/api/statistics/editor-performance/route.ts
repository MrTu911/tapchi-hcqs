
/**
 * 📊 API: Editor Performance Statistics
 * GET /api/statistics/editor-performance
 * 
 * Thống kê năng suất của các biên tập viên
 * - Số bài xử lý
 * - Thời gian xử lý trung bình
 * - Tỷ lệ chấp nhận
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { getCachedData } from '@/lib/cache';

export const dynamic = 'force-dynamic';

interface EditorPerformance {
  editorId: string;
  editorName: string;
  editorEmail: string;
  role: string;
  totalDecisions: number;
  acceptedDecisions: number;
  rejectedDecisions: number;
  revisionDecisions: number;
  acceptanceRate: number;
  avgDecisionDays: number;
}

async function fetchEditorPerformance(): Promise<EditorPerformance[]> {
  // Lấy tất cả editors (SECTION_EDITOR, MANAGING_EDITOR, EIC)
  const editors = await prisma.user.findMany({
    where: {
      role: {
        in: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC']
      }
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true
    }
  });

  // Lấy thống kê cho từng editor
  const performance = await Promise.all(editors.map(async (editor) => {
    const [decisions, decisionsByType, avgDaysResult] = await Promise.all([
      // Total decisions
      prisma.editorDecision.count({
        where: { decidedBy: editor.id }
      }),
      
      // Decisions grouped by type
      prisma.editorDecision.groupBy({
        by: ['decision'],
        where: { decidedBy: editor.id },
        _count: { _all: true }
      }),
      
      // Average decision days
      prisma.$queryRaw<Array<{ avg: number | null }>>`
        SELECT AVG(
          EXTRACT(EPOCH FROM ("decidedAt" - s."createdAt")) / 86400
        )::numeric as avg
        FROM "EditorDecision" ed
        JOIN "Submission" s ON ed."submissionId" = s."id"
        WHERE ed."decidedBy" = ${editor.id}
          AND ed."decidedAt" IS NOT NULL
      `
    ]);

    const decisionMap = new Map(
      decisionsByType.map(item => [item.decision, item._count?._all || 0])
    );

    const accepted = decisionMap.get('ACCEPT') || 0;
    const rejected = decisionMap.get('REJECT') || 0;
    const minor = decisionMap.get('MINOR') || 0;
    const major = decisionMap.get('MAJOR') || 0;
    const revision = minor + major; // MINOR + MAJOR = revisions

    return {
      editorId: editor.id,
      editorName: editor.fullName,
      editorEmail: editor.email,
      role: editor.role,
      totalDecisions: decisions,
      acceptedDecisions: accepted,
      rejectedDecisions: rejected,
      revisionDecisions: revision,
      acceptanceRate: decisions > 0 
        ? Math.round((accepted / decisions) * 100 * 10) / 10 
        : 0,
      avgDecisionDays: avgDaysResult[0]?.avg 
        ? Math.round(Number(avgDaysResult[0].avg) * 10) / 10 
        : 0
    };
  }));

  // Sắp xếp theo số quyết định giảm dần
  return performance.sort((a, b) => b.totalDecisions - a.totalDecisions);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Chỉ ADMIN, MANAGING_EDITOR, EIC mới xem được
    if (!['SYSADMIN', 'MANAGING_EDITOR', 'EIC'].includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Lấy từ cache hoặc tính toán (cache 30 phút)
    const stats = await getCachedData(
      'stats:editor-performance',
      fetchEditorPerformance,
      1800 // 30 phút
    );

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('❌ Error fetching editor performance:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

