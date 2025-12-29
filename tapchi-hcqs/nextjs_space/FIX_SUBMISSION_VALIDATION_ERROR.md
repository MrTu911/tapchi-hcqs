# Báo cáo Sửa lỗi: "Dữ liệu không hợp lệ" khi nộp bài

**Ngày:** 28/12/2025  
**Trạng thái:** ✅ Đã hoàn thành  
**Deployment:** tapchinckhhcqs.abacusai.app

---

## 🔴 Vấn đề ban đầu

### Triệu chứng
Khi tác giả nộp bài viết mới, hệ thống trả về lỗi **400 Bad Request** với message:
```
Error: Dữ liệu không hợp lệ
```

### Log lỗi chi tiết (từ server)
```json
{
  "code": "invalid_enum_value",
  "received": "OPEN",
  "options": ["PUBLIC", "CONFIDENTIAL", "SECRET", "TOP_SECRET"],
  "path": ["securityLevel"],
  "message": "Invalid enum value. Expected 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET', received 'OPEN'"
}
```

---

## 🧠 Nguyên nhân gốc rễ

### Mâu thuẫn Schema

**Prisma Schema** (database) định nghĩa:
```prisma
enum SecurityLevel {
  OPEN        // ❌ Giá trị cũ
  INTERNAL    // ❌ Giá trị cũ
  SENSITIVE   // ❌ Giá trị cũ
}
```

**Zod Validator** (API route) yêu cầu:
```typescript
z.enum(['PUBLIC', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'])  // ✅ Giá trị mới
```

**Form Frontend** gửi:
```typescript
formData.securityLevel = 'OPEN'  // ❌ Giá trị cũ
```

→ **Kết quả:** Frontend gửi `OPEN`, nhưng backend validator chỉ chấp nhận `PUBLIC` → **400 Error**

---

## 🛠️ Giải pháp thực hiện

### Bước 1: Chuẩn hóa enum theo chuẩn quân sự

Đổi từ generic values sang military classification levels:

| Giá trị cũ | Giá trị mới | Ý nghĩa |
|------------|-------------|----------|
| `OPEN` | `PUBLIC` | Công khai |
| `INTERNAL` | `CONFIDENTIAL` | Mật |
| `SENSITIVE` | `SECRET` | Tối mật |
| _(new)_ | `TOP_SECRET` | Tuyệt mật |

### Bước 2: Cập nhật Frontend Form

**File:** `components/dashboard/submission-form-enhanced.tsx`

```diff
- securityLevel: 'OPEN',
+ securityLevel: 'PUBLIC',

- <SelectItem value="OPEN">Công khai</SelectItem>
- <SelectItem value="INTERNAL">Nội bộ</SelectItem>
- <SelectItem value="SENSITIVE">Nhạy cảm</SelectItem>
+ <SelectItem value="PUBLIC">Công khai</SelectItem>
+ <SelectItem value="CONFIDENTIAL">Mật</SelectItem>
+ <SelectItem value="SECRET">Tối mật</SelectItem>
+ <SelectItem value="TOP_SECRET">Tuyệt mật</SelectItem>
```

### Bước 3: Cập nhật Prisma Schema

**File:** `prisma/schema.prisma`

```diff
enum SecurityLevel {
-  OPEN
-  INTERNAL
-  SENSITIVE
+  PUBLIC
+  CONFIDENTIAL
+  SECRET
+  TOP_SECRET
}

model Submission {
  ...
-  securityLevel SecurityLevel @default(OPEN)
+  securityLevel SecurityLevel @default(PUBLIC)
}
```

### Bước 4: Migrate dữ liệu hiện có

**Script:** `scripts/migrate-security-level-data.ts`

Quy trình migrate an toàn:
1. Disable trigger `submission_search_vector_trigger` (tránh conflict)
2. Tạo column tạm `securityLevel_new` (type TEXT)
3. Copy & transform data:
   - `OPEN` → `PUBLIC`
   - `INTERNAL` → `CONFIDENTIAL`
   - `SENSITIVE` → `SECRET`
4. Drop column cũ `securityLevel`
5. Rename `securityLevel_new` → `securityLevel`
6. Re-enable trigger
7. Push Prisma schema mới

**Kết quả:** 38 submissions được migrate thành công từ `OPEN` → `PUBLIC`

### Bước 5: Cập nhật logic Two-Person Rule

**File:** `app/api/submissions/[id]/decision/route.ts`

```diff
- if (submission.securityLevel === 'SENSITIVE' && decision === 'ACCEPT')
+ if ((submission.securityLevel === 'SECRET' || submission.securityLevel === 'TOP_SECRET') && decision === 'ACCEPT')
```

→ Bài viết **SECRET** và **TOP_SECRET** yêu cầu 2 chữ ký (EIC + SECURITY_AUDITOR)

### Bước 6: Cập nhật Seed Scripts

```bash
find scripts -name "*.ts" -exec sed -i "s/securityLevel: 'OPEN'/securityLevel: 'PUBLIC'/g" {} \;
```

---

## ✅ Kết quả

### Test submission form
- ✅ Frontend gửi `securityLevel: "PUBLIC"`
- ✅ Backend validator chấp nhận `PUBLIC`
- ✅ Prisma client tạo record với `PUBLIC`
- ✅ Không còn lỗi 400 "Dữ liệu không hợp lệ"

### Verify database
```sql
SELECT "securityLevel", COUNT(*) FROM "Submission" GROUP BY "securityLevel";
-- Result: 38 submissions với securityLevel = 'PUBLIC'
```

### Build status
```
✓ Compiled successfully
✓ Checking validity of types
✓ No TypeScript errors
```

---

## 🔒 Tính năng bổ sung

### Phân cấp bảo mật theo quân sự

| Mức | Enum Value | Label (UI) | Two-Person Rule |
|-----|-----------|------------|------------------|
| 1 | `PUBLIC` | Công khai | ❌ Không |
| 2 | `CONFIDENTIAL` | Mật | ❌ Không |
| 3 | `SECRET` | Tối mật | ✅ Có |
| 4 | `TOP_SECRET` | Tuyệt mật | ✅ Có |

### Security Rules
- Bài **PUBLIC** & **CONFIDENTIAL**: EIC hoặc Managing Editor có thể phê duyệt độc lập
- Bài **SECRET** & **TOP_SECRET**: Bắt buộc cả 2 chữ ký:
  - Editor-in-Chief (EIC)
  - Security Auditor (SECURITY_AUDITOR role)

---

## 📝 Files thay đổi

1. ✅ `components/dashboard/submission-form-enhanced.tsx`
2. ✅ `prisma/schema.prisma`
3. ✅ `app/api/submissions/[id]/decision/route.ts`
4. ✅ `scripts/migrate-security-level-data.ts` (new)
5. ✅ `scripts/seed.ts`
6. ✅ `scripts/seed-all-data.ts`
7. ✅ `lib/validators.ts` (already correct)

---

## 🎯 Bài học rút ra

### 1. Hệ thống error handling hoạt động tốt
- Log chi tiết Zod validation errors
- Trả về HTTP 400 (không phải 500)
- Message tiếng Việt rõ ràng
- Logger ghi đầy đủ context

### 2. Importance of Schema Consistency
- ❌ **Sai lầm:** Database schema, validator schema, và frontend code không đồng bộ
- ✅ **Nguyên tắc:** Luôn có 1 "source of truth" duy nhất (Prisma schema)
- ✅ **Best practice:** Generate Zod schemas từ Prisma (với tools như `zod-prisma`)

### 3. Military-Grade Classification
- Sử dụng thuật ngữ chuẩn quốc tế: PUBLIC, CONFIDENTIAL, SECRET, TOP_SECRET
- Dễ hiểu cho cả developer và end-user
- Tương thích với các hệ thống phân loại bảo mật khác

---

## 🚀 Triển khai

```bash
# 1. Migrate dữ liệu
yarn tsx scripts/migrate-security-level-data.ts

# 2. Push schema mới
yarn prisma db push --accept-data-loss

# 3. Build và deploy
yarn build
```

**Deployment URL:** https://tapchinckhhcqs.abacusai.app

---

## 📞 Hỗ trợ

Nếu gặp vấn đề tương tự:
1. Kiểm tra server logs: `/api/health` endpoint hoặc console logs
2. Verify Prisma schema khớp với validators
3. Run diagnostic: `yarn tsx scripts/diagnostics/check-submissions.ts`

---

**Checkpoint:** "Sửa lỗi validation securityLevel enum"
