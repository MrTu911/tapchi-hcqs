# Phase 17: Category Management & Media Picker Integration

## 📋 Tổng quan

Phase 17 tập trung vào hoàn thiện hai tính năng quan trọng:
1. **Nâng cấp Category Management UI** với CRUD đầy đủ, tìm kiếm, và thống kê
2. **Tích hợp Media Picker** vào Modern Editor để quản lý ảnh tập trung

---

## ✅ Đã hoàn thành

### 1. Category Management UI Upgrade

#### API Endpoints
- **Tạo mới**: `/api/categories/[id]/route.ts`
  - `GET`: Lấy thông tin category theo ID
  - `PUT`: Cập nhật category
  - `DELETE`: Xóa category (kiểm tra usage)

#### UI Features
- **Client-side React**: Chuyển từ SSR sang CSR để tương tác tốt hơn
- **Full CRUD**: Tạo, đọc, cập nhật, xóa category
- **Statistics Cards**: Hiển thị tổng số chuyên mục, tổng bài viết, trung bình
- **Search Functionality**: Tìm kiếm theo tên, mã, hoặc slug
- **Auto-slug Generation**: Tự động tạo slug từ tên (hỗ trợ tiếng Việt)
- **Validation**: Kiểm tra duplicate code/slug
- **Delete Protection**: Không cho xóa category đang có bài viết
- **Modern Table UI**: Sử dụng Shadcn Table với responsive design

#### Dialogs
- **Create Dialog**: Form tạo category mới với validation
- **Edit Dialog**: Chỉnh sửa category hiện có
- **Delete AlertDialog**: Xác nhận xóa với warning nếu có bài viết

---

### 2. Media Picker Component

#### File mới: `components/media-picker.tsx`

**Tính năng chính**:
- **Media Grid**: Hiển thị danh sách ảnh từ Media Library
- **Search & Filter**: Tìm kiếm và lọc theo category
- **Upload Inline**: Upload ảnh mới ngay trong dialog
- **Image Preview**: Xem trước ảnh trước khi chọn
- **Pagination**: Phân trang cho nhiều ảnh
- **Responsive**: Hiển thị 3-4 columns tùy màn hình
- **Selection State**: Highlight ảnh đã chọn
- **Metadata Display**: Hiển thị tên, kích thước, dimensions

**Props Interface**:
```typescript
interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaFile) => void;
  allowUpload?: boolean;
}
```

---

### 3. Editor Integration

#### Modern Editor Updates
- **Import Media Picker**: Tích hợp component vào editor
- **State Management**: `showMediaPicker` state
- **Handler Functions**:
  - `handleOpenMediaPicker()`: Mở dialog
  - `handleMediaSelect()`: Xử lý khi chọn ảnh
- **Image Insertion**: Tự động chèn ảnh vào editor với alt text

#### Toolbar Updates (`editor-toolbar.tsx`)
- **New Prop**: `onOpenMediaPicker?: () => void`
- **Priority Logic**: Media Picker > File Input
- **Backwards Compatible**: Vẫn hỗ trợ upload trực tiếp nếu không có Media Picker

#### Slash Command Updates (`editor-slash-command.tsx`)
- **New Prop**: `onOpenMediaPicker?: () => void`
- **Image Command**: Ưu tiên mở Media Picker
- **Fallback**: File input nếu không có Media Picker

---

## 🛠️ Chi tiết kỹ thuật

### Category Management

**API Validation**:
```typescript
// Check duplicate
const duplicateCategory = await prisma.category.findFirst({
  where: {
    AND: [
      { id: { not: id } },
      { OR: [{ code }, { slug }] }
    ]
  }
});

// Check usage before delete
if (category._count.submissions > 0) {
  return errorResponse('Cannot delete: category has articles');
}
```

**Auto-slug Generation**:
```typescript
const slug = value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
```

### Media Picker Integration

**Image Insertion Flow**:
```typescript
const handleMediaSelect = (media: MediaFile) => {
  const imageUrl = getImageUrl(media.cloudStoragePath);
  editor
    .chain()
    .focus()
    .setImage({ 
      src: imageUrl,
      alt: media.altText || media.title || media.fileName,
    })
    .run();
};
```

**Priority Strategy**:
1. Check if `onOpenMediaPicker` is provided
2. If yes: Open Media Picker dialog
3. If no: Fallback to file input upload

---

## 🐛 Bug Fixes

### Route Conflict
**Problem**: Next.js không cho phép `/api/categories/[id]` và `/api/categories/[slug]` cùng tồn tại.

**Solution**: 
```bash
# Di chuyển [slug] route
mv app/api/categories/[slug] app/api/categories/by-slug/[slug]
```

### TypeScript Errors
**Problem**: `selectedCategory._count` possibly undefined

**Solution**:
```typescript
// Before
{selectedCategory?._count?.submissions! > 0 && ...}

// After
{selectedCategory && selectedCategory._count && 
 selectedCategory._count.submissions > 0 && ...}
```

---

## 📁 Files Created/Modified

### Created
1. `/app/api/categories/[id]/route.ts` - Category CRUD API
2. `/components/media-picker.tsx` - Media Library picker dialog
3. `/home/ubuntu/tapchi-hcqs/PHASE_17_CATEGORY_MEDIA_INTEGRATION_SUMMARY.md` - Tài liệu này

### Modified
1. `/app/dashboard/admin/categories/page.tsx` - Nâng cấp UI từ SSR sang CSR
2. `/components/modern-editor.tsx` - Tích hợp Media Picker
3. `/components/editor-toolbar.tsx` - Thêm Media Picker support
4. `/components/editor-slash-command.tsx` - Thêm Media Picker support
5. `/app/api/categories/[slug]/` → `/app/api/categories/by-slug/[slug]/` - Resolve route conflict

---

## 🎨 UI/UX Improvements

### Category Management
- **Gradient Header**: Emerald to teal gradient cho title
- **Statistics Dashboard**: 3 cards hiển thị metrics quan trọng
- **Search Box**: Icon search với placeholder rõ ràng
- **Modern Table**: Hover effects, responsive columns
- **Badge Components**: Visual indicators cho code và count
- **Empty States**: Friendly messages với CTAs

### Media Picker
- **Grid Layout**: 3-4 columns responsive
- **Image Cards**: Hover scale effect
- **Selection Highlight**: Primary color ring
- **Metadata Overlay**: Gradient overlay với info
- **Upload Section**: Inline upload với category selection
- **Filter Bar**: Search + category filter + refresh button

---

## 🔐 Security & Validation

### Category Management
- **Role-based Access**: SYSADMIN, EIC, MANAGING_EDITOR only
- **Delete Protection**: Cannot delete categories with articles
- **Duplicate Prevention**: Check code and slug uniqueness
- **Audit Logging**: Log all create/update/delete operations

### Media Picker
- **File Type Validation**: Images only
- **Size Limits**: 10MB max
- **Authentication Required**: Must be logged in
- **S3 Integration**: Secure cloud storage

---

## 📊 Statistics

### Build Results
- ✅ TypeScript compilation: **Success**
- ✅ Next.js build: **Success**
- 📦 Total routes: **100+**
- 📦 Category Management: **6.84 kB**
- 📦 Media Picker in Modern Editor: Included in editor bundle

### Performance
- **Category List**: Fast client-side search/filter
- **Media Picker**: Pagination với lazy loading
- **Image Proxy**: S3 signed URLs với 24h cache

---

## 🚀 Usage Guide

### Category Management

**Tạo category mới**:
1. Vào `/dashboard/admin/categories`
2. Click "Thêm chuyên mục"
3. Điền mã (VD: CSI), tên (VD: Khoa học thông tin)
4. Slug tự động generate, có thể chỉnh sửa
5. Click "Tạo chuyên mục"

**Chỉnh sửa category**:
1. Click icon Edit ở category muốn sửa
2. Cập nhật thông tin
3. Click "Cập nhật"

**Xóa category**:
1. Click icon Trash
2. Nếu category có bài viết → Không thể xóa
3. Nếu category rỗng → Confirm xóa

### Media Picker trong Editor

**Chèn ảnh từ thư viện**:
1. Trong Modern Editor, click icon Image ở toolbar
2. Hoặc gõ `/` và chọn "Thêm ảnh"
3. Media Picker dialog mở ra
4. Tìm kiếm/lọc ảnh nếu cần
5. Click vào ảnh muốn chọn
6. Click "Chọn ảnh này"
7. Ảnh tự động chèn vào editor

**Upload ảnh mới**:
1. Trong Media Picker dialog
2. Chọn file từ máy tính
3. Chọn category (Banner, News, Article, etc.)
4. Nhập alt text (optional)
5. Click "Upload"
6. Ảnh tự động được chọn sau khi upload

---

## 🎯 Benefits

### For Administrators
- ✅ Quản lý category dễ dàng không cần code
- ✅ Tìm kiếm và thống kê trực quan
- ✅ Bảo vệ chống xóa nhầm

### For Content Editors
- ✅ Chọn ảnh từ thư viện tập trung
- ✅ Không cần upload lại ảnh đã có
- ✅ Preview trước khi chọn
- ✅ Upload inline nếu ảnh chưa có

### For System
- ✅ Centralized media management
- ✅ Reusable images
- ✅ Reduced storage duplication
- ✅ Better organization

---

## 🔄 Migration Notes

### Route Changes
Nếu có code gọi trực tiếp đến `/api/categories/[slug]`, cần update thành:
```typescript
// Before
fetch(`/api/categories/${slug}`)

// After
fetch(`/api/categories/by-slug/${slug}`)
```

### Editor Integration
Các page sử dụng Modern Editor tự động có Media Picker:
- ✅ `/dashboard/admin/news/create`
- ✅ `/dashboard/admin/news/[id]`
- ✅ Các page khác dùng `<ModernEditor />`

---

## 📝 Next Steps (Đề xuất)

### Phase 18: Enhanced Features
1. **Drag & Drop trong Media Picker**
2. **Bulk Upload**: Upload nhiều ảnh cùng lúc
3. **Image Editing**: Crop, resize trong browser
4. **Category Icon Management**: Upload icon cho category
5. **Media Analytics**: Track usage của từng ảnh

### Phase 19: Advanced Search
1. **Global Media Search**: Tìm kiếm ảnh toàn hệ thống
2. **Smart Tags**: AI tagging cho ảnh
3. **Related Images**: Gợi ý ảnh liên quan

---

## ✨ Conclusion

Phase 17 đã hoàn thành thành công việc nâng cấp Category Management UI và tích hợp Media Picker vào Modern Editor. Hai tính năng này cải thiện đáng kể trải nghiệm quản trị nội dung, giúp admin và editor làm việc hiệu quả hơn.

**Key Achievements**:
- ✅ Modern, intuitive Category Management UI
- ✅ Centralized Media Library với picker dialog
- ✅ Seamless integration với Modern Editor
- ✅ Production-ready code với full validation
- ✅ Comprehensive documentation

**Build Status**: ✅ **SUCCESS**  
**Deployment**: Ready for production

---

Generated: December 7, 2025  
Phase: 17 - Category & Media Integration  
Status: Completed ✅
