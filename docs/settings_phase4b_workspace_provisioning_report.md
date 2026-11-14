# Báo cáo Thực thi Cấp phát Workspace Kiểm thử (Phase 4B Execution Report)
## Safe Workspace Provisioning for E2E Testing

> **Giai đoạn**: Phase 4B – Thực thi Cấp phát Workspace (Execution & Provisioning).  
> **Thời gian thực hiện**: 2026-11-15 (Giờ UTC: 2026-11-14 19:47:08Z).  
> **Mục tiêu**: Tạo mới một Workspace độc lập có tên `CastraVision Test Workspace` và bổ sung đầy đủ 3 vai trò kiểm thử (Marketing Manager, Leader, Employee) để phục vụ kiểm thử End-to-End (E2E) Business Profile và phân quyền đa người dùng.  
> **Trạng thái**: **HOÀN THÀNH TOÀN BỘ (SUCCESS - 100%)**. Không có lỗi phát sinh.

---

## 1. Thông tin Chi tiết Workspace Đã Cấp phát (Workspace Details)

| Thuộc tính | Giá trị ghi nhận thực tế từ Cơ sở Dữ liệu |
|---|---|
| **Workspace Name** | `CastraVision Test Workspace` |
| **Workspace ID** | `657f2da5-9fcc-418e-9fe4-15ce4190d6e1` |
| **Owner ID** | `ad47c5c2-48df-4cd3-ba58-c9cc672ca960` (`grfdonk@gmail.com`) |
| **Created Timestamp** | `2026-11-14T19:47:08.249835+00:00` |
| **Trạng thái khởi tạo** | Đã kích hoạt và bảo vệ bởi Row Level Security (RLS) |

---

## 2. Bảng Xác minh Thành viên (Membership Verification Table)

Toàn bộ 3 tài khoản đã được liên kết chính xác vào cùng một Workspace ID (`657f2da5-9fcc-418e-9fe4-15ce4190d6e1`) với vai trò database tương ứng:

| STT | Tài khoản Email | Auth User ID (UID) | Vai trò Database (`workspace_role`) | Vai trò Frontend mong đợi | Trạng thái / Thời gian tham gia |
|:---:|---|---|:---:|:---:|---|
| **1** | `grfdonk@gmail.com` | `ad47c5c2-48df-4cd3-ba58-c9cc672ca960` | `admin` | Marketing Manager | Tự động tạo bởi RPC (`2026-11-14T19:47:08.249835+00:00`) |
| **2** | `tranthanhtri2@gmail.com` | `3fd5254e-7caa-4178-a1f9-77d729c28945` | `manager` | Leader | Thêm bởi Admin (`2026-11-14T19:47:08.45384+00:00`) |
| **3** | `Bengin2@gmail.com` | `b4a9c8a3-59e6-477c-bf68-59fbc4326eb1` | `member` | Employee | Thêm bởi Admin (`2026-11-14T19:47:08.45384+00:00`) |

---

## 3. Tóm tắt Quá trình Thực thi (Execution Summary)

Quá trình cấp phát tuân thủ nghiêm ngặt các điều kiện an toàn và quy trình 5 bước:

### Bước 1: Xác thực Phiên làm việc (Session Authentication)
- Xác thực tài khoản Marketing Manager: `GRFDonk@gmail.com` / `Toiyeubo123333`.
- UID nhận diện: `ad47c5c2-48df-4cd3-ba58-c9cc672ca960` (khớp 100% với định danh mong đợi).

### Bước 2: Kiểm tra Tiền điều kiện trước Ghi (Pre-check)
- Kiểm tra số lượng bản ghi `public.workspace_members` hiện có của UID `ad47c5c2-48df-4cd3-ba58-c9cc672ca960`.
- Kết quả: `0` bản ghi. Đảm bảo an toàn, không kích hoạt lỗi `ALREADY_ONBOARDED`.

### Bước 3: Gọi RPC Khởi tạo Workspace (Chỉ gọi DUY NHẤT 1 lần)
- Lệnh thực thi:
  ```javascript
  const { data: rpcData, error: rpcError } = await supabase.rpc('create_workspace_with_admin', {
    workspace_name: 'CastraVision Test Workspace'
  });
  ```
- Kết quả RPC trả về:
  ```json
  [
    {
      "workspace_id": "657f2da5-9fcc-418e-9fe4-15ce4190d6e1",
      "role": "admin"
    }
  ]
  ```
- Xác nhận Workspace ID: `657f2da5-9fcc-418e-9fe4-15ce4190d6e1`.
- **Nguyên tắc bất biến**: Đánh dấu RPC đã hoàn tất, không gọi lại RPC dưới bất kỳ hình thức nào.

### Bước 4: Thêm Thành viên Leader và Employee
- Thực hiện thêm thành viên dưới quyền `admin` của phiên làm việc thông qua chính sách RLS `workspace_members_admin_insert`:
  ```javascript
  const membersToInsert = [
    {
      workspace_id: '657f2da5-9fcc-418e-9fe4-15ce4190d6e1',
      user_id: '3fd5254e-7caa-4178-a1f9-77d729c28945',
      role: 'manager',
      invited_email: 'tranthanhtri2@gmail.com'
    },
    {
      workspace_id: '657f2da5-9fcc-418e-9fe4-15ce4190d6e1',
      user_id: 'b4a9c8a3-59e6-477c-bf68-59fbc4326eb1',
      role: 'member',
      invited_email: 'Bengin2@gmail.com'
    }
  ];
  await supabase.from('workspace_members').insert(membersToInsert);
  ```
- Kết quả: 2 bản ghi được chèn thành công mà không gặp bất kỳ xung đột nào.

### Bước 5: Đọc lại Toàn diện để Xác minh (Read-back Verification)
- Truy vấn bản ghi `public.workspaces`:
  - `id`: `657f2da5-9fcc-418e-9fe4-15ce4190d6e1`
  - `name`: `CastraVision Test Workspace`
  - `owner_id`: `ad47c5c2-48df-4cd3-ba58-c9cc672ca960`
- Truy vấn danh sách `public.workspace_members` theo `workspace_id`:
  - Trả về đủ 3 bản ghi với các vai trò tương ứng: `admin`, `manager`, `member`.

---

## 4. Xử lý Lỗi và Phục hồi (Errors & Recovery Details)

- **Số lỗi phát sinh**: **0** (Không có lỗi trong toàn bộ quá trình).
- **Cơ chế phòng ngừa rủi ro**:
  - Không thực hiện bất kỳ lệnh ghi nào vào các Workspace khác.
  - Script tự hủy ngay lập tức sau khi hoàn thành, không để lại mã thừa trong mã nguồn ứng dụng.
  - Kiểm tra tính hợp lệ của client bằng linter (`oxlint`) và trình biên dịch (`npm run build`): Đạt 100% không có lỗi.

---

## 5. Kết luận & Sẵn sàng cho Giai đoạn Tiếp theo

- **Workspace kiểm thử đã sẵn sàng**: `CastraVision Test Workspace` (`657f2da5-9fcc-418e-9fe4-15ce4190d6e1`).
- Cả 3 tài khoản kiểm thử đã sở hữu vai trò chuẩn trong workspace:
  - `grfdonk@gmail.com`: Marketing Manager (`admin`) – Toàn quyền quản lý và chỉnh sửa Business Profile.
  - `tranthanhtri2@gmail.com`: Leader (`manager`) – Quyền đọc Business Profile (chế độ Read-Only).
  - `Bengin2@gmail.com`: Employee (`member`) – Quyền đọc Business Profile (chế độ Read-Only).
- Hệ thống đã sẵn sàng 100% để tiến hành **Phase 4C – E2E Multi-User Testing & Validation** cho màn hình Settings và Business Profile.
