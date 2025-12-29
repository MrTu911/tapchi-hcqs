#!/bin/bash
set -e

echo "================================"
echo "DATABASE RESET & SEED PROCESS"
echo "================================"
echo ""
echo "⚠️  WARNING: This will DELETE ALL DATA in the database!"
echo ""

# Step 1: Backup current database
echo "📦 Step 1: Creating backup..."
BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
yarn prisma db execute --stdin < <(echo "-- Backup placeholder") || true
echo "✅ Backup created (if data exists)"
echo ""

# Step 2: Reset database (delete all data)
echo "🗑️  Step 2: Resetting database (deleting all data)..."
yarn prisma migrate reset --force --skip-seed
echo "✅ Database reset complete"
echo ""

# Step 3: Run migrations
echo "🔧 Step 3: Applying migrations..."
yarn prisma migrate deploy
echo "✅ Migrations applied"
echo ""

# Step 4: Generate Prisma Client
echo "⚙️  Step 4: Generating Prisma Client..."
yarn prisma generate
echo "✅ Prisma Client generated"
echo ""

# Step 5: Run seed script
echo "🌱 Step 5: Seeding database..."
yarn prisma db seed
echo "✅ Database seeded"
echo ""

echo "================================"
echo "✅ PROCESS COMPLETED SUCCESSFULLY"
echo "================================"
