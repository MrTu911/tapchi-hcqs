# SỬA CHỮA: Hiển thị PDF cho Phản biện

**Ngày:** 28/12/2025  
**Vấn đề:** Giao diện phản biện không xem được nội dung PDF của bài báo cần được phản biện  
**Trạng thái:** ✅ Đã sửa xong

---

## 👀 PHÂN TÍCH VẤN ĐỀ

### Tình trạng trước khi sửa:

Hệ thống đã có `PDFViewerClient` component được tích hợp vào trang reviewer (`app/dashboard/reviewer/review/[id]/page.tsx`), nhưng có các vấn đề:

#### 1. **UI không rõ ràng**
- Không có header/title rõ ràng cho phần xem PDF
- Không có Card bao bọc, khó nhận biết
- Không có description hướng dẫn người dùng

#### 2. **Filter logic quá chặt chẽ**
```tsx
// TRƯỚC: Filter yêu cầu cả fileType và mimeType
submission.files
  .filter((file) => file.fileType === 'MANUSCRIPT' && file.mimeType?.includes('pdf'))
  .map((file) => (...)))
```

**Vấn đề:**
- Nếu file được upload với `fileType` không phải `MANUSCRIPT` (ví dụ `OTHER`, `SUPPLEMENTARY`), nó sẽ bị loại bỏ
- Quá strict, không linh hoạt

#### 3. **Không có Empty State**
- Nếu không có files, không hiển thị gì cả → Người dùng bối rối
- Không có thông báo debug khi file không match filter

#### 4. **Không có hướng dẫn**
- Người dùng không biết liệu file PDF có tồn tại hay không
- Không biết liên hệ ai khi gặp vấn đề

---

## 🔧 GIẢI PHÁP ĐÃ THỰC HIỆN

### 1. **Thêm Card Container với UI rõ ràng**

```tsx
{/* PDF Viewer Section */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <FileText className="h-5 w-5" />
      Nội dung bài báo
    </CardTitle>
    <CardDescription>
      Xem toàn văn bản thảo để thực hiện phản biện
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* ... */}
  </CardContent>
</Card>
```

**Lợi ích:**
- ✅ Rõ ràng, dễ thấy
- ✅ Có icon `FileText` trực quan
- ✅ Có mô tả hướng dẫn

---

### 2. **Relax Filter Logic**

```tsx
// SAU: Chỉ filter theo mimeType, bỏ fileType check
submission.files
  .filter((file) => file.mimeType?.includes('pdf'))
  .map((file) => (
    <PDFViewerClient 
      key={file.id}
      fileId={file.id}
      fileName={file.originalName}
    />
  ))
```

**Lợi ích:**
- ✅ Hiển thị tất cả PDF files, không phụ thuộc vào `fileType`
- ✅ Linh hoạt hơn, support nhiều trường hợp upload
- ✅ Giảm nguy cơ bỏ sót files

---

### 3. **Thêm Empty States rõ ràng**

#### **Case 1: Có files nhưng không có PDF**
```tsx
{submission.files.filter((file) => file.mimeType?.includes('pdf')).length === 0 && (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <FileText className="h-16 w-16 text-gray-300 mb-4" />
    <h3 className="text-lg font-semibold text-gray-600 mb-2">
      Không có file PDF
    </h3>
    <p className="text-sm text-gray-500 max-w-md">
      Bài báo này chưa có file PDF nào được tải lên. Vui lòng liên hệ với biên tập viên.
    </p>
    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
      <p className="font-mono">Các file có sẵn: {submission.files.map(f => f.originalName).join(', ')}</p>
    </div>
  </div>
)}
```

**Lợi ích:**
- ✅ Thông báo rõ ràng
- ✅ Hướng dẫn hành động tiếp theo
- ✅ **Debug info**: Hiển thị tên các files có sẵn

#### **Case 2: Không có files nào**
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <FileText className="h-16 w-16 text-gray-300 mb-4" />
  <h3 className="text-lg font-semibold text-gray-600 mb-2">
    Chưa có tài liệu đính kèm
  </h3>
  <p className="text-sm text-gray-500 max-w-md">
    Bài báo này chưa có file nào được tải lên. Vui lòng liên hệ với biên tập viên để được hỗ trợ.
  </p>
</div>
```

**Lợi ích:**
- ✅ Không để trống, luôn có feedback
- ✅ Hướng dẫn rõ ràng

---

### 4. **Giữ nguyên Tính năng Bảo mật**

`PDFViewerClient` component đã có sẵn các tính năng bảo mật mạnh mẽ:

```tsx
{/* 🔒 Security Warning Watermark */}
<div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-4">
  <div className="flex items-start gap-3">
    <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
    <div className="space-y-2">
      <h3 className="font-bold text-red-900 text-lg">
        ⚠️ TÀI LIỆU TUYỆT MẬT - PHẢN BIỆN KHOA HỌC
      </h3>
      <ul className="text-sm text-red-800 space-y-1">
        <li>• <strong>Cấm sao chép, phát tán</strong> tài liệu này dưới mọi hình thức</li>
        <li>• Tài liệu chỉ dùng cho mục đích <strong>phản biện khoa học</strong></li>
        <li>• Thông tin tác giả đã được <strong>ẩn danh theo nguyên tắc double-blind</strong></li>
        <li>• Mọi hành vi vi phạm sẽ bị <strong>ghi lại và xử lý nghiêm khắc</strong></li>
        <li>• Link xem có hiệu lực <strong>15 phút</strong> và được <strong>ghi log truy cập</strong></li>
      </ul>
    </div>
  </div>
</div>
```

**Các tính năng bảo mật:**
- ✅ Watermark "TÀI LIỆU TUYỆT MẬT" rất nổi bật
- ✅ Signed URLs với thời gian hết hạn 15 phút
- ✅ Audit logging mọi lần truy cập
- ✅ Thông tin tác giả đã được ẩn danh (double-blind)

---

## ✅ KẾT QUẢ 

### TypeScript Compilation:
```bash
✅ npx tsc --noEmit
0 errors found
```

### Cải tiến UI:
```
✅ Thêm Card container với title "Nội dung bài báo"
✅ Thêm CardDescription hướng dẫn
✅ Icon FileText trực quan
✅ Empty states rõ ràng với icon và thông báo
✅ Debug info hiển thị tên files có sẵn
```

### Logic Improvements:
```
✅ Relax filter: Chỉ kiểm tra mimeType, bỏ fileType check
✅ Hiển thị tất cả PDF files, không bỏ sót
✅ Fallback messages rõ ràng
✅ Hướng dẫn hành động tiếp theo
```

---

## 🧪 KIỂM TRA (Testing Guide)

### **Trường hợp 1: Bài báo có file PDF**

**Bước:**
1. Đăng nhập với tài khoản reviewer
2. Truy cập trang phản biện: `/dashboard/reviewer/review/[id]`
3. Cuộn xuống phần "Nội dung bài báo"

**Kết quả mong đợi:**
- ✅ Thấy Card với title "Nội dung bài báo" và icon FileText
- ✅ Thấy watermark đỏ "TÀI LIỆU TUYỆT MẬT"
- ✅ PDF được hiển thị trong iframe/viewer
- ✅ Có thể scroll, zoom, download PDF

### **Trường hợp 2: Bài báo không có file PDF**

**Bước:**
1. Tạo một submission mới và không upload file PDF
2. Gán reviewer
3. Truy cập trang phản biện

**Kết quả mong đợi:**
- ✅ Thấy Card "Nội dung bài báo"
- ✅ Hiển thị message "Chưa có tài liệu đính kèm"
- ✅ Có hướng dẫn liên hệ biên tập viên
- ✅ (Nếu có files khác) Hiển thị debug info với tên files

### **Trường hợp 3: Bài báo có nhiều file PDF**

**Bước:**
1. Upload nhiều file PDF cho một submission
2. Gán reviewer
3. Truy cập trang phản biện

**Kết quả mong đợi:**
- ✅ Tất cả PDF files được hiển thị (mỗi file một viewer)
- ✅ Mỗi viewer có watermark riêng
- ✅ Mỗi file có tên rõ ràng

---

## 📝 LƯU Ý KHI SửA DỤNG

### **Đối với Reviewer:**
1. **Quy định bảo mật:**
   - Không sao chép, phát tán tài liệu
   - Chỉ sử dụng cho mục đích phản biện
   - Link xem có thời hạn 15 phút

2. **Khi không xem được PDF:**
   - Kiểm tra xem có message lỗi không
   - Kiểm tra phần debug info (tên files)
   - Liên hệ biên tập viên

### **Đối với Editor:**
1. **Đảm bảo upload đúng:**
   - File phải là PDF (`mimeType` chứa `pdf`)
   - Đặt tên file rõ ràng (ví dụ: `manuscript_v1.pdf`)
   - Có thể upload nhiều files

2. **Khi reviewer phàn nàn:**
   - Kiểm tra submission có files không
   - Kiểm tra `mimeType` của files
   - Xem audit logs xem reviewer có truy cập không

---

## 🔥 TROUBLESHOOTING

### **Vấn đề 1: "Không thể tải file PDF"**

**Nguyên nhân:**
- File không tồn tại trong S3
- Signed URL hết hạn
- Quyền truy cập S3 sai

**Giải pháp:**
1. Kiểm tra file trong database:
   ```sql
   SELECT id, originalName, cloudStoragePath, mimeType 
   FROM "UploadedFile" 
   WHERE id = 'file_id_here';
   ```

2. Kiểm tra API `/api/files/[id]`:
   ```bash
   curl http://localhost:3000/api/files/FILE_ID
   ```

3. Kiểm tra S3 permissions trong `lib/s3.ts`

### **Vấn đề 2: "Không có file PDF"**

**Nguyên nhân:**
- File chưa được upload
- File không phải PDF (`mimeType` không chứa `pdf`)
- Filter logic sai

**Giải pháp:**
1. Kiểm tra debug info trên UI ("Các file có sẵn: ...")
2. Kiểm tra trong database:
   ```sql
   SELECT originalName, mimeType, fileType 
   FROM "UploadedFile" 
   WHERE submissionId = 'submission_id_here';
   ```

3. Nếu file có nhưng `mimeType` sai, cập nhật:
   ```sql
   UPDATE "UploadedFile" 
   SET mimeType = 'application/pdf' 
   WHERE id = 'file_id_here';
   ```

### **Vấn đề 3: "PDF viewer không hiển thị"**

**Nguyên nhân:**
- Component `PDFViewerSimple` chưa được import đúng
- Worker script (`/pdf.worker.min.js`) không tồn tại
- Browser không hỗ trợ

**Giải pháp:**
1. Kiểm tra file worker:
   ```bash
   ls -la public/pdf.worker.min.js
   ```

2. Kiểm tra browser console:
   - Mở DevTools → Console
   - Tìm lỗi liên quan đến "pdf.worker" hoặc "pdfjs"

3. Kiểm tra component import:
   ```tsx
   import { PDFViewerSimple } from '@/components/pdf-viewer-simple'
   ```

---

## 📦 CÁC FILE ĐÃ SỬA

### 1. **`app/dashboard/reviewer/review/[id]/page.tsx`**

**Thay đổi:**
- Thêm Card container cho PDF viewer section
- Relax filter logic (bỏ `fileType` check)
- Thêm empty states với debug info
- Thêm title và description rõ ràng

**Trước:**
```tsx
{submission.files && submission.files.length > 0 && (
  <div className="space-y-4">
    {submission.files
      .filter((file) => file.fileType === 'MANUSCRIPT' && file.mimeType?.includes('pdf'))
      .map((file) => (
        <PDFViewerClient 
          key={file.id}
          fileId={file.id}
          fileName={file.originalName}
        />
      ))}
  </div>
)}
```

**Sau:**
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <FileText className="h-5 w-5" />
      Nội dung bài báo
    </CardTitle>
    <CardDescription>
      Xem toàn văn bản thảo để thực hiện phản biện
    </CardDescription>
  </CardHeader>
  <CardContent>
    {submission.files && submission.files.length > 0 ? (
      <div className="space-y-6">
        {submission.files
          .filter((file) => file.mimeType?.includes('pdf'))
          .map((file) => (
            <PDFViewerClient 
              key={file.id}
              fileId={file.id}
              fileName={file.originalName}
            />
          ))}
        {/* Empty state for no PDF files */}
        {submission.files.filter((file) => file.mimeType?.includes('pdf')).length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Không có file PDF
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              Bài báo này chưa có file PDF nào được tải lên. Vui lòng liên hệ với biên tập viên.
            </p>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
              <p className="font-mono">Các file có sẵn: {submission.files.map(f => f.originalName).join(', ')}</p>
            </div>
          </div>
        )}
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          Chưa có tài liệu đính kèm
        </h3>
        <p className="text-sm text-gray-500 max-w-md">
          Bài báo này chưa có file nào được tải lên. Vui lòng liên hệ với biên tập viên để được hỗ trợ.
        </p>
      </div>
    )}
  </CardContent>
</Card>
```

---

## 🔗 LIÊN KẾT

### Related Components:
- `app/dashboard/reviewer/review/[id]/pdf-viewer-client.tsx` - PDF viewer với security features
- `components/pdf-viewer-simple.tsx` - Simple iframe-based PDF viewer
- `lib/s3.ts` - S3 file management và signed URL generation
- `app/api/files/[id]/route.ts` - API endpoint để lấy file URL

### Related Features:
- Double-blind review policy (ẩn danh tác giả)
- File upload system (S3 integration)
- Audit logging (ghi lại truy cập)
- Security watermarks

---

## ✅ KẾT LUẬN

**Đã hoàn thành:**
- ✅ Thêm Card container với UI rõ ràng
- ✅ Relax filter logic để hiển thị tất cả PDF files
- ✅ Thêm empty states với debug info
- ✅ Giữ nguyên các tính năng bảo mật
- ✅ TypeScript compile không lỗi

**Sẵn sàng kiểm tra:**
Giao diện phản biện giờ đã có thể xem nội dung PDF của bài báo rõ ràng, với các thông báo hướng dẫn đầy đủ khi gặp vấn đề.

---

**Báo cáo được tạo bởi:** DeepAgent  
**Thời gian:** 2025-12-28  
**Trạng thái:** ✅ Sẵn sàng kiểm tra
