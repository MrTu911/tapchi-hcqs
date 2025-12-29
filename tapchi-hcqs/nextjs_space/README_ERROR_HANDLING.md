# HƯỚng Dẫn Xử Lý Lỗi Toàn Diện

## Tổng Quan

Hệ thống đã được nâng cấp với tầng xử lý lỗi thống nhất, giúp:
- ❌ **Không còn lỗi 500 mù mờ**
- ✅ **Phản hồi lỗi rõ ràng, có cấu trúc**
- ✅ **Logging đầy đủ, dễ truy vết**
- ✅ **Validation đầu vào chặt chẽ**
- ✅ **Auth & authorization tự động**

---

## 1. Các Loại Lỗi Đã Hỗ Trợ

### Custom Error Classes

```typescript
import { 
  AppError,           // Lỗi chung
  ValidationError,    // Lỗi validation (400)
  AuthenticationError,// Chưa đăng nhập (401)
  AuthorizationError, // Không có quyền (403)
  NotFoundError,      // Không tìm thấy (404)
  ConflictError,      // Dữ liệu trùng lặp (409)
  DatabaseError       // Lỗi database (500)
} from '@/lib/error-handler';

// Sử dụng
throw new ValidationError('Thiếu thông tin bắt buộc');
throw new NotFoundError('Không tìm thấy bài nộp');
throw new AuthorizationError('Chỉ biên tập viên mới có quyền');
```

### Tự Động Xử Lý

- **ZodError**: Tự động phân tích và trả field errors
- **PrismaError**: Định dạng lỗi database rõ ràng
  - `P2002`: Duplicate entry
  - `P2025`: Record not found
  - `P2003`: Foreign key constraint
  - `P2014`: Relation violation

---

## 2. Template API Route Chuẩn

### POST Request (Tạo Mới)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleError, ValidationError } from '@/lib/error-handler';
import { requireAuth } from '@/lib/api-guards';
import { yourSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    // 1. Xác thực
    const session = await requireAuth(request);
    
    // 2. Log request
    logger.api('POST', '/api/your-route', { userId: session.user.id });

    // 3. Parse & validate
    const body = await request.json();
    const validatedData = yourSchema.parse(body);

    // 4. Business logic
    const result = await prisma.yourModel.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
      },
    });

    // 5. Log success
    logger.info({
      context: 'YOUR_MODEL_CREATED',
      id: result.id,
      userId: session.user.id,
    });

    // 6. Return success
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    // 7. Xử lý lỗi tự động
    return handleError(error, 'API_YOUR_ROUTE_POST');
  }
}
```

### GET Request (Lấy Dữ Liệu)

```typescript
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    
    logger.api('GET', '/api/your-route', { userId: session.user.id });

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      throw new ValidationError('Thiếu tham số id');
    }

    // Fetch data
    const result = await prisma.yourModel.findUnique({
      where: { id },
    });

    if (!result) {
      throw new NotFoundError('Không tìm thấy dữ liệu');
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleError(error, 'API_YOUR_ROUTE_GET');
  }
}
```

### PUT Request (Cập Nhật)

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request);
    const { id } = params;

    logger.api('PUT', `/api/your-route/${id}`, { userId: session.user.id });

    // Check exists
    const existing = await prisma.yourModel.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Không tìm thấy dữ liệu');
    }

    // Check permissions
    assertCanAccessResource(
      session,
      existing.ownerId,
      ['EIC', 'MANAGING_EDITOR']
    );

    // Validate & update
    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    const updated = await prisma.yourModel.update({
      where: { id },
      data: validatedData,
    });

    logger.info({
      context: 'YOUR_MODEL_UPDATED',
      id,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return handleError(error, 'API_YOUR_ROUTE_PUT');
  }
}
```

### DELETE Request (Xóa)

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireEditor(request); // Chỉ editor được xóa
    const { id } = params;

    logger.api('DELETE', `/api/your-route/${id}`, { userId: session.user.id });

    const existing = await prisma.yourModel.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Không tìm thấy dữ liệu');
    }

    await prisma.yourModel.delete({
      where: { id },
    });

    logger.info({
      context: 'YOUR_MODEL_DELETED',
      id,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Xóa thành công',
    });
  } catch (error) {
    return handleError(error, 'API_YOUR_ROUTE_DELETE');
  }
}
```

---

## 3. Validation Với Zod

### Tạo Schema Mới

Trong `lib/validators.ts`:

```typescript
import { z } from 'zod';

export const createYourModelSchema = z.object({
  title: z.string()
    .min(5, 'Tiêu đề phải có ít nhất 5 ký tự')
    .max(200, 'Tiêu đề không được quá 200 ký tự'),
  
  description: z.string()
    .max(1000, 'Mô tả quá dài')
    .optional(),
  
  email: z.string()
    .email('Email không hợp lệ'),
  
  age: z.number()
    .int('Tuổi phải là số nguyên')
    .min(18, 'Phải từ 18 tuổi trở lên')
    .max(100, 'Tuổi không hợp lệ'),
  
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']),
  
  tags: z.array(z.string()).optional(),
  
  metadata: z.record(z.any()).optional(),
});

export const updateYourModelSchema = createYourModelSchema.partial();
```

### Sử Dụng Schema

```typescript
import { createYourModelSchema } from '@/lib/validators';

const validatedData = createYourModelSchema.parse(inputData);
// Nếu không hợp lệ → throw ZodError → handleError tự động xử lý
```

---

## 4. Authentication & Authorization

### Các Hàm Guard

```typescript
import {
  requireAuth,       // Yêu cầu đăng nhập
  requireRole,       // Yêu cầu vai trò cụ thể
  requireEditor,     // Yêu cầu biên tập viên
  requireAdmin,      // Yêu cầu quản trị viên
  requireReviewer,   // Yêu cầu phản biện viên
  requireAuthor,     // Yêu cầu tác giả
  assertCanAccessResource,
} from '@/lib/api-guards';

// Ví dụ 1: Chỉ cần đăng nhập
const session = await requireAuth(request);

// Ví dụ 2: Phải là biên tập viên
const session = await requireEditor(request);

// Ví dụ 3: Phải là EIC hoặc MANAGING_EDITOR
const session = await requireRole(['EIC', 'MANAGING_EDITOR'], request);

// Ví dụ 4: Kiểm tra quyền truy cập tài nguyên
assertCanAccessResource(
  session,
  resourceOwnerId,
  ['EIC', 'MANAGING_EDITOR'],
  'Không có quyền truy cập bài nộp này'
);
```

---

## 5. Logging

### Các Mức Log

```typescript
import { logger } from '@/lib/logger';

// Info - Thông tin chung
logger.info('Hệ thống đã khởi động');

// Debug - Chi tiết (chỉ trong development)
logger.debug({ userId, action: 'view_submission', submissionId });

// Warning - Cảnh báo
logger.warn('Database latency cao: 500ms');

// Error - Lỗi
logger.error({
  context: 'API_ERROR',
  error: error.message,
  stack: error.stack,
  userId,
});
```

### Log Chuyên Biệt

```typescript
// API Request
logger.api('POST', '/api/submissions', { userId, ip });

// Database Operation
logger.db('create', 'Submission', { id, title });

// Authentication Event
logger.auth('login', userId, { ip, userAgent });

// Security Event
logger.security('unauthorized_access', { userId, resource, action });
```

---

## 6. Các Trường Hợp Thường Gặp

### Trường Hợp 1: Thiếu Trường Bắt Buộc

```typescript
// ❌ Sai
if (!data.title) {
  return NextResponse.json(
    { error: 'Thiếu tiêu đề' },
    { status: 400 }
  );
}

// ✅ Đúng
const schema = z.object({
  title: z.string({ required_error: 'Thiếu tiêu đề' }),
});
const validatedData = schema.parse(data);
// Tự động throw ZodError với message rõ ràng
```

### Trường Hợp 2: Không Tìm Thấy Dữ Liệu

```typescript
// ❌ Sai
const submission = await prisma.submission.findUnique({ where: { id } });
if (!submission) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

// ✅ Đúng
const submission = await prisma.submission.findUnique({ where: { id } });
if (!submission) {
  throw new NotFoundError('Không tìm thấy bài nộp');
}
```

### Trường Hợp 3: Không Có Quyền

```typescript
// ❌ Sai
if (session.user.role !== 'EDITOR') {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 403 }
  );
}

// ✅ Đúng
const session = await requireEditor(request);
// Tự động throw AuthorizationError nếu không phải editor
```

### Trường Hợp 4: Upload File

```typescript
try {
  // 1. Validate file
  if (!file) {
    throw new ValidationError('Vui lòng tải lên file');
  }
  
  if (file.size > 10 * 1024 * 1024) {
    throw new ValidationError('File không được quá 10MB');
  }
  
  if (!['application/pdf', 'image/jpeg'].includes(file.type)) {
    throw new ValidationError('Chỉ chấp nhận PDF hoặc JPEG');
  }

  // 2. Upload file
  const { saveFile } = await import('@/lib/storage');
  const savedFile = await saveFile(buffer, file.name, file.type);
  
  // 3. Log
  logger.info({
    context: 'FILE_UPLOADED',
    fileId: savedFile.id,
    fileName: file.name,
    fileSize: file.size,
    userId: session.user.id,
  });
  
  return savedFile;
} catch (fileError) {
  logger.error({
    context: 'FILE_UPLOAD_ERROR',
    error: fileError instanceof Error ? fileError.message : String(fileError),
    userId: session.user.id,
  });
  throw new ValidationError('Không thể tải lên file. Vui lòng thử lại.');
}
```

---

## 7. Testing Error Handling

### Test Validation Error

```bash
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{"title": "abc"}'

# Mong đợi:
{
  "error": "Dữ liệu không hợp lệ",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "title", "message": "Tiêu đề phải có ít nhất 10 ký tự" },
    { "field": "abstract", "message": "Tóm tắt là bắt buộc" }
  ],
  "context": "API_SUBMISSIONS_POST"
}
```

### Test Authentication Error

```bash
curl http://localhost:3000/api/submissions

# Mong đợi:
{
  "error": "Vui lòng đăng nhập để tiếp tục",
  "code": "AUTHENTICATION_ERROR",
  "context": "API_SUBMISSIONS_GET"
}
```

### Test Not Found Error

```bash
curl http://localhost:3000/api/submissions/invalid-id

# Mong đợi:
{
  "error": "Không tìm thấy bài nộp",
  "code": "NOT_FOUND",
  "context": "API_SUBMISSIONS_GET_BY_ID"
}
```

---

## 8. Best Practices

### ✅ DO (Nên Làm)

1. **Luôn sử dụng try-catch trong API routes**
2. **Validate tất cả input với Zod**
3. **Sử dụng custom error classes**
4. **Log mọi thao tác quan trọng**
5. **Kiểm tra authentication trước khi thao tác**
6. **Kiểm tra quyền truy cập tài nguyên**
7. **Trả về phản hồi có cấu trúc**

### ❌ DON'T (Không Nên)

1. ❌ Trả 500 không có message
2. ❌ Sử dụng console.log thay vì logger
3. ❌ Bỏ qua validation
4. ❌ Hardcode status codes
5. ❌ Không kiểm tra quyền
6. ❌ Để lộ thông tin nhạy cảm trong error messages

---

## 9. Phụ Lục: Error Response Format

### Thành Công (200)

```json
{
  "success": true,
  "data": { ... }
}
```

### Validation Error (400)

```json
{
  "error": "Dữ liệu không hợp lệ",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "email", "message": "Email không hợp lệ" }
  ],
  "context": "API_ROUTE_NAME"
}
```

### Authentication Error (401)

```json
{
  "error": "Chưa đăng nhập",
  "code": "AUTHENTICATION_ERROR",
  "context": "API_ROUTE_NAME"
}
```

### Authorization Error (403)

```json
{
  "error": "Không có quyền truy cập",
  "code": "AUTHORIZATION_ERROR",
  "context": "API_ROUTE_NAME"
}
```

### Not Found (404)

```json
{
  "error": "Không tìm thấy tài nguyên",
  "code": "NOT_FOUND",
  "context": "API_ROUTE_NAME"
}
```

### Conflict (409)

```json
{
  "error": "Dữ liệu đã tồn tại",
  "code": "CONFLICT",
  "field": "email",
  "context": "API_ROUTE_NAME"
}
```

### Server Error (500)

```json
{
  "error": "Đã xảy ra lỗi hệ thống",
  "code": "INTERNAL_ERROR",
  "context": "API_ROUTE_NAME",
  "message": "Chi tiết lỗi (chỉ hiển thị trong development)"
}
```

---

**Tài liệu được cập nhật:** 2025-01-15  
**Tác giả:** DeepAgent - Abacus.AI
