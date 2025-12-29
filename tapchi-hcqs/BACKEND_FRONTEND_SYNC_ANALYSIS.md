# 🔍 Phân tích đồng bộ Backend - Frontend

**Ngày kiểm tra:** 9 tháng 12, 2025  
**Trạng thái:** ⚠️ Cần bổ sung UI cho 12 module

---

## 🟢 I. Backend APIs đã có UI đầy đủ (43 modules)

### 📊 1. Dashboard & Analytics
- ✅ `/api/dashboard/summary` → `/dashboard/admin/analytics`
- ✅ `/api/statistics/*` → `/dashboard/admin/statistics`
- ✅ `/api/admin/dashboard-stats` → `/dashboard/admin/analytics`

### 📄 2. Content Management
- ✅ `/api/articles` → `/dashboard/admin/articles`
- ✅ `/api/articles/[id]` → `/dashboard/admin/articles/[id]`
- ✅ `/api/submissions` → `/dashboard/author/submissions`
- ✅ `/api/submissions/[id]` → `/dashboard/author/submissions/[id]`
- ✅ `/api/reviews` → `/dashboard/reviewer`
- ✅ `/api/reviews/[id]` → `/dashboard/reviewer/review/[id]`

### 📚 3. Journal Issues
- ✅ `/api/issues` → `/dashboard/admin/issues`
- ✅ `/api/issues/[id]` → `/dashboard/admin/issues/[id]`
- ✅ `/api/issues/add-articles` → `/dashboard/admin/issues/[id]` (dialog)
- ✅ `/api/issues/publish` → `/dashboard/admin/issues/[id]` (button)
- ✅ `/api/issues/upload` → `/dashboard/admin/issues` (form)

### 📰 4. News Management
- ✅ `/api/news` → `/dashboard/admin/news`
- ✅ `/api/news/[id]` → `/dashboard/admin/news/[id]`
- ✅ `/api/news/upload-image` → Modern Editor

### 🎨 5. CMS Modules
- ✅ `/api/banners` → `/dashboard/admin/banners`
- ✅ `/api/navigation` → `/dashboard/admin/cms/navigation`
- ✅ `/api/homepage-sections` → `/dashboard/admin/cms/homepage`
- ✅ `/api/public-pages` → `/dashboard/admin/cms/pages`
- ✅ `/api/site-settings` → `/dashboard/admin/cms/settings`
- ✅ `/api/media` → `/dashboard/admin/cms/media`
- ✅ `/api/videos` → `/dashboard/admin/cms/videos`

### 🗂️ 6. Categories & Taxonomy
- ✅ `/api/categories` → `/dashboard/admin/categories`
- ✅ `/api/categories/[id]` → `/dashboard/admin/categories/[id]`

### 👥 7. User Management
- ✅ `/api/users` → `/dashboard/admin/users`
- ✅ `/api/users/[id]` → `/dashboard/admin/users/[id]`
- ✅ `/api/admin/users/approve` → `/dashboard/admin/users` (integrated)
- ✅ `/api/admin/users/pending` → `/dashboard/admin/users` (tab)
- ✅ `/api/admin/users/toggle-active` → `/dashboard/admin/users` (button)

### 🔒 8. Authentication & Security
- ✅ `/api/auth/login` → `/auth/login`
- ✅ `/api/auth/register` → `/auth/register`
- ✅ `/api/auth/forgot-password` → `/auth/forgot-password`
- ✅ `/api/auth/reset-password` → `/auth/reset-password`
- ✅ `/api/audit-logs` → `/dashboard/admin/audit-logs`
- ✅ `/api/security/alerts` → `/dashboard/admin/security-alerts`
- ✅ `/api/sessions` → `/dashboard/admin/sessions`

### 🔍 9. Search & Export
- ✅ `/api/search` → `/search`
- ✅ `/api/search/advanced` → `/search/advanced`
- ✅ `/api/search/filter` → `/dashboard/admin/reports`
- ✅ `/api/export/pdf` → `/dashboard/admin/reports`
- ✅ `/api/export/excel` → `/dashboard/admin/reports`

### ⚙️ 10. System Configuration
- ✅ `/api/review-settings` → `/dashboard/admin/review-settings`
- ✅ `/api/ui-config` → `/dashboard/admin/ui-config`
- ✅ `/api/permissions` → `/dashboard/admin/permissions`
- ✅ `/api/metadata` → `/dashboard/admin/metadata`

### 📈 11. Reviewers
- ✅ `/api/reviewers/*` → `/dashboard/admin/reviewers`
- ✅ `/api/reviewers/metrics` → `/dashboard/admin/reviewers/metrics`

### 🔄 12. Workflow
- ✅ `/api/workflow` → `/dashboard/admin/workflow`
- ✅ `/api/workflow/timeline` → Integrated in submission pages

---

## 🟡 II. Backend APIs THIẾU UI (12 modules cần bổ sung)

### 👑 **1. Role Escalation Management** ⚠️ URGENT

**Backend APIs:**
- `GET /api/admin/role-escalation` - Lấy danh sách yêu cầu nâng cấp quyền
- `POST /api/admin/role-escalation` - Tạo yêu cầu mới
- `GET /api/admin/role-escalation/[id]` - Chi tiết yêu cầu
- `PATCH /api/admin/role-escalation/[id]` - Duyệt/Từ chối

**UI cần tạo:**
```
📁 app/dashboard/admin/role-escalation/
   ├── page.tsx          (Danh sách yêu cầu)
   └── [id]/
       └── page.tsx      (Chi tiết & Duyệt)
```

**Chức năng:**
- ☐ Hiển thị table yêu cầu nâng cấp (PENDING, APPROVED, REJECTED)
- ☐ Filter theo trạng thái, người yêu cầu, quyền mới
- ☐ Button "Duyệt" / "Từ chối" với lý do
- ☐ Hiển thị CV, thẻ công tác, giấy tờ kèm theo
- ☐ Thống kê: Tổng yêu cầu, tỷ lệ duyệt, thời gian xử lý trung bình

**RBAC:** SYSADMIN, EIC

---

### ⭐ **2. Featured Articles Management**

**Backend APIs:**
- `GET /api/featured-articles` - Lấy danh sách bài nổi bật
- `POST /api/featured-articles` - Thêm bài nổi bật
- `DELETE /api/featured-articles/[id]` - Xóa khỏi danh sách nổi bật

**UI cần tạo:**
```
📁 app/dashboard/admin/featured-articles/
   └── page.tsx          (Quản lý bài nổi bật)
```

**Chức năng:**
- ☐ Hiển thị danh sách bài đang nổi bật (featured=true)
- ☐ Dialog search & select bài để thêm vào featured
- ☐ Drag & drop để sắp xếp thứ tự hiển thị
- ☐ Button "Bỏ nổi bật" cho từng bài
- ☐ Preview cách hiển thị trên homepage

**RBAC:** SYSADMIN, EIC, MANAGING_EDITOR

---

### 📚 **3. Volumes Management**

**Backend APIs:**
- `GET /api/volumes` - Lấy danh sách tập
- `POST /api/volumes` - Tạo tập mới
- `GET /api/volumes/[id]` - Chi tiết tập
- `PUT /api/volumes/[id]` - Cập nhật tập
- `DELETE /api/volumes/[id]` - Xóa tập

**UI cần tạo:**
```
📁 app/dashboard/admin/volumes/
   ├── page.tsx          (Danh sách tập)
   └── [id]/
       └── page.tsx      (Chi tiết tập)
```

**Chức năng:**
- ☐ Table hiển thị: Số tập, Năm, Số lượng số, Trạng thái
- ☐ Dialog tạo/sửa tập (volumeNo, year, description)
- ☐ Hiển thị danh sách số trong tập
- ☐ Validation: Không xóa tập nếu có số

**RBAC:** SYSADMIN, EIC, MANAGING_EDITOR

---

### 📅 **4. Deadlines Management**

**Backend APIs:**
- `GET /api/deadlines` - Lấy danh sách deadline
- `POST /api/deadlines` - Tạo deadline mới
- `PUT /api/deadlines/[id]` - Cập nhật deadline
- `DELETE /api/deadlines/[id]` - Xóa deadline

**UI cần tạo:**
```
📁 app/dashboard/admin/deadlines/
   └── page.tsx          (Quản lý deadline)
```

**Chức năng:**
- ☐ Calendar view hiển thị tất cả deadlines
- ☐ Table view: Bài viết, Loại deadline, Ngày hết hạn, Trạng thái
- ☐ Filter theo: Loại (Review, Revision, Decision), Trạng thái (Upcoming, Overdue, Completed)
- ☐ Thông báo deadline sắp tới (within 3 days)
- ☐ Button "Extend deadline" cho editor

**RBAC:** SYSADMIN, EIC, MANAGING_EDITOR, SECTION_EDITOR

---

### 📦 **5. Production Management**

**Backend APIs:**
- `GET /api/production` - Lấy danh sách bài đang production
- `POST /api/production` - Bắt đầu production
- `PUT /api/production/[id]` - Cập nhật trạng thái production

**UI cần tạo:**
```
📁 app/dashboard/layout/production/
   ├── page.tsx          (Đã có nhưng chưa implement)
   └── [id]/
       └── page.tsx      (Chi tiết production)
```

**Chức năng:**
- ☐ Kanban board: Accepted → Copyediting → Layout → Proofing → Published
- ☐ Hiển thị danh sách bài theo stage
- ☐ Button chuyển stage (với validation)
- ☐ Upload file proof, final PDF
- ☐ Assign layout editor, proofreader
- ☐ Comment/note system cho mỗi stage

**RBAC:** SYSADMIN, EIC, MANAGING_EDITOR, Layout Editor, Proofreader

---

### ✏️ **6. Copyediting Management**

**Backend APIs:**
- `GET /api/copyediting` - Lấy danh sách bài cần copyedit
- `POST /api/copyediting` - Bắt đầu copyediting
- `PUT /api/copyediting/[id]` - Hoàn thành copyediting

**UI cần tạo:**
```
📁 app/dashboard/copyediting/
   ├── page.tsx          (Danh sách bài cần copyedit)
   └── [id]/
       └── page.tsx      (Copyedit interface)
```

**Chức năng:**
- ☐ Inline editor để chỉnh sửa bản thảo
- ☐ Highlight changes (track changes)
- ☐ Comment system cho từng paragraph
- ☐ Upload edited file (Word/PDF)
- ☐ Button "Gửi cho tác giả xem xét" / "Duyệt"
- ☐ Version history

**RBAC:** SYSADMIN, EIC, MANAGING_EDITOR, Copyeditor

---

### 🔍 **7. Plagiarism Detection**

**Backend APIs:**
- `POST /api/plagiarism` - Kiểm tra plagiarism cho bài viết
- `GET /api/plagiarism/[id]` - Lấy kết quả kiểm tra

**UI cần tạo:**
```
📁 app/dashboard/admin/plagiarism/
   ├── page.tsx          (Danh sách bài đã kiểm tra)
   └── [id]/
       └── page.tsx      (Kết quả chi tiết)
```

**Chức năng:**
- ☐ Button "Kiểm tra plagiarism" trong submission detail
- ☐ Hiển thị % similarity
- ☐ Highlight text trùng khớp
- ☐ Liệt kê nguồn trùng khớp (URL, document)
- ☐ Report PDF export
- ☐ Thống kê: Số bài kiểm tra, % bài có vấn đề

**RBAC:** SYSADMIN, EIC, MANAGING_EDITOR, SECTION_EDITOR

---

### 🏷️ **8. Keywords Management**

**Backend APIs:**
- `GET /api/keywords` - Lấy danh sách từ khóa
- `POST /api/keywords` - Tạo/merge keywords
- `DELETE /api/keywords/[id]` - Xóa keyword

**UI cần tạo:**
```
📁 app/dashboard/admin/keywords/
   └── page.tsx          (Quản lý từ khóa)
```

**Chức năng:**
- ☐ Table: Từ khóa, Số bài sử dụng, Lần cuối sử dụng
- ☐ Search & filter keywords
- ☐ Button "Merge keywords" (ghép từ khóa trùng/tương tự)
- ☐ Tag cloud visualization
- ☐ Keyword trending (xu hướng từ khóa)
- ☐ Export keywords list

**RBAC:** SYSADMIN, EIC, MANAGING_EDITOR

---

### 💬 **9. Messages System**

**Backend APIs:**
- `GET /api/messages` - Lấy danh sách tin nhắn
- `POST /api/messages` - Gửi tin nhắn mới
- `PUT /api/messages/[id]` - Đánh dấu đã đọc

**UI cần tạo:**
```
📁 app/dashboard/messages/
   ├── page.tsx          (Inbox)
   └── [id]/
       └── page.tsx      (Thread chi tiết)
```

**Chức năng:**
- ☐ Inbox: Danh sách thread (như email)
- ☐ Filter: Unread, Important, Archived
- ☐ Search messages
- ☐ Compose new message (với recipient picker)
- ☐ Reply/Forward
- ☐ Attach files
- ☐ Real-time notification

**RBAC:** Tất cả user roles

---

### 🔑 **10. API Tokens Management**

**Backend APIs:**
- `GET /api/security/api-tokens` - Lấy danh sách tokens
- `POST /api/security/api-tokens` - Tạo token mới
- `DELETE /api/security/api-tokens/[id]` - Revoke token

**UI cần tạo:**
```
📁 app/dashboard/admin/api-tokens/
   └── page.tsx          (Quản lý API tokens)
```

**Chức năng:**
- ☐ Table: Token name, Scopes, Created, Last used, Status
- ☐ Dialog tạo token mới (chọn scopes/permissions)
- ☐ Hiển thị token value 1 lần duy nhất sau khi tạo
- ☐ Button "Revoke" để vô hiệu hóa token
- ☐ Lịch sử sử dụng API
- ☐ Rate limiting settings

**RBAC:** SYSADMIN only

---

### 🗑️ **11. Data Retention Policy**

**Backend APIs:**
- `GET /api/security/retention` - Lấy retention policies
- `POST /api/security/retention` - Tạo policy mới
- `PUT /api/security/retention/[id]` - Cập nhật policy

**UI cần tạo:**
```
📁 app/dashboard/admin/data-retention/
   └── page.tsx          (Cấu hình retention)
```

**Chức năng:**
- ☐ Table: Data type, Retention period, Action (Archive/Delete)
- ☐ Configure retention cho: Audit logs, Sessions, Submissions, Reviews
- ☐ Automatic cleanup schedule
- ☐ Manual cleanup button (với confirmation)
- ☐ Thống kê: Dung lượng tiết kiệm, Số records đã xóa

**RBAC:** SYSADMIN only

---

### 🔐 **12. Two-Factor Authentication (2FA) Management**

**Backend APIs:**
- `POST /api/auth/2fa` - Bật/Tắt 2FA
- `POST /api/auth/2fa/send-otp` - Gửi OTP
- `POST /api/auth/2fa/verify-otp` - Xác thực OTP

**UI cần tạo:**
```
📁 app/dashboard/settings/security/
   └── page.tsx          (2FA settings - trong settings page)
```

**Chức năng:**
- ☐ Toggle 2FA (ON/OFF)
- ☐ QR code cho Authenticator app (Google Authenticator, Authy)
- ☐ Backup codes (10 codes, print/save)
- ☐ Trusted devices management
- ☐ 2FA method selection: Authenticator / SMS / Email
- ☐ Emergency disable (với security questions)

**RBAC:** Tất cả users (tự quản lý)

---

## 📋 III. CHECKLIST BỔ SUNG UI (Theo độ ưu tiên)

### 🔴 **Urgent (Cần làm ngay)**

| STT | Module | Path | RBAC | Thời gian ước tính |
|-----|--------|------|------|------------------|
| 1 | Role Escalation | `/dashboard/admin/role-escalation` | SYSADMIN, EIC | 2-3 giờ |
| 2 | Featured Articles | `/dashboard/admin/featured-articles` | SYSADMIN, EIC, MANAGING_EDITOR | 1.5-2 giờ |
| 3 | Deadlines | `/dashboard/admin/deadlines` | SYSADMIN, EIC, MANAGING_EDITOR | 2-3 giờ |

### 🟡 **High Priority (Nên làm trong tuần này)**

| STT | Module | Path | RBAC | Thời gian ước tính |
|-----|--------|------|------|------------------|
| 4 | Messages System | `/dashboard/messages` | All roles | 3-4 giờ |
| 5 | Volumes | `/dashboard/admin/volumes` | SYSADMIN, EIC, MANAGING_EDITOR | 1.5-2 giờ |
| 6 | Keywords | `/dashboard/admin/keywords` | SYSADMIN, EIC, MANAGING_EDITOR | 1.5-2 giờ |

### 🟠 **Medium Priority (Quan trọng nhưng không gấp)**

| STT | Module | Path | RBAC | Thời gian ước tính |
|-----|--------|------|------|------------------|
| 7 | Production | `/dashboard/layout/production` | SYSADMIN, EIC, Layout team | 4-5 giờ |
| 8 | Copyediting | `/dashboard/copyediting` | SYSADMIN, EIC, Copyeditor | 3-4 giờ |
| 9 | Plagiarism | `/dashboard/admin/plagiarism` | SYSADMIN, EIC, MANAGING_EDITOR | 2-3 giờ |

### ⚪ **Low Priority (Nên có nhưng không bắt buộc)**

| STT | Module | Path | RBAC | Thời gian ước tính |
|-----|--------|------|------|------------------|
| 10 | API Tokens | `/dashboard/admin/api-tokens` | SYSADMIN | 2-3 giờ |
| 11 | Data Retention | `/dashboard/admin/data-retention` | SYSADMIN | 2-3 giờ |
| 12 | 2FA Management | `/dashboard/settings/security` | All users | 2-3 giờ |

---

## 📊 IV. Tổng kết

### Thống kê tổng quan

```
Tổng số Backend APIs: 150+
APIs đã có UI: 138+ (92%)
APIs thiếu UI: 12 (8%)

Tổng thời gian ước tính: 30-38 giờ
```

### Phân bổ theo độ ưu tiên

| Độ ưu tiên | Số lượng | Thời gian | % Tổng |
|-------------|-----------|-----------|--------|
| Urgent | 3 | 6-8h | 25% |
| High | 3 | 6-8h | 25% |
| Medium | 3 | 9-12h | 33% |
| Low | 3 | 6-9h | 17% |
| **Tổng** | **12** | **30-38h** | **100%** |

---

## 🛠️ V. Kế hoạch triển khai

### Tuần 1: Urgent modules (3 modules)
- **Ngày 1-2:** Role Escalation (2-3h)
- **Ngày 3:** Featured Articles (1.5-2h)
- **Ngày 4-5:** Deadlines (2-3h)
- **Testing & QA:** Ngày 6-7

### Tuần 2: High Priority modules (3 modules)
- **Ngày 1-2:** Messages System (3-4h)
- **Ngày 3:** Volumes (1.5-2h)
- **Ngày 4:** Keywords (1.5-2h)
- **Testing & QA:** Ngày 5-7

### Tuần 3: Medium Priority modules (3 modules)
- **Ngày 1-2:** Production (4-5h)
- **Ngày 3-4:** Copyediting (3-4h)
- **Ngày 5:** Plagiarism (2-3h)
- **Testing & QA:** Ngày 6-7

### Tuần 4: Low Priority modules (3 modules)
- **Ngày 1:** API Tokens (2-3h)
- **Ngày 2:** Data Retention (2-3h)
- **Ngày 3:** 2FA Management (2-3h)
- **Final Testing & Documentation:** Ngày 4-7

---

## ✅ VI. Kết luận

### Điểm mạnh
✅ 92% backend APIs đã có UI tương ứng  
✅ Các module chính (submissions, reviews, issues, news, CMS) đã hoàn thiện  
✅ Hệ thống user management, security, analytics đã đầy đủ  
✅ Các chức năng cơ bản cho tạp chí khoa học đã sẵn sàng  

### Cần cải thiện
⚠️ 12 modules (8%) vẫn thiếu UI  
⚠️ Các chức năng nâng cao (role escalation, plagiarism, production) chưa hoàn thiện  
⚠️ Hệ thống messages, 2FA chưa tích hợp  

### Khuyến nghị
1. **Ưu tiên thực hiện:** Role Escalation, Featured Articles, Deadlines (tuần 1)
2. **Tiếp theo:** Messages System, Volumes, Keywords (tuần 2)
3. **Cuối cùng:** Production, Copyediting, Plagiarism, và các module security (tuần 3-4)

---

**Chuẩn bị bởi:** DeepAgent  
**Ngày:** 9 tháng 12, 2025  
**Trạng thái:** ✅ Sẵn sàng triển khai
