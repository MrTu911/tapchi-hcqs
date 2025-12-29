# CHECKLIST BỔ SUNG UI CÒN THIẾU

**Ngày tạo:** 9 tháng 12, 2025  
**Trạng thái:** 📋 Sẵn sàng triển khai  
**Tổng số UI cần bổ sung:** 11 pages

---

## 🔴 Ưu tiên CAO (Tuần 1: 9-15/12/2025)

### 1. Featured Articles Management

**Vị trí:** `/dashboard/admin/featured-articles/page.tsx`  
**API Backend:** ✅ Đã có (`/api/featured-articles`)

#### Checklist Implementation

**Backend:**
- [x] API GET `/api/featured-articles` - Lấy danh sách
- [x] API POST `/api/featured-articles` - Thêm mới
- [x] API GET `/api/featured-articles/[id]` - Lấy chi tiết
- [x] API PUT `/api/featured-articles/[id]` - Cập nhật
- [x] API DELETE `/api/featured-articles/[id]` - Xóa

**Frontend Components:**
- [ ] Main page: `app/dashboard/admin/featured-articles/page.tsx`
  - [ ] Table hiển thị danh sách featured articles
  - [ ] Columns: STT, Tiêu đề, Tác giả, Danh mục, Display Order, Start Date, End Date, Is Active, Actions
  - [ ] Search by title
  - [ ] Filter by category, active status
  - [ ] Pagination

- [ ] Add/Edit Dialog
  - [ ] Search & select article (autocomplete)
  - [ ] Display order (number input)
  - [ ] Start date (date picker)
  - [ ] End date (date picker)
  - [ ] Is active (toggle)
  - [ ] Featured type (dropdown: homepage, sidebar, archive)
  - [ ] Display position (dropdown: top, middle, bottom)

- [ ] Reorder Feature
  - [ ] Drag & drop to reorder
  - [ ] Bulk update display order
  - [ ] Preview order

- [ ] Delete Confirmation
  - [ ] AlertDialog
  - [ ] Show article info

**UI/UX:**
- [ ] Modern card-based layout
- [ ] Gradient header "Quản lý Bài báo Nổi bật"
- [ ] Statistics cards: Total Featured, Active, Scheduled, Expired
- [ ] Preview button to see how it looks on homepage
- [ ] Active/inactive badges with colors
- [ ] Calendar icon for date fields
- [ ] Toast notifications

**Integration:**
- [ ] Add link to sidebar: `/dashboard/admin/featured-articles`
- [ ] Icon: `Star` from lucide-react
- [ ] Roles: SYSADMIN, EIC, MANAGING_EDITOR
- [ ] Update homepage to fetch from this API

**Testing:**
- [ ] Create featured article
- [ ] Edit featured article
- [ ] Reorder featured articles
- [ ] Delete featured article
- [ ] Verify display on homepage
- [ ] Check date-based scheduling (start/end)

---

### 2. Volumes Management

**Vị trí:** `/dashboard/admin/volumes/page.tsx`  
**API Backend:** ✅ Đã có (`/api/volumes`)

#### Checklist Implementation

**Backend:**
- [x] API GET `/api/volumes` - Lấy danh sách
- [x] API POST `/api/volumes` - Tạo mới
- [x] API GET `/api/volumes/[id]` - Lấy chi tiết
- [x] API PUT `/api/volumes/[id]` - Cập nhật
- [x] API DELETE `/api/volumes/[id]` - Xóa

**Frontend Components:**
- [ ] Main page: `app/dashboard/admin/volumes/page.tsx`
  - [ ] Table hiển thị danh sách volumes
  - [ ] Columns: STT, Volume No, Year, Title, Description, Số Issues, Số Articles, Actions
  - [ ] Search by title
  - [ ] Filter by year
  - [ ] Sorting: year DESC, volumeNo DESC

- [ ] Create/Edit Dialog
  - [ ] Volume number (number input, required)
  - [ ] Year (year picker, required)
  - [ ] Title Vietnamese (text input, required)
  - [ ] Title English (text input)
  - [ ] Description Vietnamese (textarea)
  - [ ] Description English (textarea)
  - [ ] Validation: Unique volumeNo + year combination

- [ ] Volume Detail View
  - [ ] Show volume info
  - [ ] List all issues in this volume
  - [ ] Statistics: Total issues, total articles
  - [ ] Button: "Add New Issue" (navigate to issue create with volume pre-selected)

- [ ] Delete Confirmation
  - [ ] Prevent delete if volume has issues
  - [ ] Show warning message
  - [ ] Show issue count

**UI/UX:**
- [ ] Modern table with Shadcn UI
- [ ] Gradient header "Quản lý Tập tạp chí"
- [ ] Statistics cards: Total Volumes, This Year, Total Issues, Total Articles
- [ ] Year badges with colors
- [ ] Link to issues of volume
- [ ] Expandable rows to show issues

**Integration:**
- [ ] Add link to sidebar: `/dashboard/admin/volumes`
- [ ] Icon: `BookOpen` from lucide-react
- [ ] Roles: SYSADMIN, EIC, MANAGING_EDITOR
- [ ] Update issues form to use this volume list

**Testing:**
- [ ] Create new volume
- [ ] Edit volume details
- [ ] View volume with issues
- [ ] Try to delete volume with issues (should fail)
- [ ] Delete empty volume (should succeed)
- [ ] Verify issue form shows volumes correctly

---

### 3. Deadlines Management

**Vị trí:** `/dashboard/admin/deadlines/page.tsx`  
**API Backend:** ✅ Đã có (`/api/deadlines`)

#### Checklist Implementation

**Backend:**
- [x] API GET `/api/deadlines` - Lấy danh sách
- [x] API POST `/api/deadlines` - Tạo mới
- [ ] API PUT `/api/deadlines/[id]` - Cập nhật (cần kiểm tra)
- [ ] API DELETE `/api/deadlines/[id]` - Xóa (cần kiểm tra)

**Frontend Components:**
- [ ] Main page: `app/dashboard/admin/deadlines/page.tsx`
  - [ ] Two views: List view & Calendar view
  - [ ] Table columns: Submission, Type, Due Date, Days Left, Status, Assigned To, Actions
  - [ ] Calendar view with color-coded deadlines
  - [ ] Filter by: Type (Review, Revision, Decision), Status (Upcoming, Overdue, Completed)
  - [ ] Search by submission code/title

- [ ] Create/Edit Dialog
  - [ ] Submission (autocomplete search)
  - [ ] Deadline type (dropdown: REVIEW, REVISION, DECISION, COPYEDIT, PRODUCTION)
  - [ ] Due date (date-time picker)
  - [ ] Assigned to (user selector)
  - [ ] Notes (textarea)
  - [ ] Send reminder (checkbox + days before)

- [ ] Calendar Component
  - [ ] Use `react-big-calendar` or similar
  - [ ] Color coding: Green (completed), Yellow (upcoming), Red (overdue)
  - [ ] Click to view/edit deadline
  - [ ] Drag & drop to reschedule

- [ ] Alerts Section
  - [ ] Show overdue deadlines at top
  - [ ] Show deadlines due in 3 days
  - [ ] Notification bell icon
  - [ ] Count of overdue items

- [ ] Reminder Settings
  - [ ] Auto-send reminder emails
  - [ ] Configure reminder days (3, 7, 14 days before)
  - [ ] Email template preview

**UI/UX:**
- [ ] Tab interface: "List View" | "Calendar View" | "Settings"
- [ ] Gradient header "Quản lý Hạn chết"
- [ ] Statistics cards: Total Deadlines, Overdue, Due This Week, Completed
- [ ] Color-coded status badges
- [ ] Warning icons for overdue
- [ ] Clock icon for upcoming
- [ ] Countdown timer for urgent deadlines

**Integration:**
- [ ] Add link to sidebar: `/dashboard/admin/deadlines`
- [ ] Icon: `Calendar` from lucide-react
- [ ] Roles: SYSADMIN, EIC, MANAGING_EDITOR, SECTION_EDITOR
- [ ] Show deadline alerts in dashboard header
- [ ] Integrate with submission detail pages
- [ ] Integrate with review pages

**Testing:**
- [ ] Create deadline for review
- [ ] Create deadline for revision
- [ ] Edit deadline date
- [ ] Delete deadline
- [ ] View calendar view
- [ ] Check overdue alerts
- [ ] Test reminder email (manual trigger)
- [ ] Verify integration with submissions

---

## 🟡 Ưu tiên TRUNG BÌNH (Tuần 2: 16-22/12/2025)

### 4. Copyediting Workflow

**Vị trí:** `/dashboard/admin/copyediting/page.tsx`  
**API Backend:** ✅ Đã có (`/api/copyediting`)

#### Checklist Implementation

**Backend:**
- [x] API GET `/api/copyediting` - Lấy danh sách
- [x] API POST `/api/copyediting` - Tạo task
- [ ] API PUT `/api/copyediting/[id]` - Cập nhật (cần kiểm tra)

**Frontend Components:**
- [ ] Main page: `app/dashboard/admin/copyediting/page.tsx`
  - [ ] Table: Articles in copyediting
  - [ ] Columns: Article, Status, Copyeditor, Assigned Date, Deadline, Progress, Actions
  - [ ] Filter by status: Pending, In Progress, Completed, Revision Required
  - [ ] Search by article title

- [ ] Assign Copyeditor Dialog
  - [ ] Article info
  - [ ] Copyeditor selector (role: COPYEDITOR or SECTION_EDITOR)
  - [ ] Deadline (date picker)
  - [ ] Instructions (textarea)

- [ ] Copyediting Detail Page
  - [ ] Article content viewer
  - [ ] Upload edited file
  - [ ] Comment/track changes section
  - [ ] Side-by-side comparison (original vs edited)
  - [ ] Approve/Request revision buttons

- [ ] Track Changes Component
  - [ ] Show changes made
  - [ ] Comments on specific sections
  - [ ] Accept/reject individual changes
  - [ ] History of revisions

**UI/UX:**
- [ ] Workflow diagram at top
- [ ] Status badges with colors
- [ ] Progress bar for each article
- [ ] File diff viewer
- [ ] Comment threads

**Integration:**
- [ ] Add to sidebar: `/dashboard/admin/copyediting`
- [ ] Icon: `Edit3` from lucide-react
- [ ] Link from production workflow

---

### 5. Production Workflow (Kiểm tra & Bổ sung)

**Vị trí:** `/dashboard/layout/production/page.tsx` (Đã có)  
**API Backend:** ✅ Đã có (`/api/production`)

#### Checklist Kiểm tra

- [ ] Kiểm tra page hiện tại có chức năng gì
- [ ] Đọc code và xác định thiếu chức năng nào
- [ ] Bổ sung chức năng còn thiếu

**Chức năng cần có:**
- [ ] Galley management
- [ ] Layout/typesetting tools
- [ ] Proofing interface
- [ ] Final PDF generation
- [ ] Publish to issue
- [ ] Metadata assignment (DOI, pages, etc.)

---

### 6. Plagiarism Check Integration

**Vị trí:** Tích hợp vào `/dashboard/editor/submissions/[id]` và `/dashboard/admin/articles/[id]`  
**API Backend:** ✅ Đã có (`/api/plagiarism`)

#### Checklist Implementation

**Backend:**
- [x] API POST `/api/plagiarism` - Check plagiarism

**Frontend Integration:**
- [ ] Add "Check Plagiarism" button to submission detail
- [ ] Create `PlagiarismCheckDialog` component
  - [ ] File selector (use current manuscript or upload new)
  - [ ] Loading state while checking
  - [ ] Results display:
    - [ ] Similarity percentage (with color coding)
    - [ ] Matched sources list
    - [ ] Highlighted text sections
  - [ ] Save report button
  - [ ] Download report PDF

- [ ] Plagiarism History Section
  - [ ] Show all previous checks
  - [ ] Timestamp, similarity %, checker name
  - [ ] View detailed report

- [ ] Alert System
  - [ ] Show warning if similarity > 25%
  - [ ] Require editor approval if similarity > 40%

**UI/UX:**
- [ ] Button with shield icon
- [ ] Progress bar during check
- [ ] Color-coded results: Green (<10%), Yellow (10-25%), Red (>25%)
- [ ] Export report as PDF

**Integration:**
- [ ] Add to editor submission detail page
- [ ] Add to admin article detail page
- [ ] Save results to database (need model)

---

### 7. Keywords Management

**Vị trí:** `/dashboard/admin/keywords/page.tsx`  
**API Backend:** ✅ Đã có (`/api/keywords`)

#### Checklist Implementation

**Backend:**
- [x] API GET `/api/keywords` - Lấy danh sách
- [ ] API POST `/api/keywords` - Tạo mới (cần kiểm tra)
- [ ] API PUT `/api/keywords/[id]` - Cập nhật (cần kiểm tra)
- [ ] API DELETE `/api/keywords/[id]` - Xóa (cần kiểm tra)
- [ ] API POST `/api/keywords/merge` - Gộp keywords (cần tạo)

**Frontend Components:**
- [ ] Main page: `app/dashboard/admin/keywords/page.tsx`
  - [ ] Table: Keywords list
  - [ ] Columns: Keyword (VN/EN), Category, Usage Count, Last Used, Actions
  - [ ] Search by keyword
  - [ ] Filter by category
  - [ ] Sort by usage count

- [ ] Create/Edit Dialog
  - [ ] Keyword Vietnamese (required)
  - [ ] Keyword English
  - [ ] Category (dropdown)
  - [ ] Aliases (tags input for similar keywords)

- [ ] Merge Keywords Dialog
  - [ ] Select source keywords (multi-select)
  - [ ] Select target keyword
  - [ ] Preview articles affected
  - [ ] Confirm merge

- [ ] Keyword Details
  - [ ] Show all articles using this keyword
  - [ ] Statistics chart
  - [ ] Related keywords (suggestions)

**UI/UX:**
- [ ] Tag-based display
- [ ] Usage count badges
- [ ] Category color coding
- [ ] Autocomplete when adding keywords to articles

**Integration:**
- [ ] Add to sidebar
- [ ] Icon: `Tag` from lucide-react
- [ ] Integrate with submission form (autocomplete)

---

## 🟢 Ưu tiên THẤP (Tuần 3: 23-29/12/2025)

### 8. Messages Management

**Vị trí:** `/dashboard/messages/page.tsx`  
**API Backend:** ✅ Đã có (`/api/messages`)

#### Checklist Implementation

- [ ] Main page with inbox, sent, compose
- [ ] Thread view
- [ ] Mark as read/unread
- [ ] Delete messages
- [ ] Search messages
- [ ] Compose new message with user selector

---

### 9. API Tokens Management

**Vị trí:** `/dashboard/admin/security/api-tokens/page.tsx`  
**API Backend:** ✅ Đã có (`/api/security/api-tokens`)

#### Checklist Implementation

- [ ] List all tokens
- [ ] Create new token (with scopes, expiry)
- [ ] Revoke token
- [ ] View usage logs
- [ ] Regenerate token

---

### 10. Role Escalation Management

**Vị trí:** `/dashboard/admin/role-escalation/page.tsx`  
**API Backend:** ✅ Đã có (`/api/admin/role-escalation`)

#### Checklist Implementation

- [ ] List role escalation requests
- [ ] Approve/reject requests
- [ ] View request details
- [ ] Send notification to user
- [ ] Audit log integration

---

### 11. 2FA Admin Panel

**Vị trí:** `/dashboard/admin/security/2fa/page.tsx`  
**API Backend:** ✅ Đã có (`/api/auth/2fa`)

#### Checklist Implementation

- [ ] List users with 2FA status
- [ ] Force enable 2FA for roles
- [ ] Reset 2FA for user
- [ ] 2FA statistics
- [ ] Audit log 2FA activities

---

## 📋 Tổng kết

### Tổng số UI cần tạo: 11 pages

**Ưu tiên CAO:** 3 pages  
**Ưu tiên TRUNG BÌNH:** 4 pages  
**Ưu tiên THẤP:** 4 pages

### Thời gian ước tính

- **Tuần 1 (CAO):** 3 pages x 1.5 ngày = ~5 ngày
- **Tuần 2 (TRUNG BÌNH):** 4 pages x 1 ngày = ~4 ngày
- **Tuần 3 (THẤP):** 4 pages x 0.5 ngày = ~2 ngày

**Tổng:** ~11 ngày (2.5 tuần)

---

**Prepared by:** DeepAgent  
**Last Updated:** December 9, 2025  
**Status:** 📖 Ready for Implementation
