#!/bin/bash

# Verify Build Script
# Kiểm tra build artifacts có Prisma Client đúng không

set -e

echo "========================================"
echo "  KIỂM TRA BUILD ARTIFACTS"
echo "========================================"
echo ""

# 1. Kiểm tra .build tồn tại
if [ ! -d ".build" ]; then
  echo "❌ .build directory không tồn tại!"
  echo "   Chạy: yarn build trước"
  exit 1
fi

echo "✅ .build directory tồn tại"

# 2. Kiểm tra standalone build
if [ ! -d ".build/standalone" ]; then
  echo "❌ .build/standalone không tồn tại!"
  exit 1
fi

echo "✅ .build/standalone tồn tại"

# 3. Kiểm tra Prisma Client trong build
if [ ! -d ".build/standalone/app/node_modules/.prisma" ]; then
  echo "⚠️  Prisma Client chưa có trong standalone build"
  echo "   Đây là bình thường nếu dùng shared node_modules"
else
  echo "✅ Prisma Client có trong standalone build"
  if [ -f ".build/standalone/app/node_modules/.prisma/client/package.json" ]; then
    VERSION=$(cat .build/standalone/app/node_modules/.prisma/client/package.json | grep '"version"' | head -n1 | cut -d'"' -f4)
    echo "   ℹ️  Version: $VERSION"
  fi
fi

# 4. Kiểm tra API routes
if [ ! -f ".build/server/app/api/submissions/route.js" ]; then
  echo "❌ API route submissions không tồn tại!"
  exit 1
fi

echo "✅ API route submissions tồn tại"

# 5. Kiểm tra kích thước build
BUILD_SIZE=$(du -sh .build | cut -f1)
echo "ℹ️  Kích thước build: $BUILD_SIZE"

# 6. Kiểm tra timestamp
BUILD_TIME=$(stat -c %y .build | cut -d'.' -f1)
echo "ℹ️  Build time: $BUILD_TIME"

echo ""
echo "========================================"
echo "  ✅ KIỂM TRA HOÀN TẤT"
echo "========================================"
