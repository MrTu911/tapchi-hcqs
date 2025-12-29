# Hướng dẫn Triển khai Hệ thống
# Tạp chí Điện tử Khoa học Hậu cần Quân sự

## Mục lục

1. [Yêu cầu Hệ thống](#yêu-cầu-hệ-thống)
2. [Cài đặt Môi trường](#cài-đặt-môi-trường)
3. [Cấu hình Hệ thống](#cấu-hình-hệ-thống)
4. [Triển khai với Docker](#triển-khai-với-docker)
5. [Khởi tạo Dữ liệu](#khởi-tạo-dữ-liệu)
6. [Backup và Restore](#backup-và-restore)
7. [Monitoring và Maintenance](#monitoring-và-maintenance)
8. [Troubleshooting](#troubleshooting)

---

## 1. Yêu cầu Hệ thống

### Phần cứng tối thiểu

**Máy chủ ứng dụng:**
- CPU: 4 cores (Intel Xeon hoặc tương đương)
- RAM: 8 GB
- Storage: 100 GB SSD
- Network: 1 Gbps LAN

**Máy chủ Database:**
- CPU: 4 cores
- RAM: 16 GB
- Storage: 200 GB SSD (RAID 10 khuyến nghị)
- Network: 1 Gbps LAN

### Phần mềm

- **Hệ điều hành**: Ubuntu 22.04 LTS hoặc CentOS 8
- **Docker**: ≥ 24.0
- **Docker Compose**: ≥ 2.20
- **PostgreSQL**: 16 (qua Docker)
- **Node.js**: 18 LTS (qua Docker)
- **Nginx**: Latest (qua Docker)

### Mạng và Bảo mật

- Domain nội bộ: `journal.hvc.local` (hoặc tên tùy chỉnh)
- SSL Certificate: Từ CA nội bộ quân đội
- Firewall: Chỉ mở port 80, 443 cho mạng nội bộ
- Backup Storage: NAS hoặc máy chủ backup riêng biệt

---

## 2. Cài đặt Môi trường

### 2.1. Cài đặt Docker

```bash
# Update hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Thêm user vào docker group
sudo usermod -aG docker $USER

# Cài đặt Docker Compose
sudo apt install docker-compose-plugin -y

# Kiểm tra phiên bản
docker --version
docker compose version
```

### 2.2. Chuẩn bị Thư mục

```bash
# Tạo thư mục dự án
sudo mkdir -p /opt/tapchi-hcqs
sudo chown -R $USER:$USER /opt/tapchi-hcqs
cd /opt/tapchi-hcqs

# Clone source code (hoặc copy từ USB/CD)
git clone <repository-url> .
# HOẶC
rsync -av /path/to/source/ /opt/tapchi-hcqs/

cd /opt/tapchi-hcqs/deploy
```

---

## 3. Cấu hình Hệ thống

### 3.1. Biến Môi trường

```bash
# Copy template
cp .env.production.example .env.production

# Chỉnh sửa file
nano .env.production
```

**Nội dung `.env.production`:**

```env
# Database
DATABASE_URL="postgresql://postgres:CHANGE_THIS_PASSWORD@postgres:5432/tapchi_hcqs?schema=public"
POSTGRES_DB=tapchi_hcqs
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD  # Đổi thành mật khẩu mạnh!

# JWT Secrets (tạo bằng: openssl rand -base64 32)
JWT_SECRET=YOUR_JWT_SECRET_HERE_MIN_32_CHARS
JWT_REFRESH_SECRET=YOUR_REFRESH_SECRET_HERE_MIN_32_CHARS

# AWS S3 (cho file uploads)
AWS_REGION=ap-southeast-1
AWS_BUCKET_NAME=tapchi-hcqs-files
AWS_FOLDER_PREFIX=production/

# Application
NEXT_PUBLIC_APP_URL=https://journal.hvc.local
NODE_ENV=production

# Backup
BACKUP_RETENTION_DAYS=30
```

**Tạo JWT Secrets:**

```bash
# Tạo JWT_SECRET
openssl rand -base64 32

# Tạo JWT_REFRESH_SECRET
openssl rand -base64 32
```

### 3.2. SSL Certificate

**Option 1: Self-signed (cho testing):**

```bash
cd /opt/tapchi-hcqs/deploy
chmod +x scripts/generate_ssl_cert.sh
./scripts/generate_ssl_cert.sh
```

**Option 2: CA nội bộ quân đội (production):**

```bash
# Copy certificates từ CA
cp /path/to/fullchain.pem /opt/tapchi-hcqs/deploy/certs/
cp /path/to/privkey.pem /opt/tapchi-hcqs/deploy/certs/

# Phân quyền
chmod 644 /opt/tapchi-hcqs/deploy/certs/fullchain.pem
chmod 600 /opt/tapchi-hcqs/deploy/certs/privkey.pem

# Cập nhật nginx.conf
nano nginx.conf
# Uncomment và điều chỉnh:
# ssl_certificate /etc/nginx/certs/fullchain.pem;
# ssl_certificate_key /etc/nginx/certs/privkey.pem;
```

### 3.3. Cấu hình DNS

Thêm vào DNS Server nội bộ:

```
journal.hvc.local    A    10.0.x.x  # IP của máy chủ
```

Hoặc thêm vào `/etc/hosts` trên máy client:

```bash
echo "10.0.x.x journal.hvc.local" | sudo tee -a /etc/hosts
```

---

## 4. Triển khai với Docker

### 4.1. Build và Start Services

```bash
cd /opt/tapchi-hcqs/deploy

# Build images
docker compose build

# Start all services
docker compose up -d

# Kiểm tra trạng thái
docker compose ps

# Xem logs
docker compose logs -f
```

### 4.2. Kiểm tra Services

```bash
# Kiểm tra database
docker exec tapchi-db pg_isready -U postgres

# Kiểm tra application
curl http://localhost:3000/api/health

# Kiểm tra Nginx
curl http://localhost/nginx-health
```

---

## 5. Khởi tạo Dữ liệu

### 5.1. Chạy Migrations

```bash
# Vào container app
docker exec -it tapchi-app sh

# Chạy migrations
npx prisma migrate deploy

# Generate Prisma Client (nếu cần)
npx prisma generate

# Thoát container
exit
```

### 5.2. Seed Dữ liệu Mẫu

```bash
# Chạy seed script
docker exec -it tapchi-app npm run seed
```

**Tài khoản admin mặc định:**
- Email: `admin@hvc.local`
- Password: `Admin@12345`
- Role: SYSADMIN

**⚠️ Lưu ý:** Đổi mật khẩu ngay sau khi đăng nhập lần đầu!

### 5.3. Tối ưu Database

```bash
# Chạy optimization script
docker exec -it tapchi-db psql -U postgres -d tapchi_hcqs -f /scripts/optimize-db.sql
```

---

## 6. Backup và Restore

### 6.1. Backup Tự Động

Backup tự động chạy mỗi ngày lúc 2:00 AM qua cron job trong container `tapchi-backup`.

**Kiểm tra backup:**

```bash
# Liệt kê backups
ls -lh /opt/tapchi-hcqs/deploy/backups/

# Xem logs backup
docker logs tapchi-backup
```

### 6.2. Backup Thủ công

```bash
# Backup database
docker exec tapchi-backup /scripts/backup_db_docker.sh

# Backup files (uploads)
rsync -av /opt/tapchi-hcqs/deploy/volumes/app_uploads/ /backup/uploads/
```

### 6.3. Restore từ Backup

**⚠️ Cảnh báo:** Quá trình này sẽ xóa toàn bộ dữ liệu hiện tại!

```bash
# 1. Dừng application
docker compose stop app

# 2. Liệt kê backups
docker exec tapchi-backup ls -lh /backups/

# 3. Restore database
docker exec -it tapchi-backup /scripts/restore_db_docker.sh /backups/tapchi_backup_20240101_020000.sql.gz

# 4. Khởi động lại
docker compose start app

# 5. Kiểm tra
docker compose logs -f app
```

### 6.4. Backup lên Máy chủ NAS

```bash
# Cấu hình rsync tự động
crontab -e

# Thêm dòng:
0 3 * * * rsync -av /opt/tapchi-hcqs/deploy/backups/ user@nas-server:/backups/tapchi-hcqs/
```

---

## 7. Monitoring và Maintenance

### 7.1. Kiểm tra Sức khỏe Hệ thống

```bash
# Chạy health check
cd /opt/tapchi-hcqs/deploy
chmod +x scripts/health_check.sh
./scripts/health_check.sh
```

### 7.2. Xem Logs

```bash
# Application logs
docker compose logs -f app

# Database logs
docker compose logs -f postgres

# Nginx logs
docker compose logs -f nginx

# Backup logs
docker compose logs -f backup

# Tất cả logs
docker compose logs -f
```

### 7.3. Monitoring Dashboard

Truy cập: `https://journal.hvc.local/dashboard/admin/monitor`

- Tổng quan hệ thống
- Thống kê người dùng, bài viết
- Xu hướng và biểu đồ
- Hoạt động gần đây

### 7.4. Audit Logs

Truy cập: `https://journal.hvc.local/dashboard/admin/audit`

- Xem tất cả hoạt động hệ thống
- Lọc theo người dùng, hành động, thời gian
- Xuất báo cáo

### 7.5. Maintenance Tasks

**Hàng tuần:**

```bash
# Vacuum database
docker exec tapchi-db psql -U postgres -d tapchi_hcqs -c "VACUUM ANALYZE;"

# Kiểm tra disk usage
df -h
du -sh /opt/tapchi-hcqs/deploy/volumes/*

# Kiểm tra backups
ls -lh /opt/tapchi-hcqs/deploy/backups/ | tail -n 10
```

**Hàng tháng:**

```bash
# Reindex database
docker exec tapchi-db psql -U postgres -d tapchi_hcqs -c "REINDEX DATABASE tapchi_hcqs;"

# Update system
sudo apt update && sudo apt upgrade -y

# Check Docker images updates
docker images
```

---

## 8. Troubleshooting

### 8.1. Container không start

```bash
# Xem logs chi tiết
docker compose logs service_name

# Kiểm tra cấu hình
docker compose config

# Restart service
docker compose restart service_name
```

### 8.2. Database connection errors

```bash
# Kiểm tra database
docker exec -it tapchi-db psql -U postgres -d tapchi_hcqs

# Kiểm tra network
docker network inspect deploy_tapchi-network

# Reset database (cẩn thận!)
docker compose down
docker volume rm deploy_postgres_data
docker compose up -d
```

### 8.3. Application errors

```bash
# Xem logs real-time
docker compose logs -f app

# Vào container để debug
docker exec -it tapchi-app sh

# Rebuild application
docker compose up -d --build app
```

### 8.4. Nginx errors

```bash
# Test nginx config
docker exec tapchi-nginx nginx -t

# Reload nginx
docker exec tapchi-nginx nginx -s reload

# Restart nginx
docker compose restart nginx
```

### 8.5. Performance issues

```bash
# Kiểm tra resource usage
docker stats

# Kiểm tra slow queries
docker exec tapchi-db psql -U postgres -d tapchi_hcqs -c "SELECT * FROM slow_queries;"

# Kiểm tra connections
docker exec tapchi-db psql -U postgres -d tapchi_hcqs -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## Phụ lục

### A. Cấu trúc Thư mục

```
/opt/tapchi-hcqs/
├── deploy/
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .env.production
│   ├── scripts/
│   ├── certs/
│   ├── logs/
│   ├── backups/
│   └── volumes/
├── nextjs_space/  # Application code
└── docs/          # Documentation
```

### B. Các Lệnh Thường dùng

```bash
# Start hệ thống
docker compose up -d

# Stop hệ thống
docker compose stop

# Restart hệ thống
docker compose restart

# Xem logs
docker compose logs -f

# Xem trạng thái
docker compose ps

# Update code và rebuild
git pull
docker compose up -d --build app

# Backup database
docker exec tapchi-backup /scripts/backup_db_docker.sh

# Health check
./scripts/health_check.sh
```

### C. Liên hệ Hỗ trợ

- **Email kỹ thuật**: it-support@hvc.local
- **Điện thoại nội bộ**: [Số điện thoại]
- **Trang thông tin**: https://journal.hvc.local

---

**Tài liệu phiên bản**: 4.0  
**Ngày cập nhật**: 27/12/2024  
**Tác giả**: Phòng CNTT - Học viện Hậu cần Quân sự
