# Quy tắc dự án CastraVision (phần Frontend)

## Phạm vi
- CHỈ được sửa/tạo file trong thư mục CastraView/ và docs/UI/.
- KHÔNG sửa backend (CastraServices, manage.py, supabase, Datasources, Utils, data, notebooks), Docker, hay file .env.
- KHÔNG chạy git commit/push/reset. Việc dùng git do tôi tự làm.
- KHÔNG sửa package-lock.json bằng tay. Chỉ cài thư viện mới sau khi hỏi tôi.
  Ngoại lệ đã được duyệt sẵn (stack UI): tailwindcss, @tailwindcss/vite, shadcn (CLI) và các gói nó kéo theo,
  class-variance-authority, clsx, tailwind-merge, lucide-react, tw-animate-css, radix-ui, prop-types, react-router-dom.

## Stack
- React 19 + Vite 8, JavaScript (không dùng TypeScript).
- Linter: oxlint. Sau mỗi tác vụ chạy `npm run lint` và `npm run build` trong CastraView, báo kết quả.
- Router: react-router-dom (được phép cài).
- Style: Tailwind CSS v4 (plugin `@tailwindcss/vite`) + shadcn/ui bản JavaScript (`components.json` đặt `tsx: false`).
  - Alias `@/` trỏ tới `src/` (khai báo trong `vite.config.js` và `jsconfig.json`).
  - Màu/font/radius là biến theme của shadcn trong `src/styles/tokens.css` (kèm `success`, `warning`, `info`, `violet`, `coral` → dùng `text-success`, `bg-info/15`...). Không hard-code màu hex trong JSX.
  - Gộp class bằng `cn()` (`src/lib/utils.js`), biến thể dùng `cva`, icon dùng `lucide-react`.
  - Thêm component nền bằng `npx shadcn@latest add <tên>` (sau khi hỏi tôi nếu cần cài thêm gói ngoài danh sách trên).
  - Code mới KHÔNG viết file `.css` riêng, CSS modules hay styled-components. Toàn bộ CSS cũ (App.css, actor-ui.css, CSS riêng của component) đã được gỡ; `index.css` và `styles/tokens.css` là hai file CSS duy nhất.

## Cấu trúc thư mục trong CastraView/src
- components/  : component dùng lại (StatCard, AlertPanel...), ghép từ components/ui/
- components/ui/ : component nền do shadcn sinh ra (Button, Card, Table, Dialog...), hạn chế sửa tay
- lib/         : utils.js (cn), api client, supabase
- pages/       : mỗi màn hình một thư mục/file
- layouts/     : khung chung (Sidebar, Header)
- services/    : toàn bộ lời gọi API (không fetch trực tiếp trong component)
- mocks/       : dữ liệu giả khi chưa nối API
- hooks/, utils/, styles/ (tokens.css + điểm vào Tailwind)

## Quy ước
- Mỗi component một file, tên PascalCase.
- Base URL của API đọc từ biến môi trường VITE_API_BASE_URL (khai báo trong .env.example).
- Giao diện phải bám sát ảnh trong docs/UI/. Khi không chắc, hỏi tôi.
- Mọi chữ hiển thị trên giao diện dùng tiếng Việt nếu ảnh thiết kế là tiếng Việt.
- Không tự thêm tính năng ngoài ảnh thiết kế.
## Thêm component shadcn
- Chạy `npx shadcn@latest add <tên> -y` trong CastraView.
- Lỗi đã biết: CLI tự thêm gói rác `cn` vào package.json và sinh `import { cn } from "cn"`. Sau mỗi lần add: `npm uninstall cn` và đổi import thành `"@/lib/utils"` trong `src/components/ui/`.
- Chạy `npm run lint` và `npm run build` sau khi add.
