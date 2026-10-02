# Proposal alignment review — 29/09/2026

Đối chiếu nguồn: `C2SE.05_CastraVision_Capstone_Proposal.docx` với lát cắt Sprint 1 đang chạy.

## Các điểm đã đồng bộ

| Nội dung | Proposal ban đầu | Trạng thái dự án | Điều chỉnh |
|---|---|---|---|
| FR01 input | Có `business size` | Form/API chưa có | Bổ sung trường bắt buộc `business_size` vào form, schema, dữ liệu mẫu và test |
| FR01 output | Kênh, phân bổ, thông điệp, phân khúc, rationale | Đã có structured response | Giữ nguyên |
| NFR04 | Lỗi AI phải rõ ràng, Retry có kiểm soát, fallback | Backend có retry/fallback; UI có lỗi nhưng CTA chưa đổi | CTA đổi thành “Thử lại” khi request lỗi |
| Frontend | ReactJS (Next.js), Tailwind/shadcn | React 19 + Vite 8 + custom CSS | Proposal bản aligned ghi theo implementation thực tế |
| Backend | Python (FastAPI, Django) | Django 6 + Pydantic; Celery | Proposal bản aligned bỏ mô tả FastAPI khỏi Sprint 1 |
| Data | Supabase / PostgreSQL/MongoDB chưa thống nhất | PostgreSQL 16 + pgvector, Redis 7 | Proposal bản aligned ghi stack đang chạy |
| Architecture | AI services có thể triển khai microservice | Hiện là modular Django client-server | Proposal mô tả hiện trạng và giữ microservice là hướng mở rộng |
| Verification | pytest/Vitest/OpenAPI | Django tests, oxlint, Vite build, JSON contract | NFR05 được viết lại đúng bằng chứng hiện có |

## Khác biệt hợp lệ, chưa sửa vào module người khác

- Proposal là phạm vi toàn hệ thống FR01–FR12; checkout hiện tại mới xác minh lát cắt FR01.
- Workspace/RBAC, User & Business Profile, import campaign data, auth và các FR02–FR12 là module song song hoặc sprint sau; không nên dựng giả chỉ để “khớp tài liệu”.
- Các tích hợp Meta/Google/TikTok vẫn là mock/sandbox theo chính constraint của proposal.

## Bằng chứng kiểm tra

- Backend: 5 Django tests pass.
- Frontend: oxlint pass.
- Frontend production build: Vite build pass.
