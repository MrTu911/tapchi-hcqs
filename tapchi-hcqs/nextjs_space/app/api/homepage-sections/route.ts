
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/homepage-sections - Get all homepage sections
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const isActive = searchParams.get("isActive");
    
    const where = isActive ? { isActive: isActive === "true" } : {};
    
    const sections = await prisma.homepageSection.findMany({
      where,
      orderBy: { order: "asc" },
    });
    
    return NextResponse.json({ success: true, data: sections });
  } catch (error: any) {
    console.error("Error fetching homepage sections:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/homepage-sections - Create new section
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userRole = session.role;
    if (!["SYSADMIN", "EIC", "MANAGING_EDITOR"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const body = await req.json();
    const {
      key,
      type,
      title,
      titleEn,
      subtitle,
      subtitleEn,
      content,
      contentEn,
      imageUrl,
      linkUrl,
      linkText,
      linkTextEn,
      settings,
      order,
      isActive = true,
    } = body;
    
    if (!key || !type) {
      return NextResponse.json(
        { error: "Key and type are required" },
        { status: 400 }
      );
    }
    
    // Check if key already exists
    const existing = await prisma.homepageSection.findUnique({
      where: { key },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: "Section with this key already exists" },
        { status: 400 }
      );
    }
    
    // Get next order if not provided
    let finalOrder = order;
    if (finalOrder === undefined) {
      const maxOrder = await prisma.homepageSection.findFirst({
        orderBy: { order: "desc" },
      });
      finalOrder = maxOrder ? maxOrder.order + 1 : 0;
    }
    
    const section = await prisma.homepageSection.create({
      data: {
        key,
        type,
        title,
        titleEn,
        subtitle,
        subtitleEn,
        content,
        contentEn,
        imageUrl,
        linkUrl,
        linkText,
        linkTextEn,
        settings,
        order: finalOrder,
        isActive,
      },
    });
    
    return NextResponse.json({ success: true, data: section });
  } catch (error: any) {
    console.error("Error creating homepage section:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
