# CastraVision - Sprint 1 setup

Sprint 1 triển khai một lát cắt chạy xuyên suốt cho FR01:

- RAG pipeline: PostgreSQL + pgvector, ingestion job, local/OpenAI embeddings và top-k retrieval.
- Strategy API: nhận hồ sơ doanh nghiệp và dữ liệu lịch sử, truy xuất context, gọi LLM có retry,
  kiểm tra structured output và có fallback ngoại tuyến.
- Strategy screen: form nhập liệu, màn hình kết quả, phân bổ ngân sách và nút phân tích lại.
- Project configuration: Docker Compose, `.env.example`, Redis/Celery và GitHub Actions CI.

Hợp đồng FR01 yêu cầu trường `business_size` với một trong bốn giá trị `Micro`, `Small`,
`Medium`, `Large`. Trường này bắt buộc ở cả form và API.

## Chạy local không cần Docker

```powershell
.\.venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py ingest_knowledge data\sample_knowledge.json
python manage.py runserver
```

Trong terminal thứ hai:

```powershell
cd CastraView
npm ci
npm run dev
```

Mở `http://localhost:5173`. Backend chạy tại `http://127.0.0.1:8000`.

Nếu chưa có `OPENAI_API_KEY`, API vẫn hoạt động với embedding hash và strategy fallback xác định.
Đây là chế độ phát triển Sprint 1, không phải mô hình semantic dùng cho production.

## Chạy đủ stack bằng Docker

Docker Desktop trên Windows cần WSL 2. Sau khi Docker engine hoạt động:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Compose tạo năm service: `frontend`, `backend`, `celery_worker`, `postgres` có pgvector và `redis`.
Migration `CastraServices.0001_initial` tự chạy `CREATE EXTENSION IF NOT EXISTS vector` trên PostgreSQL.

Backend chạy bằng Gunicorn; frontend được build tĩnh và phục vụ bằng Nginx. Compose dùng
`requirements-runtime.txt` để image backend chỉ chứa dependency runtime. Các biến
`DOCKER_DATABASE_URL`, `DOCKER_REDIS_URL`, `DOCKER_CELERY_BROKER_URL` và
`DOCKER_CELERY_RESULT_BACKEND` chỉ cần điền khi muốn ghi đè service nội bộ của Compose.

## Nạp dữ liệu lịch sử / doanh nghiệp

File JSON đầu vào là một array, mỗi record có dạng:

```json
{
  "source": "meta",
  "external_id": "campaign-2026-q3",
  "title": "Meta campaign Q3",
  "content": "Nội dung hoặc dữ liệu đã chuẩn hóa cần lập chỉ mục.",
  "metadata": {"channel": "Meta"}
}
```

Chạy trực tiếp:

```powershell
python manage.py ingest_knowledge data\sample_knowledge.json
```

Hoặc gọi Celery task `CastraServices.tasks.embed_pending_chunks` cho các row chưa có embedding.
Record được chunk có overlap, upsert theo `source + external_id + chunk index`, sau đó truy xuất cosine
top-k. PostgreSQL dùng toán tử pgvector; SQLite dùng cosine trong Python để test local.

## Strategy API

`POST /api/strategies/generate/`

Ví dụ:

```powershell
curl.exe -H "Content-Type: application/json" --data-binary "@data/sample_strategy_request.json" http://127.0.0.1:8000/api/strategies/generate/
```

Response luôn có `strategy`, `context_sources`, `provider`, `request_id` và `warning`. Trường `strategy`
được validate bằng Pydantic; tổng phần trăm phân bổ ngân sách phải bằng 100.

Health check: `GET /api/health/`.

## Biến môi trường quan trọng

- `DATABASE_URL`: PostgreSQL URL; bỏ trống khi chạy SQLite local.
- `OPENAI_API_KEY`: bật OpenAI Responses API và OpenAI embeddings.
- `OPENAI_MODEL`: model sinh chiến lược.
- `OPENAI_EMBEDDING_MODEL`: mặc định `text-embedding-3-small` (1536 chiều).
- `EMBEDDING_PROVIDER`: `auto`, `openai` hoặc `local`.
- `ALLOW_LLM_FALLBACK`: cho phép trả strategy fallback khi LLM timeout/lỗi.
- `RAG_TOP_K`: số chunk ngữ cảnh tối đa, mặc định 5.

Khi đổi `EMBEDDING_PROVIDER`, hãy chạy lại lệnh ingestion. Retrieval chỉ so sánh các vector được tạo
bởi cùng provider để tránh trộn hai không gian embedding không tương thích.

## Kiểm thử

```powershell
ruff check CastraVision CastraServices
pytest --cov=CastraServices
cd CastraView
npm run lint
npm test
npm run build
```

CI chạy cùng các bước với PostgreSQL pgvector và Redis service containers.

## Phạm vi chưa làm trong Sprint 1

- Đồng bộ trực tiếp Meta/Google Ads/TikTok và ba agent chuyên biệt trong sơ đồ.
- Reranker, hybrid search, evaluation dataset và monitoring chất lượng retrieval.
- Lưu lịch sử chiến lược theo người dùng/RBAC.
- HTTPS termination, secret manager và backup automation cho production.
