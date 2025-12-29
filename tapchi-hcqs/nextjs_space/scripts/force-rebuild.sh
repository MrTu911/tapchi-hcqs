#!/bin/bash

# Force Rebuild Script
# Xóa tất cả cache và build lại từ đầu

set -e  # Exit on error

echo "========================================"
echo "  FORCE REBUILD - XÓA CACHE VÀ BUILD LẠI"
echo "========================================"
echo ""

# 1. Xóa .build directory
echo "➤ Bước 1: Xóa .build directory..."
if [ -d ".build" ]; then
  rm -rf .build
  echo "  ✅ Đã xóa .build"
else
  echo "  ℹ️  .build không tồn tại"
fi

# 2. Xóa .next directory
echo "➤ Bước 2: Xóa .next directory..."
if [ -d ".next" ]; then
  rm -rf .next
  echo "  ✅ Đã xóa .next"
else
  echo "  ℹ️  .next không tồn tại"
fi

# 3. Xóa node_modules/.cache
echo "➤ Bước 3: Xóa node_modules/.cache..."
if [ -d "node_modules/.cache" ]; then
  rm -rf node_modules/.cache
  echo "  ✅ Đã xóa node_modules/.cache"
else
  echo "  ℹ️  node_modules/.cache không tồn tại"
fi

# 4. Regenerate Prisma Client
echo "➤ Bước 4: Regenerate Prisma Client..."
yarn prisma generate
echo "  ✅ Prisma Client đã được regenerate"

# 5. Kiểm tra Prisma Client version
echo "➤ Bước 5: Kiểm tra Prisma Client..."
PRISMA_VERSION=$(yarn prisma --version | grep "prisma" | head -n1 | awk '{print $3}')
echo "  ℹ️  Prisma CLI version: $PRISMA_VERSION"

if [ -f "node_modules/.prisma/client/package.json" ]; then
  CLIENT_VERSION=$(cat node_modules/.prisma/client/package.json | grep '"version"' | head -n1 | cut -d'"' -f4)
  echo "  ℹ️  Prisma Client version: $CLIENT_VERSION"
fi

# 6. Build application
echo "➤ Bước 6: Build application..."
NODE_OPTIONS="--max-old-space-size=4096" yarn build
echo "  ✅ Build hoàn tất"

echo ""
echo "========================================"
echo "  ✅ FORCE REBUILD HOÀN TẤT"
echo "========================================"
echo ""
echo "Tiếp theo:"
echo "  1. Kiểm tra build artifacts trong .build/"
echo "  2. Deploy lên production"
echo "  3. Chờ 5 phút rồi test"
