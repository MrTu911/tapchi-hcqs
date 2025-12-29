# PHASE 3: NÂNG CẤP NGHIỆP VỤ CHUYÊN SÂU
## Tạp chí Khoa học Hậu cần - Kỹ thuật Quân sự

**Ngày bắt đầu:** 31/10/2025  
**Trạng thái:** ✅ HOÀN THÀNH Backend Core Logic

---

## 📋 TỔNG QUAN

Phase 3 tập trung vào việc xây dựng đầy đủ các tính năng nghiệp vụ báo chí chuyên nghiệp theo 4 tầng:

1. **Tầng nghiệp vụ tác nghiệp** - Quy trình xuất bản & phản biện kín
2. **Tầng nghiệp vụ quản trị** - Ban biên tập & kiểm duyệt  
3. **Tầng nghiệp vụ học thuật** - Quản lý tri thức
4. **Tầng chuyển đổi số** - Tự động hóa & AI

---

## ✅ ĐÃ HOÀN THÀNH

### 1. DATABASE SCHEMA ENHANCEMENT

#### Mô hình mới được thêm:

**ReviewerProfile** - Hồ sơ phản biện viên
- Chuyên môn (expertise) và từ khóa (keywords)
- Thống kê hiệu suất: số review, tỷ lệ hoàn thành, rating trung bình
- Quản lý workload: số bài tối đa, trạng thái sẵn sàng
- Lịch sử phản biện: ngày review cuối, thời gian hoàn thành trung bình

**Deadline** - Quản lý deadline theo giai đoạn
- Các loại deadline: INITIAL_REVIEW, REVISION_SUBMIT, RE_REVIEW, EDITOR_DECISION, PRODUCTION, PUBLICATION
- Gán cho người dùng cụ thể
- Tracking: overdue status, số lần nhắc nhở
- Tự động tạo deadline khi submission chuyển trạng thái

**Keyword** - Từ điển từ khóa học thuật
- Quản lý từ khóa chuẩn với category
- Từ đồng nghĩa và từ liên quan
- Thống kê usage để gợi ý phổ biến

**Notification** - Thông báo tự động
- Nhiều loại: SUBMISSION_RECEIVED, REVIEW_INVITED, REVIEW_REMINDER, DECISION_MADE, DEADLINE_APPROACHING, DEADLINE_OVERDUE, etc.
- Gửi qua app và email
- Tracking: đã đọc, đã gửi email

**EmailTemplate** - Templates cho email tự động
- Subject và body (HTML + text)
- Biến động: {{name}}, {{link}}, etc.
- Active/inactive management

#### Nâng cấp models hiện có:

**Submission**
- `code`: Mã bài tự động (HCQS-YYYYMMDD-XXX)
- `slaDeadline`: Deadline tổng thể
- `isOverdue`: Cờ báo quá hạn
- `daysInCurrentStatus`: Số ngày ở trạng thái hiện tại
- `lastStatusChangeAt`: Thời điểm chuyển trạng thái cuối

**Review**
- `invitedAt`, `acceptedAt`, `declinedAt`: Timeline phản biện
- `deadline`: Deadline cụ thể cho review
- `qualityRating`: Đánh giá chất lượng phản biện (1-5) bởi editor
- `remindersSent`: Số lần gửi email nhắc

---

### 2. CORE BUSINESS LOGIC

#### submission-code-generator.ts
- ✅ Tự động sinh mã bài: `HCQS-YYYYMMDD-XXX`
- ✅ Đảm bảo unique trong ngày
- ✅ Validation format

#### sla-manager.ts
- ✅ Định nghĩa SLA chuẩn cho mỗi status (7-21 ngày)
- ✅ Tính toán SLA status: on-time 🟢 / warning 🟡 / overdue 🔴
- ✅ Tự động tính deadline dựa trên status
- ✅ Color coding và icon cho UI
- ✅ Logic gửi reminder (7, 3, 1 ngày trước hạn)

#### reviewer-matcher.ts
- ✅ **AI-powered matching algorithm** gợi ý reviewer phù hợp
- ✅ Scoring system (100 điểm):
  - 40 điểm: Expertise matching
  - 30 điểm: Keyword matching  
  - 15 điểm: Workload (ưu tiên người ít việc)
  - 15 điểm: Rating history
  - 10 điểm bonus: Completion rate cao (>90%)
- ✅ Tự động cập nhật profile sau mỗi review

#### notification-manager.ts
- ✅ Tạo thông báo in-app và email
- ✅ Bulk notifications cho nhiều users
- ✅ Mark as read functionality
- ✅ Unread count tracking
- ✅ Email template with HTML styling

#### deadline-manager.ts
- ✅ Tạo deadline theo type
- ✅ Complete deadline khi xong việc
- ✅ Tự động check overdue deadlines (cron job ready)
- ✅ Gửi reminders tự động (3 ngày trước hạn)
- ✅ Auto-create deadlines khi submission chuyển status

---

### 3. API ENDPOINTS MỚI

#### `/api/reviewers/suggest`
- GET: Gợi ý reviewers phù hợp cho submission
- Params: `submissionId`, `limit`
- Returns: Danh sách reviewers với score, reasons, workload, rating

#### `/api/reviewers/profile`
- GET: Lấy thông tin reviewer profile
- POST: Tạo/cập nhật profile (expertise, keywords, max concurrent reviews)

#### `/api/notifications`
- GET: Lấy danh sách thông báo (all hoặc unread only)
- PATCH: Đánh dấu đã đọc (single hoặc mark all)

#### `/api/keywords`
- GET: Auto-suggest từ khóa (fuzzy search)
- POST: Thêm từ khóa mới hoặc increment usage

#### `/api/deadlines`
- GET: Lấy deadlines (theo submission hoặc assigned to me)
- POST: Tạo deadline mới
- PATCH: Complete deadline

#### `/api/statistics/dashboard`
- GET: Thống kê tổng quan theo role
- Returns: Overview stats, role-specific stats, recent activities

---

## 🚧 ĐANG TRIỂN KHAI

### 4. ENHANCED DASHBOARDS (Đang phát triển)

Sẽ tạo dashboard nâng cao cho từng role với:

**Tác giả (Author)**
- Bảng điều khiển bài viết của tôi
- Tracking tiến độ với SLA indicators
- Thông báo revision requests
- Thống kê acceptance rate

**Phản biện (Reviewer)**
- Danh sách bài được mời phản biện
- Accept/Decline invitations
- Submit reviews với 5 tiêu chí chấm điểm
- Lịch sử phản biện và rating

**Biên tập viên (Section Editor)**
- Bảng quản lý submissions theo status
- Assign reviewers với AI suggestions
- Tổng hợp reviews và ra quyết định
- SLA warnings dashboard

**Thư ký (Managing Editor)**
- Overview toàn bộ hệ thống
- Workflow progress tracking
- Batch operations
- Reports & exports

**Chủ nhiệm (EIC)**
- Executive dashboard với KPIs
- Final approval workflow
- Digital signature interface
- Strategic reports

---

## 📊 TÍNH NĂNG NGHIỆP VỤ CHÍNH

### ✅ Quy trình Phản biện Kín (Confidential Peer Review)

**Workflow tự động:**
1. Editor mời phản biện → Email tự động
2. Reviewer accept/decline → Update profile
3. Submit review → Notify editor
4. Editor consolidate → Decision notification
5. Auto-track deadlines → Reminders 7-3-1 days

**Tính năng:**
- ✅ Tự động gán reviewer dựa trên AI matching
- ✅ Email invitation với deadline rõ ràng
- ✅ Accept/decline workflow
- ✅ 5-criteria review form (có thể customize)
- ✅ Quality rating cho reviewers (1-5 sao)
- ✅ Auto-reminder system
- ✅ Workload management
- ✅ Statistics & performance tracking

### ✅ SLA & Progress Tracking

**Color-coded status:**
- 🟢 On-time: Còn >3 ngày
- 🟡 Warning: Còn 1-3 ngày  
- 🔴 Overdue: Quá hạn

**Metrics:**
- Days in current status
- Deadline for each stage
- Overall SLA compliance
- Overdue submissions count

### ✅ Mã bài tự động

Format: `HCQS-YYYYMMDD-XXX`

Ví dụ:
- HCQS-20251031-001
- HCQS-20251031-002
- HCQS-20251101-001

Auto-increment trong ngày, reset mỗi ngày mới.

---

## 🔜 TÍNH NĂNG SẼ BỔ SUNG

### Academic Features (Phase 3.2)
- [ ] Citation export (BibTeX, APA, EndNote XML)
- [ ] Google Scholar metadata integration
- [ ] DOI minting workflow
- [ ] ORCID integration
- [ ] Advanced search với facets

### Digital Transformation (Phase 3.3)
- [ ] Digital signatures với QR verification
- [ ] SHA-256 checksum registry
- [ ] Automated report generation (PDF)
- [ ] Backup & restore automation
- [ ] Plagiarism check integration

### Advanced Analytics (Phase 3.4)
- [ ] Visualization charts (submissions over time, acceptance rate, etc.)
- [ ] KPI dashboard (quarterly/annual)
- [ ] Reviewer performance analytics
- [ ] Category/topic trends analysis
- [ ] Export reports to PDF

---

## 📈 KẾT QUẢ ĐẠT ĐƯỢC

### Database
- ✅ 5 models mới
- ✅ 2 models nâng cấp
- ✅ 15+ indexes mới cho performance
- ✅ Full-Text Search restored

### Backend Logic
- ✅ 5 core business modules
- ✅ 6 API endpoint groups
- ✅ AI-powered reviewer matching
- ✅ Automated notification system
- ✅ Deadline management system

### Architecture
- ✅ Modular, maintainable code
- ✅ TypeScript strict mode
- ✅ Prisma ORM với relations đầy đủ
- ✅ RESTful API design
- ✅ Error handling chuẩn

---

## 🎯 TIẾP THEO

**Ưu tiên cao:**
1. Dashboard UI components với SLA indicators
2. Reviewer invitation & review submission forms
3. Editor decision workflow UI
4. Notification bell component
5. Deadline management UI

**Ưu tiên trung bình:**
6. Citation export functionality
7. Digital signature interface
8. Analytics charts & reports
9. Email templates admin UI
10. Keyword management UI

**Ưu tiên thấp:**
11. Plagiarism check integration
12. Advanced search facets
13. Mobile responsive optimization
14. Performance optimization
15. Integration tests

---

## 📝 GHI CHÚ KỸ THUẬT

### Migration Strategy
- Sử dụng `prisma db push` để tránh data loss
- FTS setup script riêng (không qua Prisma)
- Backward compatible với Phase 2

### Performance Considerations
- Indexes on deadline dates, status, isOverdue
- Eager loading với include để giảm N+1 queries
- Pagination cho lists (take 50-100)

### Security
- All endpoints require authentication
- Role-based authorization (RBAC)
- Input validation on all APIs
- SQL injection prevention via Prisma

---

## 👥 HƯỚNG DẪN SỬ DỤNG CHO DEV TEAM

### Tạo reviewer profile:
```typescript
POST /api/reviewers/profile
{
  "expertise": ["Hậu cần", "Quân sự"],
  "keywords": ["logistics", "supply chain"],
  "maxConcurrentReviews": 5
}
```

### Gợi ý reviewers cho bài:
```typescript
GET /api/reviewers/suggest?submissionId=xxx&limit=10
```

### Tạo deadline:
```typescript
POST /api/deadlines
{
  "submissionId": "xxx",
  "type": "INITIAL_REVIEW",
  "dueDate": "2025-11-21",
  "assignedTo": "user-id",
  "note": "Phản biện vòng 1"
}
```

### Gửi notification:
```typescript
import { createNotification } from '@/lib/notification-manager'

await createNotification({
  userId: "xxx",
  type: "REVIEW_INVITED",
  title: "Bạn được mời phản biện",
  message: "Bài báo 'Title' cần phản biện",
  link: "/dashboard/reviewer/review/123",
  sendEmail: true
})
```

---

**Tài liệu này sẽ được cập nhật liên tục trong quá trình phát triển Phase 3.**
