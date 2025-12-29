
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/homepage-sections/[id] - Get single section
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const section = await prisma.homepageSection.findUnique({
      where: { id },
    });
    
    if (!section) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: section });
  } catch (error: any) {
    console.error("Error fetching homepage section:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/homepage-sections/[id] - Update section
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userRole = session.role;
    if (!["SYSADMIN", "EIC", "MANAGING_EDITOR"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const { id } = params;
    const body = await req.json();
    
    const {
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
      isActive,
    } = body;
    
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (titleEn !== undefined) updateData.titleEn = titleEn;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (subtitleEn !== undefined) updateData.subtitleEn = subtitleEn;
    if (content !== undefined) updateData.content = content;
    if (contentEn !== undefined) updateData.contentEn = contentEn;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl;
    if (linkText !== undefined) updateData.linkText = linkText;
    if (linkTextEn !== undefined) updateData.linkTextEn = linkTextEn;
    if (settings !== undefined) updateData.settings = settings;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const section = await prisma.homepageSection.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json({ success: true, data: section });
  } catch (error: any) {
    console.error("Error updating homepage section:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/homepage-sections/[id] - Delete section
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userRole = session.role;
    if (!["SYSADMIN", "EIC", "MANAGING_EDITOR"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const { id } = params;
    
    await prisma.homepageSection.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting homepage section:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
