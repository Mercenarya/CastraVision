# Employee Brand Safety và EN/VI — kiểm chứng local

## Kết quả
Đã triển khai provider nội bộ `internal_rules` phiên bản 1.0.0. Marketing Manager cấu hình tại Settings → Hồ sơ doanh nghiệp; Employee/Leader chỉ đọc. Trình soạn nội dung dùng cấu hình đã lưu của đúng doanh nghiệp. Không gọi AI trả phí, không tính điểm tuân thủ và không tự duyệt proposal.

Quy tắc gồm cụm từ tránh, cụm từ bắt buộc, cảnh báo cam kết tuyệt đối và email/số điện thoại Việt Nam. Phép so khớp literal có chuẩn hóa Unicode, không chạy regex người dùng. Đây là heuristic giới hạn, không phát hiện mọi PII/ngữ cảnh, không xác nhận an toàn hoặc tuân thủ pháp lý.

API xác minh JWT/membership, chuyển tiếp JWT user qua RLS; chỉ Marketing Manager sửa. Timestamp chống ghi đè; cấu hình đổi hoặc nội dung đổi làm kết quả cũ hết hiệu lực. Timeout/lỗi không được biến thành kết quả sạch. Findings không trả lại email/số điện thoại phát hiện. Không lưu nội dung kiểm tra vào log.

## Phạm vi file
- CastraServices/brand_safety.py, employee_api.py, urls.py, test_brand_safety.py: engine, API và hồi quy.
- supabase/migrations/20261120141452_employee_brand_safety_rules.sql và tests/16_brand_safety_rules.test.sql: cột JSONB được kiểm tra, giữ RLS/audit/Inactive hiện hữu.
- Frontend services/brandSafety.js, hooks/useBrandSafetyRules.js, components/BrandSafetyRules.jsx và ContentSafetyCheck.jsx: đọc/sửa/kiểm tra với phân quyền, timeout và vô hiệu hóa kết quả cũ.
- Các màn task, campaign/reference Employee, composer/inbox/review dùng chung và Settings chuyển qua dictionary hiện hữu. EN/VI không đổi payload enum hoặc nội dung người dùng nhập. Header lang và menu chọn ngôn ngữ được đồng bộ.

Không tuyên bố toàn ứng dụng đã dịch: các màn System Admin/Marketing Manager ngoài phạm vi, trang Auth và dữ liệu tự nhập/thông báo lịch sử có thể còn ngôn ngữ gốc.

## Bằng chứng
- Django: 80/80 test PASS, dotenv tắt, SQLite memory.
- Frontend: 33 file / 83 test PASS; Auth 12/12, membership 11/11.
- SQL: 19 file / 331 assertions PASS trên platform-test và stack trống riêng CastraVision-brand-clean-test; không reset stack cũ. File 16: 11 assertions.
- Tích hợp Auth/PostgREST/Django local thật: 56/56 checks, 3/3 bài UI, 27/27 observations. UI tích hợp chạy JSDOM không mock HTTP, không đánh đồng browser đồ họa.
- Trình duyệt Chrome riêng: Marketing Manager lưu hai cụm từ và API đọc lại; Reload giữ cấu hình server. Employee kiểm tra cùng quy tắc nhận bốn loại findings; result không lặp email phát hiện. Chuyển EN→VI giữ nội dung nhập. Sửa sang nội dung sạch và kiểm tra lại nhận no_findings với chú thích giới hạn. Console cuối không có error/warning.
- Lint 0 lỗi (16 cảnh báo cũ), build PASS; bundle JS khoảng 838,77 kB còn cảnh báo >500 kB. Ruff file Python liên quan PASS.

Bằng chứng tích hợp: employee-remediation-real-local.json, employee-remediation-ui.json, employee-remediation-transport.json. Quan sát trình duyệt bổ sung: employee-brand-safety-browser.json. Không có chứng nhận visual/a11y/performance toàn app.

## Triển khai và khôi phục
Chưa áp dụng hosted, chưa commit/push. Migration mới phụ thuộc business_profiles và employee_private từ chuỗi migration Employee/platform đang có. Trước hosted phải xin phép riêng, đối chiếu history/catalog và backup; triển khai DB bổ sung → API → frontend, kiểm tra bằng JWT user.

Migration transaction giữ schema/role cũ; không backfill nội dung giả. Nếu rollback ứng dụng, quay lại frontend/backend trước và giữ cột/audit; không xóa lịch sử. Nếu DB chưa có migration/API chưa deploy, UI báo lỗi rõ, không giả cấu hình hoặc kết quả sạch.

Final hygiene: git diff --check PASS (LF/CRLF warnings only); gitleaks --no-git --redact on an export of 145 changed source/docs files: 0 findings. No env files or Git history scanned.
