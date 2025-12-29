

export const dynamic = "force-dynamic"

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'

const aliasSchema = z.object({
  oldSlug: z.string().min(1),
  newSlug: z.string().min(1),
  redirectType: z.number().default(301)
})

/**
 * ✅ Giai đoạn 2: Category Alias Management
 * GET /api/categories/alias?oldSlug=xxx - Check alias và return redirect info
 * POST /api/categories/alias - Tạo alias mới
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const oldSlug = searchParams.get('oldSlug')
    
    if (!oldSlug) {
      return errorResponse('oldSlug is required', 400)
    }
    
    const alias = await prisma.categoryAlias.findUnique({
      where: { oldSlug }
    })
    
    if (!alias) {
      return errorResponse('Alias not found', 404)
    }
    
    // Lấy category mới
    const category = await prisma.category.findUnique({
      where: { id: alias.categoryId },
      select: {
        id: true,
        code: true,
        name: true,
        slug: true
      }
    })
    
    if (!category) {
      return errorResponse('Target category not found', 404)
    }
    
    return successResponse({
      oldSlug: alias.oldSlug,
      newSlug: category.slug,
      redirectType: alias.redirectType,
      category
    })
  } catch (error) {
    console.error('Get alias error:', error)
    return errorResponse('Server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = aliasSchema.safeParse(body)
    
    if (!validation.success) {
      return errorResponse('Invalid data', 400)
    }
    
    const { oldSlug, newSlug, redirectType } = validation.data
    
    // Kiểm tra category mới có tồn tại không
    const category = await prisma.category.findUnique({
      where: { slug: newSlug }
    })
    
    if (!category) {
      return errorResponse('Target category not found', 404)
    }
    
    // Tạo alias
    const alias = await prisma.categoryAlias.create({
      data: {
        oldSlug,
        categoryId: category.id,
        redirectType
      }
    })
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: { alias } 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Create alias error:', error)
    
    if (error.code === 'P2002') {
      return errorResponse('Alias already exists', 409)
    }
    
    return errorResponse('Server error')
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const oldSlug = searchParams.get('oldSlug')
    
    if (!oldSlug) {
      return errorResponse('oldSlug is required', 400)
    }
    
    await prisma.categoryAlias.delete({
      where: { oldSlug }
    })
    
    return successResponse({ message: 'Alias deleted' })
  } catch (error) {
    console.error('Delete alias error:', error)
    return errorResponse('Server error', 500)
  }
}
