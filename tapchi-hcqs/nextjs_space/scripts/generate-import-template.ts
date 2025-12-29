/**
 * Script tạo template Excel cho import bài báo
 * 
 * Chạy: yarn tsx scripts/generate-import-template.ts
 */

import ExcelJS from 'exceljs';
import path from 'path';

async function generateTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Articles Import');
  
  // Định nghĩa các cột
  worksheet.columns = [
    { header: 'STT', key: 'stt', width: 8 },
    { header: 'Mã bài báo *', key: 'maBaiBao', width: 15 },
    { header: 'Tiêu đề (VN) *', key: 'tieuDeVN', width: 50 },
    { header: 'Tiêu đề (EN)', key: 'tieuDeEN', width: 50 },
    { header: 'Tác giả *', key: 'tacGia', width: 25 },
    { header: 'Email tác giả *', key: 'emailTacGia', width: 30 },
    { header: 'Đơn vị *', key: 'donVi', width: 35 },
    { header: 'Tóm tắt (VN) *', key: 'tomTatVN', width: 60 },
    { header: 'Tóm tắt (EN)', key: 'tomTatEN', width: 60 },
    { header: 'Từ khóa *', key: 'tuKhoa', width: 40 },
    { header: 'Danh mục *', key: 'danhMuc', width: 25 },
    { header: 'Năm xuất bản *', key: 'namXuatBan', width: 18 },
    { header: 'Số tạp chí *', key: 'soTapChi', width: 15 },
    { header: 'Tập tạp chí', key: 'tapTapChi', width: 15 },
    { header: 'Trang bắt đầu', key: 'trangBatDau', width: 15 },
    { header: 'Trang kết thúc', key: 'trangKetThuc', width: 15 },
    { header: 'Trang số', key: 'trangSo', width: 15 },
    { header: 'Trang số format', key: 'trangSoFormat', width: 18 },
    { header: 'Tên file PDF *', key: 'tenFilePDF', width: 30 },
    { header: 'Trạng thái *', key: 'trangThai', width: 15 },
    { header: 'DOI', key: 'doi', width: 30 },
    { header: 'Ghi chú', key: 'ghiChu', width: 40 },
  ];
  
  // Style cho header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0066CC' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30;
  
  // Thêm dữ liệu mẫu
  const sampleData = [
    {
      stt: 1,
      maBaiBao: 'BB-2020-001',
      tieuDeVN: 'Ứng dụng trí tuệ nhân tạo trong y tế hiện đại',
      tieuDeEN: 'Application of Artificial Intelligence in Modern Healthcare',
      tacGia: 'Nguyễn Văn A',
      emailTacGia: 'nguyenvana@example.com',
      donVi: 'Đại học Quốc gia Hà Nội',
      tomTatVN: 'Nghiên cứu này tập trung vào việc áp dụng các thuật toán học máy trong chẩn đoán bệnh...',
      tomTatEN: 'This research focuses on applying machine learning algorithms in disease diagnosis...',
      tuKhoa: 'AI, Machine Learning, Healthcare, Medical Diagnosis',
      danhMuc: 'Công nghệ thông tin',
      namXuatBan: 2020,
      soTapChi: 1,
      tapTapChi: 15,
      trangBatDau: '1',
      trangKetThuc: '10',
      trangSo: '1-10',
      trangSoFormat: 'pp. 1-10',
      tenFilePDF: 'article-001.pdf',
      trangThai: 'PUBLISHED',
      doi: '10.1234/tapchi.2020.001',
      ghiChu: 'Bài viết xuất sắc',
    },
    {
      stt: 2,
      maBaiBao: 'BB-2020-002',
      tieuDeVN: 'Phân tích dữ liệu lớn trong giáo dục',
      tieuDeEN: 'Big Data Analytics in Education',
      tacGia: 'Trần Thị B',
      emailTacGia: 'tranthib@example.com',
      donVi: 'Đại học Bách Khoa Hà Nội',
      tomTatVN: 'Bài viết trình bày việc sử dụng Big Data để cải thiện chất lượng giáo dục...',
      tomTatEN: 'This paper presents the use of Big Data to improve education quality...',
      tuKhoa: 'Big Data, Education, Learning Analytics, Data Science',
      danhMuc: 'Giáo dục',
      namXuatBan: 2020,
      soTapChi: 1,
      tapTapChi: 15,
      trangBatDau: '11',
      trangKetThuc: '20',
      trangSo: '11-20',
      trangSoFormat: 'pp. 11-20',
      tenFilePDF: 'article-002.pdf',
      trangThai: 'PUBLISHED',
      doi: '10.1234/tapchi.2020.002',
      ghiChu: '',
    },
    {
      stt: 3,
      maBaiBao: 'BB-2020-003',
      tieuDeVN: 'Bảo mật thông tin trong môi trường điện toán đám mây',
      tieuDeEN: 'Information Security in Cloud Computing Environment',
      tacGia: 'Lê Văn C',
      emailTacGia: 'levanc@example.com',
      donVi: 'Học viện Kỹ thuật quân sự',
      tomTatVN: 'Nghiên cứu các giải pháp bảo mật cho hệ thống điện toán đám mây...',
      tomTatEN: 'Research on security solutions for cloud computing systems...',
      tuKhoa: 'Cloud Security, Cybersecurity, Information Security',
      danhMuc: 'Bảo mật thông tin',
      namXuatBan: 2020,
      soTapChi: 2,
      tapTapChi: 15,
      trangBatDau: '1',
      trangKetThuc: '15',
      trangSo: '1-15',
      trangSoFormat: 'pp. 1-15',
      tenFilePDF: 'article-003.pdf',
      trangThai: 'REJECTED',
      doi: '',
      ghiChu: 'Cần bổ sung thính nghiệm',
    },
  ];
  
  // Thêm dữ liệu mẫu
  sampleData.forEach((data) => {
    const row = worksheet.addRow(data);
    
    // Style cho các cột bắt buộc (background vàng nhạt)
    const requiredColumns = [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 19, 20]; // Index các cột có dấu *
    requiredColumns.forEach((colIndex) => {
      const cell = row.getCell(colIndex);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFE599' }, // Vàng nhạt
      };
    });
    
    // Style cho PUBLISHED (xanh lá)
    if (data.trangThai === 'PUBLISHED') {
      const statusCell = row.getCell(20);
      statusCell.font = { bold: true, color: { argb: 'FF006600' } };
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCFFCC' },
      };
    }
    
    // Style cho REJECTED (đỏ nhạt)
    if (data.trangThai === 'REJECTED') {
      const statusCell = row.getCell(20);
      statusCell.font = { bold: true, color: { argb: 'FF990000' } };
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFCCCC' },
      };
    }
  });
  
  // Note: Data validation would be added here in production
  // Excel data validation is optional for this template
  
  // Thêm ghi chú hướng dẫn
  const instructionsSheet = workbook.addWorksheet('Hướng dẫn');
  instructionsSheet.columns = [
    { header: 'Mục', key: 'section', width: 30 },
    { header: 'Nội dung', key: 'content', width: 80 },
  ];
  
  const instructions = [
    { section: '📖 Cách sử dụng', content: 'Bạn cần điền đầy đủ thông tin vào các cột có dấu * (bắt buộc) và upload file PDF tương ứng vào folder pdf-imports/' },
    { section: '📌 Lưu ý quan trọng', content: 'Tên file PDF trong cột "Tên file PDF" phải khớp CHÍNH XÁC với tên file trong folder pdf-imports/' },
    { section: '✅ PUBLISHED', content: 'Bài đã xuất bản - Sẽ hiển thị công khai trên website, mọi người đều xem được' },
    { section: '❌ REJECTED', content: 'Bài không duyệt - KHÔNG hiển thị công khai, chỉ admin/editor/tác giả xem được' },
    { section: '📧 Email tác giả', content: 'Phải là email hợp lệ. Nếu tác giả chưa có trong hệ thống, sẽ tự động tạo tài khoản mới' },
    { section: '📂 Danh mục', content: 'Nếu danh mục chưa tồn tại, sẽ tự động tạo danh mục mới' },
    { section: '📖 Số/Tập tạp chí', content: 'Nếu Issue chưa tồn tại, sẽ tự động tạo Issue mới' },
    { section: '🏷️ Từ khóa', content: 'Các từ khóa phân cách bởi dấu phẩy (,). Ví dụ: AI, Machine Learning, Healthcare' },
    { section: '📄 Trang số', content: 'Có thể điền: "Trang bắt đầu" và "Trang kết thúc", hoặc "Trang số" (ví dụ: 1-10), hoặc "Trang số format" (ví dụ: pp. 1-10)' },
    { section: '📤 Upload PDF', content: 'File PDF sẽ được tự động upload lên AWS S3. Đảm bảo cấu hình AWS trong file .env' },
    { section: '🚀 Chạy script', content: 'yarn tsx scripts/import-articles-from-excel.ts scripts/articles-import.xlsx' },
  ];
  
  instructions.forEach((item) => {
    instructionsSheet.addRow(item);
  });
  
  // Style cho instruction sheet
  const instrHeaderRow = instructionsSheet.getRow(1);
  instrHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  instrHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF006600' },
  };
  
  // Lưu file
  const outputPath = path.join(__dirname, 'IMPORT_TEMPLATE.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  
  console.log(`\n✅ Đã tạo template thành công: ${outputPath}`);
  console.log('\n📝 Hướng dẫn sử dụng:');
  console.log('   1. Mở file IMPORT_TEMPLATE.xlsx');
  console.log('   2. Điền thông tin bài báo vào các dòng');
  console.log('   3. Lưu lại với tên khác (ví dụ: articles-import.xlsx)');
  console.log('   4. Chạy: yarn tsx scripts/import-articles-from-excel.ts scripts/articles-import.xlsx\n');
}

generateTemplate()
  .then(() => {
    console.log('✨ Hoàn tất!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  });
