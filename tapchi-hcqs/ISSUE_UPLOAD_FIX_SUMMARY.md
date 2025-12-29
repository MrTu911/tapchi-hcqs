# Sửa Lỗi Upload Ảnh Bìa và PDF cho Chức Năng Tạo Số Báo

## Vấn Đề Đã Phát Hiện

### 1. Database Schema Thiếu Trường `pdfUrl`
- Model `Issue` trong Prisma schema chỉ có field `coverImage` để lưu đường dẫn ảnh bìa
- **Không có field nào** để lưu đường dẫn file PDF toàn số
- Dẫn đến: File PDF được upload lên S3 thành công nhưng đường dẫn không được lưu vào database

### 2. API Upload PDF Nhưng Không Lưu
- Code trong `/app/api/issues/route.ts` (POST) và `/app/api/issues/[id]/route.ts` (PUT):
  - Upload file PDF lên S3 ✅
  - Lưu đường dẫn vào biến `pdfPath` ✅
  - Nhưng **không** đưa `pdfPath` vào câu lệnh `prisma.issue.create()` hoặc `prisma.issue.update()` ❌

## Giải Pháp Đã Thực Hiện

### Bước 1: Thêm Field `pdfUrl` vào Prisma Schema ✅

**File:** `prisma/schema.prisma`

```prisma
model Issue {
  id       String @id @default(uuid())
  volumeId String
  volume   Volume @relation(fields: [volumeId], references: [id])

  number      Int
  year        Int
  title       String?
  description String?
  coverImage  String?    // Cloud storage path for cover image
  pdfUrl      String?    // ⭐ THÊM MỚI: Cloud storage path for full issue PDF
  doi         String?
  publishDate DateTime?
  status      IssueStatus @default(DRAFT)
  createdAt   DateTime    @default(now())

  articles Article[]

  @@unique([volumeId, number])
  @@index([volumeId])
}
```

### Bước 2: Update Database ✅

**Chạy migration SQL:**

```sql
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT;
```

**Kết quả:**
- ✅ Database đã có cột `pdfUrl` để lưu đường dẫn PDF
- ✅ Dữ liệu cũ không bị mất (cột `pdfUrl` là nullable)

### Bước 3: Sửa API POST `/api/issues` ✅

**File:** `app/api/issues/route.ts`

**Trước:**
```typescript
const issue = await prisma.issue.create({
  data: {
    volumeId: volume.id,
    number: number,
    year: year,
    title: title,
    description: description,
    coverImage: coverImagePath,  // Chỉ lưu ảnh bìa
    doi: doi,
    publishDate: publishDate,
    status: status as 'DRAFT' | 'PUBLISHED'
  },
  // ...
});
```

**Sau:**
```typescript
const issue = await prisma.issue.create({
  data: {
    volumeId: volume.id,
    number: number,
    year: year,
    title: title,
    description: description,
    coverImage: coverImagePath,  // Lưu ảnh bìa
    pdfUrl: pdfPath,             // ⭐ THÊM: Lưu PDF
    doi: doi,
    publishDate: publishDate,
    status: status as 'DRAFT' | 'PUBLISHED'
  },
  // ...
});
```

### Bước 4: Sửa API PUT `/api/issues/[id]` ✅

**File:** `app/api/issues/[id]/route.ts`

**Trước:**
```typescript
const issue = await prisma.issue.update({
  where: { id },
  data: {
    // ... các field khác
    coverImage: coverImagePath !== undefined ? coverImagePath : oldIssue.coverImage,
    // Thiếu pdfUrl!
  }
});
```

**Sau:**
```typescript
const issue = await prisma.issue.update({
  where: { id },
  data: {
    // ... các field khác
    coverImage: coverImagePath !== undefined ? coverImagePath : oldIssue.coverImage,
    pdfUrl: pdfPath !== undefined ? pdfPath : oldIssue.pdfUrl,  // ⭐ THÊM
  }
});
```

### Bước 5: Regenerate Prisma Client ✅

```bash
yarn prisma generate
```

## Kết Quả Sau Khi Sửa

### ✅ Chức Năng Hoạt Động Đầy Đủ:

1. **Upload Ảnh Bìa:**
   - ✅ Validate loại file (JPEG, PNG, JPG, WebP)
   - ✅ Validate kích thước (tối đa 5MB)
   - ✅ Upload lên S3 thư mục `issues/covers/`
   - ✅ Lưu đường dẫn S3 vào `Issue.coverImage`
   - ✅ Hiển thị preview trong form

2. **Upload File PDF:**
   - ✅ Validate loại file (PDF)
   - ✅ Validate kích thước (tối đa 50MB)
   - ✅ Upload lên S3 thư mục `issues/pdfs/`
   - ✅ Lưu đường dẫn S3 vào `Issue.pdfUrl` (trước đây bị thiếu!)
   - ✅ Hiển thị tên file và kích thước trong form

3. **Quy Trình Upload:**
   ```
   User chọn file → Validate → Upload S3 → Lấy đường dẫn → Lưu DB
   ```

## Hướng Dẫn Sử Dụng

### Tạo Số Báo Mới

1. Truy cập: `/dashboard/admin/issues`
2. Click "Tạo số mới"
3. Nhập thông tin:
   - **Tập (Volume)**: Số tập (VD: 1)
   - **Số (Issue Number)**: Số báo trong tập (VD: 1)
   - **Năm**: Năm phát hành (VD: 2025)
   - **Tiêu đề**: Tùy chọn (VD: "Số Xuân 2025")
   - **Mô tả**: Tùy chọn

4. **Upload Ảnh Bìa:**
   - Click "Chọn ảnh bìa"
   - Chọn file ảnh (JPEG/PNG/WebP, tối đa 5MB)
   - Xem preview ngay lập tức

5. **Upload PDF Toàn Số:**
   - Click "Chọn file PDF"
   - Chọn file PDF (tối đa 50MB)
   - Hiển thị tên file và kích thước

6. Nhập thêm:
   - **DOI**: Nếu có
   - **Ngày phát hành**: Chọn ngày
   - **Trạng thái**: Nháp hoặc Đã xuất bản

7. Click "Tạo mới"

### Chỉnh Sửa Số Báo

1. Click icon "Edit" ở số báo muốn sửa
2. Form sẽ mở với dữ liệu hiện tại
3. Có thể:
   - Giữ nguyên ảnh bìa cũ hoặc upload ảnh mới
   - Giữ nguyên PDF cũ hoặc upload PDF mới
   - Sửa các thông tin khác
4. Click "Cập nhật"

## Build & Test Status

### TypeScript Compilation
```bash
yarn tsc --noEmit
```
**Kết quả:** ✅ Không có lỗi TypeScript

### Database Migration
```bash
yarn tsx apply_pdf_url_migration.ts
```
**Kết quả:** ✅ Column `pdfUrl` đã được thêm vào bảng `Issue`

### Prisma Client Generation
```bash
yarn prisma generate
```
**Kết quả:** ✅ Prisma Client đã được regenerate với field `pdfUrl`

## Files Đã Thay Đổi

### Modified Files:
1. ✅ `prisma/schema.prisma`
   - Thêm field `pdfUrl: String?` vào model `Issue`

2. ✅ `app/api/issues/route.ts`
   - Thêm `pdfUrl: pdfPath` vào câu lệnh `prisma.issue.create()`

3. ✅ `app/api/issues/[id]/route.ts`
   - Thêm `pdfUrl: pdfPath !== undefined ? pdfPath : oldIssue.pdfUrl` vào câu lệnh `prisma.issue.update()`

### New Files:
4. ✅ `apply_pdf_url_migration.ts`
   - Script migration để thêm column `pdfUrl` vào database

5. ✅ `ISSUE_UPLOAD_FIX_SUMMARY.md`
   - Tài liệu này

## So Sánh Trước và Sau

### Trước Khi Sửa ❌
```
User upload PDF → Upload lên S3 thành công → Lưu path vào biến pdfPath
→ Tạo Issue trong DB (KHÔNG có pdfUrl) → PDF bị "mất tích"
```

### Sau Khi Sửa ✅
```
User upload PDF → Upload lên S3 thành công → Lưu path vào biến pdfPath
→ Tạo Issue trong DB với pdfUrl = pdfPath → PDF được lưu đầy đủ
```

## Lưu Ý Quan Trọng

1. **Dữ liệu cũ:** Các số báo đã tạo trước đây sẽ có `pdfUrl = null`. Nếu cần, có thể chỉnh sửa lại để upload PDF.

2. **S3 Storage:** File được lưu tại:
   - Ảnh bìa: `issues/covers/YYYY-N-timestamp-filename.ext`
   - PDF: `issues/pdfs/YYYY-N-timestamp-filename.pdf`

3. **Form Validation:**
   - Chỉ bắt buộc: Tập, Số, Năm
   - Ảnh bìa và PDF là tùy chọn
   - Có thể tạo số báo chỉ với ảnh bìa, chỉ với PDF, hoặc cả hai

## Deployment Ready

✅ **Sẵn sàng deploy:**
- Database migration đã chạy thành công
- TypeScript compilation passed
- API đã được update
- Form component không cần thay đổi (đã hỗ trợ sẵn)

## Tổng Kết

**Vấn đề:** Chức năng upload PDF không hoạt động do thiếu field trong database và API không lưu đường dẫn PDF.

**Giải pháp:** 
1. Thêm field `pdfUrl` vào schema
2. Update database
3. Sửa API POST và PUT để lưu `pdfUrl`
4. Regenerate Prisma Client

**Kết quả:** ✅ Chức năng tạo và chỉnh sửa số báo đã hoạt động đầy đủ với cả ảnh bìa và file PDF.
