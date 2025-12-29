
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { getServerSession } from "@/lib/auth";

/**
 * API: Bulk Update Navigation Order
 * POST /api/navigation/bulk-update
 * 
 * Update positions of multiple navigation items at once
 * Useful for drag-and-drop reordering
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
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, message: "Invalid items array" },
        { status: 400 }
      );
    }

    // Update all items in transaction
    await prisma.$transaction(
      items.map((item: any) =>
        prisma.navigationItem.update({
          where: { id: item.id },
          data: { position: item.position }
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: "Navigation order updated successfully"
    });

  } catch (error: any) {
    console.error("Bulk update navigation error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
