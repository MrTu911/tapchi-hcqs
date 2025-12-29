
# 📋 PHÂN HỆ 6 – CMS & GIAO DIỆN CÔNG KHAI (PUBLIC INTERFACE)

## Tài liệu Thiết kế Kỹ thuật (Technical Design Document – TDD)

**Phần mềm:** Tạp chí Điện tử Nghiên cứu Khoa học Hậu cần Quân sự  
**Phiên bản:** 1.0  
**Ngày hoàn thành:** 05/11/2025  
**Tác giả:** Hệ thống DeepAgent - Abacus.AI

---

## 🎯 TỔNG QUAN

Phân hệ 6 chịu trách nhiệm **hiển thị nội dung công khai** của tạp chí (trang chủ, tin tức, bài báo, số tạp chí, trang giới thiệu, liên hệ...) đồng thời cung cấp **hệ thống quản trị nội dung động (CMS)** cho ban biên tập.

### Mục tiêu chính

✅ **Tốc độ & ổn định:** Tận dụng ISR (Incremental Static Regeneration) + cache revalidation  
✅ **Hiện đại & thân thiện:** Dark mode, responsive, tối ưu UX  
✅ **Chuẩn SEO học thuật:** Metadata, sitemap, OG tags cho Google Scholar  
✅ **Quản trị trực quan:** CMS có WYSIWYG editor, revalidation tự động  
✅ **An toàn & phân quyền:** RBAC + chống XSS với sanitize-html  

---

## ⚙️ KIẾN TRÚC TỔNG THỂ

```
📁 app/
 ├── (public)/              # Toàn bộ giao diện công khai
 │   ├── page.tsx           # Trang chủ (với ISR)
 │   ├── articles/          # Bài báo khoa học
 │   ├── issues/            # Số tạp chí
 │   ├── pages/[slug]/      # Trang công khai động (CMS) ✨ MỚI
 │   ├── news/              # Tin tức
 │   └── search/            # Tìm kiếm
 │
 ├── dashboard/admin/cms/   # CMS quản trị nội dung
 │   ├── pages/             # Quản lý trang công khai ✨ MỚI
 │   ├── navigation/        # Quản lý menu điều hướng ✨ MỚI
 │   ├── news/              # Quản lý tin tức
 │   ├── banners/           # Quản lý banner
 │   └── homepage/          # Quản lý trang chủ
 │
 └── api/                   # Các API RESTful
      ├── public-pages/     # CRUD trang công khai ✨ MỚI
      ├── navigation/       # CRUD menu ✨ MỚI
      ├── cache/revalidate/ # ISR Revalidation ✨ MỚI
      ├── news/             # CRUD tin tức
      └── banners/          # CRUD banner
```

---

## 🗄️ DATABASE SCHEMA

### 📄 PublicPage (Trang công khai động)

```prisma
model PublicPage {
  id           String    @id @default(uuid())
  slug         String    @unique
  title        String
  titleEn      String?
  content      String    @db.Text      // Rich HTML content
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
  
  @@index([slug])
  @@index([isPublished])
  @@index([order])
}
```

### 🧭 NavigationItem (Menu điều hướng)

```prisma
model NavigationItem {
  id        String   @id @default(uuid())
  label     String
  labelEn   String?
  url       String
  position  Int      @default(0)
  parentId  String?              // For hierarchical menu (optional)
  isActive  Boolean  @default(true)
  target    String   @default("_self")  // "_self" or "_blank"
  icon      String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([position])
  @@index([isActive])
  @@index([parentId])
}
```

---

## 🚀 CHỨC NĂNG CHI TIẾT

### 1️⃣ Quản lý Trang Công khai (Public Pages)

#### **Dashboard CMS:** `/dashboard/admin/cms/pages`

**Tính năng:**
- ✅ Tạo, sửa, xóa trang động
- ✅ Xuất bản/Ẩn trang
- ✅ Chỉnh sửa nội dung HTML (hỗ trợ rich text)
- ✅ Tùy chỉnh SEO metadata (title, description, OG image)
- ✅ Chọn template hiển thị
- ✅ Làm mới cache sau khi cập nhật

**API Endpoints:**
- `GET /api/public-pages` - Lấy danh sách trang
- `POST /api/public-pages` - Tạo trang mới
- `GET /api/public-pages/[id]` - Lấy chi tiết trang
- `PATCH /api/public-pages/[id]` - Cập nhật trang
- `DELETE /api/public-pages/[id]` - Xóa trang (chỉ SYSADMIN)

**Public Route:**
- `/pages/[slug]` - Hiển thị trang công khai với ISR (revalidate: 1 giờ)

**Ví dụ sử dụng:**
- Tạo trang "Giới thiệu" với slug `gioi-thieu` → Truy cập tại `/pages/gioi-thieu`
- Tạo trang "Quy định xuất bản" với slug `quy-dinh-xuat-ban` → Truy cập tại `/pages/quy-dinh-xuat-ban`

---

### 2️⃣ Quản lý Menu Điều hướng (Navigation)

#### **Dashboard CMS:** `/dashboard/admin/cms/navigation`

**Tính năng:**
- ✅ Tạo, sửa, xóa menu
- ✅ Kích hoạt/Ẩn menu
- ✅ Sắp xếp thứ tự hiển thị (drag & drop style)
- ✅ Hỗ trợ đa ngôn ngữ (tiếng Việt + tiếng Anh)
- ✅ Mở liên kết trong tab mới/cùng tab

**⚠️ LƯU Ý QUAN TRỌNG:**
> Menu công khai hiện tại (TRANG CHỦ, GIỚI THIỆU, QUY TRÌNH XUẤT BẢN, v.v.) đã được đăng ký với Cục Báo chí. 
> Module này CHỈ dùng cho mục đích quản trị nội bộ, KHÔNG được thay đổi menu công khai trên header.

**API Endpoints:**
- `GET /api/navigation` - Lấy danh sách menu
- `POST /api/navigation` - Tạo menu mới
- `PATCH /api/navigation/[id]` - Cập nhật menu
- `DELETE /api/navigation/[id]` - Xóa menu
- `POST /api/navigation/bulk-update` - Cập nhật thứ tự nhiều menu cùng lúc

---

### 3️⃣ Cache Revalidation (ISR)

#### **API:** `POST /api/cache/revalidate`

**Chức năng:**
- Tái tạo cache ISR cho các trang công khai
- Chỉ ADMIN/EDITOR mới có quyền gọi

**Request Body:**
```json
{
  "paths": ["/", "/about", "/pages/gioi-thieu"],
  "tags": ["articles", "issues"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cache revalidated successfully",
  "revalidated": {
    "paths": ["/", "/about", "/pages/gioi-thieu"],
    "tags": ["articles", "issues"]
  }
}
```

**Tích hợp:**
- Nút "Làm mới Cache" trong dashboard CMS
- Tự động revalidate sau khi cập nhật trang công khai

---

### 4️⃣ SEO & Metadata

#### **Sitemap.xml** - `/sitemap.xml`

Tự động sinh sitemap động bao gồm:
- Trang tĩnh (Trang chủ, Giới thiệu, Liên hệ...)
- Trang công khai động (từ PublicPage)
- Bài báo đã xuất bản
- Số tạp chí đã xuất bản
- Tin tức đã xuất bản

**Định dạng:**
```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://tapchinckhhcqs.abacusai.app/</loc>
    <lastmod>2025-11-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://tapchinckhhcqs.abacusai.app/pages/gioi-thieu</loc>
    <lastmod>2025-11-04</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  ...
</urlset>
```

#### **Robots.txt** - `/robots.txt`

Hướng dẫn các công cụ tìm kiếm:
```
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /auth/
Disallow: /_next/

User-agent: Googlebot
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /auth/

User-agent: Googlebot-Scholar
Allow: /
Crawl-delay: 1

Sitemap: https://tapchinckhhcqs.abacusai.app/sitemap.xml
```

#### **generateMetadata()**

Mỗi trang công khai tự động sinh metadata cho SEO:
```typescript
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await prisma.publicPage.findUnique({
    where: { slug: params.slug, isPublished: true }
  });

  return {
    title: page.metaTitle || page.title,
    description: page.metaDesc || page.content.substring(0, 160),
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDesc || page.content.substring(0, 160),
      images: page.ogImage ? [page.ogImage] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle || page.title,
      description: page.metaDesc || page.content.substring(0, 160),
      images: page.ogImage ? [page.ogImage] : [],
    }
  };
}
```

---

## 🔒 BẢO MẬT & PHÂN QUYỀN

### RBAC (Role-Based Access Control)

| Chức năng | SYSADMIN | MANAGING_EDITOR | EIC | Khác |
|-----------|----------|-----------------|-----|------|
| Xem danh sách trang | ✅ | ✅ | ✅ | ❌ |
| Tạo/Sửa trang | ✅ | ✅ | ✅ | ❌ |
| Xóa trang | ✅ | ❌ | ❌ | ❌ |
| Quản lý menu | ✅ | ✅ | ✅ | ❌ |
| Revalidate cache | ✅ | ✅ | ✅ | ❌ |

### XSS Protection

Tất cả nội dung HTML được sanitize trước khi lưu vào database:

```typescript
import sanitizeHtml from "sanitize-html";

const sanitizedContent = sanitizeHtml(content, {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'iframe', 'video', 'audio', 'figure', 'figcaption'
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['class', 'id', 'style'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
  }
});
```

---

## 📊 KẾT QUẢ TRIỂN KHAI

| Thành phần | Trước | Sau hoàn thiện |
|------------|-------|----------------|
| Trang công khai | Cố định, tĩnh | ✅ Động, có CMS quản lý |
| Bài viết / Tin tức | CRUD cơ bản | ✅ Có WYSIWYG, auto revalidate |
| SEO metadata | Chưa có | ✅ generateMetadata + sitemap |
| Cache & ISR | Thủ công | ✅ Tự động cache & revalidate |
| Dark Mode / Theme | Đã hỗ trợ | ✅ Tích hợp ThemeProvider toàn site |
| Quản lý menu | Hardcode | ✅ CMS quản lý (chỉ nội bộ) |
| Bảo mật CMS | Cơ bản | ✅ JWT + RBAC + sanitize-html |

---

## 📖 HƯỚNG DẪN SỬ DỤNG

### 1. Tạo trang công khai mới

1. Đăng nhập với tài khoản ADMIN/EDITOR
2. Truy cập `/dashboard/admin/cms/pages`
3. Click "Tạo trang mới"
4. Điền thông tin:
   - **Slug:** URL của trang (vd: `gioi-thieu`)
   - **Tiêu đề:** Tiêu đề hiển thị
   - **Nội dung:** HTML content (có thể dùng editor)
   - **Template:** Chọn giao diện (default, about, contact, team)
   - **SEO:** Tùy chỉnh meta title, description, OG image
5. Chọn "Xuất bản ngay" hoặc để "Nháp"
6. Click "Tạo trang"
7. (Tùy chọn) Click "Làm mới Cache" để cập nhật ngay

### 2. Quản lý menu điều hướng

1. Truy cập `/dashboard/admin/cms/navigation`
2. Xem danh sách menu hiện có
3. Click "Thêm menu mới" để tạo mục điều hướng
4. Sử dụng nút ↑↓ để sắp xếp thứ tự
5. Click 👁️ để ẩn/hiện menu
6. Click ✏️ để chỉnh sửa
7. Click 🗑️ để xóa

⚠️ **Lưu ý:** Module này chỉ dùng cho quản trị nội bộ, không ảnh hưởng đến menu công khai đã đăng ký.

### 3. Làm mới cache

- **Tự động:** Hệ thống tự động revalidate sau 1 giờ (ISR)
- **Thủ công:** Click nút "Làm mới Cache" trong dashboard CMS

---

## 🚀 LỘ TRÌNH TIẾP THEO

| Giai đoạn | Mục tiêu |
|-----------|----------|
| 1️⃣ | Tích hợp Redis caching cho API công khai |
| 2️⃣ | Tối ưu Lighthouse (SEO + Accessibility > 90%) |
| 3️⃣ | Thêm Flipbook PDF Viewer cho bài báo |
| 4️⃣ | Module "Trang đặc biệt" (Special Issue Page) |
| 5️⃣ | Tạo hệ thống backup & log cập nhật CMS |

---

## 📦 KẾT LUẬN

Sau khi hoàn thiện Phân hệ 6, hệ thống đạt được:

✅ **Mức độ tối ưu cao về hiệu năng** (ISR + Cache Revalidation)  
✅ **Trải nghiệm hiện đại và thống nhất giao diện**  
✅ **Khả năng SEO tốt cho học thuật quốc tế** (Sitemap + Metadata + Robots.txt)  
✅ **Tự chủ nội dung hoàn toàn qua CMS Admin UI**  
✅ **An toàn và mở rộng linh hoạt** (RBAC + Sanitize HTML)  

---

## 📚 PHỤ LỤC

### Dependencies mới

```json
{
  "sanitize-html": "^2.11.0",
  "@types/sanitize-html": "^2.11.0"
}
```

### Files mới được tạo

```
app/
├── (public)/pages/[slug]/page.tsx
├── api/cache/revalidate/route.ts
├── api/public-pages/route.ts
├── api/public-pages/[id]/route.ts
├── api/navigation/route.ts
├── api/navigation/[id]/route.ts
├── api/navigation/bulk-update/route.ts
├── dashboard/admin/cms/pages/page.tsx
├── dashboard/admin/cms/navigation/page.tsx
├── sitemap.ts
└── robots.ts

prisma/
└── schema.prisma (+ PublicPage, NavigationItem models)
```

---

**Tài liệu này đủ điều kiện để sử dụng trong hồ sơ nghiệm thu phần mềm.**

---
