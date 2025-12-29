# 📋 TỔNG HỢP TÀI KHOẢN TEST - TẠP CHÍ HCQS

**Ngày tạo:** 03/11/2025  
**Trạng thái:** ✅ Đã kiểm tra và hoạt động

---

## 🔐 DANH SÁCH TÀI KHOẢN TEST

### 1️⃣ QUẢN TRỊ VIÊN HỆ THỐNG (SYSADMIN)
- **Email:** admin@test.com
- **Mật khẩu:** Admin123!@#
- **Họ tên:** Quản trị viên hệ thống
- **Đơn vị:** Tạp chí HCQS
- **Quyền hạn:** Toàn quyền quản trị hệ thống
- **Dashboard:** `/dashboard/admin`

### 2️⃣ TỔNG BIÊN TẬP (EIC)
- **Email:** eic@test.com
- **Mật khẩu:** Eic123!@#
- **Họ tên:** Nguyễn Văn Tổng
- **Đơn vị:** Tạp chí HCQS
- **Quyền hạn:** Quyết định cuối cùng về xuất bản
- **Dashboard:** `/dashboard/eic`

### 3️⃣ BIÊN TẬP ĐIỀU HÀNH (MANAGING_EDITOR)
- **Email:** managing@test.com
- **Mật khẩu:** Managing123!@#
- **Họ tên:** Trần Thị Điều Hành
- **Đơn vị:** Tạp chí HCQS
- **Quyền hạn:** Quản lý quy trình biên tập
- **Dashboard:** `/dashboard/managing`

### 4️⃣ BIÊN TẬP CHUYÊN MỤC (SECTION_EDITOR)
- **Email:** editor@test.com
- **Mật khẩu:** Editor123!@#
- **Họ tên:** Lê Văn Biên
- **Đơn vị:** Tạp chí HCQS
- **Quyền hạn:** Quản lý chuyên mục, gán reviewer
- **Dashboard:** `/dashboard/editor`

### 5️⃣ BIÊN TẬP KỸ THUẬT (LAYOUT_EDITOR)
- **Email:** layout@test.com
- **Mật khẩu:** Layout123!@#
- **Họ tên:** Phạm Thị Kỹ Thuật
- **Đơn vị:** Tạp chí HCQS
- **Quyền hạn:** Trình bày và xuất bản
- **Dashboard:** `/dashboard/layout`

### 6️⃣ PHẢN BIỆN VIÊN 1 (REVIEWER)
- **Email:** reviewer@test.com
- **Mật khẩu:** Reviewer123!@#
- **Họ tên:** PGS.TS Hoàng Văn Phản Biện
- **Đơn vị:** Học viện Hậu cần
- **Chuyên môn:** Quản trị chiến lược, Logistics quân sự, Quản lý chuỗi cung ứng
- **Reviews được gán:** 2 bài
- **Dashboard:** `/dashboard/reviewer`

### 7️⃣ PHẢN BIỆN VIÊN 2 (REVIEWER)
- **Email:** reviewer2@test.com
- **Mật khẩu:** Reviewer123!@#
- **Họ tên:** TS. Võ Thị An Ninh
- **Đơn vị:** Đại học Quốc gia
- **Chuyên môn:** Công nghệ thông tin, An ninh mạng, Bảo mật thông tin
- **Reviews được gán:** 2 bài
- **Dashboard:** `/dashboard/reviewer`

### 8️⃣ TÁC GIẢ 1 (AUTHOR)
- **Email:** author@test.com
- **Mật khẩu:** Author123!@#
- **Họ tên:** ThS. Đặng Văn Tác Giả
- **Đơn vị:** Học viện Kỹ thuật Quân sự
- **Dashboard:** `/dashboard/author`

### 9️⃣ TÁC GIẢ 2 (AUTHOR)
- **Email:** author2@test.com
- **Mật khẩu:** Author123!@#
- **Họ tên:** NCV. Bùi Thị Nghiên Cứu
- **Đơn vị:** Trường Đại học Bách Khoa
- **Dashboard:** `/dashboard/author`

### 🔟 KIỂM TOÁN AN NINH (SECURITY_AUDITOR)
- **Email:** security@test.com
- **Mật khẩu:** Security123!@#
- **Họ tên:** Vũ Văn Bảo Mật
- **Đơn vị:** Tạp chí HCQS
- **Quyền hạn:** Kiểm toán an ninh hệ thống
- **Dashboard:** `/dashboard/admin/security`

### 1️⃣1️⃣ ĐỘC GIẢ (READER)
- **Email:** reader@test.com
- **Mật khẩu:** Reader123!@#
- **Họ tên:** Nguyễn Độc Giả
- **Đơn vị:** Công chúng
- **Quyền hạn:** Xem nội dung công khai
- **Dashboard:** `/dashboard`

---

## 📊 THỐNG KÊ HỆ THỐNG

### Dữ liệu đã tạo:
- ✅ **Tổng số tài khoản:** 11 (tất cả các role)
- ✅ **Tổng số bài nộp:** 25 bài
  - Published: 20 bài
  - Under Review: 3 bài
  - New: 2 bài
- ✅ **Tổng số reviews:** 10 review assignments
  - Mỗi bài được gán 2 reviewers
  - Tất cả đang ở trạng thái "Chờ phản biện"

### Reviewer có bài cần phản biện:
1. **PGS.TS Hoàng Văn Phản Biện** (reviewer@test.com) - 2 bài
2. **TS. Võ Thị An Ninh** (reviewer2@test.com) - 2 bài
3. **Nguyen Van Test** (testuser@hvhcqs.edu.vn) - 3 bài
4. **Phản biện viên** (reviewer@tapchi.mil.vn) - 3 bài

---

## 🎯 KIỂM TRA CHỨC NĂNG REVIEW

### Bước 1: Đăng nhập với tài khoản reviewer
```
Email: reviewer@test.com
Mật khẩu: Reviewer123!@#
```

### Bước 2: Truy cập trang review assignments
```
URL: /dashboard/reviewer/assignments
```

### Bước 3: Kiểm tra danh sách bài cần phản biện
Reviewer sẽ thấy:
- Tab "Chờ phản biện" với 2 bài
- Thông tin bài viết: Tiêu đề, Mã, Tác giả, Danh mục
- Nút "Bắt đầu phản biện"

### Bước 4: Thực hiện phản biện
- Click "Bắt đầu phản biện" trên bất kỳ bài nào
- URL sẽ là: `/dashboard/reviewer/review/[reviewId]`
- Điền form phản biện với các trường:
  - Điểm số (score)
  - Nhận xét (comments)
  - Đề xuất (recommendation): ACCEPT/MINOR/MAJOR/REJECT

---

## 🔍 VẤN ĐỀ ĐÃ KHẮC PHỤC

### ❌ Vấn đề trước đây:
- Không thể xem review vì không có review nào trong hệ thống
- Tất cả bài nộp đều có status PUBLISHED (đã hoàn thành)

### ✅ Giải pháp đã áp dụng:
1. ✅ Tạo 11 tài khoản test cho tất cả các role
2. ✅ Tạo 5 bài nộp mới với status NEW và UNDER_REVIEW
3. ✅ Gán 10 review assignments (mỗi bài 2 reviewers)
4. ✅ Tạo ReviewerProfile cho các reviewer với expertise và keywords

---

## 📝 GHI CHÚ

### Quy tắc mật khẩu:
- Format: `[Role]123!@#`
- Ví dụ: `Admin123!@#`, `Reviewer123!@#`, `Author123!@#`

### Tài khoản reviewer đặc biệt:
- **reviewer@test.com** và **reviewer2@test.com** là 2 tài khoản mới được tạo
- Có đầy đủ thông tin chuyên môn (expertise, keywords)
- Đã được gán ReviewerProfile

### URL quan trọng:
- **Trang chủ:** `/`
- **Đăng nhập:** `/auth/login`
- **Dashboard chung:** `/dashboard`
- **Reviewer assignments:** `/dashboard/reviewer/assignments`
- **Thực hiện review:** `/dashboard/reviewer/review/[reviewId]`

---

## ✅ KIỂM TRA ĐÃ THỰC HIỆN

- [x] Tất cả tài khoản đã được tạo thành công
- [x] Mật khẩu đã được hash an toàn (bcrypt)
- [x] ReviewerProfile đã được tạo cho reviewers
- [x] Bài nộp test đã được tạo
- [x] Review assignments đã được tạo
- [x] Database queries hoạt động chính xác
- [x] Review assignments page hiển thị đúng dữ liệu

---

## 🚀 BƯỚC TIẾP THEO

1. **Test chức năng review:**
   - Đăng nhập với reviewer@test.com
   - Xem danh sách reviews
   - Thực hiện 1 review hoàn chỉnh

2. **Test workflow hoàn chỉnh:**
   - Author nộp bài mới
   - Editor gán reviewer
   - Reviewer phản biện
   - Editor quyết định

3. **Test các role khác:**
   - EIC: Quyết định cuối cùng
   - Managing Editor: Quản lý quy trình
   - Layout Editor: Trình bày xuất bản

---

**📅 Ngày cập nhật:** 03/11/2025  
**✅ Trạng thái:** Đã sẵn sàng để test và sử dụng
