import { prisma } from './lib/prisma'

async function checkTestUsers() {
  try {
    const testEmails = [
      'admin@tapchi.mil.vn',
      'editor@tapchi.mil.vn', 
      'author@tapchi.mil.vn'
    ]
    
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: testEmails
        }
      },
      select: {
        email: true,
        role: true,
        isActive: true
      }
    })
    
    console.log('✅ Found test users:', users)
    
    if (users.length < 3) {
      console.log('⚠️  Missing test users. Running seed...')
      return false
    }
    
    return true
  } catch (error) {
    console.error('❌ Error checking users:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

checkTestUsers().then(exists => {
  if (!exists) {
    console.log('Need to run: yarn prisma db seed')
  }
  process.exit(0)
})
