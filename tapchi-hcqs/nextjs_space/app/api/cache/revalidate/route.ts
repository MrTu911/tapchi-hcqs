
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "@/lib/auth";

/**
 * API: Cache Revalidation
 * POST /api/cache/revalidate
 * 
 * Tái tạo cache ISR cho các trang công khai
 * Chỉ ADMIN hoặc EDITOR mới có quyền gọi
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !['SYSADMIN', 'MANAGING_EDITOR', 'EIC'].includes(session.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { paths, tags } = body;

    // Revalidate by path
    if (paths && Array.isArray(paths)) {
      for (const path of paths) {
        revalidatePath(path);
      }
    }

    // Revalidate by tag
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        revalidateTag(tag);
      }
    }

    // Default: revalidate homepage and key pages
    if (!paths && !tags) {
      revalidatePath('/');
      revalidatePath('/about');
      revalidatePath('/contact');
      revalidatePath('/news');
      revalidatePath('/issues');
      revalidatePath('/articles');
    }

    return NextResponse.json({
      success: true,
      message: "Cache revalidated successfully",
      revalidated: {
        paths: paths || ['/', '/about', '/contact', '/news', '/issues', '/articles'],
        tags: tags || []
      }
    });

  } catch (error: any) {
    console.error("Cache revalidation error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
