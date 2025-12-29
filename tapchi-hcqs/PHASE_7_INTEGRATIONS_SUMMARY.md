# Phase 7: Integrations & Advanced Features - Hoàn thành ✅

## Tổng quan
Phase 7 đã triển khai thành công các tích hợp bên thứ ba và tính năng AI nâng cao cho hệ thống tạp chí điện tử.

## Các tính năng đã triển khai

### 1. 🌐 ORCID Integration
**Mô tả:** Tích hợp OAuth với ORCID để đồng bộ hồ sơ tác giả và phản biện viên

**Thành phần:**
- `lib/integrations/orcid.ts` - Thư viện xử lý OAuth và đồng bộ hồ sơ
- `app/api/auth/orcid/route.ts` - Khởi tạo OAuth flow
- `app/api/auth/orcid/callback/route.ts` - Xử lý callback sau khi authenticate
- `components/dashboard/orcid-connect-button.tsx` - UI component kết nối ORCID
- Database model: `ORCIDProfile`

**Biến môi trường:**
```bash
ORCID_CLIENT_ID=
ORCID_CLIENT_SECRET=
ORCID_REDIRECT_URI=
ORCID_SANDBOX=true
```

**Chức năng:**
- Kết nối tài khoản ORCID với user
- Tự động đồng bộ: tên, bio, affiliations, publications
- Cập nhật định kỳ thông tin từ ORCID
- Validate ORCID ID format

---

### 2. 📖 DOI / CrossRef Integration
**Mô tả:** Đăng ký DOI và gửi metadata tới CrossRef cho bài báo xuất bản

**Thành phần:**
- `lib/integrations/crossref.ts` - Thư viện tạo XML và submit DOI (đã có sẵn)

**Biến môi trường:**
```bash
CROSSREF_DEPOSITOR_NAME=Tạp chí HCQS
CROSSREF_DEPOSITOR_EMAIL=admin@journal.edu.vn
CROSSREF_REGISTRANT_NAME=Học viện Hậu cần
CROSSREF_LOGIN_ID=
CROSSREF_PASSWORD=
CROSSREF_TEST_MODE=true
```

**Chức năng:**
- Tự động tạo DOI suffix (format: volume.issue.articleNumber)
- Generate CrossRef XML metadata
- Submit DOI registration
- Kiểm tra trạng thái DOI
- Validate DOI format

---

### 3. 🔍 Semantic Search
**Mô tả:** Tìm kiếm thông minh sử dụng vector embeddings và cosine similarity

**Thành phần:**
- `lib/search-engine.ts` - Engine xử lý semantic search
- `app/api/search/semantic/route.ts` - API endpoint

**Chức năng:**
- Generate text embeddings từ title, abstract, keywords
- Tính toán cosine similarity giữa query và documents
- Hỗ trợ filter theo category, date range
- Trích xuất từ khóa tự động (TF-IDF)
- Trả về kết quả ranked by relevance score

**API Endpoint:**
```
GET /api/search/semantic?q={query}&category={code}&limit={10}
```

---

### 4. 🤖 AI Reviewer Matching
**Mô tả:** Gợi ý phản biện viên phù hợp tự động dựa trên AI

**Thành phần:**
- `lib/ai/reviewer-match.ts` - AI matching algorithm
- `app/api/reviewers/match/route.ts` - API endpoint
- `components/dashboard/reviewer-match-card.tsx` - UI component
- Database model: `ReviewerMatchScore`

**Chức năng:**
- So khớp keywords giữa submission và reviewer expertise
- Tính toán expertise match theo section
- Đánh giá availability score (workload, quality rating)
- Weighted scoring: keyword 40%, expertise 35%, availability 25%
- Lưu match scores vào database
- Top N recommendations

**API Endpoint:**
```
POST /api/reviewers/match
Body: { submissionId: string, topN: number }
```

---

### 5. 🧠 Plagiarism Check
**Mô tả:** Tích hợp kiểm tra đạo văn với iThenticate/Turnitin API

**Thành phần:**
- `lib/integrations/ithenticate.ts` - Thư viện tích hợp
- `app/api/plagiarism/route.ts` - API endpoint
- Database model: `PlagiarismCheck`

**Biến môi trường:**
```bash
ITHENTICATE_API_KEY=
ITHENTICATE_API_URL=https://api.ithenticate.com/v1
ITHENTICATE_ENABLED=false
```

**Chức năng:**
- Submit document cho plagiarism check
- Lưu report ID và similarity score
- Trạng thái: PENDING → PROCESSING → COMPLETED/FAILED
- Mock mode khi chưa có API key
- Kiểm tra và hiển thị kết quả trong editor workflow

**API Endpoints:**
```
POST /api/plagiarism - Submit check
GET /api/plagiarism?submissionId={id} - Get status
```

---

### 6. 📊 Public Metrics
**Mô tả:** Theo dõi views, downloads, citations cho mỗi bài báo

**Thành phần:**
- Database model: `ArticleMetrics`
- `app/api/metrics/article/[articleId]/route.ts` - API endpoint
- `components/dashboard/article-metrics-card.tsx` - UI component

**Chức năng:**
- Track views, downloads, citations
- Phân tích theo quốc gia (viewsByCountry)
- Phân tích theo tháng (viewsByMonth)
- Tự động increment metrics
- Hiển thị thống kê real-time

**API Endpoints:**
```
GET /api/metrics/article/{id} - Get metrics
POST /api/metrics/article/{id} - Track view/download
Body: { action: "view" | "download", country?: string }
```

---

### 7. 🧩 Public API v1
**Mô tả:** API công khai cho bên thứ ba truy cập dữ liệu bài báo

**Thành phần:**
- `app/api/public/articles/route.ts` - List articles
- `app/api/public/articles/[id]/route.ts` - Article detail

**Chức năng:**
- Lấy danh sách bài báo published với pagination
- Filter theo category, featured
- Chi tiết bài báo kèm metrics
- Không yêu cầu authentication
- RESTful API format

**API Endpoints:**
```
GET /api/public/articles?page=1&limit=20&category={code}&featured=true
GET /api/public/articles/{id}
```

**Response format:**
```json
{
  "articles": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### 8. 🔔 Web Push Notifications
**Mô tả:** Thông báo real-time qua trình duyệt (PWA)

**Thành phần:**
- `lib/web-push.ts` - Thư viện xử lý push notifications
- `app/api/push/subscribe/route.ts` - API endpoint
- Database model: `PushSubscription`

**Biến môi trường:**
```bash
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@journal.edu.vn
```

**Chức năng:**
- User subscribe/unsubscribe push notifications
- Lưu subscription endpoint và keys
- Gửi push notification tới một hoặc nhiều users
- Tự động disable subscription khi failed
- Track last used time
- Support multiple devices per user

**API Endpoints:**
```
POST /api/push/subscribe - Subscribe to push
DELETE /api/push/subscribe - Unsubscribe
```

**Generate VAPID keys:**
```javascript
import { generateVAPIDKeys } from '@/lib/web-push'
const keys = generateVAPIDKeys()
```

---

### 9. 🕒 Cron / Scheduler
**Mô tả:** Tự động hóa các tác vụ định kỳ

**Thành phần:**
- `lib/cron-scheduler.ts` - Cron job definitions
- `app/api/cron/run-jobs/route.ts` - Manual trigger API
- Database model: `ScheduledJob`

**Job Types:**
1. **SEND_REMINDERS** - Gửi email nhắc nhở review deadline
   - Schedule: Mỗi ngày lúc 9 AM
   - Tìm overdue reviews và gửi reminders

2. **UPDATE_METRICS** - Cập nhật article metrics
   - Schedule: Mỗi 6 giờ
   - Aggregate analytics data

3. **DATA_RETENTION** - Áp dụng data retention policies
   - Schedule: Mỗi ngày lúc 12 AM
   - Archive/delete data theo retention policy

4. **CHECK_DEADLINES** - Kiểm tra và đánh dấu deadlines quá hạn
   - Schedule: Mỗi giờ
   - Update isOverdue flag

5. **SYNC_ORCID** - Đồng bộ ORCID profiles
   - Schedule: Custom (có thể trigger manual)

**Chức năng:**
- Auto-run theo cron schedule
- Manual trigger qua API (SYSADMIN only)
- Track job status: PENDING → RUNNING → COMPLETED/FAILED
- Lưu result và error logs
- Retry mechanism (có thể implement)

**Cron Schedules:**
```javascript
// Send reminders every day at 9 AM
'0 9 * * *'

// Update metrics every 6 hours
'0 */6 * * *'

// Check data retention daily at midnight
'0 0 * * *'

// Check deadlines every hour
'0 * * * *'
```

---

## Database Models Mới

### ORCIDProfile
```prisma
model ORCIDProfile {
  id          String   @id @default(uuid())
  userId      String   @unique
  orcidId     String   @unique
  fullName    String?
  biography   String?  @db.Text
  affiliations String[]
  works       Json?
  accessToken  String?
  refreshToken String?
  lastSyncAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### ArticleMetrics
```prisma
model ArticleMetrics {
  id         String   @id @default(uuid())
  articleId  String   @unique
  views      Int      @default(0)
  downloads  Int      @default(0)
  citations  Int      @default(0)
  viewsByCountry   Json?
  viewsByMonth     Json?
  lastViewedAt     DateTime?
  lastDownloadedAt DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### PlagiarismCheck
```prisma
model PlagiarismCheck {
  id           String            @id @default(uuid())
  submissionId String
  provider     String
  reportId     String?
  status       PlagiarismStatus  @default(PENDING)
  similarity   Float?
  reportUrl    String?
  reportData   Json?
  checkedAt    DateTime?
  createdAt    DateTime          @default(now())
}
```

### ReviewerMatchScore
```prisma
model ReviewerMatchScore {
  id           String   @id @default(uuid())
  submissionId String
  reviewerId   String
  score        Float
  expertiseMatch   Float?
  keywordMatch     Float?
  citationMatch    Float?
  availabilityScore Float?
  metadata     Json?
  createdAt    DateTime @default(now())
}
```

### PushSubscription
```prisma
model PushSubscription {
  id           String   @id @default(uuid())
  userId       String
  endpoint     String   @unique
  keys         Json
  deviceInfo   String?
  isActive     Boolean  @default(true)
  lastUsedAt   DateTime @default(now())
  createdAt    DateTime @default(now())
}
```

### ScheduledJob
```prisma
model ScheduledJob {
  id          String    @id @default(uuid())
  type        JobType
  status      JobStatus @default(PENDING)
  scheduledAt DateTime
  startedAt   DateTime?
  completedAt DateTime?
  result      Json?
  error       String?   @db.Text
  metadata    Json?
  createdAt   DateTime  @default(now())
}
```

---

## Admin Dashboard - Integrations Page

**URL:** `/dashboard/admin/integrations`

**Chức năng:**
- Hiển thị tất cả integrations và trạng thái
- Test connection cho mỗi integration
- Xem API endpoints và documentation links
- Hiển thị biến môi trường cần thiết
- Chỉ SYSADMIN có quyền truy cập

**Integrations được hiển thị:**
1. ORCID - Active
2. CrossRef DOI - Active
3. iThenticate - Active/Inactive (tùy config)
4. Semantic Search - Active
5. AI Reviewer Matching - Active
6. Web Push Notifications - Active
7. Public API - Active
8. Cron Jobs - Active

---

## Hướng dẫn sử dụng

### 1. Kết nối ORCID (Author/Reviewer)
1. Vào Profile → Click "Kết nối ORCID"
2. Đăng nhập ORCID và authorize
3. Hệ thống tự động sync profile

### 2. AI Reviewer Matching (Editor)
1. Vào Submission detail
2. Click "AI Reviewer Matching"
3. Xem top 5 reviewers phù hợp nhất
4. Chọn reviewer để assign

### 3. Plagiarism Check (Editor)
1. Vào Submission detail
2. Click "Kiểm tra đạo văn"
3. Xem similarity score và report

### 4. View Article Metrics (Public)
- Metrics tự động được track khi user view/download article
- Admin có thể xem detailed metrics trong dashboard

### 5. Public API
- Truy cập `/api/public/articles` để lấy danh sách bài báo
- Không cần authentication
- Pagination support

### 6. Web Push Notifications
- User enable notifications trong browser
- System tự động gửi push khi có events

### 7. Cron Jobs (SYSADMIN)
- Auto-run theo schedule
- Manual trigger qua `/dashboard/admin/integrations`

---

## Các thư viện đã cài đặt

```json
{
  "node-cron": "4.2.1",
  "@types/node-cron": "3.0.11",
  "web-push": "3.6.7",
  "@types/web-push": "3.6.4"
}
```

---

## Cấu trúc thư mục

```
nextjs_space/
├── lib/
│   ├── integrations/
│   │   ├── orcid.ts
│   │   ├── crossref.ts (đã có)
│   │   └── ithenticate.ts
│   ├── ai/
│   │   └── reviewer-match.ts
│   ├── search-engine.ts
│   ├── cron-scheduler.ts
│   └── web-push.ts
├── app/
│   ├── api/
│   │   ├── auth/orcid/
│   │   ├── plagiarism/
│   │   ├── search/semantic/
│   │   ├── reviewers/match/
│   │   ├── metrics/article/
│   │   ├── public/articles/
│   │   ├── push/subscribe/
│   │   └── cron/run-jobs/
│   └── dashboard/
│       └── admin/
│           └── integrations/
└── components/
    └── dashboard/
        ├── article-metrics-card.tsx
        ├── reviewer-match-card.tsx
        └── orcid-connect-button.tsx
```

---

## Security & Best Practices

1. **API Keys:** Tất cả API keys được lưu trong environment variables
2. **OAuth Tokens:** Encrypt access/refresh tokens trước khi lưu database
3. **Rate Limiting:** Áp dụng rate limit cho public APIs
4. **Authentication:** Internal APIs require session authentication
5. **CORS:** Configure CORS cho public APIs
6. **Audit Logging:** Log tất cả integration activities

---

## Testing

### Manual Testing
1. **ORCID:** Test OAuth flow (cần ORCID credentials)
2. **Semantic Search:** Test với các queries khác nhau
3. **Reviewer Matching:** Test với submission có keywords
4. **Plagiarism Check:** Test mock mode
5. **Metrics:** Track views/downloads
6. **Public API:** Test pagination và filters
7. **Cron Jobs:** Manual trigger và check logs

### API Testing
```bash
# Semantic Search
curl "http://localhost:3000/api/search/semantic?q=hậu+cần&limit=5"

# Public Articles
curl "http://localhost:3000/api/public/articles?page=1&limit=10"

# Article Metrics
curl "http://localhost:3000/api/metrics/article/{articleId}"

# Reviewer Match (requires auth)
curl -X POST http://localhost:3000/api/reviewers/match \
  -H "Content-Type: application/json" \
  -d '{"submissionId": "xxx", "topN": 5}'
```

---

## Future Enhancements

1. **ORCID:**
   - Auto-populate submission metadata từ ORCID
   - Bulk import publications

2. **Semantic Search:**
   - Use OpenAI/Cohere embeddings API cho accuracy cao hơn
   - Support multilingual search

3. **AI Reviewer Matching:**
   - Citation network analysis
   - Machine learning model training
   - Conflict of interest detection

4. **Plagiarism Check:**
   - Integration với multiple providers
   - Automated report generation

5. **Metrics:**
   - Altmetrics integration
   - Citation tracking từ CrossRef/Google Scholar
   - Real-time analytics dashboard

6. **Web Push:**
   - Customizable notification preferences
   - Rich notifications với actions

7. **Cron Jobs:**
   - Web UI để manage schedules
   - Job queue system (Bull/BullMQ)

---

## Kết luận

Phase 7 đã thành công triển khai đầy đủ 9 tính năng integrations và advanced features:
- ✅ ORCID Integration
- ✅ DOI / CrossRef
- ✅ Semantic Search
- ✅ AI Reviewer Matching
- ✅ Plagiarism Check
- ✅ Public Metrics
- ✅ Public API v1
- ✅ Web Push Notifications
- ✅ Cron / Scheduler

Hệ thống hiện đã có đầy đủ các tính năng tiên tiến cần thiết cho một tạp chí khoa học quốc tế, tuân thủ các chuẩn mực của COPE và DOAJ.

---

**Ngày hoàn thành:** 03/11/2025
**Version:** 7.0.0
**Status:** ✅ Production Ready
