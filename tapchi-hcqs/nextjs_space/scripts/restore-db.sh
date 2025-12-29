
#!/bin/bash
# ✅ D4: Script khôi phục database từ backup
# Sử dụng: ./scripts/restore-db.sh <backup_file>

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Kiểm tra tham số
if [ -z "$1" ]; then
  echo "❌ Lỗi: Vui lòng cung cấp file backup"
  echo "Sử dụng: ./scripts/restore-db.sh <backup_file>"
  echo ""
  echo "📋 Danh sách các backup hiện có:"
  ls -lh backups/backup_*.sql.gz 2>/dev/null || echo "Chưa có backup nào"
  exit 1
fi

BACKUP_FILE="$1"

# Kiểm tra file tồn tại
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Lỗi: File không tồn tại: $BACKUP_FILE"
  exit 1
fi

# Kiểm tra DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Lỗi: Không tìm thấy DATABASE_URL trong .env"
  exit 1
fi

echo "⚠️  CẢNH BÁO: Script này sẽ XÓA toàn bộ dữ liệu hiện tại!"
echo "📁 File backup: $BACKUP_FILE"
echo ""
read -p "Bạn có chắc chắn muốn khôi phục? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Đã hủy"
  exit 0
fi

echo "🔄 Đang khôi phục database..."

# Giải nén nếu file .gz
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "🗜️  Đang giải nén file..."
  TEMP_FILE="${BACKUP_FILE%.gz}"
  gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
  RESTORE_FILE="$TEMP_FILE"
  SHOULD_DELETE_TEMP=true
else
  RESTORE_FILE="$BACKUP_FILE"
  SHOULD_DELETE_TEMP=false
fi

# Khôi phục database
psql "$DATABASE_URL" < "$RESTORE_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Khôi phục database thành công"
  
  # Xóa file tạm nếu có
  if [ "$SHOULD_DELETE_TEMP" = true ]; then
    rm "$RESTORE_FILE"
  fi
  
  echo "✅ Hoàn tất!"
else
  echo "❌ Lỗi khi khôi phục database"
  
  # Xóa file tạm nếu có
  if [ "$SHOULD_DELETE_TEMP" = true ]; then
    rm "$RESTORE_FILE"
  fi
  
  exit 1
fi

# Chạy migrations để đảm bảo schema đúng
echo "🔄 Đang chạy migrations..."
yarn prisma migrate deploy

echo "✅ Tất cả đã xong!"
