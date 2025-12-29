# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG TẠP CHÍ ĐIỆN TỬ KHOA HỌC HẬU CẦN QUÂN SỰ

## MỤC LỤC

1. [Giới thiệu chung](#1-giới-thiệu-chung)
2. [Đăng nhập hệ thống](#2-đăng-nhập-hệ-thống)
3. [Hướng dẫn cho Tác giả](#3-hướng-dẫn-cho-tác-giả)
4. [Hướng dẫn cho Phản biện viên](#4-hướng-dẫn-cho-phản-biện-viên)
5. [Hướng dẫn cho Biên tập viên](#5-hướng-dẫn-cho-biên-tập-viên)
6. [Hướng dẫn cho Quản trị viên](#6-hướng-dẫn-cho-quản-trị-viên)
7. [Quản lý CMS](#7-quản-lý-cms)
8. [Tra cứu và tìm kiếm](#8-tra-cứu-và-tìm-kiếm)
9. [Câu hỏi thường gặp](#9-câu-hỏi-thường-gặp)

---

## 1. GIỚI THIỆU CHUNG

### 1.1. Về hệ thống

Tạp chí điện tử Khoa học Hậu cần quân sự là hệ thống quản lý xuất bản khoa học toàn diện, hỗ trợ quy trình từ nộp bài, phản biện, biên tập đến xuất bản trực tuyến.

### 1.2. Các vai trò trong hệ thống

| Vai trò | Mô tả | Quyền hạn chính |
|---------|-------|----------------|
| **SYSADMIN** | Quản trị viên hệ thống | Toàn quyền quản lý hệ thống, cấu hình, người dùng |
| **EIC** | Tổng biên tập (Editor-in-Chief) | Quản lý toàn bộ quy trình biên tập, xuất bản |
| **MANAGING_EDITOR** | Biên tập điều hành | Quản lý bài báo, giao phản biện, quyết định xuất bản |
| **SECTION_EDITOR** | Biên tập chuyên mục | Quản lý bài báo trong chuyên mục cụ thể |
| **AUTHOR** | Tác giả | Nộp bài, theo dõi tiến trình, chỉnh sửa |
| **REVIEWER** | Phản biện viên | Đánh giá, nhận xét bài báo |
| **SECURITY_AUDITOR** | Kiểm toán viên bảo mật | Xem nhật ký hệ thống, kiểm tra bảo mật |

### 1.3. Yêu cầu kỹ thuật

- **Trình duyệt**: Chrome/Edge (phiên bản mới nhất), Firefox 90+, Safari 14+
- **Kết nối Internet**: Tốc độ tối thiểu 5 Mbps
- **Màn hình**: Độ phân giải tối thiểu 1024x768
- **Email**: Địa chỉ email hợp lệ @tapchinckhhcqs.vn (cho tài khoản chính thức)

---

## 2. ĐĂNG NHẬP HỆ THỐNG

### 2.1. Truy cập hệ thống

1. Mở trình duyệt và truy cập: **https://tapchinckhhcqs.abacusai.app**
2. Nhấp vào nút **"Đăng nhập"** ở góc phải màn hình

### 2.2. Đăng nhập

1. Nhập **Email** và **Mật khẩu**
2. Nhấn **"Đăng nhập"**
3. Hệ thống sẽ tự động chuyển đến trang Dashboard tương ứng với vai trò của bạn

### 2.3. Tài khoản test (chỉ dùng cho môi trường thử nghiệm)

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | admin@tapchinckhhcqs.vn | TapChi@2025 |
| Tổng biên tập | eic@tapchinckhhcqs.vn | TapChi@2025 |
| Biên tập điều hành | managing.editor@tapchinckhhcqs.vn | TapChi@2025 |
| Biên tập viên | editor@tapchinckhhcqs.vn | TapChi@2025 |
| Tác giả | author@tapchinckhhcqs.vn | TapChi@2025 |
| Phản biện | reviewer@tapchinckhhcqs.vn | TapChi@2025 |
| Kiểm toán viên | auditor@tapchinckhhcqs.vn | TapChi@2025 |

### 2.4. Quên mật khẩu

1. Tại trang đăng nhập, nhấp vào **"Quên mật khẩu?"**
2. Nhập địa chỉ email đã đăng ký
3. Kiểm tra email để nhận link đặt lại mật khẩu
4. Nhấp vào link và tạo mật khẩu mới

### 2.5. Đổi mật khẩu

1. Sau khi đăng nhập, vào **Dashboard > Cài đặt > Bảo mật**
2. Nhập mật khẩu hiện tại
3. Nhập mật khẩu mới (tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt)
4. Xác nhận mật khẩu mới
5. Nhấn **"Cập nhật mật khẩu"**

---

## 3. HƯỚNG DẪN CHO TÁC GIẢ

### 3.1. Giao diện Dashboard Tác giả

Sau khi đăng nhập, bạn sẽ thấy:
- **Thống kê**: Tổng số bài viết, bài đang phản biện, đã chấp nhận, đã xuất bản
- **Biểu đồ**: Phân bố trạng thái bài viết
- **Bài viết gần đây**: Danh sách bài viết mới nhất của bạn

### 3.2. Nộp bài nghiên cứu mới

#### Bước 1: Chuẩn bị tài liệu

Trước khi nộp bài, hãy chuẩn bị:
- **Bản thảo chính** (định dạng PDF, DOC, DOCX - tối đa 10MB)
- **Thư xin đăng** (Cover Letter - nếu có)
- **Tài liệu bổ sung** (hình ảnh, bảng biểu, dữ liệu - nếu có)

#### Bước 2: Truy cập form nộp bài

1. Vào **Dashboard > Bài viết của tôi**
2. Nhấn nút **"Tạo bài mới"** (góc phải)

#### Bước 3: Điền thông tin bài báo

**Thông tin cơ bản:**
- **Tiêu đề** (tiếng Việt) - bắt buộc
- **Title** (tiếng Anh) - bắt buộc
- **Danh mục**: Chọn chuyên mục phù hợp
- **Từ khóa**: Tối thiểu 3 từ khóa, cách nhau bởi dấu phẩy

**Tóm tắt:**
- **Tóm tắt tiếng Việt**: 150-300 từ
- **Abstract (tiếng Anh)**: 150-300 từ

**Tải file:**
- Nhấn **"Chọn file"** để tải lên bản thảo
- Hỗ trợ: PDF, DOC, DOCX (tối đa 10MB)
- Có thể tải thêm tài liệu bổ sung

#### Bước 4: Xác nhận và gửi

1. Kiểm tra lại toàn bộ thông tin
2. Đánh dấu vào ô **"Tôi xác nhận đây là nghiên cứu gốc"**
3. Nhấn **"Gửi bài"**
4. Hệ thống sẽ hiển thị **mã bài viết** (lưu lại để theo dõi)

### 3.3. Theo dõi tiến trình phản biện

#### Xem chi tiết bài viết

1. Vào **Dashboard > Bài viết của tôi**
2. Nhấp vào tên bài viết cần xem
3. Màn hình chi tiết sẽ hiển thị:
   - **Trạng thái hiện tại** (đang chờ, đang phản biện, cần chỉnh sửa, chấp nhận, từ chối)
   - **Timeline**: Lịch sử các sự kiện của bài viết
   - **File đã tải lên**: Bản thảo và tài liệu bổ sung

#### Các trạng thái bài viết

| Trạng thái | Ý nghĩa | Hành động cần làm |
|------------|---------|-------------------|
| **SUBMITTED** | Mới nộp, chờ biên tập xem xét | Chờ phản hồi |
| **UNDER_REVIEW** | Đang được phản biện | Chờ kết quả phản biện |
| **REVISION** | Cần chỉnh sửa theo ý kiến phản biện | **Nộp bản chỉnh sửa** |
| **ACCEPTED** | Đã chấp nhận, chuẩn bị xuất bản | Chờ xuất bản |
| **REJECTED** | Không đủ điều kiện xuất bản | Kết thúc quy trình |
| **PUBLISHED** | Đã xuất bản trên tạp chí | Hoàn tất |

### 3.4. Nộp bản chỉnh sửa

#### Khi nào cần nộp bản chỉnh sửa?

Khi trạng thái bài viết là **"REVISION"** (Yêu cầu chỉnh sửa), bạn cần:
1. Đọc kỹ nhận xét của phản biện viên
2. Chỉnh sửa bản thảo theo yêu cầu
3. Chuẩn bị **thư trả lời phản biện** (Response Letter) giải thích các thay đổi

#### Các bước nộp bản chỉnh sửa:

1. Vào **Dashboard > Bài viết của tôi**
2. Mở bài viết có trạng thái **"REVISION"**
3. Nhấn nút **"Nộp bản chỉnh sửa"**
4. Tải lên:
   - **Bản thảo đã chỉnh sửa** (file mới)
   - **Thư trả lời phản biện** (Response Letter - PDF)
   - **Bản Track Changes** (nếu có - để dễ so sánh)
5. Điền **Ghi chú chỉnh sửa**: Tóm tắt các thay đổi chính
6. Nhấn **"Gửi bản chỉnh sửa"**

### 3.5. Giao tiếp với Biên tập viên

#### Hộp tin nhắn (Message Box)

1. Tại trang chi tiết bài viết, cuộn xuống phần **"Tin nhắn"**
2. Nhập nội dung cần trao đổi với biên tập viên
3. Nhấn **"Gửi tin nhắn"**
4. Bạn sẽ nhận được email thông báo khi có phản hồi

**Lưu ý:**
- Trong chế độ **Phản biện kín** (Blind Review), bạn **KHÔNG** nhìn thấy tên phản biện viên
- Chỉ giao tiếp với biên tập viên qua hệ thống, không gửi email riêng

### 3.6. Cập nhật hồ sơ cá nhân

1. Vào **Dashboard > Cài đặt > Hồ sơ**
2. Cập nhật thông tin:
   - **Họ tên đầy đủ**
   - **Đơn vị công tác** (tổ chức/trường)
   - **ORCID ID** (nếu có)
   - **Bio**: Giới thiệu ngắn về bản thân
   - **Lĩnh vực nghiên cứu**: Các lĩnh vực chuyên môn
3. Nhấn **"Lưu thay đổi"**

### 3.7. Xem bài viết đã xuất bản

#### Trên Dashboard:
1. Vào **Dashboard > Bài viết của tôi**
2. Lọc theo trạng thái **"PUBLISHED"**
3. Nhấp vào bài viết để xem chi tiết

#### Trên trang công khai:
1. Vào **Trang chủ > Tạp chí > Số mới nhất** hoặc **Kho lưu trữ**
2. Tìm và nhấp vào bài viết của bạn
3. Bạn sẽ thấy:
   - **Toàn văn bài báo** (PDF)
   - **Số lượt xem** và **lượt tải về**
   - **Cách trích dẫn** (APA, MLA, IEEE, BibTeX)

---

## 4. HƯỚNG DẪN CHO PHẢN BIỆN VIÊN

### 4.1. Giao diện Dashboard Phản biện viên

Sau khi đăng nhập, bạn sẽ thấy:
- **Danh sách bài cần phản biện**: Bài mới được giao
- **Tiến độ phản biện**: Số bài đã hoàn thành, đang làm, quá hạn
- **Lịch sử phản biện**: Các bài đã phản biện trước đó

### 4.2. Nhận bài phản biện

Khi biên tập viên giao bài cho bạn:
1. Bạn sẽ nhận **email thông báo**
2. Bài viết xuất hiện trong **Dashboard > Phản biện > Bài cần phản biện**
3. Bạn có **14 ngày** (mặc định) để hoàn thành phản biện

### 4.3. Quy trình phản biện

#### Bước 1: Mở bài viết

1. Vào **Dashboard > Phản biện > Bài cần phản biện**
2. Nhấp vào bài viết cần phản biện
3. Màn hình sẽ hiển thị:
   - **Thông tin bài viết**: Tiêu đề, tóm tắt, từ khóa
   - **Bản thảo PDF**: Trình đọc PDF tích hợp
   - **Form phản biện**: Mẫu đánh giá

**Lưu ý về Phản biện kín (Blind Review):**
- Trong chế độ **Single Blind**: Bạn biết tên tác giả, nhưng tác giả không biết tên bạn
- Trong chế độ **Double Blind**: Bạn không biết tên tác giả, và tác giả không biết tên bạn

#### Bước 2: Đọc và đánh giá bài viết

**Các tiêu chí đánh giá:**

1. **Tính mới và quan trọng của nghiên cứu** (1-5 điểm)
2. **Phương pháp nghiên cứu** (1-5 điểm)
3. **Kết quả và phân tích** (1-5 điểm)
4. **Cấu trúc và trình bày** (1-5 điểm)
5. **Tài liệu tham khảo** (1-5 điểm)

#### Bước 3: Điền form phản biện

1. **Chọn đề xuất**: 
   - ✅ **Chấp nhận** (Accept)
   - 📝 **Chấp nhận có chỉnh sửa nhỏ** (Minor Revision)
   - 🔄 **Yêu cầu chỉnh sửa lớn** (Major Revision)
   - ❌ **Từ chối** (Reject)

2. **Điền nhận xét**:
   - **Nhận xét cho Tác giả**: Những điểm mạnh, điểm yếu, đề xuất cải thiện (hiển thị cho tác giả)
   - **Nhận xét cho Biên tập viên**: Đánh giá tổng quan, lý do đề xuất (chỉ biên tập viên thấy)

3. **Cho điểm tổng thể**: Từ 1-10

#### Bước 4: Gửi phản biện

1. Kiểm tra lại toàn bộ đánh giá
2. Nhấn **"Gửi phản biện"**
3. Hệ thống sẽ gửi email xác nhận cho bạn và thông báo cho biên tập viên

### 4.4. Mẫu nhận xét phản biện

#### Cấu trúc nhận xét chuẩn:

```
1. TÓM TẮT BÀI VIẾT
   - Nội dung chính của bài báo (2-3 câu)

2. ĐIỂM MẠNH
   - Điểm tích cực của nghiên cứu
   - Những đóng góp quan trọng

3. ĐIỂM YẾU VÀ ĐỀ XUẤT CHỈNH SỬA
   - Vấn đề 1: [Mô tả vấn đề] → Đề xuất: [Cách khắc phục]
   - Vấn đề 2: [Mô tả vấn đề] → Đề xuất: [Cách khắc phục]
   - ...

4. LỖI NHỎ CẦN SỬA
   - Lỗi chính tả, ngữ pháp
   - Định dạng trích dẫn
   - Chất lượng hình ảnh

5. KẾT LUẬN
   - Đề xuất cuối cùng: Chấp nhận/Chỉnh sửa/Từ chối
```

### 4.5. Xử lý yêu cầu phản biện lại (Re-review)

Nếu tác giả nộp bản chỉnh sửa:
1. Bạn sẽ nhận email thông báo
2. Bài viết xuất hiện lại trong **Bài cần phản biện**
3. Hệ thống hiển thị:
   - **Nhận xét của bạn lần trước**
   - **Thư trả lời** của tác giả
   - **Bản thảo mới** (có highlight thay đổi)
4. Đánh giá xem tác giả đã khắc phục đầy đủ chưa
5. Gửi phản biện mới

### 4.6. Quản lý thời gian phản biện

- Thời hạn phản biện mặc định: **14 ngày**
- Nếu cần thêm thời gian:
  1. Vào trang chi tiết bài viết
  2. Nhấn **"Yêu cầu gia hạn"**
  3. Điền lý do và thời gian cần thêm
  4. Biên tập viên sẽ xem xét và phản hồi

---

## 5. HƯỚNG DẪN CHO BIÊN TẬP VIÊN

### 5.1. Giao diện Dashboard Biên tập viên

Dashboard hiển thị:
- **Bài mới nộp**: Cần xem xét và giao phản biện
- **Bài đang phản biện**: Theo dõi tiến độ
- **Bài cần quyết định**: Đã có phản biện, cần quyết định xuất bản
- **Thống kê**: Tổng số bài, tỷ lệ chấp nhận, thời gian xử lý trung bình

### 5.2. Xử lý bài mới nộp

#### Bước 1: Kiểm tra sơ bộ

1. Vào **Dashboard > Quản lý bài viết > Bài mới nộp**
2. Nhấp vào bài viết để xem chi tiết
3. Kiểm tra:
   - ✅ Tiêu đề, tóm tắt rõ ràng
   - ✅ Chuyên mục phù hợp
   - ✅ Định dạng bản thảo đúng
   - ✅ Nội dung phù hợp với tạp chí

#### Bước 2: Quyết định xử lý

**Tùy chọn 1: Giao phản biện**
1. Nhấn **"Gửi phản biện"**
2. Chọn phản biện viên từ danh sách (tối thiểu 2 người)
3. Đặt thời hạn phản biện (mặc định 14 ngày)
4. Nhấn **"Giao phản biện"**

**Tùy chọn 2: Từ chối nhanh (Desk Reject)**
Nếu bài không phù hợp:
1. Nhấn **"Từ chối"**
2. Chọn lý do: Ngoài phạm vi tạp chí, Chất lượng kém, Đã xuất bản nơi khác...
3. Viết thông báo cho tác giả
4. Nhấn **"Xác nhận từ chối"**

### 5.3. Quản lý phản biện viên

#### Danh sách phản biện viên

1. Vào **Dashboard > Quản lý > Phản biện viên**
2. Xem thông tin:
   - Lĩnh vực chuyên môn
   - Số bài đã phản biện
   - Tỷ lệ hoàn thành đúng hạn
   - Trạng thái (đang bận, sẵn sàng)

#### Thêm phản biện viên mới

1. Nhấn **"Thêm phản biện viên"**
2. Điền thông tin:
   - Họ tên
   - Email
   - Đơn vị
   - Học hàm, học vị
   - Lĩnh vực chuyên môn
3. Nhấn **"Lưu"**
4. Hệ thống tự động gửi email mời tham gia

### 5.4. Theo dõi tiến độ phản biện

1. Vào **Dashboard > Quản lý bài viết > Đang phản biện**
2. Xem trạng thái từng phản biện viên:
   - 🟢 **Đã hoàn thành**
   - 🟡 **Đang thực hiện**
   - 🔴 **Quá hạn**
3. Nếu phản biện viên quá hạn:
   - Nhấn **"Nhắc nhở"** để gửi email tự động
   - Hoặc **"Giao lại"** cho phản biện viên khác

### 5.5. Ra quyết định biên tập

#### Khi đủ phản biện (thường 2-3 người):

1. Vào **Dashboard > Quản lý bài viết > Cần quyết định**
2. Mở bài viết, xem tổng hợp:
   - Đề xuất của từng phản biện viên
   - Điểm đánh giá
   - Nhận xét chi tiết

3. Đưa ra quyết định:

| Quyết định | Khi nào áp dụng | Hành động tiếp theo |
|------------|----------------|---------------------|
| **Chấp nhận** | Tất cả phản biện đồng ý, không có vấn đề lớn | Chuyển sang sản xuất, xuất bản |
| **Chỉnh sửa nhỏ** | Có một số lỗi nhỏ, không ảnh hưởng nội dung | Tác giả chỉnh sửa, không cần phản biện lại |
| **Chỉnh sửa lớn** | Có vấn đề quan trọng cần sửa | Tác giả chỉnh sửa, gửi lại phản biện |
| **Từ chối** | Phản biện đều không đồng ý, hoặc có vấn đề nghiêm trọng | Kết thúc quy trình |

4. Nhấn **"Quyết định"**, chọn loại quyết định
5. Viết **thư thông báo** cho tác giả:
   - Tóm tắt ý kiến phản biện
   - Giải thích quyết định
   - Hướng dẫn các bước tiếp theo
6. Nhấn **"Gửi quyết định"**

### 5.6. Quản lý số tạp chí (Issue)

#### Tạo số mới

1. Vào **Dashboard > Tạp chí > Quản lý số**
2. Nhấn **"Tạo số mới"**
3. Điền thông tin:
   - **Tập** (Volume): Ví dụ: 2025
   - **Số** (Number): Ví dụ: 1, 2, 3...
   - **Năm**: 2025
   - **Tiêu đề**: "Số 01/2025"
   - **Mô tả**: Giới thiệu ngắn về số này
   - **Bìa số** (Cover Image): Tải lên ảnh bìa (JPG/PNG, tối đa 5MB)
   - **DOI**: Nếu có
   - **Ngày xuất bản**: Chọn ngày
4. Nhấn **"Tạo số"**

#### Thêm bài vào số

1. Mở số tạp chí vừa tạo
2. Nhấn **"Thêm bài viết"**
3. Chọn các bài đã **chấp nhận** từ danh sách
4. Sắp xếp thứ tự bài viết (kéo thả)
5. Nhấn **"Lưu"**

#### Xuất bản số

1. Kiểm tra lại toàn bộ bài viết trong số
2. Nhấn **"Xuất bản số"**
3. Xác nhận xuất bản
4. Hệ thống tự động:
   - Cập nhật trạng thái bài viết thành **PUBLISHED**
   - Hiển thị số mới trên trang công khai
   - Gửi email thông báo cho tác giả

### 5.7. Thống kê và báo cáo

#### Dashboard Analytics

1. Vào **Dashboard > Thống kê & Phân tích**
2. Xem các chỉ số:
   - **Tổng số bài nộp**: Theo tháng, quý, năm
   - **Tỷ lệ chấp nhận**: % bài được xuất bản
   - **Thời gian xử lý trung bình**: Từ nộp đến quyết định
   - **Biểu đồ xu hướng**: Số bài nộp theo thời gian
   - **Top danh mục**: Chuyên mục có nhiều bài nhất

#### Xuất báo cáo

1. Vào **Dashboard > Báo cáo**
2. Chọn bộ lọc:
   - Khoảng thời gian
   - Danh mục
   - Tác giả
   - Trạng thái
3. Nhấn **"Xuất báo cáo"**
4. Chọn định dạng:
   - **PDF**: Báo cáo tổng hợp, có biểu đồ
   - **Excel**: Dữ liệu chi tiết, có thống kê

---

## 6. HƯỚNG DẪN CHO QUẢN TRỊ VIÊN

### 6.1. Giao diện Dashboard Quản trị viên

Quản trị viên có quyền truy cập đầy đủ:
- Quản lý người dùng
- Cấu hình hệ thống
- Quản lý CMS (nội dung website)
- Xem nhật ký bảo mật
- Sao lưu và khôi phục dữ liệu

### 6.2. Quản lý người dùng

#### Xem danh sách người dùng

1. Vào **Dashboard > Quản lý > Người dùng**
2. Bảng hiển thị:
   - Họ tên, Email
   - Vai trò
   - Trạng thái (Chờ duyệt, Đang hoạt động, Vô hiệu hóa)
   - Ngày tạo

#### Thêm người dùng mới

1. Nhấn **"Thêm người dùng"**
2. Điền thông tin:
   - Email (bắt buộc)
   - Họ tên đầy đủ
   - Vai trò: Chọn 1 trong 7 vai trò
   - Đơn vị
   - Học hàm, học vị (nếu là phản biện viên)
3. Nhấn **"Tạo tài khoản"**
4. Hệ thống gửi email với link kích hoạt và đặt mật khẩu cho người dùng

#### Chỉnh sửa người dùng

1. Nhấp vào tên người dùng hoặc nút **"Chỉnh sửa"**
2. Có thể thay đổi:
   - Vai trò
   - Trạng thái (Vô hiệu hóa tài khoản)
   - Thông tin cá nhân
3. Nhấn **"Cập nhật"**

#### Xóa người dùng

1. Chọn người dùng cần xóa
2. Nhấn **"Xóa"**
3. **Cảnh báo**: Hành động này không thể hoàn tác
4. Xác nhận xóa

### 6.3. Quản lý danh mục (Categories)

#### Xem danh sách danh mục

1. Vào **Dashboard > Quản lý > Danh mục**
2. Xem thống kê:
   - Tổng số danh mục
   - Tổng số bài viết
   - Trung bình bài/danh mục

#### Thêm danh mục mới

1. Nhấn **"Thêm danh mục"**
2. Điền:
   - **Mã danh mục**: Ví dụ: "LOG" (Logistics)
   - **Tên tiếng Việt**: "Hậu cần - Logistics"
   - **Tên tiếng Anh**: "Logistics"
   - **Slug**: Tự động tạo từ tên (có thể chỉnh sửa)
   - **Mô tả**: Giới thiệu về danh mục
3. Nhấn **"Lưu"**

#### Chỉnh sửa/Xóa danh mục

- **Chỉnh sửa**: Nhấn biểu tượng ✏️
- **Xóa**: Nhấn biểu tượng 🗑️
  - ⚠️ Không thể xóa danh mục đang có bài viết

### 6.4. Cấu hình phản biện

1. Vào **Dashboard > Quản trị > Cài đặt phản biện**
2. Chọn **Chế độ phản biện kín**:
   - **Không ẩn danh** (Open Review): Tất cả đều biết nhau
   - **Ẩn danh đơn** (Single Blind): Phản biện biết tác giả, tác giả không biết phản biện
   - **Ẩn danh kép** (Double Blind): Cả hai đều không biết nhau
3. Cấu hình:
   - **Số phản biện viên tối thiểu**: Mặc định 2
   - **Thời hạn phản biện**: Mặc định 14 ngày
   - **Tự động giao phản biện**: Bật/Tắt
4. Nhấn **"Lưu cài đặt"**

### 6.5. Xem nhật ký kiểm toán (Audit Logs)

1. Vào **Dashboard > Bảo mật > Nhật ký kiểm toán**
2. Bộ lọc:
   - **Thời gian**: Từ ngày đến ngày
   - **Loại sự kiện**: Đăng nhập, Tạo bài, Phản biện, Xuất bản...
   - **Người dùng**: Lọc theo email
3. Xem chi tiết:
   - Thời gian
   - Người thực hiện
   - Hành động
   - IP Address
   - Dữ liệu trước/sau (nếu có)
4. Có thể **Xuất Excel** để lưu trữ

### 6.6. Sao lưu và khôi phục dữ liệu

#### Sao lưu tự động

Hệ thống tự động sao lưu database mỗi ngày lúc 2:00 AM (giờ server)
- File backup lưu tại: `backups/db_YYYY-MM-DD_HH-mm-ss.sql.gz`
- Lưu giữ 30 ngày gần nhất

#### Sao lưu thủ công

1. Vào **Dashboard > Hệ thống > Sao lưu**
2. Nhấn **"Sao lưu ngay"**
3. Chờ hệ thống tạo file backup
4. Nhấn **"Tải về"** để lưu vào máy tính

#### Khôi phục dữ liệu

⚠️ **CẢNH BÁO**: Khôi phục sẽ **XÓA TOÀN BỘ** dữ liệu hiện tại!

1. Vào **Dashboard > Hệ thống > Khôi phục**
2. Chọn file backup (`.sql` hoặc `.sql.gz`)
3. Nhấn **"Khôi phục"**
4. Xác nhận hành động
5. Hệ thống sẽ:
   - Dừng tất cả dịch vụ
   - Xóa database cũ
   - Nhập dữ liệu từ backup
   - Khởi động lại dịch vụ

---

## 7. QUẢN LÝ CMS

### 7.1. Giới thiệu CMS

Hệ thống CMS cho phép quản trị viên và biên tập viên **chỉnh sửa nội dung website mà không cần code**, bao gồm:
- Banner trang chủ
- Menu điều hướng
- Bố cục trang chủ
- Trang tĩnh (Giới thiệu, Liên hệ...)
- Tin tức
- Video/Media
- Cài đặt website

### 7.2. Quản lý Banner

#### Tạo banner mới

1. Vào **Dashboard > CMS > Banners**
2. Nhấn **"Thêm Banner"**
3. Điền thông tin:

**Nội dung:**
- **Tiêu đề chính** (VN/EN)
- **Tiêu đề phụ** (VN/EN)
- **Văn bản nút** (VN/EN): Ví dụ: "Xem thêm"
- **Liên kết**: URL khi nhấp vào banner
- **Mục tiêu**: 
  - `_self`: Mở trong cùng tab
  - `_blank`: Mở tab mới

**Hình ảnh:**
- Nhấn **"Chọn hình"**
- Tải ảnh lên (JPG/PNG, tối đa 5MB)
- **Kích thước khuyến nghị**:
  - Desktop: 1920x600px
  - Tablet: 1024x400px
  - Mobile: 768x300px

**Cài đặt hiển thị:**
- **Thiết bị**: Desktop, Tablet, Mobile (hoặc Tất cả)
- **Vị trí**: Thứ tự hiển thị (1, 2, 3...)
- **Lên lịch**: 
  - Ngày bắt đầu
  - Ngày kết thúc (để trống = vô thời hạn)
- **Trạng thái**: Kích hoạt/Vô hiệu hóa

4. Nhấn **"Lưu"**

### 7.3. Quản lý Menu điều hướng

1. Vào **Dashboard > CMS > Menu điều hướng**
2. Xem danh sách menu hiện tại
3. **Sắp xếp thứ tự**: Kéo thả để thay đổi vị trí
4. **Thêm mục menu mới**:
   - Nhấn **"Thêm mục"**
   - Nhập:
     - **Nhãn**: Tên hiển thị (VN/EN)
     - **URL**: Đường dẫn (ví dụ: `/about`, `/archive`)
     - **Vị trí**: Thứ tự
   - Nhấn **"Lưu"**
5. **Chỉnh sửa/Xóa**: Nhấn biểu tượng tương ứng

### 7.4. Quản lý Trang chủ

#### Bố cục trang chủ (Homepage Sections)

1. Vào **Dashboard > CMS > Trang chủ**
2. Tab **"Homepage Sections"**
3. Xem danh sách các phần:
   - Hero Banner
   - Số mới nhất
   - Tin tức
   - Video
   - Tìm kiếm
   - Tác giả nổi bật
   - ...

4. **Bật/Tắt phần**:
   - Chuyển nút **Kích hoạt/Vô hiệu hóa**
   - Phần bị tắt sẽ không hiển thị trên trang chủ

5. **Sắp xếp thứ tự**:
   - Kéo thả các phần để thay đổi vị trí
   - Nhấn **"Lưu thứ tự"**

6. **Chỉnh sửa nội dung phần**:
   - Nhấn **"Chỉnh sửa"** trên phần cần thay đổi
   - Cập nhật:
     - Tiêu đề
     - Tiêu đề phụ
     - Nội dung
     - Hình ảnh
     - Liên kết
   - Nhấn **"Cập nhật"**

### 7.5. Quản lý Trang tĩnh (Public Pages)

#### Danh sách trang

1. Vào **Dashboard > CMS > Trang tĩnh**
2. Xem các trang:
   - Giới thiệu (About)
   - Liên hệ (Contact)
   - Quy trình xuất bản (Publishing Process)
   - Giấy phép (License)
   - Hướng dẫn (Guidelines)

#### Chỉnh sửa trang

1. Nhấp vào tên trang
2. **Editor nội dung** (Modern Editor):
   - Hỗ trợ định dạng phong phú (tiêu đề, danh sách, bảng, hình ảnh...)
   - Sử dụng **Slash Commands**:
     - Gõ `/` để mở menu lệnh
     - `/heading1` → Tiêu đề cấp 1
     - `/image` → Chèn hình ảnh
     - `/table` → Tạo bảng
   - **Bubble Menu**: Bôi đen văn bản để hiện menu định dạng nhanh

3. **SEO Metadata**:
   - **Meta Title**: Tiêu đề cho Google (50-60 ký tự)
   - **Meta Description**: Mô tả ngắn (150-160 ký tự)
   - **OG Image**: Ảnh hiển thị khi chia sẻ Facebook

4. **Xuất bản**:
   - Bật **"Xuất bản"**
   - Chọn **Ngày xuất bản**
   - Nhấn **"Lưu thay đổi"**

### 7.6. Quản lý Tin tức (News)

#### Tạo tin tức mới

1. Vào **Dashboard > CMS > Tin tức**
2. Nhấn **"Tạo tin mới"**
3. Điền:

**Nội dung chính:**
- **Tiêu đề** (VN/EN)
- **Tóm tắt ngắn** (150-200 từ)
- **Nội dung đầy đủ** (VN/EN): Sử dụng Modern Editor

**Ảnh bìa:**
- Nhấn **"Tải ảnh bìa"**
- Chọn ảnh (JPG/PNG, tối đa 5MB)
- Kích thước khuyến nghị: 1200x630px

**Phân loại:**
- **Danh mục**: Chọn chuyên mục
- **Tags**: Nhập các từ khóa, cách nhau bằng dấu phẩy

**Xuất bản:**
- **Nổi bật**: Hiển thị ở vị trí nổi bật trang chủ
- **Trạng thái**: Bản nháp/Xuất bản
- **Ngày xuất bản**: Chọn ngày

4. Nhấn **"Lưu tin tức"**

### 7.7. Quản lý Video

#### Thêm video

1. Vào **Dashboard > CMS > Video**
2. Nhấn **"Thêm Video"**
3. Chọn 1 trong 2 cách:

**Cách 1: Tải video lên**
- Tab **"Upload File"**
- Chọn file video (MP4, WebM, OGG - tối đa 100MB)
- Xem trước video
- Nhấn **"Tải lên"**

**Cách 2: Nhúng YouTube**
- Tab **"YouTube"**
- Dán URL video YouTube
- Hệ thống tự động trích xuất ID

4. Điền thông tin:
- **Tiêu đề** (VN/EN)
- **Mô tả** (VN/EN)
- **Danh mục**: Chọn loại video
- **Tags**: Từ khóa
- **Nổi bật**: Hiển thị ở trang chủ
- **Trạng thái**: Kích hoạt/Vô hiệu hóa

5. Nhấn **"Lưu video"**

### 7.8. Thư viện Media

#### Tải file lên

1. Vào **Dashboard > CMS > Thư viện Media**
2. Nhấn **"Tải lên"**
3. Chọn file (JPG, PNG, GIF, WebP - tối đa 10MB)
4. Điền:
   - **Tiêu đề**: Tên file
   - **Alt Text**: Mô tả cho SEO và accessibility
   - **Danh mục**: banner, news, article, profile...
5. Nhấn **"Tải lên"**

#### Sử dụng Media Picker

Khi chỉnh sửa nội dung (News, Pages), nhấn nút **"Chèn ảnh"**:
1. Cửa sổ Media Picker hiện ra
2. Tìm kiếm hoặc lọc theo danh mục
3. Nhấp chọn ảnh
4. Hoặc tải ảnh mới lên trực tiếp
5. Nhấn **"Chèn"**

### 7.9. Cài đặt Website (Site Settings)

1. Vào **Dashboard > CMS > Cài đặt Website**
2. Các tab cài đặt:

#### Tab "Chung" (General)
- **Tên tạp chí** (VN/EN)
- **Slogan** (VN/EN)
- **Logo**: Tải logo chính (PNG với nền trong suốt)
- **Favicon**: Icon 32x32px

#### Tab "Liên hệ" (Contact)
- **Email liên hệ**
- **Số điện thoại**
- **Địa chỉ**
- **Giờ làm việc**

#### Tab "Mạng xã hội" (Social Media)
- **Facebook URL**
- **Twitter URL**
- **LinkedIn URL**
- **YouTube URL**

#### Tab "SEO"
- **Meta Title mặc định**
- **Meta Description mặc định**
- **Google Analytics ID**
- **Google Search Console Code**

#### Tab "Giao diện" (Appearance)
- **Màu chủ đạo**: Chọn màu (color picker)
- **Màu phụ**
- **Font chữ**: Chọn từ danh sách

#### Tab "Footer"
- **Văn bản Footer** (VN/EN)
- **Copyright text**
- **Các liên kết nhanh**

3. Sau khi chỉnh sửa, nhấn **"Lưu thay đổi"**

---

## 8. TRA CỨU VÀ TÌM KIẾM

### 8.1. Tìm kiếm cơ bản

1. Tại **Trang chủ**, nhập từ khóa vào ô **"Tìm kiếm"**
2. Nhấn **Enter** hoặc nút **🔍**
3. Kết quả hiển thị:
   - Tiêu đề bài viết
   - Tác giả
   - Tóm tắt
   - **Điểm liên quan** (Relevance Score)
4. Nhấp vào bài viết để xem chi tiết

### 8.2. Tìm kiếm nâng cao

1. Vào **Trang chủ > Tìm kiếm nâng cao**
2. Điền các tiêu chí:

| Trường | Mô tả | Ví dụ |
|--------|-------|-------|
| **Từ khóa chung** | Tìm trong toàn bộ bài | "logistics" |
| **Tiêu đề** | Chỉ tìm trong tiêu đề | "supply chain" |
| **Tác giả** | Tên tác giả | "Nguyễn Văn A" |
| **Đơn vị** | Tổ chức của tác giả | "Học viện Hậu cần" |
| **Danh mục** | Chọn chuyên mục | "Hậu cần quân sự" |
| **Năm** | Khoảng thời gian | Từ 2020 đến 2025 |
| **Từ khóa cụ thể** | Tags của bài viết | "optimization" |

3. Nhấn **"Tìm kiếm"**
4. Kết quả có thể:
   - **Sắp xếp**: Theo mức độ liên quan, ngày xuất bản, lượt xem
   - **Lọc thêm**: Theo danh mục, năm

### 8.3. Duyệt theo danh mục

1. Vào **Trang chủ > Danh mục**
2. Chọn danh mục quan tâm:
   - Hậu cần - Logistics
   - Kinh tế quốc phòng
   - Trang bị kỹ thuật
   - Quản lý nhà nước
   - ...
3. Xem tất cả bài viết trong danh mục
4. Có thể lọc thêm theo năm

### 8.4. Kho lưu trữ (Archive)

1. Vào **Trang chủ > Kho lưu trữ**
2. Xem 3 cấp thông tin:

**Cấp 1: Thống kê tổng quan**
- Tổng số tạp chí đã xuất bản
- Tổng số bài báo
- Tổng số tác giả
- Lượt xem, lượt tải về

**Cấp 2: Số tạp chí theo năm**
- Xem ảnh bìa số
- Số tập/số
- Số bài viết
- Nhấn **"Xem PDF Flipbook"** để đọc toàn bộ số
- Nhấn **"Xem mục lục"** để xem danh sách bài

**Cấp 3: Bảng tìm kiếm bài viết**
- **Tìm kiếm**: Nhập tiêu đề hoặc tên tác giả
- **Lọc**: Chọn danh mục, năm xuất bản
- **Bảng kết quả**: 10 bài/trang
- **Tải về**: Nhấn nút 📥 để tải PDF từng bài

### 8.5. Xem chi tiết bài viết

#### Thông tin hiển thị:
- **Tiêu đề** (VN/EN)
- **Tác giả** và đơn vị
- **Danh mục**
- **Ngày xuất bản**
- **DOI** (nếu có)
- **Tóm tắt** (VN/EN)
- **Từ khóa**
- **Toàn văn PDF**:
  - Xem trực tuyến (PDF Viewer)
  - Hoặc tải về

#### Các tính năng:
- **Trích dẫn**: Sao chép citation theo chuẩn APA, MLA, IEEE, BibTeX
- **Chia sẻ**: Facebook, Twitter, LinkedIn
- **In**: In trực tiếp từ trình duyệt
- **Bài liên quan**: Gợi ý các bài cùng chuyên mục

---

## 9. CÂU HỎI THƯỜNG GẶP

### 9.1. Về tài khoản

**Q1: Làm sao để đăng ký tài khoản?**

A: Hệ thống không hỗ trợ đăng ký công khai. Vui lòng liên hệ Ban biên tập qua email: **editor@tapchinckhhcqs.vn** để được cấp tài khoản.

**Q2: Tôi quên mật khẩu, phải làm sao?**

A: Tại trang đăng nhập, nhấp "Quên mật khẩu?", nhập email, và làm theo hướng dẫn trong email nhận được.

**Q3: Tôi có thể thay đổi địa chỉ email không?**

A: Không thể tự thay đổi. Vui lòng liên hệ Quản trị viên để được hỗ trợ.

### 9.2. Về nộp bài

**Q4: Định dạng file nào được chấp nhận?**

A: 
- **Bản thảo chính**: PDF, DOC, DOCX (tối đa 10MB)
- **Hình ảnh bổ sung**: JPG, PNG, TIFF (tối đa 5MB/file)
- **Dữ liệu**: Excel, CSV, ZIP (tối đa 20MB)

**Q5: Tôi có thể nộp bài bằng tiếng Anh không?**

A: Có, tạp chí chấp nhận bài bằng tiếng Việt hoặc tiếng Anh. Tuy nhiên, cần có tóm tắt song ngữ.

**Q6: Mất bao lâu để có kết quả phản biện?**

A: Trung bình **6-8 tuần** kể từ khi nộp bài. Thời gian có thể dài hơn nếu cần phản biện thêm.

**Q7: Tôi có thể rút bài đã nộp không?**

A: Có, nếu bài chưa được gửi phản biện. Liên hệ Biên tập viên phụ trách qua hệ thống tin nhắn.

### 9.3. Về phản biện

**Q8: Tôi có được trả công khi phản biện không?**

A: Hiện tại, phản biện là tự nguyện và không có thù lao. Tuy nhiên, bạn sẽ nhận được chứng nhận phản biện viên.

**Q9: Tôi có thể từ chối phản biện một bài không?**

A: Có, nếu bạn không đủ chuyên môn hoặc bận việc, vui lòng thông báo ngay cho Biên tập viên.

**Q10: Tôi có thể xem danh sách bài đã phản biện không?**

A: Có, tại **Dashboard > Phản biện > Lịch sử phản biện**.

### 9.4. Về xuất bản

**Q11: Tạp chí có thu phí xuất bản không?**

A: Vui lòng liên hệ Ban biên tập để biết chính sách phí hiện hành.

**Q12: Bài viết có được gán DOI không?**

A: Có, tất cả bài viết được xuất bản đều được cấp DOI.

**Q13: Tôi có thể cập nhật bài viết sau khi xuất bản không?**

A: Không. Sau khi xuất bản, bài viết là bản ghi chính thức và không thể thay đổi. Nếu có lỗi nghiêm trọng, có thể xuất bản Erratum (Thông báo sửa lỗi).

### 9.5. Về kỹ thuật

**Q14: Tại sao tôi không tải được PDF?**

A: Kiểm tra:
1. Kết nối Internet
2. Trình duyệt đã bật JavaScript
3. Không dùng Ad Blocker
4. Thử trình duyệt khác (Chrome, Firefox)

**Q15: Hệ thống báo lỗi "Session expired", phải làm sao?**

A: Phiên đăng nhập đã hết hạn (sau 24 giờ không hoạt động). Vui lòng đăng nhập lại.

**Q16: Tôi không thấy nút "Gửi bài", tại sao?**

A: Kiểm tra:
1. Bạn đã đăng nhập chưa?
2. Tài khoản có vai trò AUTHOR không?
3. Tài khoản đã được kích hoạt chưa?

### 9.6. Liên hệ hỗ trợ

**Nếu không tìm thấy câu trả lời, vui lòng liên hệ:**

📧 **Email hỗ trợ kỹ thuật**: support@tapchinckhhcqs.vn

📧 **Email Ban biên tập**: editor@tapchinckhhcqs.vn

📞 **Hotline**: [Số điện thoại]

🏢 **Địa chỉ**: [Địa chỉ văn phòng]

⏰ **Giờ làm việc**: Thứ 2 - Thứ 6, 8:00 - 17:00

---

## PHỤ LỤC

### A. Bảng thuật ngữ

| Tiếng Việt | Tiếng Anh | Giải thích |
|------------|-----------|------------|
| Bản thảo | Manuscript | File bài báo gốc |
| Phản biện | Peer Review | Quá trình đánh giá bởi chuyên gia |
| Phản biện kín | Blind Review | Phản biện ẩn danh |
| Chấp nhận | Accept | Bài được chấp thuận xuất bản |
| Từ chối | Reject | Bài không đủ tiêu chuẩn |
| Chỉnh sửa | Revision | Yêu cầu tác giả sửa bài |
| DOI | Digital Object Identifier | Mã định danh số duy nhất |
| ORCID | Open Researcher and Contributor ID | Mã định danh tác giả |
| Dashboard | Bảng điều khiển | Giao diện quản lý cá nhân |
| CMS | Content Management System | Hệ thống quản lý nội dung |

### B. Phím tắt hữu ích

| Phím tắt | Chức năng |
|----------|----------|
| `Ctrl + S` | Lưu nháp (khi soạn thảo) |
| `Ctrl + Enter` | Gửi form |
| `Esc` | Đóng dialog/popup |
| `/` (trong editor) | Mở menu lệnh Slash Commands |
| `Ctrl + B` | In đậm văn bản |
| `Ctrl + I` | In nghiêng văn bản |
| `Ctrl + K` | Chèn liên kết |

### C. Danh sách trạng thái bài viết

1. **SUBMITTED** - Mới nộp
2. **UNDER_REVIEW** - Đang phản biện
3. **REVISION** - Yêu cầu chỉnh sửa
4. **ACCEPTED** - Đã chấp nhận
5. **IN_PRODUCTION** - Đang sản xuất
6. **PUBLISHED** - Đã xuất bản
7. **REJECTED** - Đã từ chối
8. **WITHDRAWN** - Đã rút bài

### D. Quy trình xuất bản tóm tắt

```
┌─────────────┐
│ NỘP BÀI     │
│ (Author)    │
└─────┬───────┘
      │
      ▼
┌─────────────────┐
│ KIỂM TRA SƠ BỘ  │
│ (Editor)        │
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ PHẢN BIỆN       │
│ (2-3 Reviewers) │
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ QUYẾT ĐỊNH      │
│ (Editor)        │
└─────┬───────────┘
      │
      ├─── Chấp nhận ────────────►┌──────────────┐
      │                            │ XUẤT BẢN     │
      ├─── Chỉnh sửa ─────┐        └──────────────┘
      │                   │
      └─── Từ chối         │
                          │
                          ▼
                  ┌────────────────┐
                  │ TÁC GIẢ SỬA    │
                  │ & NỘP LẠI      │
                  └────────┬───────┘
                           │
                           └──► (Quay lại Phản biện)
```

---

## KẾT LUẬN

Hướng dẫn này cung cấp tất cả thông tin cần thiết để sử dụng Hệ thống Tạp chí điện tử Khoa học Hậu cần quân sự một cách hiệu quả.

Nếu có bất kỳ thắc mắc nào không được giải đáp trong tài liệu này, vui lòng liên hệ:

📧 **support@tapchinckhhcqs.vn**

---

**Phiên bản**: 1.0  
**Ngày cập nhật**: Tháng 12 năm 2025  
**Biên soạn**: Ban Quản trị Hệ thống  

---

© 2025 Tạp chí Khoa học Hậu cần quân sự. Bảo lưu mọi quyền.