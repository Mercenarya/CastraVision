# API Reference

Tài liệu này mô tả các HTTP endpoint đang được mount trong Django tại thời điểm kiểm tra.
Các route có tiền tố `/api/` được khai báo trong `CastraServices/urls.py` và include tại
`CastraVision/urls.py`.

## Base URL

| Môi trường | Base URL |
|---|---|
| Local | `http://127.0.0.1:8000/api` |
| Docker Compose | `http://localhost:8000/api` |

Trong phát triển frontend, Vite proxy `/api` tới backend. Có thể đặt `VITE_API_URL` khi cần gọi
backend bằng URL đầy đủ.

## Định dạng chung

- JSON request gửi `Content-Type: application/json`, trừ endpoint upload tệp dùng
  `multipart/form-data`.
- JSON lỗi từ API Django thường có dạng:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Thông tin không hợp lệ.",
    "details": []
  }
}
```

- Các endpoint đăng nhập, hồ sơ và lịch sử nhập liệu hiện dùng Django session cookie.
  Gọi `GET /auth/csrf/` trước các request thay đổi dữ liệu để nhận CSRF cookie; gửi cookie cùng
  header `X-CSRFToken` cho `POST`/`PUT`.
- `GET /auth/session/` và các endpoint yêu cầu đăng nhập dựa trên session cookie, không phải
  `Authorization: Bearer`.

## Endpoint đang được mount

### `GET /health/`

Kiểm tra backend và loại database đang cấu hình. Không yêu cầu đăng nhập.

**Response `200`:**

```json
{
  "status": "ok",
  "database": "postgresql",
  "supabase": "not configured"
}
```

`database` là vendor do Django trả về (ví dụ `sqlite` hoặc `postgresql`). Trường `supabase` có thể
là `connected`, `not configured`, hoặc thông tin lỗi. Endpoint này phản ánh trạng thái kết nối,
không phải kiểm tra sức khỏe toàn diện của các service.

### `POST /strategies/generate/`

Sinh đề xuất chiến lược marketing từ thông tin doanh nghiệp. Endpoint hiện không yêu cầu đăng
nhập và được miễn CSRF.

**Request:**

```json
{
  "business_name": "Castra Coffee",
  "industry": "F&B",
  "business_size": "Small",
  "product_service": "Cà phê rang xay giao tận nơi",
  "target_audience": "Nhân viên văn phòng tại TP.HCM",
  "campaign_goal": "Tăng đơn hàng trực tuyến",
  "budget": 30000000,
  "currency": "VND",
  "preferred_channels": ["Meta", "TikTok"],
  "historical_data": [
    {
      "channel": "Meta",
      "period": "2026-Q3",
      "ctr": 1.8,
      "cpa": 85000,
      "roas": 2.4,
      "notes": ""
    }
  ]
}
```

- Bắt buộc: `business_name` (2–120 ký tự), `industry` (2–120), `business_size`,
  `product_service` (3–500), `target_audience` (3–500), `campaign_goal` (3–300), `budget`
  (> 0, tối đa 1.000.000.000).
- `business_size`: `Micro`, `Small`, `Medium`, hoặc `Large`.
- `currency`: `VND` hoặc `USD`; mặc định `VND`.
- `preferred_channels`: tối đa 3 phần tử từ `Meta`, `Google Ads`, `TikTok`; mặc định `[]`.
- `historical_data`: tối đa 30 phần tử. Mỗi phần tử bắt buộc có `channel` (`Meta`, `Google Ads`,
  `TikTok`, `Other`) và `period`; `ctr`, `cpa`, `roas` không âm và có thể `null`; `notes` tối đa
  500 ký tự.

**Response `200`:**

```json
{
  "request_id": "uuid",
  "strategy": {
    "recommended_channel": "Meta",
    "segment": "Nhân viên văn phòng tại TP.HCM",
    "message": "...",
    "rationale": "...",
    "budget_allocation": [
      {"channel": "Meta", "percentage": 60, "rationale": "Kênh chính"}
    ],
    "actions": ["..."],
    "confidence": 55
  },
  "context_sources": [],
  "provider": "deterministic-fallback",
  "warning": "OPENAI_API_KEY chưa được cấu hình; kết quả dùng chế độ Sprint 1 ngoại tuyến."
}
```

`budget_allocation` có thể gồm nhiều phần tử; tổng `percentage` là 100. `provider` cho biết provider
đã dùng (`openai` hoặc `deterministic-fallback`); `warning` có thể là `null`.

**Lỗi chính:** `400 INVALID_JSON`, `400 VALIDATION_ERROR`, `413 PAYLOAD_TOO_LARGE`,
`503 STRATEGY_GENERATION_FAILED`.

### `GET /supabase/test/`

Endpoint chẩn đoán Supabase. Không yêu cầu đăng nhập. Khi client được cấu hình, thử truy vấn
`business_profiles` và trả dữ liệu mẫu. Đây là endpoint kiểm tra phục vụ phát triển; không nên công
khai trên môi trường production nếu không bổ sung xác thực và giới hạn dữ liệu trả về.

**Response:** `200` với `status: "success"` khi truy vấn thành công; `503` nếu Supabase client không
sẵn sàng. Khi truy vấn thất bại, code hiện tại vẫn trả `200` cùng thông tin lỗi trong JSON.

### `GET /auth/csrf/`

Tạo/đặt CSRF cookie để client có thể gửi request session an toàn.

**Response `200`:** `{"ok": true}` cùng cookie CSRF trong response.

### `GET /auth/session/`

Trả user hiện đang đăng nhập trong Django session.

**Response `200`:**

```json
{"user": {"id": 1, "email": "owner@example.com"}}
```

Nếu chưa đăng nhập: `{"user": null}`.

### `POST /auth/register/`

Tạo tài khoản Django, đăng nhập tài khoản vừa tạo và trả `201 Created`.

**Request:** `{"email": "owner@example.com", "password": "..."}`

Email được trim/lowercase; password phải vượt qua Django password validators.

**Response `201`:** `{"user": {"id": 1, "email": "owner@example.com"}}`

**Lỗi chính:** `400 INVALID_JSON`, `400 INVALID_EMAIL`, `400 WEAK_PASSWORD`, `409 EMAIL_EXISTS`.

### `POST /auth/login/`

Đăng nhập bằng Django session.

**Request:** `{"email": "owner@example.com", "password": "..."}`

**Response `200`:** `{"user": {"id": 1, "email": "owner@example.com"}}`

**Lỗi chính:** `400 INVALID_JSON`, `401 INVALID_CREDENTIALS`.

### `POST /auth/logout/`

Đăng xuất và hủy Django session hiện tại.

**Response `200`:** `{"ok": true}`. Gửi CSRF token theo quy tắc chung.

### `GET /business-profile/`

Lấy hồ sơ của user đang đăng nhập.

**Response `200`:**

```json
{
  "profile": {
    "business_name": "Castra Coffee",
    "industry": "F&B",
    "business_size": "Small",
    "target_customers": "Nhân viên văn phòng tại TP.HCM",
    "primary_goal": "Tăng đơn hàng trực tuyến",
    "product_service": "Cà phê rang xay",
    "preferred_channels": ["Meta"],
    "monthly_budget": 30000000,
    "currency": "VND"
  }
}
```

Nếu chưa có hồ sơ: `{"profile": null}`.

### `PUT /business-profile/`

Tạo hoặc cập nhật hồ sơ user đang đăng nhập. Các trường được đọc từ request:

| Trường | Quy tắc |
|---|---|
| `business_name` | Bắt buộc, tối đa 120 ký tự |
| `industry` | Bắt buộc, tối đa 120 ký tự |
| `business_size` | Bắt buộc: `Micro`, `Small`, `Medium`, `Large` |
| `target_customers` | Bắt buộc, tối đa 500 ký tự |
| `primary_goal` | Tùy chọn, tối đa 300 ký tự |
| `product_service` | Tùy chọn, tối đa 500 ký tự |
| `preferred_channels` | Tối đa 3 giá trị: `Meta`, `Google Ads`, `TikTok` |
| `monthly_budget` | Số nguyên từ 0 đến 1.000.000.000; mặc định 0 |
| `currency` | `VND` hoặc `USD`; mặc định `VND` |

**Response `200`:** `{"profile": { ... }}` với hồ sơ đã lưu. Request phải là JSON và cần session
đăng nhập cùng CSRF token.

### `GET /campaign-imports/`

Trả lịch sử các lần nhập gần nhất của user đang đăng nhập và tối đa 30 dòng đã chuẩn hóa của lần
nhập mới nhất.

**Response `200`:**

```json
{
  "imports": [
    {"id": 1, "filename": "metrics.csv", "row_count": 2, "created_at": "2026-10-20T10:00:00Z"}
  ],
  "latest_rows": [
    {
      "channel": "Meta",
      "period": "2026-09",
      "spend": 1000,
      "clicks": 40,
      "impressions": 2000,
      "conversions": 3,
      "revenue": 2500
    }
  ]
}
```

`imports` tối đa 10 phần tử.

### `POST /campaign-imports/upload/`

Upload CSV hoặc XLSX, giới hạn 5 MB. Cần user đăng nhập bằng Django session. Gửi `multipart/form-data`
trong đó `file` là tệp cần nhập. Không gửi `mode=commit` để chỉ validate và xem trước; gửi
`mode=commit` để lưu sau khi tất cả các dòng hợp lệ.

Các cột bắt buộc (hỗ trợ alias tiếng Anh và một số alias tiếng Việt):

- `channel`: `channel`, `platform`, `source`, `kenh`
- `period`: `period`, `date`, `month`, `ngay`
- `spend`: `spend`, `cost`, `amount_spent`, `chi_phi`
- `clicks`: `clicks`, `link_clicks`, `luot_nhap`
- `impressions`: `impressions`, `views`, `hien_thi`
- `conversions`: `conversions`, `purchases`, `leads`, `chuyen_doi`
- `revenue` tùy chọn: `revenue`, `conversion_value`, `sales`, `doanh_thu`

Tối đa 2.000 dòng. Số liệu phải không âm. `channel` cần có giá trị; API giữ nguyên tên channel mà file
cung cấp. `period` tối đa 80 ký tự.

**Preview `200`:** trả `row_count`, tối đa 5 dòng `preview`, tối đa 20 lỗi, `error_count` và `errors`.

**Commit `201`:** trả preview tương tự cùng `import_id` sau khi lưu. Nếu có dòng lỗi, commit trả
`400 VALIDATION_ERROR` và không lưu.

**Lỗi chính:** `400 INVALID_JSON`, `400 MISSING_FILE`, `400 INVALID_FILE`,
`400 VALIDATION_ERROR`, `413 FILE_TOO_LARGE`, `401 AUTH_REQUIRED`.

## Route chưa được expose

`CastraServices/campaign_api.py` hiện có các view `import_file` và `sandbox_import` dùng Supabase RLS
và JWT Bearer, nhưng module này **chưa được include trong `CastraServices/urls.py`**. Vì vậy chúng
không tạo endpoint HTTP khả dụng hiện tại. Không nhầm `campaign-imports/upload/` đang mount (Django
session và lưu `CampaignImport`) với view upload Supabase chưa mount.

Tương tự, hàm `backendApi` trong frontend (`CastraView/src/lib/api.js`) gửi Supabase Bearer token,
trong khi các màn hình hiện tại gọi wrapper session trong `CastraView/src/App.jsx`. Kiểm tra lại
contract xác thực trước khi nối client mới vào route.

## Liên kết mã nguồn

- Routes: `CastraVision/urls.py`, `CastraServices/urls.py`
- Account/profile/import session API: `CastraServices/account_api.py`
- Health/strategy/Supabase diagnostic: `CastraServices/views.py`
- Strategy request/response schema: `CastraServices/schemas.py`
- Supabase JWT/workspace auth: `CastraServices/authentication.py`, `CastraServices/permissions.py`
- Supabase campaign import views (chưa mount): `CastraServices/campaign_api.py`
- Frontend session API calls: `CastraView/src/App.jsx`
