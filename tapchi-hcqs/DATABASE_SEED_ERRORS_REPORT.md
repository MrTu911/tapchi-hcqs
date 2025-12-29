# BÁO CÁO LỖI SEED DATABASE
## Ngày: 28/12/2025

---

## 📊 TỔNG QUAN

**Trạng thái**: Seed thất bại - Phát hiện 2 lỗi nghiêm trọng
**Tác động**: Không thể khởi tạo dữ liệu mẫu cho hệ thống

---

## ❌ LỖI #1: THIẾU MIGRATION TABLES

### Mô tả lỗi:
```
Error: The table `public.Category` does not exist in the current database.
Code: P2021
```

### Nguyên nhân:
- Thư mục `prisma/migrations/` chỉ chứa file SQL rời (`add_chat_and_comments.sql`)
- Không có cấu trúc migration folders chuẩn của Prisma
- Khi chạy `yarn prisma migrate reset`, không có migration nào được apply

### Cách khắc phục:
✅ Đã tạo initial migration: `yarn prisma migrate dev --name init --create-only`
✅ Đã apply migration: `yarn prisma migrate deploy`
✅ Kết quả: Tất cả tables đã được tạo thành công

### Bài học:
- **Luôn đảm bảo có migration folders hợp lệ** trước khi reset database
- Prisma cần cấu trúc: `prisma/migrations/<timestamp>_<name>/migration.sql`
- Không đủ chỉ có file SQL rời trong thư mục migrations

---

## ❌ LỖI #2: REFERENCE USER KHÔNG TỒN TẠI

### Mô tả lỗi:
```
TypeError: Cannot read properties of undefined (reading 'id')
Location: scripts/seed.ts:429:30
Code: const author2 = createdUsers.find(u => u.email === 'john@doe.com')!
```

### Nguyên nhân:
- **Line 318** seed script tìm user với email `john@doe.com`
- User này **KHÔNG TỒN TẠI** trong mảng `USERS` (lines 67-155)
- Dấu `!` (non-null assertion) gây ra undefined.id error

### Dữ liệu thực tế:
```typescript
// USERS array chỉ có 1 AUTHOR:
{
  email: "author@tapchi.mil.vn",  // ✅ Tồn tại
  role: "AUTHOR"
}

// Script tìm:
const author2 = createdUsers.find(u => u.email === 'john@doe.com')!  // ❌ Không tồn tại
```

### Tác động:
- Seed bị dừng ngay khi tạo articles
- Không có dữ liệu mẫu nào được tạo (submissions, articles, reviews, etc.)
- Categories và Users đã được seed thành công trước đó

### Các giải pháp khả thi:

#### **Option A: Sử dụng user hiện có** (Khuyến nghị)
```typescript
// Thay vì:
const author2 = createdUsers.find(u => u.email === 'john@doe.com')!

// Đổi thành:
const author2 = createdUsers.find(u => u.role === 'SECTION_EDITOR')! // Hoặc role khác
// HOẶC dùng chính author nếu không cần phân biệt
const author2 = author
```

#### **Option B: Thêm author thứ 2 vào USERS array**
```typescript
const USERS = [
  // ... existing users
  {
    email: "author2@tapchi.mil.vn",  // Tạo author thứ 2
    password: "Author2@2025",
    fullName: "Tác giả 2",
    org: "Quân khu 2",
    role: "AUTHOR"
  }
]

// Và sửa line 318:
const author2 = createdUsers.find(u => u.email === 'author2@tapchi.mil.vn')!
```

---

## 📋 TIẾN ĐỘ SEED

| Bước | Trạng thái | Ghi chú |
|------|-----------|---------|
| 📚 Categories | ✅ Thành công | 11 chuyên mục |
| 👥 Users | ✅ Thành công | ~10+ users |
| 👨‍🔬 Reviewer Profiles | ✅ Thành công | 1 profile |
| 📖 Volumes & Issues | ✅ Thành công | - |
| 📰 Articles | ❌ **THẤT BẠI** | Lỗi tại author2 |
| 📝 Submissions | ⏸️ Chưa chạy | Phụ thuộc Articles |
| 🔍 Reviews | ⏸️ Chưa chạy | Phụ thuộc Submissions |
| 💬 Messages | ⏸️ Chưa chạy | Phụ thuộc Users |

---

## 🔧 HÀNH ĐỘNG KHẮC PHỤC

### Bước 1: Sửa lỗi trong seed.ts
- [ ] Sửa line 318: Thay `john@doe.com` bằng user thực tế
- [ ] Test lại logic tìm author2
- [ ] Đảm bảo tất cả references hợp lệ

### Bước 2: Re-seed database
- [ ] Chạy lại `yarn prisma db seed`
- [ ] Xác nhận tất cả data được tạo
- [ ] Test các relationships

### Bước 3: Validation sau seed
- [ ] Kiểm tra tất cả tables có data
- [ ] Verify foreign key constraints
- [ ] Test login với seed users
- [ ] Kiểm tra workflow hoạt động

---

## 💡 KHUYẾN NGHỊ CẢI TIẾN

### 1. **Error Handling trong Seed Script**
```typescript
// Thêm validation trước khi sử dụng
const author2 = createdUsers.find(u => u.email === 'john@doe.com')
if (!author2) {
  console.warn('⚠️  User john@doe.com not found, using default author')
  author2 = author // fallback
}
```

### 2. **Migration Management**
- Tạo script kiểm tra migrations trước khi seed
- Tự động generate initial migration nếu cần
- Log migration status

### 3. **Seed Validation**
- Thêm checks sau mỗi bước seed
- Log số lượng records được tạo
- Validate relationships

### 4. **Testing**
- Tạo automated test cho seed script
- Verify tất cả required data tồn tại
- Test các edge cases

---

## 📌 KẾT LUẬN

**Nguyên nhân chính**:
1. ❌ Migration structure không đúng chuẩn Prisma
2. ❌ Hardcoded email reference không tồn tại

**Độ nghiêm trọng**: 🔴 HIGH
- Ngăn chặn hoàn toàn việc khởi tạo dữ liệu
- Ảnh hưởng đến development và testing

**Thời gian khắc phục dự kiến**: ~10 phút
- Sửa code: 2 phút
- Re-seed: 3 phút
- Validation: 5 phút

---

*Báo cáo được tạo tự động bởi Database Seeding Process*
