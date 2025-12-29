
/**
 * Seed script for Public Pages CMS
 * Creates default static pages: About, Contact, License, Publishing Process
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Public Pages...\n');

  // Delete existing public pages
  await prisma.publicPage.deleteMany({});
  console.log('✅ Cleared existing public pages\n');

  // 1. About Page (Giới thiệu)
  const aboutPage = await prisma.publicPage.create({
    data: {
      slug: 'about',
      title: 'Giới thiệu về Tạp chí',
      titleEn: 'About the Journal',
      content: `
        <div class="prose max-w-none">
          <h2>Giới thiệu chung</h2>
          <p>
            Tạp chí điện tử Khoa học Hậu cần quân sự là ấn phẩm khoa học chuyên ngành, 
            được xuất bản bởi Học viện Hậu cần, Bộ Quốc phòng Việt Nam.
          </p>
          
          <h3>Lịch sử hình thành</h3>
          <p>
            Tạp chí được thành lập vào năm 2020 với mục tiêu cung cấp một diễn đàn học thuật 
            chất lượng cao cho các nhà nghiên cứu, giảng viên, và học viên trong lĩnh vực 
            khoa học hậu cần quân sự.
          </p>
          
          <h3>Sứ mệnh</h3>
          <ul>
            <li>Phổ biến kiến thức khoa học về hậu cần quân sự</li>
            <li>Đóng góp vào sự phát triển của lý luận và thực tiễn hậu cần quân sự</li>
            <li>Tạo môi trường học thuật cho các nhà nghiên cứu</li>
            <li>Thúc đẩy hợp tác quốc tế trong lĩnh vực nghiên cứu</li>
          </ul>
          
          <h3>Ban biên tập</h3>
          <p>
            Ban biên tập tạp chí bao gồm các chuyên gia hàng đầu trong lĩnh vực hậu cần quân sự, 
            với nhiều năm kinh nghiệm nghiên cứu và giảng dạy.
          </p>
          
          <h3>Thông tin liên hệ</h3>
          <p>
            <strong>Địa chỉ:</strong> Học viện Hậu cần, Bộ Quốc phòng<br/>
            <strong>Email:</strong> tapchi@tapchinckhhcqs.vn<br/>
            <strong>Điện thoại:</strong> (024) 1234 5678
          </p>
        </div>
      `,
      contentEn: `
        <div class="prose max-w-none">
          <h2>Overview</h2>
          <p>
            The Electronic Journal of Military Logistics Science is a specialized academic publication, 
            published by the Logistics Academy, Ministry of National Defence of Vietnam.
          </p>
          
          <h3>History</h3>
          <p>
            The journal was established in 2020 with the aim of providing a high-quality academic forum 
            for researchers, lecturers, and students in the field of military logistics science.
          </p>
          
          <h3>Mission</h3>
          <ul>
            <li>Disseminate scientific knowledge about military logistics</li>
            <li>Contribute to the development of military logistics theory and practice</li>
            <li>Create an academic environment for researchers</li>
            <li>Promote international cooperation in research</li>
          </ul>
          
          <h3>Editorial Board</h3>
          <p>
            The journal's editorial board consists of leading experts in military logistics, 
            with many years of research and teaching experience.
          </p>
          
          <h3>Contact Information</h3>
          <p>
            <strong>Address:</strong> Logistics Academy, Ministry of National Defence<br/>
            <strong>Email:</strong> tapchi@tapchinckhhcqs.vn<br/>
            <strong>Phone:</strong> (024) 1234 5678
          </p>
        </div>
      `,
      metaTitle: 'Giới thiệu về Tạp chí Khoa học Hậu cần quân sự',
      metaTitleEn: 'About Military Logistics Science Journal',
      metaDesc: 'Tìm hiểu về Tạp chí điện tử Khoa học Hậu cần quân sự - ấn phẩm khoa học chuyên ngành của Học viện Hậu cần, Bộ Quốc phòng Việt Nam.',
      metaDescEn: 'Learn about the Electronic Journal of Military Logistics Science - a specialized academic publication of the Logistics Academy, Ministry of National Defence of Vietnam.',
      isPublished: true,
      publishedAt: new Date(),
      template: 'about',
      order: 1
    }
  });
  console.log('✅ Created About page:', aboutPage.slug);

  // 2. Contact Page (Liên hệ)
  const contactPage = await prisma.publicPage.create({
    data: {
      slug: 'contact',
      title: 'Liên hệ',
      titleEn: 'Contact Us',
      content: `
        <div class="prose max-w-none">
          <h2>Thông tin liên hệ</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div>
              <h3>Địa chỉ</h3>
              <p>
                Học viện Hậu cần<br/>
                Bộ Quốc phòng Việt Nam<br/>
                Hà Nội, Việt Nam
              </p>
            </div>
            
            <div>
              <h3>Liên hệ</h3>
              <p>
                <strong>Email:</strong> tapchi@tapchinckhhcqs.vn<br/>
                <strong>Điện thoại:</strong> (024) 1234 5678<br/>
                <strong>Fax:</strong> (024) 1234 5679
              </p>
            </div>
          </div>
          
          <h3>Ban biên tập</h3>
          <p>
            <strong>Tổng biên tập:</strong><br/>
            Email: tongbientap@tapchinckhhcqs.vn
          </p>
          <p>
            <strong>Phó Tổng biên tập:</strong><br/>
            Email: phobientap@tapchinckhhcqs.vn
          </p>
          
          <h3>Liên hệ cho tác giả</h3>
          <p>
            Nếu bạn có câu hỏi về quy trình xuất bản, vui lòng liên hệ:<br/>
            <strong>Email:</strong> tacgia@tapchinckhhcqs.vn
          </p>
          
          <h3>Hỗ trợ kỹ thuật</h3>
          <p>
            Đối với các vấn đề kỹ thuật liên quan đến website:<br/>
            <strong>Email:</strong> hotro@tapchinckhhcqs.vn
          </p>
          
          <h3>Giờ làm việc</h3>
          <p>
            Thứ 2 - Thứ 6: 8:00 - 17:00<br/>
            Nghỉ Thứ 7, Chủ nhật và các ngày lễ
          </p>
        </div>
      `,
      contentEn: `
        <div class="prose max-w-none">
          <h2>Contact Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div>
              <h3>Address</h3>
              <p>
                Logistics Academy<br/>
                Ministry of National Defence of Vietnam<br/>
                Hanoi, Vietnam
              </p>
            </div>
            
            <div>
              <h3>Contact</h3>
              <p>
                <strong>Email:</strong> tapchi@tapchinckhhcqs.vn<br/>
                <strong>Phone:</strong> (024) 1234 5678<br/>
                <strong>Fax:</strong> (024) 1234 5679
              </p>
            </div>
          </div>
          
          <h3>Editorial Board</h3>
          <p>
            <strong>Editor-in-Chief:</strong><br/>
            Email: tongbientap@tapchinckhhcqs.vn
          </p>
          <p>
            <strong>Deputy Editor-in-Chief:</strong><br/>
            Email: phobientap@tapchinckhhcqs.vn
          </p>
          
          <h3>Author Contact</h3>
          <p>
            For questions about the publishing process, please contact:<br/>
            <strong>Email:</strong> tacgia@tapchinckhhcqs.vn
          </p>
          
          <h3>Technical Support</h3>
          <p>
            For technical issues related to the website:<br/>
            <strong>Email:</strong> hotro@tapchinckhhcqs.vn
          </p>
          
          <h3>Business Hours</h3>
          <p>
            Monday - Friday: 8:00 AM - 5:00 PM<br/>
            Closed on Saturdays, Sundays and public holidays
          </p>
        </div>
      `,
      metaTitle: 'Liên hệ - Tạp chí Khoa học Hậu cần quân sự',
      metaTitleEn: 'Contact Us - Military Logistics Science Journal',
      metaDesc: 'Thông tin liên hệ của Tạp chí điện tử Khoa học Hậu cần quân sự. Địa chỉ, email, số điện thoại và giờ làm việc.',
      metaDescEn: 'Contact information for the Electronic Journal of Military Logistics Science. Address, email, phone number and business hours.',
      isPublished: true,
      publishedAt: new Date(),
      template: 'contact',
      order: 2
    }
  });
  console.log('✅ Created Contact page:', contactPage.slug);

  // 3. License Page (Giấy phép)
  const licensePage = await prisma.publicPage.create({
    data: {
      slug: 'license',
      title: 'Giấy phép và Quy định pháp lý',
      titleEn: 'License and Legal Regulations',
      content: `
        <div class="prose max-w-none">
          <h2>Giấy phép xuất bản điện tử</h2>
          <p>
            Tạp chí điện tử Khoa học Hậu cần quân sự hoạt động theo Giấy phép xuất bản 
            điện tử số <strong>[Số giấy phép]</strong> do Bộ Thông tin và Truyền thông cấp 
            ngày <strong>[Ngày cấp]</strong>.
          </p>
          
          <h3>Tuân thủ Thông tư 41/2022/TT-BTTTT</h3>
          <p>
            Tạp chí tuân thủ đầy đủ các quy định của Thông tư 41/2022/TT-BTTTT của Bộ Thông tin 
            và Truyền thông về quản lý, cung cấp và sử dụng dịch vụ báo chí điện tử.
          </p>
          
          <h4>Các khía cạnh tuân thủ chính:</h4>
          <ol>
            <li>
              <strong>Quy trình xuất bản:</strong> Mọi bài viết đều trải qua quy trình phản biện 
              nghiêm ngặt và được phê duyệt bởi Ban biên tập trước khi xuất bản.
            </li>
            <li>
              <strong>Bảo mật dữ liệu:</strong> Hệ thống sử dụng mã hóa SSL/TLS, xác thực đa yếu tố 
              và lưu trữ an toàn trên nền tảng đám mây.
            </li>
            <li>
              <strong>Ghi nhật ký kiểm toán:</strong> Tất cả các hoạt động quan trọng đều được 
              ghi nhật ký để phục vụ kiểm toán và giám sát.
            </li>
            <li>
              <strong>Lưu trữ dữ liệu:</strong> Dữ liệu được sao lưu định kỳ và lưu trữ theo 
              quy định pháp luật Việt Nam.
            </li>
            <li>
              <strong>Quản lý nội dung:</strong> Nội dung xuất bản được kiểm duyệt kỹ lưỡng, 
              tuân thủ quy định về an ninh quốc gia và đạo đức xuất bản.
            </li>
          </ol>
          
          <h3>Chính sách nội dung</h3>
          
          <h4>Phạm vi xuất bản</h4>
          <p>
            Tạp chí xuất bản các bài viết khoa học trong lĩnh vực hậu cần quân sự, bao gồm 
            nhưng không giới hạn: chiến lược hậu cần, quản lý hậu cần, công nghệ hậu cần, 
            kinh tế hậu cần.
          </p>
          
          <h4>Trách nhiệm của tác giả</h4>
          <ul>
            <li>Đảm bảo tính nguyên bản và không vi phạm bản quyền</li>
            <li>Công bố đầy đủ các xung đột lợi ích</li>
            <li>Tuân thủ các chuẩn mực đạo đức nghiên cứu</li>
            <li>Chịu trách nhiệm về nội dung bài viết</li>
          </ul>
          
          <h4>Bản quyền</h4>
          <p>
            Tất cả các bài viết xuất bản trên tạp chí tuân thủ các quy định về bản quyền 
            theo pháp luật Việt Nam. Tác giả giữ bản quyền nhưng cấp cho tạp chí quyền 
            xuất bản và phân phối.
          </p>
          
          <h4>Đạo đức xuất bản</h4>
          <p>
            Tạp chí tuân thủ các nguyên tắc đạo đức xuất bản của COPE (Committee on Publication Ethics), 
            bao gồm: minh bạch, công bằng, trung thực và trách nhiệm.
          </p>
          
          <h4>Bảo vệ thông tin</h4>
          <p>
            Thông tin cá nhân của tác giả, phản biện và người dùng được bảo vệ theo 
            Luật An ninh mạng và các quy định về bảo vệ dữ liệu cá nhân.
          </p>
          
          <h3>Liên hệ pháp lý</h3>
          <p>
            Mọi vấn đề pháp lý liên quan đến tạp chí, vui lòng liên hệ:<br/>
            <strong>Email:</strong> phapluat@tapchinckhhcqs.vn<br/>
            <strong>Điện thoại:</strong> (024) 1234 5678
          </p>
        </div>
      `,
      contentEn: `
        <div class="prose max-w-none">
          <h2>Electronic Publishing License</h2>
          <p>
            The Electronic Journal of Military Logistics Science operates under Electronic 
            Publishing License No. <strong>[License Number]</strong> issued by the Ministry 
            of Information and Communications on <strong>[Issue Date]</strong>.
          </p>
          
          <h3>Compliance with Circular 41/2022/TT-BTTTT</h3>
          <p>
            The journal fully complies with the provisions of Circular 41/2022/TT-BTTTT of 
            the Ministry of Information and Communications on the management, provision and 
            use of electronic press services.
          </p>
          
          <h4>Key compliance aspects:</h4>
          <ol>
            <li>
              <strong>Publishing process:</strong> All articles undergo rigorous peer review 
              and are approved by the Editorial Board before publication.
            </li>
            <li>
              <strong>Data security:</strong> The system uses SSL/TLS encryption, multi-factor 
              authentication and secure cloud storage.
            </li>
            <li>
              <strong>Audit logging:</strong> All critical activities are logged for audit 
              and monitoring purposes.
            </li>
            <li>
              <strong>Data retention:</strong> Data is backed up regularly and stored in 
              accordance with Vietnamese law.
            </li>
            <li>
              <strong>Content management:</strong> Published content is thoroughly vetted, 
              complying with national security regulations and publication ethics.
            </li>
          </ol>
          
          <h3>Content Policy</h3>
          
          <h4>Publication Scope</h4>
          <p>
            The journal publishes scientific articles in the field of military logistics, 
            including but not limited to: logistics strategy, logistics management, 
            logistics technology, logistics economics.
          </p>
          
          <h4>Author Responsibilities</h4>
          <ul>
            <li>Ensure originality and non-infringement of copyright</li>
            <li>Fully disclose conflicts of interest</li>
            <li>Adhere to research ethics standards</li>
            <li>Take responsibility for article content</li>
          </ul>
          
          <h4>Copyright</h4>
          <p>
            All articles published in the journal comply with copyright regulations under 
            Vietnamese law. Authors retain copyright but grant the journal the right to 
            publish and distribute.
          </p>
          
          <h4>Publication Ethics</h4>
          <p>
            The journal adheres to COPE (Committee on Publication Ethics) publication ethics 
            principles, including: transparency, fairness, honesty and accountability.
          </p>
          
          <h4>Information Protection</h4>
          <p>
            Personal information of authors, reviewers and users is protected under the 
            Cybersecurity Law and personal data protection regulations.
          </p>
          
          <h3>Legal Contact</h3>
          <p>
            For any legal matters related to the journal, please contact:<br/>
            <strong>Email:</strong> phapluat@tapchinckhhcqs.vn<br/>
            <strong>Phone:</strong> (024) 1234 5678
          </p>
        </div>
      `,
      metaTitle: 'Giấy phép và Quy định pháp lý - Tạp chí Khoa học Hậu cần quân sự',
      metaTitleEn: 'License and Legal Regulations - Military Logistics Science Journal',
      metaDesc: 'Thông tin về giấy phép xuất bản điện tử, tuân thủ Thông tư 41/2022/TT-BTTTT và các quy định pháp lý của Tạp chí điện tử Khoa học Hậu cần quân sự.',
      metaDescEn: 'Information about electronic publishing license, compliance with Circular 41/2022/TT-BTTTT and legal regulations of the Electronic Journal of Military Logistics Science.',
      isPublished: true,
      publishedAt: new Date(),
      template: 'default',
      order: 3
    }
  });
  console.log('✅ Created License page:', licensePage.slug);

  // 4. Publishing Process Page (Quy trình xuất bản)
  const publishingPage = await prisma.publicPage.create({
    data: {
      slug: 'publishing-process',
      title: 'Quy trình xuất bản',
      titleEn: 'Publishing Process',
      content: `
        <div class="prose max-w-none">
          <h2>Quy trình xuất bản bài báo khoa học</h2>
          <p>
            Tạp chí điện tử Khoa học Hậu cần quân sự tuân thủ quy trình xuất bản khoa học 
            nghiêm ngặt để đảm bảo chất lượng và tính học thuật của các bài viết.
          </p>
          
          <h3>1. Gửi bài (Submission)</h3>
          <p>
            Tác giả đăng ký tài khoản và nộp bài viết qua hệ thống trực tuyến. Bài viết cần 
            tuân thủ các yêu cầu về định dạng, độ dài và nội dung.
          </p>
          <ul>
            <li>Định dạng: DOC, DOCX hoặc PDF</li>
            <li>Độ dài: 3000-8000 từ (không bao gồm tài liệu tham khảo)</li>
            <li>Ngôn ngữ: Tiếng Việt (bắt buộc có tóm tắt tiếng Anh)</li>
          </ul>
          
          <h3>2. Kiểm tra sơ bộ (Initial Screening)</h3>
          <p>
            Ban biên tập kiểm tra bài viết về:
          </p>
          <ul>
            <li>Phù hợp với phạm vi và định hướng của tạp chí</li>
            <li>Tuân thủ các yêu cầu về định dạng và trình bày</li>
            <li>Không vi phạm đạo đức nghiên cứu và xuất bản</li>
            <li>Kiểm tra đạo văn bằng phần mềm iThenticate</li>
          </ul>
          <p>
            <em>Thời gian: 5-7 ngày làm việc</em>
          </p>
          
          <h3>3. Phân công phản biện (Peer Review Assignment)</h3>
          <p>
            Bài viết được gửi đến ít nhất 2 phản biện độc lập, là các chuyên gia trong lĩnh vực. 
            Tạp chí áp dụng phương thức phản biện kín (Double-blind peer review).
          </p>
          <p>
            <em>Thời gian: 3-4 tuần</em>
          </p>
          
          <h3>4. Quyết định biên tập (Editorial Decision)</h3>
          <p>
            Dựa trên ý kiến của các phản biện, Ban biên tập sẽ đưa ra một trong các quyết định:
          </p>
          <ul>
            <li><strong>Chấp nhận:</strong> Bài viết được chấp nhận xuất bản</li>
            <li><strong>Chỉnh sửa nhỏ:</strong> Yêu cầu tác giả chỉnh sửa và nộp lại</li>
            <li><strong>Chỉnh sửa lớn:</strong> Yêu cầu chỉnh sửa đáng kể và phản biện lại</li>
            <li><strong>Từ chối:</strong> Bài viết không phù hợp để xuất bản</li>
          </ul>
          <p>
            <em>Thời gian: 1-2 tuần sau khi nhận đủ phản biện</em>
          </p>
          
          <h3>5. Chỉnh sửa và nộp lại (Revision)</h3>
          <p>
            Nếu bài viết cần chỉnh sửa, tác giả sẽ nhận được thông báo kèm ý kiến chi tiết 
            từ Ban biên tập và phản biện. Tác giả cần:
          </p>
          <ul>
            <li>Chỉnh sửa bài viết theo yêu cầu</li>
            <li>Trả lời từng ý kiến của phản biện</li>
            <li>Nộp lại bài viết đã chỉnh sửa trong thời gian quy định (thường 2-4 tuần)</li>
          </ul>
          
          <h3>6. Biên tập kỹ thuật (Copy-editing)</h3>
          <p>
            Sau khi bài viết được chấp nhận, Ban biên tập tiến hành:
          </p>
          <ul>
            <li>Biên tập ngôn ngữ và văn phong</li>
            <li>Kiểm tra và chuẩn hóa trích dẫn, tài liệu tham khảo</li>
            <li>Định dạng bài viết theo template của tạp chí</li>
            <li>Cấp DOI (Digital Object Identifier) cho bài viết</li>
          </ul>
          <p>
            <em>Thời gian: 1-2 tuần</em>
          </p>
          
          <h3>7. Duyệt bản in (Proofreading)</h3>
          <p>
            Bản thảo cuối cùng được gửi cho tác giả để kiểm tra và xác nhận. Tác giả có thể 
            yêu cầu chỉnh sửa nhỏ nếu cần thiết.
          </p>
          <p>
            <em>Thời gian: 3-5 ngày làm việc</em>
          </p>
          
          <h3>8. Xuất bản (Publication)</h3>
          <p>
            Bài viết được xuất bản trực tuyến và đưa vào số tạp chí tương ứng. Tác giả sẽ 
            nhận được thông báo và bản PDF của bài viết đã xuất bản.
          </p>
          
          <h3>Tổng thời gian</h3>
          <p>
            Từ lúc nộp bài đến khi xuất bản: <strong>8-12 tuần</strong> (có thể kéo dài hơn 
            nếu bài viết cần chỉnh sửa nhiều lần).
          </p>
          
          <h3>Hướng dẫn cho tác giả</h3>
          <p>
            Để biết thêm chi tiết về yêu cầu định dạng, template và hướng dẫn nộp bài, 
            vui lòng xem <a href="/guidelines">Hướng dẫn cho tác giả</a>.
          </p>
          
          <h3>Liên hệ hỗ trợ</h3>
          <p>
            Nếu có thắc mắc về quy trình xuất bản, vui lòng liên hệ:<br/>
            <strong>Email:</strong> tacgia@tapchinckhhcqs.vn<br/>
            <strong>Điện thoại:</strong> (024) 1234 5678
          </p>
        </div>
      `,
      contentEn: `
        <div class="prose max-w-none">
          <h2>Scientific Article Publishing Process</h2>
          <p>
            The Electronic Journal of Military Logistics Science follows a rigorous scientific 
            publishing process to ensure the quality and academic integrity of articles.
          </p>
          
          <h3>1. Submission</h3>
          <p>
            Authors register an account and submit their manuscript through the online system. 
            Articles must comply with requirements regarding format, length and content.
          </p>
          <ul>
            <li>Format: DOC, DOCX or PDF</li>
            <li>Length: 3000-8000 words (excluding references)</li>
            <li>Language: Vietnamese (English abstract required)</li>
          </ul>
          
          <h3>2. Initial Screening</h3>
          <p>
            The Editorial Board checks the article for:
          </p>
          <ul>
            <li>Alignment with the journal's scope and direction</li>
            <li>Compliance with formatting and presentation requirements</li>
            <li>No violation of research and publication ethics</li>
            <li>Plagiarism check using iThenticate software</li>
          </ul>
          <p>
            <em>Duration: 5-7 working days</em>
          </p>
          
          <h3>3. Peer Review Assignment</h3>
          <p>
            The article is sent to at least 2 independent reviewers who are experts in the field. 
            The journal employs double-blind peer review.
          </p>
          <p>
            <em>Duration: 3-4 weeks</em>
          </p>
          
          <h3>4. Editorial Decision</h3>
          <p>
            Based on reviewers' comments, the Editorial Board will make one of the following decisions:
          </p>
          <ul>
            <li><strong>Accept:</strong> Article is accepted for publication</li>
            <li><strong>Minor revision:</strong> Requires author to revise and resubmit</li>
            <li><strong>Major revision:</strong> Requires significant revision and re-review</li>
            <li><strong>Reject:</strong> Article is not suitable for publication</li>
          </ul>
          <p>
            <em>Duration: 1-2 weeks after receiving all reviews</em>
          </p>
          
          <h3>5. Revision and Resubmission</h3>
          <p>
            If the article requires revision, authors will receive a notification with detailed 
            comments from the Editorial Board and reviewers. Authors need to:
          </p>
          <ul>
            <li>Revise the article as requested</li>
            <li>Respond to each reviewer comment</li>
            <li>Resubmit the revised article within the specified time (usually 2-4 weeks)</li>
          </ul>
          
          <h3>6. Copy-editing</h3>
          <p>
            After the article is accepted, the Editorial Board conducts:
          </p>
          <ul>
            <li>Language and style editing</li>
            <li>Check and standardize citations and references</li>
            <li>Format the article according to the journal's template</li>
            <li>Assign DOI (Digital Object Identifier) to the article</li>
          </ul>
          <p>
            <em>Duration: 1-2 weeks</em>
          </p>
          
          <h3>7. Proofreading</h3>
          <p>
            The final manuscript is sent to the author for review and confirmation. Authors can 
            request minor corrections if necessary.
          </p>
          <p>
            <em>Duration: 3-5 working days</em>
          </p>
          
          <h3>8. Publication</h3>
          <p>
            The article is published online and included in the corresponding journal issue. 
            Authors will receive a notification and PDF of the published article.
          </p>
          
          <h3>Total Timeline</h3>
          <p>
            From submission to publication: <strong>8-12 weeks</strong> (may be longer if the 
            article requires multiple revisions).
          </p>
          
          <h3>Author Guidelines</h3>
          <p>
            For more details on formatting requirements, templates and submission guidelines, 
            please see <a href="/guidelines">Author Guidelines</a>.
          </p>
          
          <h3>Support Contact</h3>
          <p>
            If you have questions about the publishing process, please contact:<br/>
            <strong>Email:</strong> tacgia@tapchinckhhcqs.vn<br/>
            <strong>Phone:</strong> (024) 1234 5678
          </p>
        </div>
      `,
      metaTitle: 'Quy trình xuất bản - Tạp chí Khoa học Hậu cần quân sự',
      metaTitleEn: 'Publishing Process - Military Logistics Science Journal',
      metaDesc: 'Tìm hiểu quy trình xuất bản bài báo khoa học tại Tạp chí điện tử Khoa học Hậu cần quân sự. Từ nộp bài, phản biện đến xuất bản.',
      metaDescEn: 'Learn about the scientific article publishing process at the Electronic Journal of Military Logistics Science. From submission, peer review to publication.',
      isPublished: true,
      publishedAt: new Date(),
      template: 'default',
      order: 4
    }
  });
  console.log('✅ Created Publishing Process page:', publishingPage.slug);

  console.log('\n✅ Public Pages seeding completed successfully!');
  console.log(`\nCreated ${4} pages:`);
  console.log(`- ${aboutPage.slug}`);
  console.log(`- ${contactPage.slug}`);
  console.log(`- ${licensePage.slug}`);
  console.log(`- ${publishingPage.slug}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding public pages:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
