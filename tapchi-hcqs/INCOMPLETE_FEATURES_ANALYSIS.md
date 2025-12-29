
# Phân tích các chức năng còn chưa hoàn thiện
**Ngày phân tích:** 06/11/2025  
**Trạng thái:** ✅ Hoàn tất phân tích

---

## 📊 Tổng quan

Sau khi phân tích toàn bộ code nguồn của dự án Tạp chí điện tử Khoa học Hậu cần quân sự, đã xác định được **các chức năng chưa hoàn thiện** hoặc **chưa được triển khai đầy đủ**.

---

## 🔍 Phương pháp phân tích

1. ✅ Đọc Prisma schema (1,206 dòng) - 44 models
2. ✅ Kiểm tra 133 API routes
3. ✅ Kiểm tra 66 dashboard pages
4. ✅ Tìm kiếm TODO/FIXME comments
5. ✅ So sánh với documentation

---

## 🚨 Các chức năng CHƯA hoàn thiện

### 1. **Email Template Management** ❌ Chưa có

**Trạng thái:** Model đã có trong schema, được sử dụng trong code, nhưng **chưa có UI/API quản lý**

**Model trong schema:**
```prisma
model EmailTemplate {
  id       String  @id @default(uuid())
  code     String  @unique
  subject  String
  bodyHtml String
  bodyText String?
  variables String[]
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Thiếu:**
- ❌ API CRUD cho EmailTemplate (`/api/admin/email-templates/`)
- ❌ UI quản lý trong admin dashboard (`/dashboard/admin/email-templates`)
- ❌ WYSIWYG editor cho HTML email
- ❌ Test email functionality
- ❌ Email preview

**Được sử dụng tại:**
- `/app/api/auth/register/route.ts`
- `/app/api/admin/users/approve/route.ts`

**Mức độ ưu tiên:** 🔴 **CAO** (Hiện tại email templates được hardcode trong code)

---

### 2. **Asset Management System** ❌ Chưa có

**Trạng thái:** Model đã có trong schema nhưng **chưa có API/UI**

**Model trong schema:**
```prisma
model Asset {
  id        String   @id @default(uuid())
  ownerId   String?
  path      String
  mime      String?
  metaJson  Json?
  checksum  String?
  createdAt DateTime @default(now())
}
```

**Thiếu:**
- ❌ API quản lý assets (`/api/admin/assets/`)
- ❌ UI Media Library
- ❌ Image upload/management
- ❌ File browser
- ❌ Asset metadata editor

**Mức độ ưu tiên:** 🟡 **TRUNG BÌNH** (Hiện tại đang dùng UploadedFile)

---

### 3. **Report Registry / Digital Signature** ❌ Chưa có

**Trạng thái:** Model đã có trong schema nhưng **chưa được triển khai**

**Model trong schema:**
```prisma
model ReportRegistry {
  id             String   @id @default(uuid())
  objectType     String
  objectId       String
  hash           String
  signerId       String
  signer         User     @relation("UserSigner", fields: [signerId], references: [id])
  signatureImage String?
  signedAt       DateTime @default(now())
  note           String?
}
```

**Thiếu:**
- ❌ API cho digital signature
- ❌ UI ký số điện tử
- ❌ Report generation
- ❌ Signature verification

**Mức độ ưu tiên:** 🟢 **THẤP** (Chức năng nâng cao)

---

### 4. **Data Retention / Auto-deletion** ⚠️ Chưa hoàn chỉnh

**Trạng thái:** Model và API đã có, nhưng **chưa có cron job tự động**

**TODO trong code:**
```typescript
// lib/security/data-retention.ts
// TODO: Xóa file từ S3/storage trước khi xóa record
```

**Thiếu:**
- ⚠️ Scheduled job để tự động xóa/archive dữ liệu cũ
- ⚠️ Integration với S3 cleanup
- ⚠️ Backup before deletion
- ⚠️ UI để configure retention policies

**Mức độ ưu tiên:** 🟡 **TRUNG BÌNH**

---

### 5. **Revision Turnaround Time Analytics** ⚠️ Chưa hoàn chỉnh

**TODO trong code:**
```typescript
// lib/editor-analytics.ts
avgRevisionTurnaroundDays: 0, // TODO: Implement
```

**Thiếu:**
- ⚠️ Logic tính toán thời gian revision
- ⚠️ Hiển thị trong dashboard analytics

**Mức độ ưu tiên:** 🟢 **THẤP**

---

### 6. **Copyediting Workflow** ⚠️ Chưa đầy đủ

**Trạng thái:** API đã có (`/api/copyediting`) nhưng **UI chưa hoàn chỉnh**

**Thiếu:**
- ⚠️ UI chi tiết cho LAYOUT_EDITOR role
- ⚠️ Copyediting dashboard
- ⚠️ Version comparison view
- ⚠️ Track changes UI

**Mức độ ưu tiên:** 🟡 **TRUNG BÌNH**

---

### 7. **Production/Layout Management** ⚠️ Chưa đầy đủ

**Trạng thái:** API cơ bản đã có (`/api/production`) nhưng **UI chưa đầy đủ**

**Dashboard page tồn tại:** `/dashboard/layout/production/page.tsx`

**Thiếu:**
- ⚠️ Production workflow UI
- ⚠️ Layout editor
- ⚠️ Proofing tools
- ⚠️ PDF generation/preview trong production stage

**Mức độ ưu tiên:** 🟡 **TRUNG BÌNH**

---

### 8. **Advanced Search Features** ⚠️ Chưa hoàn thiện

**API đã có:**
- ✅ `/api/search/route.ts`
- ✅ `/api/search/advanced/route.ts`
- ✅ `/api/search/semantic/route.ts`

**UI đã có:**
- ✅ `/app/(public)/search/page.tsx`
- ✅ `/app/(public)/search/advanced/page.tsx`

**Thiếu:**
- ⚠️ Full-text search PostgreSQL integration (FTS setup trong schema nhưng chưa có migration)
- ⚠️ Search filters nâng cao trong UI
- ⚠️ Search analytics
- ⚠️ Search suggestions/autocomplete

**Mức độ ưu tiên:** 🟡 **TRUNG BÌNH**

---

### 9. **CMS Pages Templates** ⚠️ Chưa đầy đủ

**Trạng thái:** PublicPage model có field `template` nhưng chưa có templates

```prisma
model PublicPage {
  template String @default("default") // "default", "contact", "about", "team"
}
```

**Thiếu:**
- ⚠️ Template presets cho từng loại page
- ⚠️ Template selector trong UI
- ⚠️ Contact form template
- ⚠️ Team/About page templates

**Mức độ ưu tiên:** 🟢 **THẤP**

---

### 10. **Settings Field Editor (JSON)** ⚠️ Chưa có

**Các model có JSON settings field:**
- `HomepageSection.settings`
- `PageBlock.metadata`
- `Banner` (không có nhưng có thể cần)

**Thiếu:**
- ⚠️ UI editor cho JSON settings
- ⚠️ Schema validation
- ⚠️ Settings presets

**Mức độ ưu tiên:** 🟢 **THẤP**

---

### 11. **Version Control & Rollback** ❌ Chưa có

**Được đề xuất trong PHASE_12:**
- Track changes history cho CMS content
- Rollback capability
- Compare versions

**Thiếu:**
- ❌ Version history UI
- ❌ Rollback functionality
- ❌ Version comparison

**Mức độ ưu tiên:** 🟢 **THẤP** (Nice to have)

---

### 12. **Scheduled Publishing** ❌ Chưa có

**Được đề xuất trong PHASE_12:**
- Schedule sections to activate/deactivate at specific times

**Model có date fields:**
- `Banner.startDate` và `Banner.endDate` (đã có)
- `News.publishedAt` (đã có)

**Thiếu:**
- ❌ Cron job để tự động activate/deactivate theo schedule
- ❌ UI để set scheduled publish

**Mức độ ưu tiên:** 🟡 **TRUNG BÌNH**

---

### 13. **Responsive Preview (Mobile/Tablet/Desktop)** ❌ Chưa có

**Được đề xuất trong PHASE_12:**

**Thiếu:**
- ❌ Device switcher trong preview modal
- ❌ Mobile/Tablet/Desktop preview modes
- ❌ Responsive testing tools

**Mức độ ưu tiên:** 🟢 **THẤP** (Nice to have)

---

### 14. **Plagiarism Check Integration** ⚠️ API có nhưng chưa integrate

**Model đã có:**
```prisma
model PlagiarismCheck {
  provider String // "ithenticate", "turnitin", "copyscape"
  status   PlagiarismStatus
  similarity Float?
  reportUrl String?
}
```

**API đã có:** `/api/plagiarism/route.ts`

**Thiếu:**
- ⚠️ Integration với iThenticate/Turnitin
- ⚠️ UI để view plagiarism report
- ⚠️ Automatic check trigger trong submission workflow

**Mức độ ưu tiên:** 🔴 **CAO** (Quan trọng cho tạp chí khoa học)

---

### 15. **ORCID Full Integration** ⚠️ Callback có nhưng chưa đầy đủ

**API đã có:**
- ✅ `/api/auth/orcid/route.ts`
- ✅ `/api/auth/orcid/callback/route.ts`

**Thiếu:**
- ⚠️ UI để link/unlink ORCID
- ⚠️ Auto-sync ORCID data
- ⚠️ Display ORCID info trong profile
- ⚠️ ORCID works integration

**Mức độ ưu tiên:** 🟡 **TRUNG BÌNH**

---

### 16. **Reviewer AI Matching** ⚠️ API có nhưng chưa có AI thật

**Model đã có:**
```prisma
model ReviewerMatchScore {
  score            Float
  expertiseMatch   Float?
  keywordMatch     Float?
  citationMatch    Float?
  availabilityScore Float?
}
```

**API đã có:** `/api/reviewers/match/route.ts`

**Thiếu:**
- ⚠️ Real AI/ML algorithm (hiện tại chỉ là mock)
- ⚠️ Training data
- ⚠️ Confidence score
- ⚠️ Explanation của matching

**Mức độ ưu tiên:** 🟢 **THẤP** (Hiện tại manual matching hoạt động tốt)

---

### 17. **Article Citation Tracking** ❌ Chưa có

**Model có field:**
```prisma
model ArticleMetrics {
  citations Int @default(0)
}
```

**Thiếu:**
- ❌ Crossref integration để track citations
- ❌ Google Scholar integration
- ❌ Citation chart trong article page
- ❌ Auto-update citations

**Mức độ ưu tiên:** 🟡 **TRUNG BÌNH**

---

### 18. **Web Push Notifications (PWA)** ⚠️ Model có nhưng chưa implement đầy đủ

**Model đã có:**
```prisma
model PushSubscription {
  endpoint String @unique
  keys Json
}
```

**API đã có:** `/api/push/subscribe/route.ts`

**Thiếu:**
- ⚠️ Service Worker setup
- ⚠️ Push notification UI
- ⚠️ Notification preferences
- ⚠️ PWA manifest

**Mức độ ưu tiên:** 🟢 **THẤP**

---

### 19. **Advanced Deadline Management** ⚠️ Chưa đầy đủ

**Model đã có:** `Deadline`

**API đã có:** `/api/deadlines/route.ts`

**Thiếu:**
- ⚠️ Deadline calendar view
- ⚠️ Gantt chart cho workflow timeline
- ⚠️ Automatic deadline extension request
- ⚠️ Deadline conflict detection

**Mức độ ưu tiên:** 🟢 **THẤP**

---

### 20. **Role Escalation Approval Workflow** ⚠️ API có nhưng UI chưa hoàn chỉnh

**Model đã có:** `RoleEscalationRequest`

**API đã có:** `/api/admin/role-escalation/route.ts`

**Thiếu:**
- ⚠️ UI cho user request role escalation
- ⚠️ Approval workflow UI
- ⚠️ Notification cho requesters

**Mức độ ưu tiên:** 🟢 **THẤP**

---

## ✅ Các chức năng ĐÃ hoàn thiện

### Hệ thống Core
- ✅ Authentication & Authorization (JWT + NextAuth)
- ✅ User Registration & Approval Workflow
- ✅ Email Verification
- ✅ Password Reset
- ✅ Two-Factor Authentication
- ✅ Session Management
- ✅ RBAC (Role-Based Access Control)
- ✅ Permission System

### Submission & Review Workflow
- ✅ Submission Management (Full CRUD)
- ✅ Reviewer Assignment
- ✅ Review Submission
- ✅ Editor Decision
- ✅ Revision Management
- ✅ Article Publishing
- ✅ Issue Management
- ✅ Volume Management

### CMS (Content Management System)
- ✅ Banner Management (với drag & drop)
- ✅ Navigation Management
- ✅ Homepage Sections Management (với drag & drop + live preview)
- ✅ News/Announcement Management
- ✅ Public Pages Management
- ✅ Featured Articles Management
- ✅ Page Blocks Management

### Analytics & Statistics
- ✅ Dashboard Statistics (Admin, Editor, Author, Reviewer)
- ✅ Submission Statistics
- ✅ Review Statistics
- ✅ User Statistics
- ✅ Article Metrics (views, downloads)
- ✅ Editor Performance Analytics

### Security & Compliance
- ✅ Audit Logs
- ✅ Security Alerts
- ✅ API Token Management
- ✅ Data Retention Policies (model + API)
- ✅ Security Monitoring

### Advanced Features
- ✅ Full-Text Search (basic)
- ✅ Semantic Search
- ✅ Advanced Search
- ✅ File Upload to S3
- ✅ Category Management (với alias)
- ✅ Keyword Dictionary
- ✅ Notification System
- ✅ Messaging System (Author-Editor)

---

## 📊 Tóm tắt theo mức độ ưu tiên

### 🔴 Ưu tiên CAO (Cần làm ngay)
1. **Email Template Management** - Để quản lý email templates dễ dàng
2. **Plagiarism Check Integration** - Quan trọng cho tạp chí khoa học

### 🟡 Ưu tiên TRUNG BÌNH (Nên làm)
3. **Data Retention Auto-cleanup** - Tự động dọn dẹp dữ liệu cũ
4. **Copyediting Workflow UI** - Hoàn thiện workflow cho layout editor
5. **Production/Layout Management** - Tools cho production stage
6. **Advanced Search Features** - Cải thiện search experience
7. **Scheduled Publishing** - Tự động publish theo lịch
8. **ORCID Integration** - Tích hợp đầy đủ với ORCID
9. **Article Citation Tracking** - Track citations từ Crossref/Google Scholar

### 🟢 Ưu tiên THẤP (Nice to have)
10. **Asset Management System** - Hiện tại UploadedFile đủ dùng
11. **Report Registry / Digital Signature** - Chức năng nâng cao
12. **CMS Templates** - Template presets
13. **Settings JSON Editor** - UI cho JSON fields
14. **Version Control & Rollback** - History tracking
15. **Responsive Preview** - Device preview modes
16. **Reviewer AI Matching** - Cải thiện algorithm
17. **Web Push Notifications** - PWA features
18. **Advanced Deadline Management** - Calendar view, Gantt chart
19. **Role Escalation UI** - Request workflow

---

## 🎯 Khuyến nghị

### Phase tiếp theo nên tập trung vào:

1. **Email Template Management** (1-2 ngày)
   - CRUD API
   - Admin UI với WYSIWYG editor
   - Email preview & test send

2. **Plagiarism Check Integration** (2-3 ngày)
   - iThenticate/Turnitin API integration
   - UI để view report
   - Auto-trigger trong workflow

3. **Scheduled Publishing Cron Jobs** (1 ngày)
   - Banner auto-activation
   - News auto-publish
   - Cleanup scheduled jobs

4. **Data Retention Automation** (1 ngày)
   - Scheduled cleanup jobs
   - S3 file deletion
   - Backup before delete

5. **Copyediting & Production UI** (2-3 ngày)
   - Layout Editor dashboard
   - Copyediting tools
   - Production workflow

---

## 📝 Notes

- Hệ thống đã có **foundation rất vững chắc** với hầu hết core features đã hoàn thiện
- Các tính năng còn thiếu chủ yếu là **enhancements** hoặc **nice-to-have**
- Schema database đã được thiết kế **rất đầy đủ** cho tương lai
- Cần **ưu tiên theo use cases thực tế** của người dùng

---

**Checkpoint này:** Phân tích hoàn tất, sẵn sàng implement các features còn thiếu
**Ngày phân tích:** 06/11/2025
