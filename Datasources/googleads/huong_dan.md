# Hướng dẫn cấu hình Google Ads API

## Giá trị Cần Điền

### 1. **Developer Token (Token nhà phát triển)**
- **Where to get it (Lấy từ đâu)**: Google Ads API Center → https://developers.google.com/google-ads/api/docs/first-call/dev-token
- **What it is (Là gì)**: Token xác định tài khoản nhà phát triển Google Ads API của bạn
- **Format (Định dạng)**: Chuỗi (thay thế `INSERT_DEVELOPER_TOKEN_HERE` bằng giá trị thực)

### 2. **Use Proto Plus Flag (Cờ sử dụng proto plus)**
- **Where to get it (Lấy từ đâu)**: Đây là lựa chọn cấu hình, không lấy từ bên ngoài
- **What it is (Là gì)**: Có sử dụng proto-plus messages hay không (khuyến nghị: `"True"`)
- **Format (Định dạng)**: Hoặc `"True"` hoặc `"False"` (thay thế `INSERT_USE_PROTO_PLUS_FLAG_HERE`)

### 3. **OAuth2 Credentials** (chọn một trong hai phương pháp)

#### **Tuỳ chọn A: Luồng OAuth2** (Đề xuất cho đa số người dùng)
- **Client ID**: Từ Google Cloud Console → APIs & Services → Credentials
- **Client Secret**: Từ Google Cloud Console → APIs & Services → Credentials  
- **Refresh Token**: Được nhận sau khi hoàn thành quy trình ủy quyền OAuth2
- **Where to learn more (Đọc thêm tại)**: https://developers.google.com/google-ads/api/docs/oauth/overview

#### **Tuỳ chọn B: Tài khoản dịch vụ** (Cho ứng dụng máy chủ để máy chủ)
- **JSON Key File Path**: Đường dẫn đến file khóa riêng JSON của tài khoản dịch vụ
- **Impersonated Email**: Địa chỉ email được giả lập (nếu sử dụng ủy quyền miền rộng)
- **Where to learn more (Đọc thêm tại)**: https://developers.google.com/google-ads/api/docs/oauth/service-accounts

### 4. **Login Customer ID** (Bắt buộc cho tài khoản quản lý)
- **Where to get it (Lấy từ đâu)**: ID khách hàng Google Ads của bạn (không có gạch ngang, ví dụ: `1234567890`)
- **What it is (Là gì)**: ID khách hàng của tài khoản quản lý được xác thực
- **Format (Định dạng)**: Chuỗi không có gạch ngang (thay thế `INSERT_LOGIN_CUSTOMER_ID_HERE`)

## Các Bước Cấu Hình

1. **Lấy thông tin xác thực** theo các links được cung cấp trong Comment của file yaml
2. **Chỉnh sửa** file `Datasources\googleads\ggads_client.yaml` thay tất cả giá trị placeholder
3. **Chọn phương pháp xác thực**:
   - Cho OAuth2: Điền `client_id`, `client_secret`, `refresh_token`
   - Cho Tài khoản dịch vụ: Bỏ comment và điền `json_key_file_path` và `impersonated_email`
4. **Lưu file**

## Cách File Được Sử Dụng Trong Code

Như thấy trong file `ggads_request_account.py`, client được khởi tạo bằng:
```python
client = GoogleAdsClient.load_from_storage()
```
Điều này tự động tải cấu hình từ file yaml của bạn.

## Lưu Ý Quan Trọng

- **Không bao giờ cam kết thông tin thực tế vào hệ thống quản lý phiên bản** (file `.gitignore` nên ngăn chặn điều này)
- Ví dụ chỉ ra cấu hình ghi log và proxy được comment out - chỉ bỏ comment khi thực sự cần
- Application Default Credentials (ADC) là một tùy chọn khác cho môi trường Google Cloud

Sau khi cấu hình xong, bạn có thể chạy script test hoặc mã Google Ads API của riêng mình, và client sẽ sử dụng thông tin xác thực này để xác thực với Google Ads API.