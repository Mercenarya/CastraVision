# Hướng dẫn Dự án CastraVision

## Tổng quan Dự án
CastraVision là một ứng dụng full-stack bao gồm:
- **Backend**: API Django REST Framework (CastraServices/)
- **Frontend**: Ứng dụng React/Vite (CastraView/)
- **Tiện ích**: Công cụ và script được chia sẻ (Utils/)
- **Kiểm thử**: Bộ kiểm thử (TEST/)
- **Tài liệu**: Tài liệu dự án (docs/)
- **Dữ liệu**: Dữ liệu mẫu và cơ sở tri thức (data/)

## Quy trình Phát triển

### 1. Thiết lập Môi trường Phát triển
- [ ] Clone repository
- [ ] Tạo môi trường ảo: `python -m venv venv`
- [ ] Kích hoạt môi trường: `source venv/bin/activate` (Linux/Mac) hoặc `venv\Scripts\activate` (Windows)
- [ ] Cài đặt dependencies: `pip install -r requirements.txt`
- [ ] Cài đặt dependencies frontend: `cd CastraView && npm install`
- [ ] Thiết lập biến môi trường (sao chép `.env.example` thành `.env`)
- [ ] Chạy migration: `python manage.py migrate`
- [ ] Tạo superuser: `python manage.py createsuperuser`
- [ ] Tải dữ liệu mẫu (nếu có thể): `python manage.py loaddata sample_data.json`
- [ ] Khởi chạy máy chủ phát triển:
  - Backend: `python manage.py runserver`
  - Frontend: `cd CastraView && npm run dev`

### 2. Thực hiện Thay đổi
- [ ] Tạo nhánh mới: `git checkout -b feature/your-feature-name`
- [ ] Thực hiện thay đổi của bạn tuân theo các quy tắc và Skill phù hợp
- [ ] Viết hoặc cập nhật tests khi cần thiết
- [ ] Chạy tests địa phương: `python manage.py test` và/hoặc `cd CastraView && npm test`
- [ ] Đảm bảo code qua linting
- [ ] Cam kết Changes với thông điệp mô tả rõ ràng
- [ ] Đẩy lên remote: `git push -u origin feature/your-feature-name`
- [ ] Tạo pull request để review

### 3. Quy trình Review Code
- [ ] Đảm bảo mô tả PR giải thích rõ ràng gì và tại sao
- [ ] Liên kết tới các issues hoặc tickets liên quan
- [ ] Bao gồm ảnh chụp màn hình cho thay đổi UI
- [ ] Đáp ứng timely tất cả các bình luận review
- [ ] Yêu cầu review lại sau khi giải quyết các bình luận
- [ ] Đảm bảo CI qua trước khi hợp nhất
- [ ] Gộp commit nếu được yêu cầu bởi người duy trì
- [ ] Xóa nhánh sau khi hợp nhất

### 4. Hướng dẫn Kiểm thử
- [ ] Viết kiểm thử đơn vị cho tất cả chức năng mới
- [ ] Mục tiêu đạt >80% độ bao phủ kiểm thử
- [ ] Kiểm thử cả trường hợp tích cực và tiêu cực
- [ ] Giả lập các phụ thuộc bên ngoài
- [ ] Chạy tests trước khi cam kết
- [ ] Sử dụng pytest cho các tests Python và Jest/React Testing Library cho frontend tests
- [ ] Bao gồm các trường hợp đặc biệt trong các kịch bản kiểm thử

### 5. Yêu cầu Tài liệu
- [ ] Cập nhật README.md nếu có thay đổi kiến trúc
- [ ] Cập nhật tài liệu API nếu endpoints thay đổi
- [ ] Thêm comment để giải thích logic phức tạp
- [ ] Cập nhật thư mục docs/ với tính năng mới
- [ ] Đảm bảo tài liệu nội dòng tuân thủ tiêu chuẩn dự án

## Stack Công nghệ

### Backend (Django)
- Python 3.8+
- Django 4.x
- Django REST Framework 3.x
- PostgreSQL (khuyến nghị) hoặc SQLite cho phát triển
- Celery cho các任务 nền
- Redis cho caching và message broker
- Django-filter cho lọc API
- drf-spectacular hoặc drf-yasg cho tài liệu API

### Frontend (React)
- React 18+
- Vite 4.x
- React Router DOM 6.x
- Axios hoặc Fetch cho yêu cầu HTTP
- Formik hoặc React Hook Form cho form
- Yup hoặc Zod cho xác thực
- Styled Components hoặc CSS Modules cho styling
- React Query để lấy dữ liệu
- Redux Toolkit hoặc Zustand để quản lý state (nếu cần)
- TypeScript (tùy chọn nhưng được khuyến nghị)

### DevOps
- Docker để đóng gói container
- Gunicorn cho máy chủ WSGI sản xuất
- Nginx cho reverse proxy
- PostgreSQL cho cơ sở dữ liệu sản xuất
- Redis cho caching
- Celery với RabbitMQ/Redis cho tasks nền
- AWS/GCP/Azure cho triển khai trên đám mây
- GitHub Actions cho CI/CD
- Sentry để theo dõi lỗi
- LogRocket hoặc tương tự để giám sát frontend

## Tiêu chuẩn Code

### Python (Backend)
- Tuân theo PEP 8 hướng dẫn phong cách
- Sử dụng Black để định dạng code (độ dài dòng 88)
- Sử dụng isort để sắp xếp import
- Sử dụng flake8 để kiểm tra lint
- Sử dụng pytest để kiểm thử
- Sử dụng factory_boy cho fixtures test
- Sử dụng django-extensions cho shell_plus và các tiện ích khác
- Sử dụng python-decouple hoặc tương tự để quản lý môi trường
- Sử dụng django-environ để quản lý biến môi trường

### JavaScript/Frontend
- Sử dụng Prettier để định dạng code
- Sử dụng ESLint để kiểm tra chất lượng code
- Sử dụng React Testing Library và Jest để kiểm thử
- Sử dụng TypeScript để an toàn kiểu (nếu được áp dụng)
- Sử dụng tính năng ES6+ (hàm mũi tên, destructuring, etc.)
- Tránh console.log trong code sản xuất
- Sử dụng tên biến và hàm có ý nghĩa
- Giữ funções nhỏ và tập trung
- Sử dụng async/await cho các hoạt động bất đồng bộ
- Xử lý promises đúng cách với try/catch

### Thựcارسات Git
- Sử dụng định dạng commit conventionally:
  - feat: tính năng mới
  - fix: sửa lỗi
  - docs: thay đổi tài liệu
  - style: định dạng, thiếu dấu chấm phẩy, v.v.
  - refactor: tái cấu trúc code
  - perf: cải thiện hiệu suất
  - test: thêm hoặc sửa tests
  - chore: công việc bảo trì
- Giữ commits nguyên tử và tập trung
- Viết thông điệp cam kết rõ ràng giải thích tại sao
- Tham chiếu số issue trong commits khi thích hợp
- Rebase nhánh tính năng trước khi hợp nhất
- Xóa nhánh sau khi hợp nhất

## Hướng dẫn Cấu Trúc Dự án

### Backend (CastraServices/)
```
CastraServices/
├── __init__.py
├── settings.py
├── urls.py
├── wsgi.py
├── asgi.py
├── celery.py
├── admin.py
├── apps.py
├── models.py          # Mô hình cơ sở dữ liệu
├── views.py           # Giao diện người dùng API
├── serializers.py     # Serializer API
├── filters.py         # Bộ lọc API
├── permissions.py     # Quyền tùy chỉnh
├── migrations/        # Migration cơ sở dữ liệu
├── management/        # Lệnh quản lý tùy chỉnh
├── tests.py           # Kiểm thử
└── utils/             # Hàm tiện ích
```

### Frontend (CastraView/src/)
```
src/
├── assets/            # Hình ảnh, biểu tượng, phông chữ
├── components/        # Thành phần có thể tái sử dụng
│   ├── ui/            # Thành phần UI cơ bản (Button, Input, v.v.)
│   ├── layout/        # Thành phần bố cục (Header, Footer, Sidebar)
│   └── features/      # Thành phần tính năng cụ thể
├── pages/             # Thành phần trang
├── hooks/             # Hooks React tùy chỉnh
├── utils/             # Hàm tiện ích
├── services/          # Hàm dịch vụ API
├── store/             # Quản lý state (nếu sử dụng Redux/Zustand)
├── styles/            # Tệp CSS, chủ đề, biến
├── routes/            # Cấu hình định tuyến
├── App.jsx            # Thành phần ứng dụng chính
└── main.jsx           # Điểm vào
```

### Tiện ích (Utils/)
```
Utils/
├── __init__.py
├── setup_prj.py       # Script thiết lập dự án
├── data_processing.py # Tiện ích xử lý dữ liệu
├── ml_models/         # Mô hình học máy
└── validation/        # Tiện ích xác thực
```

## Cấu hình Môi trường
- Sử dụng файлы `.env` cho biến môi trường
- Không bao giờ commit `.env` files vào repository
- Sử dụng `.env.example` để hiển thị các biến bắt buộc
- Sử dụng python-decouple hoặc tương tự để truy cập biến môi trường trong Django
- Sử dụng import.meta.env để truy cập biến môi trường trong Vite/react
- Phân tách các môi trường: phát triển, staging, sản xuất

## Nguyên tắc Cơ sở dữ liệu
- Sử dụng migration cho tất cả thay đổi schema
- Không bao giờ sửa đổi các file migration sau khi đã được áp dụng
- Kiểm thử migration trên bản sao dữ liệu sản xuất
- Sử dụng loại trường và ràng buộc thích hợp
- Thêm chỉ mục cho các trường thường được truy vấn
- Xem xét partitioning cho các bảng lớn
- Sử dụng giao dịch cho các thao tác có liên quan
- Sao lưu thường xuyên trong môi trường sản xuất

## Nguyên tắc Thiết kế API
- Tuân theo quy ước RESTful
- Sử dụng mã trạng thái HTTP phù hợp
- Phiên bản API khi cần thay đổi phá vỡ
- Triển khai xác thực và ủy quyền thích hợp
- Xác thực tất cả các đầu vào
- Cung cấp thông báo lỗi có ý nghĩa
- Triển khai phân trang cho các điểm cuối liệt kê
- Hỗ trợ lọc, sắp xếp và tìm kiếm
- Tài liệu chi tiết cho tất cả các endpoints
- Giám sát việc sử dụng và hiệu suất API

## Nguyên tắc Frontend
- Tạo thành phần có thể tái sử dụng
- Sử dụng thành phần synthesis hơn thừa kế
- Giữ state thành phần_localized khi có thể
- Sử dụng React Context hoặc state management để quản lý state toàn cục
- Tối ưu hiển thị lại với useMemo và useCallback
- Triển khai ranh giới lỗi thích hợp
- Tải lười các thành phần không quan trọng
- Tối ưu hình ảnh và tài nguyên
- Đảm bảo thiết kế responsive
- Tuân theo hướng dẫn truy cập (WCAG 2.1)
- Kiểm thử trên các trình duyệt và thiết bị khác nhau

## Thựcارسات Bảo mật
- Không bao giờ hardcode secrets hoặc thông tin xác thực
- Sử dụng biến môi trường cho dữ liệu nhạy cảm
- Triển khai xác thực đầu vào và làm sạch thích hợp
- Sử dụng tính năng bảo mật tích hợp của Django
- Triển khai bảo vệ CSRF
- Sử dụng tiêu đề HTTP bảo mật
- Xác thực tải lên file
- Triển khai giới hạn tốc độ
- Giữ dependencies được cập nhật
- Thực hiện kiểm tra bảo mật thường xuyên
- Sử dụng HTTPS trong môi trường sản xuất
- Triển khai ghi nhật khẩu và giám sát thích hợp

## Tối ưu Hiệu suất
### Backend:
- Sử dụng chỉ mục cơ sở dữ liệu
- Tối ưu truy vấn với select_related/prefetch_related
- Triển khai chiến lược caching
- Sử dụng phân trang cho các tập dữ liệu lớn
- Xem xét sử dụng cơ sở dữ liệu chỉ đọc sao chép
- Sử dụng CDN cho tài nguyên tĩnh
- Bật nén Gzip
- Giám sát và tối ưu các truy vấn chậm

### Frontend:
- Tách mã với React.lazy và Suspense
- Tải lười hình ảnh và thành phần
- Tối ưu kích thước gói
- Sử dụng HTTP/2 khi có thể
- Triển khai chiến lược caching
- Tối 규모 thao tác DOM
- Sử dụng requestIdleCallback cho công việc ưu tiên thấp
- Tối ưu việc phân phối CSS và JavaScript
- Sử dụng web worker cho các tính toán nặng

## Chiến lược Kiểm thử
- Kiểm thử đơn vị: Kiểm thử các hàm và thành phần riêng lẻ
- Kiểm thử tích hợp: Kiểm thử cách các module hoạt động cùng nhau
- Kiểm thử end-to-end: Kiểm thử luồng người dùng (sử dụng Cypress hoặc Playwright)
- Kiểm thử hiệu suất: Kiểm thử dưới tải
- Kiểm thử bảo mật: Kiểm thử lỗ hổng
- Tích hợp liên tục: Chạy tests trên mỗi PR
- Độ bao phủ kiểm thử: Mục tiêu đạt độ bao phủ có ý nghĩa, không chỉ là phần trăm

## Quy trình Triển khai
- [ ] Đảm bảo tất cả tests qua
- [ ] Cập nhật số phiên bản nếu thích hợp
- [ ] Xây dựng tài nguyên frontend: `cd CastraView && npm run build`
- [ ] Thu thập các file tĩnh: `python manage.py collectstatic`
- [ ] Chạy migration trên sản xuất: `python manage.py migrate`
- [ ] Khởi động lại dịch vụ ứng dụng
- [ ] Theo dõi sau khi triển khai để tìm lỗi
- [ ] Có kế hoạch quay lại nếu cần
- [ ] Cập nhật tài liệu nếu quy trình triển khai thay đổi

## Hướng đóng góp
- Fork repository
- Tạo nhánh tính năng
- Thực hiện thay đổi tuân theo các hướng dẫn này
- Đảm bảo tests qua
- Gửi pull request
- Tham gia vào quá trình review code
- Tuân thủ tiêu chuẩn code của dự án
- Thân thiện và xây dựng trong các thảo luận

## Giấy phép và Pháp lý
- Đảm bảo tất cả dependencies được cấp phép thích hợp
- T tôn trọng quyền sở hữu trí tuệ
- Thêm tiêu đề giấy phép thích hợp
- Tuân thủ quy định bảo vệ dữ liệu (GDPR, v.v.)
- Triển khai điều khoản dịch vụ và chính sách bảo mật thích hợp