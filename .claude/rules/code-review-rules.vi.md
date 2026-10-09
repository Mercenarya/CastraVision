# Quy tắc Review Code cho Dự án CastraVision

## Nguyên tắc Chung
1. **Jasmin tôt hơn talento** - Viết code dễ hiểu
2. **Tính nhất quán** - Tuân theo các mẫu và phong cách code hiện có
3. **Đógrafo Megan** - Đảm bảo xử lý tốt tất cả các trường hợp đặc biệt
4. **Khả năng kiểm thử** - Viết code dễ kiểm thử

## Quy tắc Backend Django
### 1. Mô hình (Models)
- Sử dụng tên trường có tính mô tả cao
- Thêm tài liệu mô tả thích hợp cho mô hình và phương pháp
- Sử dụng `Choices` cho các trường có giới hạn lựa chọn
- Thêm phương pháp `__str__` vào tất cả các mô hình
- Sử dụng `related_name` cho khóa ngoại để tránh xung đột truy cập ngược

### 2. Giao diện người dùng (Views)
- Sử dụng giao diện người dùng dựa trên lớp khi thích hợp
- Xử lý ngoại lệ một cách thích hợp
- Trả về mã trạng thái HTTP phù hợp
- Xác thực dữ liệu đầu vào một cách kỹ lưỡng

### 3. Serializer (nếu sử dụng DRF)
- Liệt kê rõ ràng các trường thay vì sử dụng `'__all__'`
- Thêm phương pháp xác thực cho các trường hợp xác thực phức tạp
- Sử dụng `SerializerMethodField` cho các trường được tính toán

### 4. Form
- Thêm nhãn và văn bản hướng dẫn thích hợp
- Triển khai phương pháp `clean()` để xác thực chéo trường
- Sử dụng `ModelForm` khi thích hợp

## Quy tắc Frontend (React/Vite)
### 1. Thành phần (Components)
- Sử dụng thành phần chức năng với hooks
- Giữ các thành phần nhỏ và tập trung
- Sử dụng PropTypes hoặc TypeScript để xác thực prop
- Lưu trữ kết quả tính toán tốn kém với `useMemo`/`useCallback`

### 2. Phong cách (Styling)
- Sử dụng модуль CSS hoặc styled-components để tạo kiểu có phạm vi
- Tuân theo quy ước đặt tên BEM cho các lớp CSS
- Sử dụng biến CSS cho màu chủ đề

### 3. Quản lý State
- Sử dụng React Query để quản lý state của máy chủ
- Sử dụng Context API hoặc Zustand để quản lý state toàn cục client
- Tránh truyền prop qua nhiều lớp bằng cách sử dụng context khi thích hợp

## Quy tắc Kiểm thử
### 1. Kiểm thử đơn vị (Unit Tests)
- Viết kiểm thử cho mỗi hàm/phương pháp
- Kiểm thử cả trường hợp tích cực và tiêu cực
- Giả lập các phụ thuộc bên ngoài
- Mục tiêu đạt >80% độ bao phủ

### 2. Kiểm thử tích hợp (Integration Tests)
- Kiểm thử các điểm cuối API
- Kiểm thử tương tác cơ sở dữ liệu
- Kiểm thử luồng xác thực

## Quy tắc Tài liệu
### 1. Comment trong Code
- Giải thích tại sao, không phải là gì
- Cập nhật comment khi code thay đổi
- Loại bỏ code đã koment

### 2. Tài liệu API
- Giữ tài liệu API luôn cập nhật
- Sử dụng OpenAPI/Swagger cho API REST
- Tài liệu tất cả các tham số và giá trị trả về

## Quy tắc Bảo mật
### 1. Xác thực đầu vào
- Xác thực tất cả các đầu vào cả ở client và server
- Sử dụng xác thực tích hợp của Django khi có thể
- Làm sạch nội dung do người dùng tạo ra

### 2. Xác thực & Ủy quyền
- Sử dụng hệ thống xác thực của Django
- Triển khai kiểm tra quyền thích hợp
- Sử dụng HTTPS trong môi trường sản xuất

### 3. Bảo vệ dữ liệu
- Không bao giờ hardcode secret
- Sử dụng biến môi trường cho cấu hình
- Mã hóa dữ liệu nhạy cảm khi lưu trữ

## Quy tắc Hiệu suất
### 1. Cơ sở dữ liệu
- Sử dụng `select_related/prefetch_related` để tránh vấn đề N+1 truy vấn
- Thêm chỉ mục cơ sở dữ liệu cho các trường thường được truy vấn
- Sử dụng phân trang cho các queryset lớn

### 2. Frontend
- Tải lười các thành phần không quan trọng
- Tối ưu hình ảnh và tài nguyên
- Giảm thiểu kích thước gói

## Quy tắc Git
### 1. Thông điệp cam kết (Commit Messages)
- Sử dụng định dạng commit conventionally
- Tham chiếu số issue khi thích hợp
- Giữ thông điệp ngắn gọn nhưng mô tả

### 2. Nhánh (Branching)
- Sử dụng tên nhánh mô tả (feature/, bugfix/, hotfix/)
- Xóa nhánh sau khi hợp nhất
- Rebase các nhánh tính năng trước khi hợp nhất

## Phong cách Code
### 1. Python
- Tuân theo PEP 8
- Sử dụng black để định dạng code
- Sử dụng isort để sắp xếp import
- Độ dài dòng tối đa: 88 ký tự (mặc định black)

### 2. JavaScript/TypeScript
- Sử dụng Prettier để định dạng code
- Sử dụng ESLint để kiểm tra chất lượng code
- Độ dài dòng tối đa: 80-100 ký tự
- Sử dụng const/let, tránh var

## Quy trình Review
### 1. Trước khi Gửi
- Chạy tất cả các tests ở địa phương
- Đảm bảo code qua linting mà không có lỗi
- Cập nhật tài liệu nếu cần
- Gộp commit nếu cần

### 2. Trong Quá trình Review
- Đáp ứng tất cả các bình luận review
- Giải thích quyết kế khi được hỏi
- Mở lòng với phản hồi costruzione

### 3. Sau khi Được Phê duyệt
- Đảm bảo CI qua trước khi hợp nhất
- Xóa nhánh tính năng sau khi hợp nhất