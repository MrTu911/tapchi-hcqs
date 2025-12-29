
# 📋 Editorial Workflow & Automation Guide

## Tổng quan

Hệ thống Editorial Workflow & Automation cung cấp quy trình biên tập tự động từ nộp bài đến xuất bản, với các tính năng:

- ✅ Quản lý vòng đời bài viết (Submission Lifecycle)
- ✅ Workflow Engine tự động
- ✅ Smart Notifications (Email + In-app)
- ✅ Deadline Tracking & Reminders
- ✅ Auto-Assignment cho Reviewers
- ✅ Timeline Visualization

---

## 🔄 Workflow States

### Trạng thái bài viết (Submission Status)

```
NEW → UNDER_REVIEW → REVISION → ACCEPTED → IN_PRODUCTION → PUBLISHED
  ↘    ↘               ↘
    DESK_REJECT      REJECTED
```

### Transitions được phép

| Từ trạng thái | Đến trạng thái | Quyền hạn |
|---|---|---|
| NEW | UNDER_REVIEW | Editor, Managing Editor, EIC |
| NEW | DESK_REJECT | Editor, Managing Editor, EIC |
| UNDER_REVIEW | REVISION | Editor, Managing Editor, EIC |
| UNDER_REVIEW | ACCEPTED | Managing Editor, EIC |
| UNDER_REVIEW | REJECTED | Editor, Managing Editor, EIC |
| REVISION | UNDER_REVIEW | Editor, Managing Editor, EIC |
| REVISION | REJECTED | Editor, Managing Editor, EIC |
| ACCEPTED | IN_PRODUCTION | Managing Editor, EIC |
| IN_PRODUCTION | PUBLISHED | EIC, SYSADMIN |

---

## 📅 Deadline Types & SLA

### Các loại Deadline

1. **INITIAL_REVIEW**: Phản biện ban đầu (21 ngày)
2. **REVISION_SUBMIT**: Tác giả nộp bản sửa (14 ngày)
3. **RE_REVIEW**: Phản biện lại sau sửa (14 ngày)
4. **EDITOR_DECISION**: Editor ra quyết định (7 ngày)
5. **PRODUCTION**: Layout & production (14 ngày)
6. **PUBLICATION**: Xuất bản chính thức (7 ngày)

### SLA Periods

| Trạng thái | SLA (ngày) |
|---|---|
| NEW | 7 |
| UNDER_REVIEW | 21 |
| REVISION | 14 |
| ACCEPTED | 30 |
| IN_PRODUCTION | 14 |

---

## 🔔 Notifications & Emails

### Workflow Events

Hệ thống tự động gửi email và thông báo cho:

1. **REVIEWER_INVITED**: Mời phản biện
2. **REVIEWER_DEADLINE_APPROACHING**: Nhắc deadline phản biện (3 ngày trước)
3. **REVIEW_COMPLETED**: Phản biện hoàn thành
4. **DECISION_MADE**: Quyết định biên tập
5. **REVISION_REQUESTED**: Yêu cầu chỉnh sửa
6. **PAPER_PUBLISHED**: Bài viết xuất bản
7. **AUTHOR_REVISION_APPROACHING**: Nhắc deadline nộp sửa (7 ngày trước)

### Cấu hình Email

File: `/lib/workflow-automator.ts`

```typescript
await triggerWorkflowEvent('REVIEWER_INVITED', {
  recipientEmail: reviewer.email,
  recipientName: reviewer.fullName,
  submissionCode: submission.code,
  submissionTitle: submission.title
});
```

---

## 🤖 Auto-Assignment

### Reviewer Matching Algorithm

File: `/lib/reviewer-matcher.ts`

**Tiêu chí matching:**
1. Keyword similarity (70% trọng số)
2. Expertise match (30% trọng số)
3. Current workload
4. Performance metrics (rating, completion rate)

**API endpoint:**
```bash
POST /api/workflow/auto-assign
{
  "submissionId": "xxx",
  "limit": 5,
  "autoAssign": true
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "userId": "...",
      "name": "Dr. Nguyen Van A",
      "matchScore": 0.85,
      "expertise": ["AI", "Machine Learning"],
      "currentLoad": 2,
      "avgCompletionDays": 14,
      "averageRating": 4.5
    }
  ],
  "assigned": [...]
}
```

---

## 📊 Workflow Timeline

### Timeline Events

File: `/components/dashboard/workflow-timeline.tsx`

Timeline hiển thị:
- Submission created
- Version updates
- Review invitations & completions
- Editor decisions
- Deadlines
- Status changes

**API endpoint:**
```bash
GET /api/workflow/timeline?submissionId=xxx
```

---

## ⚙️ Workflow Actions

### Available Actions

File: `/components/dashboard/workflow-actions.tsx`

**Actions theo vai trò:**

| Action | Label | Trạng thái hiện tại | Quyền |
|---|---|---|---|
| send_to_review | Gửi phản biện | NEW, REVISION | Editor+ |
| desk_reject | Từ chối ngay | NEW | Editor+ |
| request_revision | Yêu cầu chỉnh sửa | UNDER_REVIEW | Editor+ |
| accept | Chấp nhận | UNDER_REVIEW | Managing+ |
| reject | Từ chối | UNDER_REVIEW, REVISION | Editor+ |
| start_production | Bắt đầu sản xuất | ACCEPTED | Managing+ |
| publish | Xuất bản | IN_PRODUCTION | EIC |

**API endpoint:**
```bash
POST /api/workflow
{
  "submissionId": "xxx",
  "action": "send_to_review",
  "note": "Optional note",
  "assignReviewers": ["reviewerId1", "reviewerId2"]
}
```

---

## 🕐 Cron Jobs

### 1. Reminder Cron

**Endpoint:** `GET /api/cron/reminders`

**Chức năng:**
- Gửi reminder cho review deadlines (3 ngày trước)
- Gửi reminder cho revision deadlines (7 ngày trước)
- Tối đa 2 lần nhắc nhở

**Cấu hình cron:**
```bash
# Run daily at 9 AM
0 9 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/reminders
```

### 2. Overdue Check Cron

**Endpoint:** `GET /api/cron/check-overdue`

**Chức năng:**
- Đánh dấu deadlines quá hạn
- Cập nhật SLA status cho submissions
- Tính toán daysInCurrentStatus

**Cấu hình cron:**
```bash
# Run daily at 1 AM
0 1 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/check-overdue
```

---

## 🎯 Dashboard Pages

### 1. Editor Workflow Dashboard

**Route:** `/dashboard/editor/workflow`

**Features:**
- Thống kê workflow (active, overdue, upcoming)
- Tabs: Overdue, Upcoming, My Deadlines, All
- Danh sách submissions quá hạn SLA

### 2. Admin Workflow System

**Route:** `/dashboard/admin/workflow`

**Features:**
- System statistics
- Manual trigger cho cron jobs
- Recent workflow events (audit logs)
- System health monitoring

### 3. Submission Detail Page

**Route:** `/dashboard/editor/submissions/[id]`

**Tích hợp:**
- Workflow Actions buttons
- Timeline visualization
- SLA indicator
- Reviewer status

---

## 📈 Performance Monitoring

### Reviewer Metrics

File: `/lib/reviewer-matcher.ts`

**Tracked metrics:**
- Total reviews
- Completed reviews
- Declined reviews
- Average completion days
- Average quality rating
- Last review date

**Update function:**
```typescript
await updateReviewerStatistics(reviewerId);
```

---

## 🔐 Security & Permissions

### RBAC Integration

File: `/lib/workflow.ts`

```typescript
function getAvailableActions(status: SubmissionStatus, userRole: string)
```

**Permission hierarchy:**
- READER: View only
- AUTHOR: Submit, view own
- REVIEWER: Review assigned
- SECTION_EDITOR: Manage assigned section
- MANAGING_EDITOR: Full editorial control
- EIC: Final publication decision
- SYSADMIN: System management

---

## 🛠️ Configuration

### Environment Variables

```bash
# Cron job authentication
CRON_SECRET=your-secret-key

# Email configuration (already configured)
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

### Workflow Configuration

File: `/lib/workflow.ts`

```typescript
// Customize workflow transitions
export const WORKFLOW_TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  NEW: ['DESK_REJECT', 'UNDER_REVIEW'],
  // ... customize as needed
}
```

---

## 📝 Usage Examples

### 1. Gửi bài viết đi phản biện với auto-assignment

```typescript
// Auto-suggest reviewers
const suggestions = await fetch('/api/workflow/auto-assign', {
  method: 'POST',
  body: JSON.stringify({
    submissionId: 'xxx',
    limit: 5
  })
});

// Send to review with selected reviewers
await fetch('/api/workflow', {
  method: 'POST',
  body: JSON.stringify({
    submissionId: 'xxx',
    action: 'send_to_review',
    assignReviewers: ['reviewer1', 'reviewer2']
  })
});
```

### 2. Yêu cầu chỉnh sửa

```typescript
await fetch('/api/workflow', {
  method: 'POST',
  body: JSON.stringify({
    submissionId: 'xxx',
    action: 'request_revision',
    note: 'Vui lòng chỉnh sửa phần abstract và thêm tài liệu tham khảo'
  })
});
```

### 3. Tạo deadline thủ công

```typescript
await fetch('/api/deadlines', {
  method: 'POST',
  body: JSON.stringify({
    submissionId: 'xxx',
    type: 'INITIAL_REVIEW',
    dueDate: '2025-11-30T00:00:00Z',
    assignedTo: 'reviewerId',
    note: 'Phản biện vòng 1'
  })
});
```

---

## 🐛 Troubleshooting

### 1. Email không được gửi

- Kiểm tra SMTP config trong `.env`
- Xem logs: `console.error` trong `workflow-automator.ts`
- Test email: `POST /api/test-email`

### 2. Cron jobs không chạy

- Verify `CRON_SECRET` environment variable
- Check authorization header
- Test manual: `curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/reminders`

### 3. Auto-assignment không hoạt động

- Kiểm tra ReviewerProfile có đủ dữ liệu
- Verify keywords và expertise
- Check reviewer availability và workload

---

## 📚 API Reference

### POST /api/workflow
Thực hiện workflow action

### POST /api/workflow/auto-assign
Gợi ý và tự động gán reviewer

### GET /api/workflow/timeline
Lấy timeline events của submission

### GET /api/deadlines
Lấy danh sách deadlines

### POST /api/deadlines
Tạo deadline mới

### PATCH /api/deadlines
Đánh dấu deadline hoàn thành

### GET /api/cron/reminders
Gửi reminder emails (cron)

### GET /api/cron/check-overdue
Kiểm tra và cập nhật overdue status (cron)

---

## 🎉 Kết luận

Hệ thống Editorial Workflow & Automation đã được triển khai đầy đủ với:

✅ Submission Lifecycle Management
✅ Workflow Engine với Auto-transitions
✅ Smart Notifications (Email + In-app)
✅ Deadline Tracking với SLA monitoring
✅ Auto-Assignment cho Reviewers
✅ Timeline Visualization
✅ Comprehensive Dashboard
✅ Cron Jobs cho automation

Hệ thống sẵn sàng sử dụng và có thể mở rộng theo nhu cầu!
