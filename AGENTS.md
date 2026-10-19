# Quy tắc dự án CastraVision (phần Frontend)

## Phạm vi
- CHỈ được sửa/tạo file trong thư mục CastraView/ và docs/UI/.
- KHÔNG sửa backend (CastraServices, manage.py, supabase, Datasources, Utils, data, notebooks), Docker, hay file .env.
- KHÔNG chạy git commit/push/reset. Việc dùng git do tôi tự làm.
- KHÔNG sửa package-lock.json bằng tay. Chỉ cài thư viện mới sau khi hỏi tôi.

## Stack
- React 19 + Vite 8, JavaScript (không dùng TypeScript).
- Linter: oxlint. Sau mỗi tác vụ chạy `npm run lint` và `npm run build` trong CastraView, báo kết quả.
- Router: react-router-dom (được phép cài).
- Style: CSS thuần với biến CSS (CSS variables) cho màu/font/spacing, một file tokens duy nhất. Không hard-code màu rải rác.

## Cấu trúc thư mục trong CastraView/src
- components/  : component dùng lại (Button, Card, Table, Modal...)
- pages/       : mỗi màn hình một thư mục/file
- layouts/     : khung chung (Sidebar, Header)
- services/    : toàn bộ lời gọi API (không fetch trực tiếp trong component)
- mocks/       : dữ liệu giả khi chưa nối API
- hooks/, utils/, styles/

## Quy ước
- Mỗi component một file, tên PascalCase.
- Base URL của API đọc từ biến môi trường VITE_API_BASE_URL (khai báo trong .env.example).
- Giao diện phải bám sát ảnh trong docs/UI/. Khi không chắc, hỏi tôi.
- Mọi chữ hiển thị trên giao diện dùng tiếng Việt nếu ảnh thiết kế là tiếng Việt.
- Không tự thêm tính năng ngoài ảnh thiết kế.