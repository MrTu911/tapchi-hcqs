/**
 * Script kiểm tra hệ thống chat và blind review policy
 * Chạy: npx tsx scripts/test-chat-system.ts
 */

import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { canChat, validateConversationParticipants, getAllowedRoles } from '../lib/chat-guard';
import { Role } from '@prisma/client';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testResult(testName: string, passed: boolean, expected: any, actual: any) {
  if (passed) {
    log('green', `✅ ${testName}`);
  } else {
    log('red', `❌ ${testName}`);
    log('yellow', `   Expected: ${JSON.stringify(expected)}`);
    log('yellow', `   Actual: ${JSON.stringify(actual)}`);
  }
}

async function testChatGuardLogic() {
  log('cyan', '\n=== Testing Chat Guard Logic ===\n');

  // Test 1: Author không thể chat với Reviewer
  const test1 = !canChat('AUTHOR' as Role, 'REVIEWER' as Role);
  testResult('Author cannot chat with Reviewer', test1, false, canChat('AUTHOR' as Role, 'REVIEWER' as Role));

  // Test 2: Reviewer không thể chat với Author
  const test2 = !canChat('REVIEWER' as Role, 'AUTHOR' as Role);
  testResult('Reviewer cannot chat with Author', test2, false, canChat('REVIEWER' as Role, 'AUTHOR' as Role));

  // Test 3: Author có thể chat với Editor
  const test3 = canChat('AUTHOR' as Role, 'SECTION_EDITOR' as Role);
  testResult('Author can chat with Section Editor', test3, true, test3);

  // Test 4: Reviewer có thể chat với Editor
  const test4 = canChat('REVIEWER' as Role, 'MANAGING_EDITOR' as Role);
  testResult('Reviewer can chat with Managing Editor', test4, true, test4);

  // Test 5: Editor có thể chat với cả Author và Reviewer
  const test5a = canChat('SECTION_EDITOR' as Role, 'AUTHOR' as Role);
  const test5b = canChat('SECTION_EDITOR' as Role, 'REVIEWER' as Role);
  testResult('Section Editor can chat with Author', test5a, true, test5a);
  testResult('Section Editor can chat with Reviewer', test5b, true, test5b);

  // Test 6: validateConversationParticipants ngăn chặn Author + Reviewer
  const validation1 = validateConversationParticipants(['AUTHOR' as Role, 'REVIEWER' as Role]);
  testResult('Validation blocks Author + Reviewer conversation', !validation1.valid, false, validation1.valid);

  // Test 7: validateConversationParticipants cho phép Author + Editor
  const validation2 = validateConversationParticipants(['AUTHOR' as Role, 'SECTION_EDITOR' as Role]);
  testResult('Validation allows Author + Editor conversation', validation2.valid, true, validation2.valid);

  // Test 8: validateConversationParticipants cho phép Reviewer + Editor
  const validation3 = validateConversationParticipants(['REVIEWER' as Role, 'MANAGING_EDITOR' as Role]);
  testResult('Validation allows Reviewer + Editor conversation', validation3.valid, true, validation3.valid);

  // Test 9: getAllowedRoles cho Author không bao gồm Reviewer
  const authorAllowedRoles = getAllowedRoles('AUTHOR' as Role);
  const test9 = !authorAllowedRoles.includes('REVIEWER' as Role);
  testResult('Author allowed roles does not include Reviewer', test9, false, authorAllowedRoles.includes('REVIEWER' as Role));

  // Test 10: getAllowedRoles cho Reviewer không bao gồm Author
  const reviewerAllowedRoles = getAllowedRoles('REVIEWER' as Role);
  const test10 = !reviewerAllowedRoles.includes('AUTHOR' as Role);
  testResult('Reviewer allowed roles does not include Author', test10, false, reviewerAllowedRoles.includes('AUTHOR' as Role));
}

async function testDatabaseModels() {
  log('cyan', '\n=== Testing Database Models ===\n');

  try {
    // Test 1: Kiểm tra ChatConversation model
    const conversationsCount = await prisma.chatConversation.count();
    log('green', `✅ ChatConversation model exists - ${conversationsCount} conversations found`);

    // Test 2: Kiểm tra ConversationParticipant model
    const participantsCount = await prisma.conversationParticipant.count();
    log('green', `✅ ConversationParticipant model exists - ${participantsCount} participants found`);

    // Test 3: Kiểm tra ChatMessage model
    const messagesCount = await prisma.chatMessage.count();
    log('green', `✅ ChatMessage model exists - ${messagesCount} messages found`);

    // Test 4: Kiểm tra Message model (old system)
    const oldMessagesCount = await prisma.message.count();
    log('green', `✅ Message model exists - ${oldMessagesCount} old messages found`);

    // Test 5: Kiểm tra ArticleComment model
    const commentsCount = await prisma.articleComment.count();
    log('green', `✅ ArticleComment model exists - ${commentsCount} comments found`);

  } catch (error: any) {
    log('red', `❌ Database model test failed: ${error.message}`);
  }
}

async function testUserRolesAndRelations() {
  log('cyan', '\n=== Testing User Roles and Relations ===\n');

  try {
    // Tìm users có vai trò AUTHOR
    const authors = await prisma.user.findMany({
      where: { role: 'AUTHOR', isActive: true },
      take: 3,
      select: {
        id: true,
        fullName: true,
        role: true,
        email: true,
      },
    });
    log('green', `✅ Found ${authors.length} active authors`);
    if (authors.length > 0) {
      log('blue', `   Example: ${authors[0].fullName} (${authors[0].email})`);
    }

    // Tìm users có vai trò REVIEWER
    const reviewers = await prisma.user.findMany({
      where: { role: 'REVIEWER', isActive: true },
      take: 3,
      select: {
        id: true,
        fullName: true,
        role: true,
        email: true,
      },
    });
    log('green', `✅ Found ${reviewers.length} active reviewers`);
    if (reviewers.length > 0) {
      log('blue', `   Example: ${reviewers[0].fullName} (${reviewers[0].email})`);
    }

    // Tìm users có vai trò SECTION_EDITOR
    const editors = await prisma.user.findMany({
      where: { role: 'SECTION_EDITOR', isActive: true },
      take: 3,
      select: {
        id: true,
        fullName: true,
        role: true,
        email: true,
      },
    });
    log('green', `✅ Found ${editors.length} active section editors`);
    if (editors.length > 0) {
      log('blue', `   Example: ${editors[0].fullName} (${editors[0].email})`);
    }

  } catch (error: any) {
    log('red', `❌ User roles test failed: ${error.message}`);
  }
}

async function testConversationScenarios() {
  log('cyan', '\n=== Testing Conversation Scenarios ===\n');

  try {
    // Scenario 1: Lấy conversations của một user
    const sampleUser = await prisma.user.findFirst({
      where: { isActive: true },
    });

    if (sampleUser) {
      const userConversations = await prisma.chatConversation.findMany({
        where: {
          participants: {
            some: {
              userId: sampleUser.id,
              isActive: true,
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  role: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        take: 5,
      });

      log('green', `✅ Found ${userConversations.length} conversations for ${sampleUser.fullName}`);

      // Kiểm tra blind review policy trong conversations
      userConversations.forEach((conv, index) => {
        const participantRoles = conv.participants.map((p) => p.user.role);
        const hasAuthor = participantRoles.includes('AUTHOR');
        const hasReviewer = participantRoles.includes('REVIEWER');

        if (hasAuthor && hasReviewer) {
          log('red', `❌ VIOLATION: Conversation ${index + 1} has both AUTHOR and REVIEWER!`);
          log('yellow', `   Participants: ${participantRoles.join(', ')}`);
        } else {
          log('blue', `   Conversation ${index + 1}: ${participantRoles.join(', ')} - ${conv._count.messages} messages`);
        }
      });
    } else {
      log('yellow', '⚠️  No users found in database');
    }
  } catch (error: any) {
    log('red', `❌ Conversation scenarios test failed: ${error.message}`);
  }
}

async function main() {
  log('cyan', '\n🛡️  CHAT SYSTEM TEST SUITE 🛡️\n');

  await testChatGuardLogic();
  await testDatabaseModels();
  await testUserRolesAndRelations();
  await testConversationScenarios();

  log('cyan', '\n=== Test Suite Completed ===\n');

  await prisma.$disconnect();
}

main().catch((error) => {
  log('red', `\n❌ Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
