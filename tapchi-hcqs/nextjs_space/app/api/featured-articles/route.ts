
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/featured-articles - Get all featured articles
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const isActive = searchParams.get("isActive");
    
    const where = isActive ? { isActive: isActive === "true" } : {};
    
    const featured = await prisma.featuredArticle.findMany({
      where,
      include: {
        article: {
          include: {
            submission: {
              include: {
                author: true,
                category: true,
              },
            },
            issue: true,
          },
        },
      },
      orderBy: { position: "asc" },
    });
    
    return NextResponse.json({ success: true, data: featured });
  } catch (error: any) {
    console.error("Error fetching featured articles:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/featured-articles - Add article to featured list
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
    const { articleId, position, reason, isActive = true } = body;
    
    if (!articleId) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      );
    }
    
    // Check if article exists and is published
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { submission: true },
    });
    
    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }
    
    // Check if already featured
    const existing = await prisma.featuredArticle.findUnique({
      where: { articleId },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: "Article is already featured" },
        { status: 400 }
      );
    }
    
    // Get next position if not provided
    let finalPosition = position;
    if (finalPosition === undefined) {
      const maxPosition = await prisma.featuredArticle.findFirst({
        orderBy: { position: "desc" },
      });
      finalPosition = maxPosition ? maxPosition.position + 1 : 0;
    }
    
    const featured = await prisma.featuredArticle.create({
      data: {
        articleId,
        position: finalPosition,
        reason,
        isActive,
      },
      include: {
        article: {
          include: {
            submission: true,
            issue: true,
          },
        },
      },
    });
    
    // Update article isFeatured flag
    await prisma.article.update({
      where: { id: articleId },
      data: { isFeatured: true },
    });
    
    return NextResponse.json({ success: true, data: featured });
  } catch (error: any) {
    console.error("Error adding featured article:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
