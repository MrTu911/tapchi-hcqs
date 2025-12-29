-- Migration: Add Chat & Comments System
-- Created: 2025-12-27
-- Description: Thêm các bảng cho hệ thống chat nội bộ và bình luận công khai

-- ================================================
-- 1. Tạo bảng ChatConversation (Hội thoại)
-- ================================================
CREATE TABLE IF NOT EXISTS "ChatConversation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'private',
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ChatConversation_createdAt_idx" ON "ChatConversation"("createdAt");
CREATE INDEX IF NOT EXISTS "ChatConversation_type_idx" ON "ChatConversation"("type");

-- ================================================
-- 2. Tạo bảng ConversationParticipant (Thành viên hội thoại)
-- ================================================
CREATE TABLE IF NOT EXISTS "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");
CREATE INDEX IF NOT EXISTS "ConversationParticipant_conversationId_idx" ON "ConversationParticipant"("conversationId");
CREATE INDEX IF NOT EXISTS "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");

-- ================================================
-- 3. Tạo bảng ChatMessage (Tin nhắn)
-- ================================================
CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ChatMessage_conversationId_idx" ON "ChatMessage"("conversationId");
CREATE INDEX IF NOT EXISTS "ChatMessage_senderId_idx" ON "ChatMessage"("senderId");
CREATE INDEX IF NOT EXISTS "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");
CREATE INDEX IF NOT EXISTS "ChatMessage_isRead_idx" ON "ChatMessage"("isRead");

-- ================================================
-- 4. Tạo bảng ArticleComment (Bình luận công khai)
-- ================================================
CREATE TABLE IF NOT EXISTS "ArticleComment" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT,
    "content" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ArticleComment_articleId_idx" ON "ArticleComment"("articleId");
CREATE INDEX IF NOT EXISTS "ArticleComment_userId_idx" ON "ArticleComment"("userId");
CREATE INDEX IF NOT EXISTS "ArticleComment_createdAt_idx" ON "ArticleComment"("createdAt");
CREATE INDEX IF NOT EXISTS "ArticleComment_isApproved_idx" ON "ArticleComment"("isApproved");

-- ================================================
-- 5. Thêm Foreign Keys
-- ================================================

-- ConversationParticipant -> ChatConversation
ALTER TABLE "ConversationParticipant" 
    ADD CONSTRAINT IF NOT EXISTS "ConversationParticipant_conversationId_fkey" 
    FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ConversationParticipant -> User
ALTER TABLE "ConversationParticipant" 
    ADD CONSTRAINT IF NOT EXISTS "ConversationParticipant_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ChatMessage -> ChatConversation
ALTER TABLE "ChatMessage" 
    ADD CONSTRAINT IF NOT EXISTS "ChatMessage_conversationId_fkey" 
    FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ChatMessage -> User
ALTER TABLE "ChatMessage" 
    ADD CONSTRAINT IF NOT EXISTS "ChatMessage_senderId_fkey" 
    FOREIGN KEY ("senderId") REFERENCES "User"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ArticleComment -> Article
ALTER TABLE "ArticleComment" 
    ADD CONSTRAINT IF NOT EXISTS "ArticleComment_articleId_fkey" 
    FOREIGN KEY ("articleId") REFERENCES "Article"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ArticleComment -> User (nullable)
ALTER TABLE "ArticleComment" 
    ADD CONSTRAINT IF NOT EXISTS "ArticleComment_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ================================================
-- 6. Hoàn tất
-- ================================================
-- Migration đã hoàn thành. 
-- Chạy script này trên production database để kích hoạt module Chat & Comments.
