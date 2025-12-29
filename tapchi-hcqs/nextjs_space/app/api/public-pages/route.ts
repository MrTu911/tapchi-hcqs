
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { getServerSession } from "@/lib/auth";
import sanitizeHtml from "sanitize-html";

/**
 * API: Public Pages CRUD
 * GET /api/public-pages - List all pages (với filter)
 * POST /api/public-pages - Create new page (ADMIN only)
 */

// GET: List all public pages
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isPublished = searchParams.get("isPublished");
    const slug = searchParams.get("slug");

    const where: any = {};
    
    if (isPublished !== null) {
      where.isPublished = isPublished === "true";
    }
    
    if (slug) {
      where.slug = slug;
    }

    const pages = await prisma.publicPage.findMany({
      where,
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: pages
    });

  } catch (error: any) {
    console.error("Get public pages error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST: Create new public page (ADMIN only)
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
      slug,
      title,
      titleEn,
      content,
      contentEn,
      metaTitle,
      metaTitleEn,
      metaDesc,
      metaDescEn,
      ogImage,
      isPublished,
      template,
      order
    } = body;

    // Validate required fields
    if (!slug || !title || !content) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: slug, title, content" },
        { status: 400 }
      );
    }

    // Sanitize HTML content
    const sanitizedContent = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe', 'video', 'audio', 'figure', 'figcaption']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        '*': ['class', 'id', 'style'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
      }
    });

    const sanitizedContentEn = contentEn ? sanitizeHtml(contentEn, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe', 'video', 'audio', 'figure', 'figcaption']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        '*': ['class', 'id', 'style'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
      }
    }) : null;

    const page = await prisma.publicPage.create({
      data: {
        slug,
        title,
        titleEn,
        content: sanitizedContent,
        contentEn: sanitizedContentEn,
        metaTitle,
        metaTitleEn,
        metaDesc,
        metaDescEn,
        ogImage,
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
        template: template || "default",
        order: order || 0
      }
    });

    return NextResponse.json({
      success: true,
      data: page
    }, { status: 201 });

  } catch (error: any) {
    console.error("Create public page error:", error);
    
    // Handle unique constraint error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: "Page with this slug already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
