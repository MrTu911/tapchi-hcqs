
#!/bin/bash
# ✅ D4: Script sao lưu database PostgreSQL
# Sử dụng: ./scripts/backup-db.sh

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Tạo thư mục backup nếu chưa tồn tại
mkdir -p "$BACKUP_DIR"

echo "🔄 Đang sao lưu database..."
echo "📁 File: $BACKUP_FILE"

# Backup database
# Sử dụng pg_dump với DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Lỗi: Không tìm thấy DATABASE_URL trong .env"
  exit 1
fi

# Extract database connection info from DATABASE_URL
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Sao lưu database thành công"
  
  # Nén file backup
  echo "🗜️  Đang nén file backup..."
  gzip "$BACKUP_FILE"
  
  if [ $? -eq 0 ]; then
    echo "✅ Nén file thành công: $COMPRESSED_FILE"
    
    # Hiển thị kích thước file
    FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    echo "📊 Kích thước: $FILE_SIZE"
  else
    echo "⚠️  Không thể nén file, nhưng backup đã hoàn tất"
  fi
  
  # Xóa các backup cũ hơn 30 ngày
  echo "🧹 Xóa các backup cũ hơn 30 ngày..."
  find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete
  
  echo "✅ Hoàn tất!"
  echo ""
  echo "📋 Danh sách các backup hiện tại:"
  ls -lh "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null || echo "Chưa có backup nào"
  
else
  echo "❌ Lỗi khi sao lưu database"
  exit 1
fi
