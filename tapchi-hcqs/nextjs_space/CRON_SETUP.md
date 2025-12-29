# Hướng Dẫn Cài Đặt Cron Jobs

## Tổng Quan

Hệ thống cung cấp các cron jobs tự động để quản lý deadline, SLA tracking, và notifications.

## Các Cron Jobs Có Sẵn

### 1. Check Overdue Deadlines
**Endpoint:** `/api/cron/check-deadlines`  
**Tần suất:** Mỗi giờ  
**Mục đích:** Kiểm tra các deadline đã quá hạn và gửi thông báo

### 2. Send Deadline Reminders
**Endpoint:** `/api/cron/deadline-reminders`  
**Tần suất:** Hàng ngày lúc 9:00 AM  
**Mục đích:** Gửi nhắc nhở cho các deadline sắp đến (24-48 giờ)

### 3. Track SLA Compliance
**Endpoint:** `/api/cron/sla-tracking`  
**Tần suất:** Hàng ngày lúc 00:00  
**Mục đích:** Theo dõi SLA và tạo alerts cho các submission vi phạm

### 4. Send Reviewer Reminders
**Endpoint:** `/api/cron/reviewer-reminders`  
**Tần suất:** Mỗi thứ 2 lúc 10:00 AM  
**Mục đích:** Nhắc nhở reviewers về các review đang pending

## Cài Đặt

### Option 1: Sử Dụng Linux Crontab (Khuyến nghị cho Intranet)

1. Thêm `CRON_SECRET` vào file `.env`:
```bash
CRON_SECRET=your-secure-random-string-here
```

2. Mở crontab:
```bash
crontab -e
```

3. Thêm các dòng sau:
```bash
# Check overdue deadlines every hour
0 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/check-deadlines

# Send deadline reminders daily at 9 AM
0 9 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/deadline-reminders

# Track SLA compliance daily at midnight
0 0 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/sla-tracking

# Send reviewer reminders every Monday at 10 AM
0 10 * * 1 curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/reviewer-reminders
```

### Option 2: Sử Dụng Node-Cron (Development)

Tạo file `scripts/run-cron.ts`:

```typescript
import cron from 'node-cron';
import { cronJobs } from './cron-jobs';

// Every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running: Check Overdue Deadlines');
  await cronJobs.checkOverdueDeadlines();
});

// Daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running: Send Deadline Reminders');
  await cronJobs.sendDeadlineReminders();
});

// Daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running: Track SLA Compliance');
  await cronJobs.trackSLACompliance();
});

// Every Monday at 10 AM
cron.schedule('0 10 * * 1', async () => {
  console.log('Running: Send Reviewer Reminders');
  await cronJobs.sendReviewerReminders();
});

console.log('Cron jobs started');
```

Chạy:
```bash
ts-node scripts/run-cron.ts
```

### Option 3: Systemd Service (Production trên Linux)

1. Tạo file `/etc/systemd/system/journal-cron.service`:
```ini
[Unit]
Description=Journal Management Cron Jobs
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/your/app
ExecStart=/usr/bin/node scripts/run-cron.js
Restart=always

[Install]
WantedBy=multi-user.target
```

2. Enable và start service:
```bash
sudo systemctl enable journal-cron
sudo systemctl start journal-cron
sudo systemctl status journal-cron
```

## Xác Thực

Tất cả cron endpoints yêu cầu `CRON_SECRET` trong header:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/check-deadlines
```

## Monitoring

Kiểm tra logs của cron jobs:

```bash
# Xem logs của systemd service
sudo journalctl -u journal-cron -f

# Xem audit logs trong database
SELECT * FROM "AuditLog" 
WHERE "eventType" IN ('ALERT_TRIGGERED', 'NOTIFICATION_SENT') 
ORDER BY "timestamp" DESC;
```

## Lưu Ý Quan Trọng

1. **Security:** Luôn sử dụng `CRON_SECRET` mạnh và không chia sẻ
2. **Email Integration:** Hiện tại cron jobs chỉ log events. Cần tích hợp SMTP để gửi email thực tế
3. **Performance:** Monitor database performance khi có nhiều cron jobs chạy đồng thời
4. **Timezone:** Đảm bảo server timezone đúng với múi giờ của tổ chức (Asia/Bangkok)
