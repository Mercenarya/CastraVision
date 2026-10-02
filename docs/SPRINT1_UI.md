# CastraVision · giao diện Sprint 1

Giao diện trong `CastraView` được xây theo sáu PDF Figma do nhóm cung cấp: đăng ký,
đăng nhập, onboarding hồ sơ doanh nghiệp, nhập dữ liệu chiến dịch, tạo chiến lược và
Content Studio. Các màn hình dùng cùng hệ màu navy, lavender, cyan và cùng sidebar.

## Luồng đã nối API

1. Đăng ký / đăng nhập / đăng xuất bằng Django session và CSRF; mật khẩu được Django băm.
2. Onboarding hai bước và cập nhật hồ sơ doanh nghiệp (`GET/PUT /api/business-profile/`).
   Tên, ngành, quy mô, khách hàng mục tiêu là bắt buộc; hồ sơ gắn với người dùng.
3. Tải CSV/XLSX tối đa 5 MB, xem trước, kiểm tra dòng lỗi rồi xác nhận nhập. Cột bắt
   buộc: `channel,period,spend,clicks,impressions,conversions`; `revenue` tùy chọn.
   Tối đa 2.000 dòng/tệp. Dữ liệu chuẩn hóa được lưu theo người dùng.
4. Tạo và phân tích lại chiến lược FR01 từ hồ sơ và tối đa 30 dòng của lần nhập gần nhất.
   API hiện có trả JSON cấu trúc, phân bổ ngân sách, thông điệp, hành động và nguồn tham chiếu.

Content Studio thể hiện bản nháp nội dung theo mẫu từ chiến lược đã tạo, có thể sửa và
sao chép. Đây **không phải** tính năng sinh nội dung AI chuyên biệt của sprint sau.
Giao diện ghi rõ giới hạn này để tránh nhầm lẫn.

## Chạy local

Tại thư mục gốc:

```powershell
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Terminal khác:

```powershell
cd CastraView
npm ci
npm run dev
```

Mở `http://127.0.0.1:5173/`. Vite proxy `/api` sang backend; khi chạy Docker Compose,
proxy tự chuyển đến service `backend`. Khi chưa có `OPENAI_API_KEY`, màn hình chiến lược
dùng fallback có quy tắc và hiện cảnh báo rõ ràng.

## Kiểm tra

```powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m ruff check CastraServices CastraVision
cd CastraView
npm run lint
npm run build
```

Không dùng dữ liệu nhập của một tài khoản làm nguồn RAG toàn cục, để tránh lộ lịch sử
chiến dịch sang tài khoản khác. Chỉ số lịch sử của tài khoản được gửi trực tiếp trong
yêu cầu tạo chiến lược của chính tài khoản đó.
