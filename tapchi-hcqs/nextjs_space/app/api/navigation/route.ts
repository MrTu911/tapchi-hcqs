
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { getServerSession } from "@/lib/auth";

/**
 * API: Navigation Menu CRUD
 * GET /api/navigation - List all navigation items
 * POST /api/navigation - Create new navigation item (ADMIN only)
 */

// GET: List all navigation items
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("isActive");

    const where: any = {};
    
    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    const items = await prisma.navigationItem.findMany({
      where,
      orderBy: { position: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: items
    });

  } catch (error: any) {
    console.error("Get navigation items error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST: Create new navigation item (ADMIN only)
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
    const {
      label,
      labelEn,
      url,
      position,
      parentId,
      isActive,
      target,
      icon
    } = body;

    // Validate required fields
    if (!label || !url) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: label, url" },
        { status: 400 }
      );
    }

    const item = await prisma.navigationItem.create({
      data: {
        label,
        labelEn,
        url,
        position: position || 0,
        parentId,
        isActive: isActive !== undefined ? isActive : true,
        target: target || "_self",
        icon
      }
    });

    return NextResponse.json({
      success: true,
      data: item
    }, { status: 201 });

  } catch (error: any) {
    console.error("Create navigation item error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
