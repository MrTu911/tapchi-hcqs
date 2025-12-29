# 🚀 SPRINT 3 ENHANCEMENTS - PRODUCTION PIPELINE ADVANCED FEATURES

**Ngày hoàn thành:** 27/12/2025  
**Mục tiêu:** Nâng cao chất lượng và độ tin cậy của quy trình xuất bản bằng các tính năng nâng cao

---

## 📋 Tổng Quan Các Tính Năng Đã Triển Khai

### ✅ **Module 1: Copyediting Enhancements**
- **Tags thay đổi chi tiết**: Theo dõi loại chỉnh sửa (sửa chính tả, thêm hình, cập nhật tài liệu tham khảo...)
- **Deadline tracking**: Quản lý hạn chốt hoàn thành biên tập
- **Cảnh báo quá hạn**: Hiển thị rõ ràng các bài quá hạn hoặc sắp đến hạn

### ✅ **Module 2: Production Enhancements**
- **Kiểm tra ràng buộc**: Chỉ cho phép xuất bản khi đáp ứng đầy đủ điều kiện
- **Thông báo chi tiết**: Gửi thông báo đầy đủ cho tác giả khi bài được xuất bản
- **Audit trail**: Ghi lại toàn bộ lịch sử thay đổi trạng thái

### ✅ **Module 3: Plagiarism Check UI**
- **Color-coded results**: Phân loại theo mức độ nghiêm trọng (Xanh/Vàng/Cam/Đỏ)
- **Progress bars**: Thể hiện trực quan tỷ lệ tương đồng
- **Detailed reports**: Hiển thị danh sách tài liệu tương tự
- **Recommendations**: Gợi ý hành động dựa trên mức độ tương đồng

---

## 🛠️ Chi Tiết Kỹ Thuật

### 1️⃣ Copyediting Module Enhancements

#### **Database Schema Updates**
```prisma
model Copyedit {
  // ... existing fields
  
  // 🆕 Sprint 3 Enhancements
  tags        String[]  @default([]) // Tags: "sửa chính tả", "thêm hình", etc.
  deadline    DateTime? // Deadline để hoàn thành biên tập
  
  @@index([deadline])
}
```

#### **API Enhancements**

**POST /api/copyediting**
- **New fields**: `tags[]`, `deadline`
- **Validation**: Zod schema cho mảng tags và ISO date string

**PATCH /api/copyediting/[id]**
- **New fields**: `tags[]`, `deadline`
- **Logic**: Xử lý cập nhật tags và deadline (cho phép xóa deadline bằng null)

#### **UI Features**

**Table View** (`/dashboard/copyediting`)
- **Tags column**: Hiển thị tất cả tags dưới dạng badges
- **Deadline column**: 
  - Hiển thị ngày deadline
  - **Quá hạn**: Badge đỏ + highlight dòng (`bg-red-50`)
  - **Sắp đến hạn** (≤ 3 ngày): Badge vàng + cảnh báo
  - **Bình thường**: Hiển thị ngày thông thường

**Edit Dialog**
- **Tags management**: 
  - Input field để thêm tag mới
  - Enter để thêm nhanh
  - Xóa tag bằng nút `×`
  - Hiển thị danh sách tags hiện tại
- **Deadline picker**: 
  - Input type="date"
  - Hiển thị preview ngày đã chọn

#### **Color Codes**

| Mức độ | Màu | Điều kiện |
|---------|------|------------|
| Quá hạn | Đỏ (`bg-red-50`, `text-red-600`) | `deadline < now && status !== 'completed'` |
| Sắp đến hạn | Vàng (`bg-amber-50`, `text-amber-700`) | `daysRemaining <= 3 && daysRemaining > 0` |
| Bình thường | Xám (`text-gray-700`) | Còn lại |

---

### 2️⃣ Production Module Enhancements

#### **API Enhancements**

**POST /api/production/publish** - Kiểm tra ràng buộc

```typescript
// 🔒 Kiểm tra 1: Article phải được ACCEPT
if (production.article.submission.status !== 'ACCEPTED') {
  return error(400, 'Article must be accepted before publishing');
}

// 🔒 Kiểm tra 2: Tất cả reviews phải hoàn thành
const pendingReviews = reviews.filter(
  r => r.status === 'pending' || r.status === 'in_progress'
);
if (pendingReviews.length > 0) {
  return error(400, `${pendingReviews.length} reviews still pending`);
}

// 🔒 Kiểm tra 3: Copyediting phải hoàn thành (nếu có)
if (latestCopyedit && latestCopyedit.status !== 'completed') {
  return error(400, 'Copyediting must be completed before publishing');
}
```

#### **Notification Enhancements**

**Thông báo xuất bản chi tiết:**
```typescript
// 🎉 Thông báo cho tác giả chính
const issueInfo = updated.issue
  ? ` trong Số ${updated.issue.number}/${updated.issue.year}`
  : '';

await prisma.notification.create({
  data: {
    userId: production.article.submission.createdBy,
    type: 'ARTICLE_PUBLISHED',
    title: '🎉 Bài viết đã xuất bản',
    message: `Chúc mừng! Bài viết "${title}" đã được xuất bản chính thức${issueInfo}. Bài viết của bạn hiện đã được công bố và có thể truy cập công khai.`,
    link: `/articles/${production.articleId}`,
  },
});

// TODO: Nếu có co-authors trong tương lai
// for (const coAuthor of production.article.submission.coAuthors) {
//   await prisma.notification.create({ ... });
// }
```

#### **Error Messages**

| Lỗi | Status | Message |
|------|--------|----------|
| Chưa accept | 400 | `Article must be accepted before publishing` |
| Reviews chưa xong | 400 | `All reviews must be completed before publishing` |
| Copyediting chưa xong | 400 | `Copyediting must be completed before publishing` |

---

### 3️⃣ Plagiarism Check UI

#### **New Page**

**URL**: `/dashboard/plagiarism`

#### **Color-Coded Thresholds**

```typescript
const getScoreConfig = (score: number) => {
  if (score >= 70) return {
    label: 'Rất cao',
    color: 'bg-red-100 text-red-800 border-red-300',
    barColor: 'bg-red-600',
    icon: AlertTriangle,
    severity: 'critical',
  };
  if (score >= 40) return {
    label: 'Cao',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    barColor: 'bg-orange-500',
    icon: AlertCircle,
    severity: 'high',
  };
  if (score >= 20) return {
    label: 'Trung bình',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    barColor: 'bg-amber-400',
    icon: AlertCircle,
    severity: 'medium',
  };
  return {
    label: 'Thấp',
    color: 'bg-green-100 text-green-800 border-green-300',
    barColor: 'bg-green-500',
    icon: CheckCircle,
    severity: 'low',
  };
};
```

#### **UI Components**

**1. Check New Article Card**
- Select dropdown cho bài viết ACCEPTED
- Nút "Kiểm tra ngay" với loading state
- Background: `border-2 border-blue-200 bg-blue-50`

**2. Reports Table**
- **Độ tương đồng column**: 
  - Font size 2xl cho tỉ lệ %
  - Icon theo mức độ
  - Progress bar với màu tương ứng
- **Mức độ column**: Badge với màu theo threshold
- **Row highlighting**: `bg-red-50` cho severity='critical'

**3. Detail Dialog**
- **Score Summary Card**: Large card với màu theo mức độ
- **Matches Section**: Danh sách tài liệu tương tự tìm thấy
- **Recommendations Card**: Gợi ý hành động dựa trên score

#### **Recommendations Logic**

| Score Range | Khuyến nghị |
|-------------|-------------|
| ≥ 70% | • Độ tương đồng rất cao - Cần xem xét từ chối<br>• Kiểm tra kỹ nguồn trích dẫn<br>• Liên hệ tác giả |
| 40-69% | • Độ tương đồng cao - Cần làm rõ<br>• Yêu cầu bổ sung trích dẫn<br>• Xem xét chỉnh sửa |
| 20-39% | • Độ tương đồng trung bình - Theo dõi<br>• Kiểm tra các đoạn trùng lặp |
| < 20% | • Độ tương đồng thấp - Chấp nhận được<br>• Bài viết đáp ứng tiêu chuẩn |

---

## 📊 Kết Quả Testing

### Build Status
✅ **TypeScript Compilation**: PASS (0 errors)  
✅ **Next.js Build**: SUCCESS (exit_code=0)  
⚠️ **Warnings**: Minor import warnings in deprecated files (`.banners-old`)

### Checkpoint
✅ **Saved**: Sprint 3 Enhanced: Tags, Deadline, Production Constraints, Plagiarism UI  
✅ **Deployed**: Development server running on localhost:3000

---

## 📝 Files Modified/Created

### Database
- `prisma/schema.prisma` - Copyedit model enhancements

### API Routes
- `app/api/copyediting/route.ts` - Tags & deadline support
- `app/api/copyediting/[id]/route.ts` - Update logic for new fields
- `app/api/production/publish/route.ts` - Validation constraints & notifications

### Pages
- `app/dashboard/copyediting/page.tsx` - Enhanced UI with tags & deadline
- `app/dashboard/plagiarism/page.tsx` - **NEW** - Color-coded plagiarism UI

---

## 🚀 Future Enhancements (Sprint 4)

### Copyediting
- [ ] File version diff viewer
- [ ] Auto-reminders khi sắp đến deadline
- [ ] Export biên bản biên tập PDF

### Production
- [ ] Co-authors notification system
- [ ] Bulk publish multiple articles
- [ ] Publishing schedule (lên lịch xuất bản)

### Plagiarism
- [ ] Integration với external APIs (iThenticate, Turnitin, Copyscape)
- [ ] PDF report export
- [ ] Batch checking

---

## 🔗 Related Documentation

- [SPRINT_3_COMPLETION_SUMMARY.md](./SPRINT_3_COMPLETION_SUMMARY.md) - Sprint 3 base features
- [MODULE_COMPLETION_SUMMARY.md](./MODULE_COMPLETION_SUMMARY.md) - Sprint 2 features
- [README.md](./README.md) - Project overview

---

**© 2025 Tạp chí điện tử Khoa học Hậu cần quân sự**
