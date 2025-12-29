
/**
 * Consolidated Admin CLI Tools
 * Hợp nhất các công cụ quản trị viên
 * 
 * Usage: yarn ts-node scripts/admin-cli.ts
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer)
    })
  })
}

async function resetAdminPassword() {
  console.log('\n🔐 Reset Admin Password\n')
  
  const email = await question('Admin email (default: john@doe.com): ') || 'john@doe.com'
  const newPassword = await question('New password (default: admin123): ') || 'admin123'
  
  const passwordHash = await bcrypt.hash(newPassword, 12)
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, isActive: true },
    create: {
      email,
      fullName: 'System Administrator',
      role: 'SYSADMIN',
      passwordHash,
      isActive: true
    }
  })
  
  console.log(`\n✅ Password reset for ${user.email}`)
  console.log(`   Email: ${email}`)
  console.log(`   Password: ${newPassword}`)
}

async function fixSlugs() {
  console.log('\n🔧 Fix Category Slugs\n')
  
  const categories = await prisma.category.findMany()
  
  for (const category of categories) {
    const slug = category.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    
    if (slug !== category.slug) {
      await prisma.category.update({
        where: { id: category.id },
        data: { slug }
      })
      console.log(`✓ Updated: ${category.name} → ${slug}`)
    } else {
      console.log(`✓ OK: ${category.name}`)
    }
  }
  
  console.log('\n✅ All slugs fixed')
}

async function checkDatabase() {
  console.log('\n📊 Database Statistics\n')
  
  const stats = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    submissions: await prisma.submission.count(),
    reviews: await prisma.review.count(),
    articles: await prisma.article.count(),
    issues: await prisma.issue.count(),
    volumes: await prisma.volume.count(),
    auditLogs: await prisma.auditLog.count()
  }
  
  console.log(`Users:       ${stats.users}`)
  console.log(`Categories:  ${stats.categories}`)
  console.log(`Submissions: ${stats.submissions}`)
  console.log(`Reviews:     ${stats.reviews}`)
  console.log(`Articles:    ${stats.articles}`)
  console.log(`Issues:      ${stats.issues}`)
  console.log(`Volumes:     ${stats.volumes}`)
  console.log(`Audit Logs:  ${stats.auditLogs}`)
  
  // Role distribution
  console.log('\n👥 User Roles:')
  const roleGroups = await prisma.user.groupBy({
    by: ['role'],
    _count: true
  })
  roleGroups.forEach(g => {
    console.log(`  ${g.role}: ${g._count}`)
  })
  
  // Submission status distribution
  console.log('\n📝 Submission Status:')
  const statusGroups = await prisma.submission.groupBy({
    by: ['status'],
    _count: true
  })
  statusGroups.forEach(g => {
    console.log(`  ${g.status}: ${g._count}`)
  })
}

async function listReviewers() {
  console.log('\n👨‍⚖️ Reviewer Workload\n')
  
  const reviewers = await prisma.user.findMany({
    where: {
      role: {
        in: ['REVIEWER', 'SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC']
      }
    },
    include: {
      reviews: {
        where: {
          submittedAt: null // Pending reviews
        }
      }
    },
    orderBy: {
      fullName: 'asc'
    }
  })
  
  console.log('Name'.padEnd(30) + 'Email'.padEnd(30) + 'Pending')
  console.log('-'.repeat(70))
  
  reviewers.forEach(reviewer => {
    const pending = reviewer.reviews.length
    const name = reviewer.fullName.padEnd(30)
    const email = reviewer.email.padEnd(30)
    console.log(`${name}${email}${pending}`)
  })
  
  console.log(`\nTotal reviewers: ${reviewers.length}`)
}

async function createUser() {
  console.log('\n👤 Create New User\n')
  
  const email = await question('Email: ')
  const fullName = await question('Full name: ')
  const password = await question('Password (default: password123): ') || 'password123'
  const org = await question('Organization (optional): ')
  
  console.log('\nSelect role:')
  console.log('1. READER')
  console.log('2. AUTHOR')
  console.log('3. REVIEWER')
  console.log('4. SECTION_EDITOR')
  console.log('5. MANAGING_EDITOR')
  console.log('6. EIC')
  console.log('7. LAYOUT_EDITOR')
  console.log('8. SYSADMIN')
  
  const roleChoice = await question('Choice (1-8): ')
  const roles = ['READER', 'AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'LAYOUT_EDITOR', 'SYSADMIN']
  const role = roles[parseInt(roleChoice) - 1] || 'READER'
  
  const passwordHash = await bcrypt.hash(password, 12)
  
  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      org: org || undefined,
      role: role as any,
      passwordHash,
      isActive: true
    }
  })
  
  console.log(`\n✅ User created:`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Role: ${user.role}`)
  console.log(`   Password: ${password}`)
}

async function mainMenu() {
  console.log('\n╔═══════════════════════════════════════╗')
  console.log('║   Admin CLI - Tạp chí HCQS          ║')
  console.log('╚═══════════════════════════════════════╝')
  console.log('\nSelect an option:')
  console.log('1. Reset Admin Password')
  console.log('2. Fix Category Slugs')
  console.log('3. Check Database Stats')
  console.log('4. List Reviewers & Workload')
  console.log('5. Create New User')
  console.log('6. Exit')
  
  const choice = await question('\nChoice (1-6): ')
  
  switch (choice) {
    case '1':
      await resetAdminPassword()
      break
    case '2':
      await fixSlugs()
      break
    case '3':
      await checkDatabase()
      break
    case '4':
      await listReviewers()
      break
    case '5':
      await createUser()
      break
    case '6':
      console.log('\n👋 Goodbye!\n')
      rl.close()
      await prisma.$disconnect()
      process.exit(0)
    default:
      console.log('\n❌ Invalid choice')
  }
  
  // Return to menu
  await mainMenu()
}

// Run
mainMenu().catch(console.error)
