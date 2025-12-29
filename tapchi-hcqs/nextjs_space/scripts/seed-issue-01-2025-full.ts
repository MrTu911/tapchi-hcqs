// @ts-nocheck
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ISSUE_DATA = {
  volumeNo: 1,
  year: 2025,
  issueNumber: 1
}

// Toàn bộ 42 bài viết từ Số 01/2025
const ALL_ARTICLES = [
  // HƯỚNG DẪN - CHỈ ĐẠO (3 bài)
  {
    title: 'Đổi mới, sáng tạo, tăng tốc, bứt phá, quyết liệt thực hiện thắng lợi nhiệm vụ giáo dục - đào tạo, nghiên cứu khoa học năm 2025',
    authorName: 'Trung tướng, GS.TS. PHAN TÙNG SƠN',
    pages: '3-7',
    category: 'HUONG_DAN_CHI_DAO',
    abstractVn: 'Thời gian qua, Học viện Hậu cần đã quán triệt, triển khai thực hiện nghiêm túc, quyết liệt, sát thực tiễn các nghị quyết, chỉ thị, kết luận, của Đảng, Quân ủy Trung ương, Bộ Quốc phòng về xây dựng Quân đội; tập trung nâng cao chất lượng công tác giáo dục, đào tạo và nghiên cứu khoa học, đạt kết quả đáng khích lệ.',
    keywords: ['giáo dục đào tạo', 'nghiên cứu khoa học', 'Học viện Hậu cần', 'đổi mới sáng tạo']
  },
  {
    title: 'Làm tốt công tác chuẩn bị - Nhân tố quyết định bảo đảm thực hiện thắng lợi nhiệm vụ đại hội đảng các cấp trong Đảng bộ Học viện Hậu cần',
    authorName: 'Trung tướng DƯƠNG ĐỨC THIỆN',
    pages: '8-11',
    category: 'HUONG_DAN_CHI_DAO',
    abstractVn: 'Công tác chuẩn bị và tiến hành đại hội đảng các cấp trong Đảng bộ Học viện có ý nghĩa đặc biệt quan trọng, là nhiệm vụ chính trị trọng tâm, xuyên suốt của các cấp ủy, tổ chức đảng, các cơ quan, đơn vị.',
    keywords: ['đại hội đảng', 'công tác chuẩn bị', 'Đảng bộ Học viện Hậu cần']
  },
  {
    title: 'Tiếp tục đẩy mạnh công tác nghiên cứu khoa học góp phần hoàn thành thắng lợi nhiệm vụ giáo dục, đào tạo ở Học viện Hậu cần',
    authorName: 'Thiếu tướng, PGS. TS. TRỊNH BÁ CHINH',
    pages: '12-16',
    category: 'HUONG_DAN_CHI_DAO',
    abstractVn: 'Công tác nghiên cứu khoa học có mối quan hệ chặt chẽ với giáo dục, đào tạo. Nâng cao chất lượng các mặt hoạt động khoa học, đưa công tác nghiên cứu khoa học đi trước một bước là yêu cầu cấp thiết.',
    keywords: ['nghiên cứu khoa học', 'giáo dục đào tạo', 'Học viện Hậu cần']
  },

  // KỶ NIỆM 95 NĂM THÀNH LẬP ĐẢNG (3 bài)
  {
    title: 'Tăng cường sự lãnh đạo của Đảng đối với công tác hậu cần, kỹ thuật quân đội thời kỳ mới',
    authorName: 'Trung tướng ĐỖ VĂN THIỆN',
    pages: '17-21',
    category: 'KY_NIEM',
    abstractVn: 'Bài viết phân tích vai trò lãnh đạo của Đảng đối với công tác hậu cần, kỹ thuật quân đội trong thời kỳ mới, đề xuất các giải pháp tăng cường sự lãnh đạo.',
    keywords: ['lãnh đạo của Đảng', 'hậu cần quân đội', 'kỹ thuật quân đội']
  },
  {
    title: 'Đấu tranh trên mạng xã hội, đẩy lùi suy thoái về tư tưởng chính trị, đạo đức lối sống của cán bộ, đảng viên, bảo vệ nền tảng tư tưởng của Đảng trong giai đoạn hiện nay',
    authorName: 'Đại tá, ThS. NGUYỄN TIẾN DŨNG',
    pages: '22-26',
    category: 'KY_NIEM',
    abstractVn: 'Bài viết đề cập đến vấn đề đấu tranh trên mạng xã hội, đẩy lùi suy thoái về tư tưởng chính trị, đạo đức lối sống, bảo vệ nền tảng tư tưởng của Đảng.',
    keywords: ['mạng xã hội', 'tư tưởng chính trị', 'đạo đức lối sống', 'bảo vệ Đảng']
  },
  {
    title: 'Xây dựng đội ngũ cán bộ hậu cần, kỹ thuật quân đội tinh nhuệ về chính trị trong tình hình mới',
    authorName: 'Thượng tá, TS. PHẠM NGỌC NHÂN',
    pages: '27-31',
    category: 'KY_NIEM',
    abstractVn: 'Bài viết đề xuất các biện pháp xây dựng đội ngũ cán bộ hậu cần, kỹ thuật quân đội có phẩm chất chính trị vững vàng, đáp ứng yêu cầu nhiệm vụ trong tình hình mới.',
    keywords: ['cán bộ hậu cần', 'kỹ thuật quân đội', 'tinh nhuệ chính trị']
  },

  // NGHIÊN CỨU - TRAO ĐỔI (32 bài)
  {
    title: 'Tổ chức dự trữ vật chất quân nhu lực lượng vũ trang địa phương đánh địch giữ vững khu vực phòng thủ chủ yếu trong tác chiến phòng thủ tỉnh',
    authorName: 'Thượng tá, TS. ĐỖ DUY THÁNG',
    pages: '32-35',
    category: 'NCTD',
    abstractVn: 'Tổ chức dự trữ vật chất quân nhu là nội dung quan trọng của bảo đảm quân nhu trong tác chiến. Bài viết đề cập một số biện pháp về tổ chức dự trữ VCQN cho lực lượng vũ trang địa phương.',
    keywords: ['dự trữ vật chất', 'quân nhu', 'lực lượng vũ trang địa phương', 'phòng thủ tỉnh']
  },
  {
    title: 'Một số giải pháp nâng cao hiệu quả bảo đảm thông tin liên lạc trong đánh trận then chốt tiêu diệt địch đổ bộ đường không trong chiến dịch phản công',
    authorName: 'Đại tá, TS. PHẠM VĂN HẢI',
    pages: '36-39',
    category: 'NCTD',
    abstractVn: 'Bảo đảm thông tin liên lạc có vị trí, vai trò rất quan trọng, nhằm bảo đảm liên lạc thông suốt, giữ vững chỉ huy, chỉ đạo, hiệp đồng trong quá trình tác chiến. Bài viết đề cập một số giải pháp nâng cao hiệu quả bảo đảm TTLL.',
    keywords: ['thông tin liên lạc', 'địch đổ bộ đường không', 'chiến dịch phản công']
  },
  {
    title: 'Nâng cao đạo đức cách mạng cho đội ngũ chủ nhiệm hậu cần - kỹ thuật trong Quân đội nhân dân Việt Nam hiện nay',
    authorName: 'Đại tá, TS. NGUYỄN VĂN KÝ',
    pages: '40-43',
    category: 'NCTD',
    abstractVn: 'Đạo đức cách mạng là cái gốc, là phẩm chất nền tảng trong nhân cách của đội ngũ chủ nhiệm hậu cần – kỹ thuật. Bài viết đề xuất một số biện pháp nâng cao đạo đức cách mạng.',
    keywords: ['đạo đức cách mạng', 'chủ nhiệm hậu cần', 'kỹ thuật quân đội']
  },
  {
    title: 'Một số biện pháp bảo đảm quân y trong tác chiến chiến lược công - chiến lược lâu dài',
    authorName: 'Thượng tá, TS. LÊ VĂN CHÍNH',
    pages: '44-47',
    category: 'NCTD',
    abstractVn: 'Bảo đảm quân y trong tác chiến chiến lược công - chiến lược lâu dài là vấn đề có ý nghĩa quan trọng, cần được nghiên cứu, đề xuất giải pháp phù hợp.',
    keywords: ['quân y', 'tác chiến chiến lược', 'chiến lược lâu dài']
  },
  {
    title: 'Giải pháp bảo đảm vật chất hậu cần trung đoàn bộ binh vận động tiến công ở đồng bằng sông Cửu Long',
    authorName: 'Trung tá, ThS. PHẠM XUÂN QUÝ',
    pages: '48-51',
    category: 'NCTD',
    abstractVn: 'Bảo đảm vật chất hậu cần là một mặt bảo đảm hậu cần chiến đấu, góp phần quan trọng để đơn vị chiến đấu thắng lợi. Bài viết đề xuất một số giải pháp bảo đảm VCHC trung đoàn bộ binh vận động tiến công ở ĐBSCL.',
    keywords: ['vật chất hậu cần', 'trung đoàn bộ binh', 'vận động tiến công', 'đồng bằng sông Cửu Long']
  },
  {
    title: 'Một số biện pháp nâng cao chất lượng công tác vận tải bảo đảm cho công trình quốc phòng',
    authorName: 'Thượng tá, TS. PHAN NGỌC TRUNG',
    pages: '52-55',
    category: 'NCTD',
    abstractVn: 'Công tác vận tải có vai trò quan trọng trong việc bảo đảm xây dựng công trình quốc phòng. Bài viết đề xuất các biện pháp nâng cao chất lượng công tác vận tải.',
    keywords: ['vận tải', 'công trình quốc phòng', 'bảo đảm']
  },
  {
    title: 'Một số vấn đề về vận dụng Tiêu chuẩn quốc gia TCVN 2737:2023 đối với công trình doanh trại quân đội',
    authorName: 'Đại tá, TS. TRẦN VĂN ĐIỀU',
    pages: '56-64',
    category: 'NCTD',
    abstractVn: 'Tiêu chuẩn TCVN 2737:2023 có ảnh hưởng lớn đến các công trình doanh trại. Bài viết phân tích các vấn đề về vận dụng tiêu chuẩn này đối với công trình doanh trại quân đội.',
    keywords: ['tiêu chuẩn quốc gia', 'TCVN 2737:2023', 'công trình doanh trại']
  },
  {
    title: 'Biện pháp bảo đảm vật chất hậu cần trung đoàn bộ binh truy kích địch rút chạy đường bộ',
    authorName: 'Trung tá, ThS. NGUYỄN VĂN HIỆN',
    pages: '65-68',
    category: 'NCTD',
    abstractVn: 'Bảo đảm vật chất hậu cần nhằm cung cấp các loại vật chất cần thiết cho người, trang bị, duy trì khả năng sẵn sàng chiến đấu và chiến đấu của đơn vị. Bài viết đề cập một số biện pháp bảo đảm VCHC trung đoàn bộ binh truy kích địch rút chạy đường bộ.',
    keywords: ['vật chất hậu cần', 'trung đoàn bộ binh', 'truy kích địch']
  },
  {
    title: 'Một số biện pháp bảo đảm quân y trung, lữ đoàn tham gia phòng, chống và khắc phục hậu quả thiên tai',
    authorName: 'Thiếu tá, ThS. NHỮ VIỆT HÙNG',
    pages: '69-71',
    category: 'NCTD',
    abstractVn: 'Bài viết đề cập các biện pháp bảo đảm quân y cho trung, lữ đoàn tham gia phòng, chống và khắc phục hậu quả thiên tai.',
    keywords: ['quân y', 'thiên tai', 'phòng chống thiên tai']
  },
  {
    title: 'Nội dung, giải pháp bảo vệ hậu cần – kỹ thuật trong tác chiến phân công chiến lược chiến trường miền Bắc',
    authorName: 'Đại tá, ThS. TẠ VIỆT XUÂN và Thiếu tá, CN. NGUYỄN ĐỨC MẠNH',
    pages: '72-75',
    category: 'NCTD',
    abstractVn: 'Bài viết đề cập nội dung và giải pháp bảo vệ hậu cần – kỹ thuật trong tác chiến phân công chiến lược chiến trường miền Bắc.',
    keywords: ['bảo vệ hậu cần', 'kỹ thuật', 'tác chiến chiến lược']
  },
  {
    title: 'Nâng cao chất lượng công tác thanh tra, kiểm tra tài chính ngân sách quốc phòng thường xuyên ở Quân khu 1',
    authorName: 'Thiếu tá, ThS. NGUYỄN NAM KHOA',
    pages: '76-79',
    category: 'NCTD',
    abstractVn: 'Bài viết đề xuất các giải pháp nâng cao chất lượng công tác thanh tra, kiểm tra tài chính ngân sách quốc phòng thường xuyên ở Quân khu 1.',
    keywords: ['thanh tra', 'tài chính quốc phòng', 'ngân sách']
  },
  {
    title: 'Giải pháp tổ chức, sử dụng, bố trí lực lượng hậu cần sư đoàn bộ binh tiến công địch phòng ngự đô thị ở địa hình trung du',
    authorName: 'Trung tá, ThS. VŨ ĐỨC TUÂN và Thiếu tá, CN. NGUYỄN VĂN TRÌNH',
    pages: '80-83',
    category: 'NCTD',
    abstractVn: 'Bài viết đề xuất giải pháp tổ chức, sử dụng, bố trí lực lượng hậu cần sư đoàn bộ binh tiến công địch phòng ngự đô thị ở địa hình trung du.',
    keywords: ['hậu cần sư đoàn', 'bộ binh', 'tiến công đô thị']
  },
  {
    title: 'Chuẩn bị lực lượng hậu cần, kỹ thuật bảo đảm cho các lực lượng vũ trang tác chiến khu vực phòng thủ huyện',
    authorName: 'Thiếu tá, CN. MAI VĂN ĐẠT',
    pages: '84-87',
    category: 'NCTD',
    abstractVn: 'Chuẩn bị lực lượng hậu cần, kỹ thuật là một nội dung chuẩn bị hậu cần, kỹ thuật, yếu tố quan trọng quyết định đến kết quả chuẩn bị HCKT.',
    keywords: ['chuẩn bị lực lượng', 'hậu cần kỹ thuật', 'phòng thủ huyện']
  },
  {
    title: 'Một số biện pháp nâng cao chất lượng quản lý kinh phí nghiệp vụ tại Binh chủng Thông tin Liên lạc',
    authorName: 'Đại úy, CN. NGUYỄN THỊ HẢI YÊN',
    pages: '88-90',
    category: 'NCTD',
    abstractVn: 'Quản lý kinh phí nghiệp vụ là quá trình tổ chức, điều hành kiểm soát việc thực hiện các chế độ quy định về KPNV. Bài viết đề xuất biện pháp nâng cao chất lượng quản lý KPNV ở Binh chủng Thông tin liên lạc.',
    keywords: ['quản lý kinh phí', 'thông tin liên lạc', 'nghiệp vụ']
  },
  {
    title: 'Một số biện pháp bảo đảm vật chất hậu cần trận then chốt đánh địch tiến công đường bộ chiến dịch phân công trong tác chiến phòng thủ quân khu',
    authorName: 'Thượng tá, ThS. ĐOÀN VĂN LUÂN',
    pages: '91-93',
    category: 'NCTD',
    abstractVn: 'Bài viết đề xuất các biện pháp bảo đảm vật chất hậu cần trận then chốt đánh địch tiến công đường bộ chiến dịch phân công trong tác chiến phòng thủ quân khu.',
    keywords: ['vật chất hậu cần', 'trận then chốt', 'phòng thủ quân khu']
  },
  {
    title: 'Tổ chức vận chuyển thương binh trung đoàn bộ binh chiến đấu tập kích ở đồng bằng sông Cửu Long mùa nước nổi',
    authorName: 'Trung tá, TS. ĐINH VĂN ĐÔNG và Đại úy, CN. TRẦN TUẤN ANH',
    pages: '94-97',
    category: 'NCTD',
    abstractVn: 'Tổ chức vận chuyển thương binh có ý nghĩa quan trọng, ảnh hưởng trực tiếp đến nhiệm vụ cứu chữa thương binh ở các tuyến quân y.',
    keywords: ['vận chuyển thương binh', 'đồng bằng sông Cửu Long', 'chiến đấu tập kích']
  },
  {
    title: 'Bảo vệ vận tải trong điều kiện địch sử dụng vũ khí công nghệ cao',
    authorName: 'Thượng tá, TS. LÊ QUANG VỊNH',
    pages: '98-101',
    category: 'NCTD',
    abstractVn: 'Bảo vệ vận tải trong chiến tranh bảo vệ Tổ quốc là vấn đề cấp thiết, phải tiến hành đồng bộ nhiều nội dung, biện pháp. Bài viết đề cập các biện pháp bảo vệ vận tải trong điều kiện địch sử dụng vũ khí công nghệ cao.',
    keywords: ['bảo vệ vận tải', 'vũ khí công nghệ cao', 'chiến tranh bảo vệ Tổ quốc']
  },
  {
    title: 'Một số yêu cầu về sử dụng lữ đoàn tàu tên lửa - ngư lôi tiến công nhóm tàu chi viện hỏa lực địch đổ bộ đường biển',
    authorName: 'Thiếu tá, ThS. NGUYỄN MẠNH QUỲNH',
    pages: '102-105',
    category: 'NCTD',
    abstractVn: 'Bài viết đề cập một số yêu cầu cơ bản về sử dụng lữ đoàn tàu tên lửa - ngư lôi tiến công nhóm tàu chi viện hỏa lực địch đổ bộ đường biển.',
    keywords: ['lữ đoàn tàu tên lửa', 'ngư lôi', 'đổ bộ đường biển']
  },
  {
    title: 'Tổ chức, sử dụng lực lượng hậu cần dự bị lữ đoàn tàu tên lửa tiến công tàu mặt nước địch bảo vệ vận tải đường biển chi viện Quần đảo Trường Sa',
    authorName: 'Thượng tá, TS. NGUYỄN QUỐC HOÀI',
    pages: '106-109',
    category: 'NCTD',
    abstractVn: 'Một nguyên tắc trong bảo đảm hậu cần trận chiến đấu trên biển là luôn phải tổ chức lực lượng hậu cần dự bị đủ mạnh để sử dụng cho các nhiệm vụ phát sinh.',
    keywords: ['lực lượng hậu cần dự bị', 'lữ đoàn tàu tên lửa', 'Quần đảo Trường Sa']
  },
  {
    title: 'Nghiên cứu một số mô hình ứng xử phi tuyến của bê tông cốt thép',
    authorName: 'Trung tá, ThS. NGUYỄN VĂN TRỌNG',
    pages: '110-114',
    category: 'NCTD',
    abstractVn: 'Bài viết trình bày làm rõ về các mô hình ứng xử phi tuyến của BTCT và các khuyến nghị áp dụng cho tính toán thiết kế các công trình trong Quân đội.',
    keywords: ['bê tông cốt thép', 'mô hình ứng xử', 'phi tuyến']
  },
  {
    title: 'Nâng cao chất lượng tự học từ vựng Tiếng Anh cho đối tượng đào tạo sĩ quan hậu cần cấp phân đội, trình độ đại học tại Học viện Hậu cần',
    authorName: 'Thiếu tá, ThS. HOÀNG THỊ THU HÀ',
    pages: '115-117',
    category: 'NCTD',
    abstractVn: 'Từ vựng đóng vai trò quan trọng trong việc học tập và sử dụng tiếng Anh. Bài viết đề xuất các biện pháp nâng cao chất lượng tự học từ vựng tiếng Anh cho học viên.',
    keywords: ['tự học', 'từ vựng Tiếng Anh', 'đào tạo sĩ quan']
  },
  {
    title: 'Biện pháp bảo đảm vật chất hậu cần phân đội bộ binh cơ động chiến đấu ở đồng bằng sông Cửu Long',
    authorName: 'Đại tá, TS. PHẠM TRỌNG DIỄN và Trung tá, ThS. NGUYỄN VĂN THÁI',
    pages: '118-121',
    category: 'NCTD',
    abstractVn: 'Bảo đảm vật chất hậu cần cho phân đội bộ binh cơ động chiến đấu là nhiệm vụ khó khăn phức tạp, tính biến động cao. Bài viết đề xuất các biện pháp phù hợp.',
    keywords: ['vật chất hậu cần', 'phân đội bộ binh', 'cơ động chiến đấu']
  },
  {
    title: 'Nâng cao chất lượng dạy học môn vật lý đại cương cho đối tượng sĩ quan hậu cần cấp phân đội, trình độ đại học, chuyên ngành vận tải',
    authorName: 'Trung tá, ThS. ĐINH VĂN THƯỜNG',
    pages: '122-124',
    category: 'NCTD',
    abstractVn: 'Bài viết đề xuất các giải pháp cho giảng viên môn vật lý đại cương nhằm nâng cao chất lượng dạy học cho đối tượng sĩ quan hậu cần.',
    keywords: ['dạy học', 'vật lý đại cương', 'sĩ quan hậu cần']
  },
  {
    title: 'Phát huy vai trò của đội ngũ giảng viên trong ứng dụng chuyển đổi số vào đổi mới phương pháp dạy học ở Học viện Hậu cần hiện nay',
    authorName: 'Trung tá, TS. TRẦN VĂN HOAN',
    pages: '125-127',
    category: 'NCTD',
    abstractVn: 'Bài viết đề xuất các biện pháp phát huy vai trò của đội ngũ giảng viên trong ứng dụng chuyển đổi số vào đổi mới phương pháp dạy học.',
    keywords: ['chuyển đổi số', 'phương pháp dạy học', 'giảng viên']
  },
  {
    title: 'Nghiên cứu thiết kế, quản lý hệ thống thu gom, xử lý nước mưa bảo đảm trong sinh hoạt cho các đơn vị đóng quân ở địa bàn khan hiếm nước',
    authorName: 'Trung tá, ThS. TRẦN MẠNH DŨNG',
    pages: '128-131',
    category: 'NCTD',
    abstractVn: 'Bài viết nghiên cứu thiết kế và quản lý hệ thống thu gom, xử lý nước mưa để bảo đảm nước sinh hoạt cho các đơn vị đóng quân ở địa bàn khan hiếm nước.',
    keywords: ['thu gom nước mưa', 'xử lý nước', 'khan hiếm nước']
  },
  {
    title: 'Phát huy vai trò hoạt động của Bộ Chỉ huy quân sự tỉnh, thành phố trong xây dựng tiềm lực vận tải khu vực phòng thủ',
    authorName: 'Trung tá, TS. NGUYỄN HUY THỤ',
    pages: '132-135',
    category: 'NCTD',
    abstractVn: 'Bài viết đề xuất các giải pháp phát huy vai trò hoạt động của Bộ Chỉ huy quân sự tỉnh, thành phố trong xây dựng tiềm lực vận tải khu vực phòng thủ.',
    keywords: ['Bộ Chỉ huy quân sự', 'tiềm lực vận tải', 'phòng thủ']
  },
  {
    title: 'Bảo đảm quân nhu sư đoàn bộ binh tiến công trong hành tiến ở địa hình trung du',
    authorName: 'Thượng tá, TS. TRẦN MẠNH CƯỜNG',
    pages: '136-139',
    category: 'NCTD',
    abstractVn: 'Bài viết đề cập các biện pháp bảo đảm quân nhu cho sư đoàn bộ binh tiến công trong hành tiến ở địa hình trung du.',
    keywords: ['quân nhu', 'sư đoàn bộ binh', 'tiến công', 'địa hình trung du']
  },
  {
    title: 'Một số giải pháp bảo đảm vật chất hậu cần tác chiến phòng thủ các tỉnh Trung Lào trong chiến tranh bảo vệ Tổ quốc',
    authorName: 'Trung tá, ThS. KHAM LOUANG THOUMMALA',
    pages: '140-143',
    category: 'NCTD',
    abstractVn: 'Bảo đảm vật chất hậu cần cho lực lượng vũ trang địa phương tác chiến phòng thủ các tỉnh Trung Lào gặp nhiều khó khăn, phức tạp. Bài viết đề xuất các giải pháp phù hợp.',
    keywords: ['vật chất hậu cần', 'phòng thủ', 'Trung Lào']
  },
  {
    title: 'Nâng cao chất lượng huấn luyện thực hành môn học tổ chức vận tải bằng ô tô ở Học viện Hậu cần',
    authorName: 'Thượng úy, CN. TRỊNH ĐỨC QUANG và Trung tá, ThS. TRỪ VĂN HỮU',
    pages: '144-146',
    category: 'NCTD',
    abstractVn: 'Bài viết đề xuất các giải pháp nâng cao chất lượng huấn luyện thực hành môn học tổ chức vận tải bằng ô tô ở Học viện Hậu cần.',
    keywords: ['huấn luyện', 'vận tải ô tô', 'thực hành']
  },
  {
    title: 'Công tác hậu cần, kỹ thuật trong diễn tập khu vực phòng thủ tỉnh Lạng Sơn',
    authorName: 'Thượng tá, TS. NGUYỄN VĂN CƯỜNG',
    pages: '147-150',
    category: 'NCTD',
    abstractVn: 'Bài viết đề cập công tác hậu cần, kỹ thuật trong diễn tập khu vực phòng thủ tỉnh Lạng Sơn, rút ra kinh nghiệm và đề xuất giải pháp.',
    keywords: ['hậu cần kỹ thuật', 'diễn tập', 'khu vực phòng thủ']
  },

  // LỊCH SỬ HẬU CẦN QUÂN SỰ (4 bài)
  {
    title: 'Khai thác, tạo nguồn vật chất hậu cần của các đoàn hậu cần trên Chiến trường B2 trong kháng chiến chống Mỹ - Kinh nghiệm và hướng kế thừa, phát triển',
    authorName: 'Đại tá, TS. VŨ QUANG HÒA',
    pages: '151-155',
    category: 'LICH_SU',
    abstractVn: 'Bài viết phân tích kinh nghiệm khai thác, tạo nguồn vật chất hậu cần của các đoàn hậu cần trên Chiến trường B2 trong kháng chiến chống Mỹ và đưa ra hướng kế thừa, phát triển.',
    keywords: ['khai thác vật chất', 'Chiến trường B2', 'kháng chiến chống Mỹ']
  },
  {
    title: 'Kinh nghiệm tổ chức cứu chữa, vận chuyển thương binh trung đoàn bộ binh chiến đấu phòng ngự trong chiến tranh bảo vệ biên giới phía Bắc',
    authorName: 'Thượng tá, TS. NGUYỄN THÀNH TRUNG',
    pages: '156-159',
    category: 'LICH_SU',
    abstractVn: 'Bài viết tổng kết kinh nghiệm tổ chức cứu chữa, vận chuyển thương binh của trung đoàn bộ binh trong chiến tranh bảo vệ biên giới phía Bắc.',
    keywords: ['cứu chữa thương binh', 'vận chuyển thương binh', 'biên giới phía Bắc']
  },
  {
    title: 'Kinh nghiệm bảo đảm hậu cần trung đoàn bộ binh chiến đấu phục kích ở địa hình trung du trong chiến tranh giải phóng và hướng kế thừa, phát triển',
    authorName: 'Thiếu tá, ThS. VŨ LƯƠNG SINH',
    pages: '160-163',
    category: 'LICH_SU',
    abstractVn: 'Bài viết tổng kết kinh nghiệm bảo đảm hậu cần trung đoàn bộ binh chiến đấu phục kích trong chiến tranh giải phóng và đề xuất hướng kế thừa, phát triển.',
    keywords: ['hậu cần', 'chiến đấu phục kích', 'chiến tranh giải phóng']
  },
  {
    title: 'Bảo đảm hậu cần Chiến dịch Tây Nguyên và hướng kế thừa - phát triển',
    authorName: 'Đại úy, CN. NGUYỄN TIẾN ĐẠT',
    pages: '164-167',
    category: 'LICH_SU',
    abstractVn: 'Bài viết phân tích công tác bảo đảm hậu cần trong Chiến dịch Tây Nguyên, rút ra bài học kinh nghiệm và đề xuất hướng kế thừa, phát triển.',
    keywords: ['bảo đảm hậu cần', 'Chiến dịch Tây Nguyên', 'kinh nghiệm']
  }
]

async function main() {
  console.log('🌱 Bắt đầu seed TOÀN BỘ 42 bài viết từ Số 01/2025...')

  // Get volume
  const volume = await prisma.volume.findFirst({ 
    where: { 
      volumeNo: ISSUE_DATA.volumeNo,
      year: ISSUE_DATA.year
    } 
  })
  if (!volume) {
    console.log('❌ Không tìm thấy volume')
    return
  }

  // Get issue
  const issue = await prisma.issue.findFirst({
    where: {
      volumeId: volume.id,
      number: ISSUE_DATA.issueNumber
    }
  })
  if (!issue) {
    console.log('❌ Không tìm thấy issue')
    return
  }

  console.log(`✅ Đang sử dụng Issue: ${issue.title}`)
  console.log(`📝 Tổng số bài viết sẽ import: ${ALL_ARTICLES.length}`)

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  // Process each article
  for (const art of ALL_ARTICLES) {
    try {
      // Get or create category
      const category = await prisma.category.findFirst({ where: { code: art.category } })
      if (!category) {
        console.log(`⚠️  Bỏ qua bài viết (không tìm thấy category ${art.category}): ${art.title}`)
        skipCount++
        continue
      }

      // Get or create author
      const authorEmail = art.authorName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 30) + '@hvhc.mil.vn'
      
      let author = await prisma.user.findFirst({ where: { email: authorEmail } })
      
      if (!author) {
        const hashedPassword = await bcrypt.hash('password123', 10)
        author = await prisma.user.create({
          data: {
            email: authorEmail,
            password: hashedPassword,
            fullName: art.authorName,
            role: 'AUTHOR',
            affiliation: 'Học viện Hậu cần',
            isVerified: true
          }
        })
        console.log(`   ➕ Tạo tác giả mới: ${art.authorName}`)
      }

      // Check if submission already exists
      const existing = await prisma.submission.findFirst({
        where: {
          title: art.title,
          issueId: issue.id
        }
      })

      if (existing) {
        console.log(`   ⏭️  Đã tồn tại: ${art.title.substring(0, 50)}...`)
        skipCount++
        continue
      }

      // Create submission
      const submission = await prisma.submission.create({
        data: {
          title: art.title,
          abstractVn: art.abstractVn || '',
          abstractEn: '',
          keywords: art.keywords.join(', '),
          submitterId: author.id,
          categoryId: category.id,
          issueId: issue.id,
          status: 'PUBLISHED',
          doi: `10.12345/hcqs.${ISSUE_DATA.year}.${ISSUE_DATA.issueNumber}.${art.pages.split('-')[0]}`,
          pages: art.pages,
          publishedDate: issue.publishedDate || new Date('2025-02-01'),
          submittedDate: new Date('2024-11-01'),
          acceptedDate: new Date('2024-12-15')
        }
      })

      // Link author to submission
      await prisma.submissionAuthor.create({
        data: {
          submissionId: submission.id,
          authorId: author.id,
          authorOrder: 1
        }
      })

      console.log(`   ✅ [${successCount + 1}/${ALL_ARTICLES.length}] Đã tạo: ${art.title.substring(0, 60)}...`)
      successCount++

    } catch (error) {
      console.error(`   ❌ Lỗi khi tạo bài viết "${art.title}":`, error)
      errorCount++
    }
  }

  console.log('\n📊 === TỔNG KẾT ===')
  console.log(`✅ Thành công: ${successCount} bài viết`)
  console.log(`⏭️  Đã tồn tại (bỏ qua): ${skipCount} bài viết`)
  console.log(`❌ Lỗi: ${errorCount} bài viết`)
  console.log(`📝 Tổng cộng đã xử lý: ${successCount + skipCount + errorCount}/${ALL_ARTICLES.length}`)
  console.log('\n🎉 Hoàn tất seed dữ liệu!')
}

main()
  .catch((e) => {
    console.error('❌ Lỗi nghiêm trọng:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
