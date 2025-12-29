
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/featured-articles/[id] - Update featured article
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
    const { position, reason, isActive } = body;
    
    const updateData: any = {};
    if (position !== undefined) updateData.position = position;
    if (reason !== undefined) updateData.reason = reason;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const featured = await prisma.featuredArticle.update({
      where: { id },
      data: updateData,
      include: {
        article: {
          include: {
            submission: true,
            issue: true,
          },
        },
      },
    });
    
    return NextResponse.json({ success: true, data: featured });
  } catch (error: any) {
    console.error("Error updating featured article:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/featured-articles/[id] - Remove from featured list
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
    
    const featured = await prisma.featuredArticle.findUnique({
      where: { id },
    });
    
    if (!featured) {
      return NextResponse.json(
        { error: "Featured article not found" },
        { status: 404 }
      );
    }
    
    await prisma.featuredArticle.delete({
      where: { id },
    });
    
    // Update article isFeatured flag
    await prisma.article.update({
      where: { id: featured.articleId },
      data: { isFeatured: false },
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting featured article:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
