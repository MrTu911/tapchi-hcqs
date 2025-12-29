# Deployment Configuration

Thư mục này chứa cấu hình triển khai hệ thống Tạp chí Hậu cần Quân sự.

## Cấu trúc thư mục

```
/deploy/
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Next.js application Dockerfile
├── nginx.conf              # Nginx reverse proxy configuration
├── .env.production.example # Environment variables template
├── scripts/
│   ├── backup_db_docker.sh        # Database backup script
│   ├── restore_db_docker.sh       # Database restore script
│   ├── health_check.sh            # System health check
│   └── generate_ssl_cert.sh       # SSL certificate generator
├── certs/                  # SSL certificates
├── logs/                   # Nginx logs
└── backups/                # Database backups
```

## Hướng dẫn triển khai

### 1. Chuẩn bị môi trường

```bash
# Copy environment template
cp .env.production.example .env.production

# Chỉnh sửa file .env.production với thông tin thực tế
nano .env.production
```

### 2. Tạo SSL certificate (cho mạng nội bộ)

```bash
chmod +x scripts/generate_ssl_cert.sh
./scripts/generate_ssl_cert.sh
```

### 3. Khởi động hệ thống

```bash
# Build và start tất cả services
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Kiểm tra trạng thái
docker-compose ps
```

### 4. Khởi tạo database

```bash
# Chạy migrations
docker exec -it tapchi-app npx prisma migrate deploy

# Seed dữ liệu mẫu (nếu cần)
docker exec -it tapchi-app npm run seed
```

### 5. Kiểm tra sức khỏe hệ thống

```bash
chmod +x scripts/health_check.sh
./scripts/health_check.sh
```

## Backup & Restore

### Backup tự động

Backup tự động chạy mỗi ngày lúc 2:00 AM thông qua cron job trong container `tapchi-backup`.

### Backup thủ công

```bash
docker exec tapchi-backup /scripts/backup_db_docker.sh
```

### Restore từ backup

```bash
# Liệt kê các backup
docker exec tapchi-backup ls -lh /backups/

# Restore từ file backup
docker exec -it tapchi-backup /scripts/restore_db_docker.sh /backups/tapchi_backup_YYYYMMDD_HHMMSS.sql.gz

# Restart application
docker-compose restart app
```

## Quản lý

### Dừng hệ thống

```bash
docker-compose stop
```

### Khởi động lại

```bash
docker-compose restart
```

### Xóa toàn bộ (cẩn thận!)

```bash
docker-compose down -v  # Xóa cả volumes (mất dữ liệu!)
```

### Xem logs

```bash
# Tất cả services
docker-compose logs -f

# Một service cụ thể
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f nginx
```

### Update application

```bash
# Pull code mới
cd /home/ubuntu/tapchi-hcqs/nextjs_space
git pull

# Rebuild và restart
cd /home/ubuntu/tapchi-hcqs/deploy
docker-compose up -d --build app
```

## Monitoring

- Application: https://journal.hvc.local
- Nginx health: http://localhost/nginx-health
- App health: http://localhost:3000/api/health
- Database: localhost:5432

## Bảo mật

- Đổi tất cả passwords trong `.env.production`
- Sử dụng SSL certificates từ CA nội bộ cho production
- Đảm bảo firewall chỉ mở port 80, 443 ra ngoài
- Định kỳ review audit logs
- Backup thường xuyên và test restore

## Troubleshooting

### Container không start

```bash
# Xem logs chi tiết
docker-compose logs service_name

# Kiểm tra cấu hình
docker-compose config
```

### Database connection errors

```bash
# Kiểm tra database
docker exec -it tapchi-db psql -U postgres -d tapchi_hcqs

# Reset database (cẩn thận!)
docker-compose down
docker volume rm deploy_postgres_data
docker-compose up -d
```

### Nginx errors

```bash
# Test nginx config
docker exec tapchi-nginx nginx -t

# Reload nginx
docker exec tapchi-nginx nginx -s reload
```
