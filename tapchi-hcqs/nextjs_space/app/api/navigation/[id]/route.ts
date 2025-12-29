
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { getServerSession } from "@/lib/auth";

/**
 * API: Navigation Item Operations
 * GET /api/navigation/[id] - Get item by ID
 * PATCH /api/navigation/[id] - Update item (ADMIN only)
 * DELETE /api/navigation/[id] - Delete item (ADMIN only)
 */

// GET: Get navigation item by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.navigationItem.findUnique({
      where: { id: params.id }
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: "Navigation item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item
    });

  } catch (error: any) {
    console.error("Get navigation item error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update navigation item (ADMIN only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session || !['SYSADMIN', 'MANAGING_EDITOR', 'EIC'].includes(session.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.label !== undefined) updateData.label = body.label;
    if (body.labelEn !== undefined) updateData.labelEn = body.labelEn;
    if (body.url !== undefined) updateData.url = body.url;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.parentId !== undefined) updateData.parentId = body.parentId;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.target !== undefined) updateData.target = body.target;
    if (body.icon !== undefined) updateData.icon = body.icon;

    const item = await prisma.navigationItem.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: item
    });

  } catch (error: any) {
    console.error("Update navigation item error:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: "Navigation item not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete navigation item (ADMIN only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session || !['SYSADMIN'].includes(session.role)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Only SYSADMIN can delete navigation items" },
        { status: 403 }
      );
    }

    await prisma.navigationItem.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: "Navigation item deleted successfully"
    });

  } catch (error: any) {
    console.error("Delete navigation item error:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: "Navigation item not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
