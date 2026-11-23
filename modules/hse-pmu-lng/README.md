# HSE PMU Command – LNG | HSE Ban Quản lý dự án (Chủ đầu tư)

Bộ cẩm nang/ứng dụng offline tiếng Việt giúp nghiên cứu vai trò HSE Manager phía BQLDA cho dự án LNG, **không phải hồ sơ hoặc quy trình được Trung Nam chấp thuận**.

## Chạy ngay
- Mở `index.html` bằng Chrome hoặc Edge. Không cần server, Node, Python hay tài khoản.
- Giao diện và dữ liệu mô phỏng đều sử dụng offline. Internet chỉ cần khi mở nguồn pháp lý liên kết.
- Dữ liệu tiến độ nhập trong ứng dụng lưu cục bộ trên chính trình duyệt; phải xuất JSON nếu muốn sao lưu.

## Nội dung
- **35** quy trình trải qua 5 giai đoạn dự án; mỗi quy trình có đầu vào, cách làm, đầu ra, tiêu chí đạt, cảnh báo và ví dụ.
- Thư viện căn cứ pháp lý/tiêu chuẩn, ma trận RACI, yêu cầu HSE cho EPC, các điểm kiểm soát, biểu mẫu CSV và luyện phỏng vấn.
- Các nội dung về phạm vi áp dụng văn bản, chức danh, pháp nhân, tiến độ và phân quyền cần đối chiếu tài liệu thực tế trước khi vận dụng.

## Phát triển tiếp bằng Codex
- `source/content.json`: nguồn dữ liệu cấu trúc (quy trình, nguồn pháp lý, câu hỏi, biểu mẫu).
- `source/content.py`: lớp tương thích để truy xuất JSON bằng Python.
- `source/template.html`: CSS, bố cục và logic giao diện, với một placeholder `__DATA__`.
- `source/build.py`: tạo lại `index.html` bằng lệnh `python3 modules/hse-pmu-lng/source/build.py` tại thư mục gốc repository.
- `source/test_app.js`: smoke test tĩnh bằng lệnh `node modules/hse-pmu-lng/source/test_app.js`.

Dữ liệu chỉ dùng để đào tạo và mô phỏng. Không tải lên GitHub các hồ sơ dự án thật, thông tin bảo mật hoặc dữ liệu cá nhân. Cần chuyên gia pháp lý và kỹ thuật kiểm chứng từng yêu cầu trước khi dùng như tài liệu quản lý chính thức.

## Cấu trúc repository
Ứng dụng này được đặt trong `modules/hse-pmu-lng/` của `HSEManager` để **không thay đổi** dự án Base44 ở nhánh main.
