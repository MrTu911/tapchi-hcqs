import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const TEST_USERS = [
  { email: "admin@tapchi.mil.vn", password: "Admin@123" },
  { email: "editor@tapchi.mil.vn", password: "Editor@123" },
  { email: "author@tapchi.mil.vn", password: "Author@123" },
  { email: "reviewer@tapchi.mil.vn", password: "Reviewer@123" },
  { email: "john@doe.com", password: "JohnDoe@123" },
  { email: "reader@test.com", password: "Password@123" },
  { email: "managing@test.com", password: "Password@123" },
  { email: "eic@test.com", password: "Password@123" },
  { email: "layout@test.com", password: "Password@123" },
]

async function main() {
  console.log('🔒 Updating test user passwords...')
  
  for (const user of TEST_USERS) {
    const hashedPassword = await bcrypt.hash(user.password, 10)
    
    try {
      const updated = await prisma.user.updateMany({
        where: { email: user.email },
        data: { passwordHash: hashedPassword }
      })
      
      if (updated.count > 0) {
        console.log(`✅ Updated password for ${user.email}`)
      } else {
        console.log(`⚠️  User not found: ${user.email}`)
      }
    } catch (error) {
      console.error(`❌ Error updating ${user.email}:`, error)
    }
  }
  
  console.log('✅ Password update complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
