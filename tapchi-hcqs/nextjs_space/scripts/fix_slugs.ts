import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/đ/g, 'd')  
    .replace(/Đ/g, 'd')  
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function main() {
  console.log('🔧 Sửa slugs cho categories...')
  
  const categories = await prisma.category.findMany()
  
  for (const category of categories) {
    const newSlug = createSlug(category.name)
    console.log(`${category.code}: ${category.name} => ${newSlug}`)
    
    await prisma.category.update({
      where: { id: category.id },
      data: { slug: newSlug }
    })
  }
  
  console.log('✅ Đã cập nhật slugs!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
