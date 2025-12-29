
/**
 * 🗑️ API: Clear Cache
 * POST /api/cache/clear
 * 
 * Xóa cache thủ công (chỉ SYSADMIN)
 * Body: { pattern?: string } - Pattern để xóa cache cụ thể (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { invalidateCache, getCacheStats } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Chỉ SYSADMIN mới có quyền clear cache
    if (session.role !== 'SYSADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Only SYSADMIN can clear cache' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { pattern } = body;

    // Lấy stats trước khi xóa
    const statsBefore = getCacheStats();

    // Xóa cache
    invalidateCache(pattern);

    // Lấy stats sau khi xóa
    const statsAfter = getCacheStats();

    return NextResponse.json({
      success: true,
      message: pattern 
        ? `Cache cleared for pattern: ${pattern}`
        : 'All cache cleared',
      before: statsBefore,
      after: statsAfter,
      clearedEntries: statsBefore.size - statsAfter.size
    });

  } catch (error: any) {
    console.error('❌ Error clearing cache:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Lấy thông tin cache
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || session.role !== 'SYSADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = getCacheStats();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('❌ Error getting cache stats:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

