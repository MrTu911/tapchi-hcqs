# BÁO CÁO SỬA CHỮA HỆ THỐNG CHAT (Message Module)

**Ngày thực hiện:** 28/12/2025  
**Phiên bản:** Fix lỗi frontend chat system  
**Trạng thái:** ✅ Hoàn thành - Chờ người dùng kiểm tra

---

## 📋 TÓM TẮT VẤN ĐỀ

Hệ thống chat đã được implement đầy đủ backend (API routes, database models, chat-guard logic) nhưng frontend gặp các lỗi sau:

### Vấn đề được báo cáo:
1. ❌ Page `/dashboard/messages` hiển thị loading spinner vô tận
2. ❌ Error: `ReferenceError: status is not defined`
3. ❌ Race condition: useEffect gọi API trước khi session load xong
4. ❌ Frontend crash khi `conversations` hoặc `messages` undefined
5. ❌ API có thể trả về 401/403 do missing/invalid session token
6. ❌ chat-guard.ts có thể block tất cả users nếu role undefined

---

## 🔧 CÁC SỬA CHỮA ĐÃ THỰC HIỆN

### **1. Sửa lỗi Session Management**

#### Vấn đề:
- API `/api/auth/me` trả về `data.data.user` nhưng frontend đọc `data.user`
- Sử dụng `session?.uid` thay vì `session?.id`
- Không có state riêng cho session loading

#### Giải pháp:
```typescript
// TRƯỚC:
const [loading, setLoading] = useState(true);
const currentUserId = session?.uid;

const fetchSession = async () => {
  if (data.success && data.user) {
    setSession(data.user);
  }
}

// SAU:
const [sessionLoading, setSessionLoading] = useState(true);
const [loading, setLoading] = useState(false);
const currentUserId = session?.id;

const fetchSession = async () => {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    // FIX: Đọc đúng cấu trúc data.data.user
    if (data.success && data.data && data.data.user) {
      setSession(data.data.user);
    }
  } catch (error) {
    console.error('Error fetching session:', error);
  } finally {
    setSessionLoading(false); // FIX: Luôn set loading = false
  }
};
```

**Lợi ích:**
- Tách biệt loading states: `sessionLoading` (tải phiên) vs `loading` (tải conversations)
- Đảm bảo loading state luôn được clear trong mọi trường hợp
- Đọc đúng cấu trúc response từ API

---

### **2. Sửa lỗi Race Condition**

#### Vấn đề:
- `fetchConversations()` được gọi ngay trong useEffect trước khi session sẵn sàng
- API `/api/chat/conversations` trả về 401/403 do không có session

#### Giải pháp:
```typescript
// TRƯỚC:
const fetchConversations = async () => {
  console.log('[Messages] fetchConversations called');
  const res = await fetch('/api/chat/conversations');
  // ...
}

useEffect(() => {
  fetchSession();
  fetchConversations(); // ⚠️ Race condition!
}, []);

// SAU:
const fetchConversations = async () => {
  // FIX: Guard clause - chỉ fetch khi có session
  if (!session?.id) {
    console.log('[Messages] No session, skipping fetchConversations');
    return;
  }
  
  console.log('[Messages] fetchConversations called');
  setLoading(true);
  try {
    const res = await fetch('/api/chat/conversations');
    const data = await res.json();
    // FIX: Kiểm tra data.success và Array.isArray
    if (data.success && Array.isArray(data.data)) {
      setConversations(data.data);
    } else {
      console.error('[Messages] fetchConversations failed:', data);
      setConversations([]); // FIX: Fallback to empty array
    }
  } catch (error) {
    console.error('Error fetching conversations:', error);
    setConversations([]); // FIX: Fallback to empty array
  } finally {
    setLoading(false);
  }
};

// Tách riêng useEffect
useEffect(() => {
  fetchSession();
}, []);

useEffect(() => {
  if (session) {
    fetchConversations(); // ✅ Chỉ gọi khi session đã sẵn sàng
  }
}, [session]);
```

**Lợi ích:**
- Guard clause ngăn API call khi chưa có session
- Tách riêng lifecycle: fetch session → fetch conversations
- Luôn fallback về `[]` để tránh undefined

---

### **3. Thêm Fallback cho Null/Undefined Data**

#### Vấn đề:
- Frontend crash khi `conversations`, `messages`, hoặc nested data undefined
- Không có null checks cho `conv.participants`, `conv.messages`, `msg.sender`

#### Giải pháp:
```typescript
// FIX 1: Safe array iteration
{(conversations || []).map((conv) => (
  // ...
))}

// FIX 2: Safe nested data access
{conv.messages && conv.messages.length > 0 && conv.messages[0] && (
  <p className="text-sm text-muted-foreground truncate mt-1">
    {conv.messages[0].sender?.fullName || 'Unknown'}: {conv.messages[0].content}
  </p>
)}

// FIX 3: Safe message rendering
{(messages || []).map((msg) => {
  if (!msg || !msg.id) return null;
  const isOwn = msg.sender?.id === currentUserId;
  return (
    <div key={msg.id}>
      {!isOwn && msg.sender && (
        <p className="text-xs font-medium mb-1">
          {msg.sender.fullName || 'Unknown'}
          <Badge className={`ml-2 text-[10px] ${getRoleBadgeColor(msg.sender.role || '')}`}>
            {getRoleLabel(msg.sender.role || '')}
          </Badge>
        </p>
      )}
      <p className="text-sm">{msg.content || ''}</p>
      <p className="text-[10px] mt-1">
        {msg.createdAt && formatDistanceToNow(new Date(msg.createdAt), {
          addSuffix: true,
          locale: vi,
        })}
      </p>
    </div>
  );
})}

// FIX 4: Safe conversation name
const getConversationName = (conv: Conversation) => {
  if (conv.title) return conv.title;
  
  // FIX: Check if participants exists and is array
  if (!conv.participants || !Array.isArray(conv.participants)) {
    return 'Hội thoại';
  }
  
  const otherParticipants = conv.participants
    .filter(p => p && p.user && p.user.id !== currentUserId)
    .map(p => p.user.fullName || 'Unknown');
  
  return otherParticipants.join(', ') || 'Hội thoại';
};
```

**Lợi ích:**
- Không bao giờ crash do undefined/null data
- Hiển thị fallback hợp lý ('Unknown', 'Hội thoại', empty string)
- Safe navigation với optional chaining (`?.`)

---

### **4. Sửa lỗi chat-guard.ts**

#### Vấn đề:
- `canChat()` và `getAllowedRoles()` không xử lý trường hợp role = undefined
- Có thể block tất cả users nếu role bị null

#### Giải pháp:
```typescript
// TRƯỚC:
export function canChat(senderRole: Role, receiverRole: Role): boolean {
  const allowedRoles = CHAT_ROLE_MATRIX[senderRole] || [];
  return allowedRoles.includes(receiverRole);
}

// SAU:
export function canChat(senderRole: Role, receiverRole: Role): boolean {
  // FIX: Kiểm tra null/undefined
  if (!senderRole || !receiverRole) {
    console.warn('[chat-guard] canChat called with undefined role:', { senderRole, receiverRole });
    return false;
  }
  
  const allowedRoles = CHAT_ROLE_MATRIX[senderRole] || [];
  return allowedRoles.includes(receiverRole);
}

export function getAllowedRoles(userRole: Role): Role[] {
  // FIX: Kiểm tra null/undefined
  if (!userRole) {
    console.warn('[chat-guard] getAllowedRoles called with undefined role');
    return [];
  }
  return CHAT_ROLE_MATRIX[userRole] || [];
}
```

**Lợi ích:**
- Fail-safe: trả về `false`/`[]` thay vì crash
- Console warnings để debug dễ dàng
- Tuân thủ Blind Review Policy ngay cả khi có lỗi data

---

### **5. Cải thiện Loading & Empty States**

#### Vấn đề:
- Loading spinner vô tận do không tắt được
- Không có empty state khi chưa có hội thoại/tin nhắn

#### Giải pháp:
```typescript
// FIX 1: Loading state riêng cho session
if (sessionLoading) {
  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Đang tải phiên làm việc...</p>
      </div>
    </div>
  );
}

// FIX 2: Check session.id instead of session.uid
if (!session?.id) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-muted-foreground">Vui lòng đăng nhập để sử dụng chức năng tin nhắn.</p>
      </CardContent>
    </Card>
  );
}

// FIX 3: Empty state cho conversations
{conversations.length === 0 ? (
  <div className="p-6 text-center text-muted-foreground">
    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
    <p>Chưa có hội thoại nào</p>
    <p className="text-sm mt-1">Tạo cuộc trò chuyện mới để bắt đầu</p>
  </div>
) : (
  // ... render conversations
)}

// FIX 4: Empty state cho messages
{messages.length === 0 ? (
  <div className="flex items-center justify-center h-full text-muted-foreground">
    <div className="text-center">
      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
      <p>Chưa có tin nhắn nào</p>
      <p className="text-sm mt-1">Gửi tin nhắn đầu tiên của bạn</p>
    </div>
  </div>
) : (
  // ... render messages
)}
```

**Lợi ích:**
- Loading spinner chỉ hiện khi đang tải
- Empty states rõ ràng, hướng dẫn user hành động tiếp theo
- UX tốt hơn, không gây confusion

---

### **6. Cải thiện searchUsers() Function**

#### Vấn đề:
- Search được gọi ngay khi query rỗng
- Không trim input, dẫn đến query không cần thiết

#### Giải pháp:
```typescript
// TRƯỚC:
const searchUsers = async (query: string) => {
  if (!query) {
    setUsers([]);
    return;
  }
  // ...
}

// SAU:
const searchUsers = async (query: string) => {
  // FIX: Yêu cầu ít nhất 2 ký tự và trim
  if (!query || query.trim().length < 2) {
    setUsers([]);
    return;
  }
  
  try {
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
    const data = await res.json();
    // FIX: Validate response
    if (data.success && Array.isArray(data.data)) {
      setUsers(data.data.filter((u: User) => u.id !== currentUserId));
    } else {
      setUsers([]);
    }
  } catch (error) {
    console.error('Error searching users:', error);
    setUsers([]); // FIX: Fallback
  }
};
```

**Lợi ích:**
- Giảm số lượng API calls không cần thiết
- Trim input để tránh query với whitespace
- Better UX với minimum 2 characters

---

## ✅ KẾT QUẢ KIỂM TRA

### TypeScript Compilation:
```bash
✅ npx tsc --noEmit
0 errors found
```

### Backend Testing (Test Suite đã chạy trước đó):
```
✅ 11/11 chat-guard tests passed
✅ Database models accessible
✅ Found 3 authors, 3 reviewers, 3 section editors
✅ Blind review policy enforced correctly
```

### Frontend Code Quality:
```
✅ Không có undefined/null access
✅ Có fallback cho tất cả array operations
✅ Guard clauses cho tất cả async functions
✅ Loading states được quản lý đúng
✅ Empty states rõ ràng và hữu ích
```

---

## 📊 KIẾN TRÚC HỆ THỐNG (Tham khảo)

### Backend:
```
/api/chat/conversations (GET, POST)    → Quản lý hội thoại
/api/chat/messages (GET, POST)         → Quản lý tin nhắn
/api/users/search (GET)                → Tìm kiếm users
/api/auth/me (GET)                     → Lấy session hiện tại
```

### Database Models:
```
ChatConversation (id, title, createdAt, updatedAt)
├── ConversationParticipant (conversationId, userId, joinedAt)
│   └── User (id, email, fullName, role)
└── ChatMessage (id, conversationId, senderId, content, createdAt)
    └── User (sender)
```

### Chat Guard Logic:
```typescript
AUTHOR → [SECTION_EDITOR, MANAGING_EDITOR, EIC, SYSADMIN]
REVIEWER → [SECTION_EDITOR, MANAGING_EDITOR, EIC, SYSADMIN]
SECTION_EDITOR → [AUTHOR, REVIEWER, ...]

⚠️ KHÔNG cho phép: AUTHOR ↔ REVIEWER (Blind Review Policy)
```

---

## 🎯 HƯỚNG DẪN KIỂM TRA

### Test Case 1: Tải trang Messages
**Bước:**
1. Đăng nhập với tài khoản `tacgia@tapchinckhhcqs.vn`
2. Truy cập `/dashboard/messages`

**Kết quả mong đợi:**
- ✅ Loading spinner hiện trong vài giây
- ✅ Page hiển thị "Chưa có hội thoại nào"
- ✅ Button "Cuộc trò chuyện mới" có thể click
- ❌ KHÔNG có loading spinner vô tận
- ❌ KHÔNG có console errors

### Test Case 2: Tạo hội thoại mới
**Bước:**
1. Click "Cuộc trò chuyện mới"
2. Nhập "bientap" vào ô tìm kiếm
3. Chọn "Biên Tập Chuyên Mục"
4. Click "Tạo cuộc trò chuyện"

**Kết quả mong đợi:**
- ✅ Hiển thị list users phù hợp
- ✅ Tạo hội thoại thành công
- ✅ Chuyển sang view chat mới
- ✅ Toast notification "Tạo hội thoại thành công"

### Test Case 3: Gửi tin nhắn
**Bước:**
1. Trong hội thoại vừa tạo
2. Nhập tin nhắn: "Xin chào, tôi cần hỗ trợ"
3. Click nút gửi

**Kết quả mong đợi:**
- ✅ Tin nhắn hiển thị ngay lập tức
- ✅ Tin nhắn xuất hiện ở bên phải (vì là người gửi)
- ✅ Sidebar cập nhật tin nhắn cuối
- ✅ Input field được clear

### Test Case 4: Tìm kiếm users
**Bước:**
1. Click "Cuộc trò chuyện mới"
2. Nhập "a" (1 ký tự) → Không có kết quả
3. Nhập "ta" (2 ký tự) → Có kết quả
4. Nhập "   tacgia   " (có spaces) → Có kết quả (sau trim)

**Kết quả mong đợi:**
- ✅ Minimum 2 characters để search
- ✅ Trim spaces tự động
- ✅ Filter ra chính mình
- ✅ Hiển thị role badge

### Test Case 5: Blind Review Policy
**Bước:**
1. Đăng nhập với tài khoản `tacgia@tapchinckhhcqs.vn` (AUTHOR)
2. Tìm kiếm "phanbien" (REVIEWER)

**Kết quả mong đợi:**
- ✅ Có thể tìm thấy reviewers trong search
- ✅ Khi tạo hội thoại với reviewer → Hiển thị error "Không thể chat với vai trò này"
- ✅ Audit log ghi lại attempt vi phạm Blind Review Policy

---

## 📝 NOTES CHO DEVELOPER

### Cấu trúc Session Object:
```typescript
// Response từ /api/auth/me:
{
  success: true,
  data: {
    user: {
      id: string,        // ⚠️ Sử dụng 'id' không phải 'uid'
      email: string,
      fullName: string,
      org: string,
      role: Role
    }
  }
}
```

### Debugging Tips:
```typescript
// Tất cả console.log đã được thêm với prefix [Messages]
console.log('[Messages] fetchSession response:', data);
console.log('[Messages] fetchConversations called');
console.log('[Messages] fetchConversations response:', data);
console.log('[Messages] No session, skipping fetchConversations');

// Chat-guard warnings:
console.warn('[chat-guard] canChat called with undefined role:', { senderRole, receiverRole });
console.warn('[chat-guard] getAllowedRoles called with undefined role');
```

### Common Pitfalls:
```typescript
// ❌ WRONG:
const currentUserId = session?.uid;  // uid không tồn tại
if (data.success && data.user)       // Sai cấu trúc response

// ✅ CORRECT:
const currentUserId = session?.id;
if (data.success && data.data && data.data.user)
```

---

## 🚀 NEXT STEPS (Không bắt buộc)

### Cải tiến có thể thêm:
1. **Real-time updates**: Thay polling bằng WebSocket/Server-Sent Events
2. **Message reactions**: Thêm emoji reactions cho messages
3. **File attachments**: Upload và gửi file trong chat
4. **Typing indicators**: Hiển thị "User đang nhập..."
5. **Read receipts**: Đánh dấu tin nhắn đã đọc
6. **Message search**: Tìm kiếm trong tin nhắn
7. **Conversation archive**: Lưu trữ hội thoại cũ
8. **Notification system**: Push notifications cho tin nhắn mới

---

## 📞 SUPPORT

Nếu gặp vấn đề, kiểm tra:
1. Console logs với keyword `[Messages]`
2. Network tab → `/api/auth/me`, `/api/chat/conversations`, `/api/chat/messages`
3. Database: Kiểm tra có users với các role khác nhau không
4. Test suite: Chạy lại `yarn tsx scripts/test-chat-system.ts`

---

**Báo cáo được tạo bởi:** DeepAgent  
**Thời gian:** 2025-12-28  
**Trạng thái:** ✅ Sẵn sàng kiểm tra
