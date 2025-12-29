
# Phase 15: Public Pages CMS - Quản lý các trang tĩnh

## 📋 Tổng quan

Phase 15 triển khai hệ thống CMS để quản lý các trang tĩnh (About, Contact, License, Publishing Process) cho phép admin và editor chỉnh sửa nội dung mà không cần động vào code.

## ✅ Đã hoàn thành

### 1. Cơ sở hạ tầng CMS
- ✅ Model `PublicPage` trong Prisma (đã có sẵn)
- ✅ API routes hoàn chỉnh (`/api/public-pages`)
- ✅ Admin UI quản lý trang (`/dashboard/admin/cms/pages`)
- ✅ Dynamic route handler (`/pages/[slug]`)

### 2. Seed dữ liệu mẫu
Tạo file `seed_public_pages.ts` với 4 trang mặc định:
- **About** (`/pages/about`): Giới thiệu về tạp chí
- **Contact** (`/pages/contact`): Thông tin liên hệ
- **License** (`/pages/license`): Giấy phép và quy định pháp lý
- **Publishing Process** (`/pages/publishing-process`): Quy trình xuất bản

Chạy seed:
```bash
cd /home/ubuntu/tapchi-hcqs/nextjs_space
npx tsx seed_public_pages.ts
```

### 3. Chuyển đổi trang tĩnh sang CMS
Cập nhật 4 trang tĩnh để redirect sang dynamic routes:
- `app/(public)/about/page.tsx` → redirect to `/pages/about`
- `app/(public)/contact/page.tsx` → redirect to `/pages/contact`
- `app/(public)/license/page.tsx` → redirect to `/pages/license`
- `app/(public)/publishing-process/page.tsx` → redirect to `/pages/publishing-process`

### 4. Sidebar menu
Đã có menu "Trang công khai" trong sidebar:
- Đường dẫn: `/dashboard/admin/cms/pages`
- Quyền truy cập: SYSADMIN, MANAGING_EDITOR, EIC

## 🗂️ Cấu trúc Model PublicPage

```prisma
model PublicPage {
  id           String    @id @default(uuid())
  slug         String    @unique
  title        String
  titleEn      String?
  content      String    @db.Text // Rich HTML content
  contentEn    String?   @db.Text
  metaTitle    String?
  metaTitleEn  String?
  metaDesc     String?   @db.Text
  metaDescEn   String?   @db.Text
  ogImage      String?
  
  isPublished  Boolean   @default(false)
  publishedAt  DateTime?
  
  template     String    @default("default")
  order        Int       @default(0)
  
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

## 🎯 Tính năng chính

### 1. Quản lý trang trong Admin Dashboard
**Đường dẫn:** `/dashboard/admin/cms/pages`

**Chức năng:**
- Xem danh sách tất cả các trang
- Tạo trang mới với Rich Text Editor
- Chỉnh sửa nội dung trang
- Xóa trang (chỉ SYSADMIN)
- Bật/tắt xuất bản trang
- SEO metadata (meta title, meta description, OG image)
- Hỗ trợ đa ngôn ngữ (Vietnamese & English)

### 2. API Routes

#### GET /api/public-pages
Lấy danh sách trang với filter:
```javascript
// Query params
?isPublished=true  // Lọc theo trạng thái xuất bản
?slug=about        // Lấy trang theo slug
```

#### POST /api/public-pages
Tạo trang mới (cần ADMIN role):
```javascript
{
  "slug": "new-page",
  "title": "Tiêu đề trang",
  "titleEn": "Page Title",
  "content": "<p>Nội dung HTML...</p>",
  "contentEn": "<p>English content...</p>",
  "metaTitle": "SEO Title",
  "metaDesc": "SEO Description",
  "ogImage": "https://i.ytimg.com/vi/PU2RoBaelDc/maxresdefault.jpg",
  "isPublished": true,
  "template": "default",
  "order": 1
}
```

#### GET /api/public-pages/[id]
Lấy chi tiết một trang

#### PATCH /api/public-pages/[id]
Cập nhật trang (cần ADMIN role)

#### DELETE /api/public-pages/[id]
Xóa trang (chỉ SYSADMIN)

### 3. Dynamic Page Display
**Đường dẫn:** `/pages/[slug]`

Trang động tự động:
- Fetch dữ liệu từ database
- Render HTML content với `dangerouslySetInnerHTML`
- SEO optimization (meta tags, OpenGraph)
- 404 nếu trang không tồn tại hoặc chưa publish

## 🔄 Quy trình sử dụng

### Cho Admin/Editor:

1. **Đăng nhập** với tài khoản SYSADMIN/MANAGING_EDITOR/EIC
2. **Truy cập CMS Pages:** Dashboard → CMS → Trang công khai
3. **Tạo/chỉnh sửa trang:**
   - Click "Tạo trang mới"
   - Nhập slug (URL-friendly, VD: "quy-dinh-su-dung")
   - Nhập tiêu đề (Vietnamese & English)
   - Soạn nội dung với Rich Text Editor
   - Thêm SEO metadata
   - Bật "Xuất bản" khi sẵn sàng
   - Lưu lại
4. **Xem trang:** Truy cập `/pages/[slug]` để xem kết quả

### Cho người dùng:

1. **Truy cập trang tĩnh:**
   - `/about` hoặc `/pages/about` - Giới thiệu
   - `/contact` hoặc `/pages/contact` - Liên hệ
   - `/license` hoặc `/pages/license` - Giấy phép
   - `/publishing-process` hoặc `/pages/publishing-process` - Quy trình xuất bản
2. **Tất cả các trang đều hiển thị nội dung từ CMS**

## 📁 Files đã tạo/chỉnh sửa

### Tạo mới:
1. `/home/ubuntu/tapchi-hcqs/nextjs_space/seed_public_pages.ts`
   - Script seed dữ liệu cho 4 trang mặc định

### Chỉnh sửa:
2. `/home/ubuntu/tapchi-hcqs/nextjs_space/app/(public)/about/page.tsx`
   - Redirect to `/pages/about`

3. `/home/ubuntu/tapchi-hcqs/nextjs_space/app/(public)/contact/page.tsx`
   - Redirect to `/pages/contact`

4. `/home/ubuntu/tapchi-hcqs/nextjs_space/app/(public)/license/page.tsx`
   - Redirect to `/pages/license`

5. `/home/ubuntu/tapchi-hcqs/nextjs_space/app/(public)/publishing-process/page.tsx`
   - Redirect to `/pages/publishing-process`

### Đã có sẵn (không cần chỉnh sửa):
- `prisma/schema.prisma` - Model PublicPage
- `app/api/public-pages/route.ts` - API routes
- `app/api/public-pages/[id]/route.ts` - API routes by ID
- `app/dashboard/admin/cms/pages/page.tsx` - Admin UI
- `app/(public)/pages/[slug]/page.tsx` - Dynamic page component
- `components/dashboard/sidebar.tsx` - Menu "Trang công khai"

## 🎨 Templates hỗ trợ

Model `PublicPage` có trường `template` để hỗ trợ nhiều loại trang:
- `default`: Trang thông thường với content dạng prose
- `about`: Trang giới thiệu (có thể tùy chỉnh layout riêng)
- `contact`: Trang liên hệ (có thể thêm form liên hệ)
- `team`: Trang giới thiệu đội ngũ (future enhancement)

Hiện tại tất cả đều dùng template `default`, có thể mở rộng sau.

## 🔒 Phân quyền

- **SYSADMIN**: Full access (tạo, sửa, xóa, publish)
- **MANAGING_EDITOR**: Tạo, sửa, publish (không xóa)
- **EIC**: Tạo, sửa, publish (không xóa)
- **Người dùng khác**: Chỉ xem trang đã publish

## 📊 Kết quả Test

```bash
✅ TypeScript compilation: PASSED
✅ Next.js build: SUCCESS (exit_code=0)
✅ Dev server: STARTED
✅ Homepage: 200 OK
✅ Public pages generated: about, contact, license, publishing-process
✅ Static export: SUCCESS

⚠️ Authentication warnings (existing issues, không liên quan đến CMS):
- Signup validation errors
- Login internal server error
```

## 🚀 Deploy

Để deploy Phase 15:

```bash
cd /home/ubuntu/tapchi-hcqs/nextjs_space

# 1. Seed public pages (nếu chưa)
npx tsx seed_public_pages.ts

# 2. Test
yarn build

# 3. Deploy
yarn start
```

## 📝 Hướng dẫn thêm trang mới

### Cách 1: Qua Admin UI (Khuyến nghị)
1. Đăng nhập admin
2. Vào "CMS → Trang công khai"
3. Click "Tạo trang mới"
4. Điền thông tin và lưu

### Cách 2: Qua code (cho developer)
1. Thêm vào `seed_public_pages.ts`:
```typescript
const newPage = await prisma.publicPage.create({
  data: {
    slug: 'new-page-slug',
    title: 'Tiêu đề trang',
    content: '<p>Nội dung...</p>',
    isPublished: true,
    publishedAt: new Date(),
    template: 'default',
    order: 5
  }
});
```

2. Chạy seed: `npx tsx seed_public_pages.ts`

## 🎉 Kết luận

**Phase 15 - Public Pages CMS đã hoàn thành thành công!**

Hệ thống cho phép admin và editor:
- ✅ Quản lý nội dung các trang tĩnh mà không cần code
- ✅ Sử dụng Rich Text Editor để soạn nội dung
- ✅ SEO optimization cho từng trang
- ✅ Hỗ trợ đa ngôn ngữ (VN/EN)
- ✅ Preview và publish/unpublish dễ dàng

**Tổng số files:**
- 1 file mới: `seed_public_pages.ts`
- 4 files chỉnh sửa: about, contact, license, publishing-process pages
- Sử dụng 4 files có sẵn: API routes, Admin UI, Dynamic page, Sidebar

---

**Ngày hoàn thành:** 13 Tháng 11, 2025  
**Trạng thái:** ✅ HOÀN THÀNH  
**Build status:** ✅ SUCCESS  
**Phase tiếp theo:** Testing & Deployment
