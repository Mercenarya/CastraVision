Dưới đây là sơ đồ **Flowchart phân cấp quyền hạn và luồng tương tác (RBAC & Workflow Governance)** dựa trên thông tin bảng phân quyền:

---

### 1. Sơ đồ phân tầng phạm vi & thẩm quyền (Hierarchical Scope & Boundaries)

```mermaid
flowchart TD
    %% TẦNG HẠ TẦNG NỀN TẢNG (PLATFORM)
    subgraph PLATFORM["TẦNG 1: NỀN TẢNG HỆ THỐNG (Platform Level)"]
        SYS_ADMIN["System Admin"]
        SYS_TASKS["Nhiệm vụ: Giám sát API & Quota, Quản trị cấu hình AI, Khóa/Kích hoạt tài khoản, Xem Security Log"]
        SYS_RESTRICT["Ranh giới hạn chế: Không xem nội dung chiến dịch/chiến lược, Không có quyền duyệt đề xuất, Không thuộc Workspace"]
        SYS_ADMIN --- SYS_TASKS
        SYS_ADMIN -. Ranh giới nghiêm ngặt .-> SYS_RESTRICT
    end

    %% TẦNG KHÔNG GIAN LÀM VIỆC CÔNG TY (WORKSPACE)
    subgraph WORKSPACE["TẦNG 2: CÔNG TY & WORKSPACE (Workspace Level)"]
        MGR["Marketing Manager"]
        MGR_TASKS["Nhiệm vụ: Quản lý Teams & Thành viên, Định nghĩa mục tiêu kinh doanh, Duyệt ngân sách lớn & chiến lược, Xuất báo cáo công ty, Audit Log"]
        MGR_RESTRICT["Ranh giới hạn chế: Không truy cập cấu hình hệ thống Platform, Không can thiệp sang Workspace khác, Không tự ý chạy Ads thực tế"]
        MGR --- MGR_TASKS
        MGR -. Ranh giới hạn chế .-> MGR_RESTRICT
    end

    %% TẦNG NHÓM (TEAM)
    subgraph TEAM_LEVEL["TẦNG 3: NHÓM DỰ ÁN (Team Level)"]
        LEADER["Team Leader"]
        LEADER_TASKS["Nhiệm vụ: Điều phối Team, Duyệt bài viết AI & Đề xuất chiến dịch trong hạn mức, Yêu cầu sửa đổi, Theo dõi hiệu suất Team"]
        LEADER_RESTRICT["Ranh giới hạn chế: Chỉ trong phạm vi Team quản lý, Không duyệt bài của chính mình, Không đổi ngân sách vượt ngưỡng, Không phân vai trò"]
        LEADER --- LEADER_TASKS
        LEADER -. Ranh giới hạn chế .-> LEADER_RESTRICT
    end

    %% TẦNG CÁ NHÂN & THỰC THI (EMPLOYEE)
    subgraph EMPLOYEE_LEVEL["TẦNG 4: CÁ NHÂN & THỰC THI (Employee Level)"]
        EMP["Employee (Member)"]
        EMP_TASKS["Nhiệm vụ: Soạn thảo nội dung AI, Nháp chiến dịch & Nhập dữ liệu, Gửi đề xuất xét duyệt, Quản lý hồ sơ cá nhân"]
        EMP_RESTRICT["Ranh giới hạn chế: Không có quyền duyệt/từ chối, Không xem dữ liệu toàn công ty, Không tự tối ưu ngân sách"]
        EMP --- EMP_TASKS
        EMP -. Ranh giới hạn chế .-> EMP_RESTRICT
    end

    %% PHÂN CẤP QUẢN TRỊ
    MGR -->|Quản lý & Phân quyền| LEADER
    LEADER -->|Hướng dẫn & Giám sát| EMP
```

---

### 2. Sơ đồ luồng nghiệp vụ & xét duyệt đề xuất (Approval & Escalation Workflow)

```mermaid
flowchart TD
    START(["Bắt đầu công việc"]) --> EMP_CREATE["Employee: Soạn thảo nội dung AI / Chiến lược / Đề xuất"]
    EMP_CREATE --> EMP_SUBMIT["Employee: Gửi đề xuất xét duyệt lên cấp trên"]

    EMP_SUBMIT --> LEADER_REVIEW{"Leader kiểm tra đề xuất"}

    %% LEADER QUYẾT ĐỊNH
    LEADER_REVIEW -->|Cần chỉnh sửa| REVISE["Yêu cầu chỉnh sửa: Gửi phản hồi về Employee"]
    REVISE --> EMP_CREATE

    LEADER_REVIEW -->|Không đạt| REJECT["Từ chối đề xuất: Kết thúc kèm lý do"]

    LEADER_REVIEW -->|Đạt tiêu chuẩn| CHECK_BUDGET{"Ngân sách & Tác động có vượt hạn mức Team không?"}

    %% PHÂN LUỒNG HẠN MỨC
    CHECK_BUDGET -->|Trong hạn mức Team| LEADER_APPROVE["Leader: Phê duyệt đề xuất"]
    LEADER_APPROVE --> DEPLOY["Chuyển sang trạng thái Sẵn sàng thực thi"]

    CHECK_BUDGET -->|Vượt hạn mức / Chiến lược lớn| ESCALATE["Chuyển tiếp lên Marketing Manager (Escalate)"]

    %% MANAGER QUYẾT ĐỊNH
    ESCALATE --> MGR_REVIEW{"Marketing Manager đánh giá toàn diện"}
    MGR_REVIEW -->|Từ chối| MGR_REJECT["Manager: Từ chối đề xuất"]
    MGR_REVIEW -->|Yêu cầu làm rõ| MGR_FEEDBACK["Manager: Gửi phản hồi về Leader / Employee"]
    MGR_FEEDBACK --> EMP_CREATE
    MGR_REVIEW -->|Phê duyệt| MGR_APPROVE["Manager: Phê duyệt ngân sách & chiến lược cấp cao"]
    MGR_APPROVE --> AUDIT_LOG["Tự động ghi nhận lịch sử vào Audit Log"]
    AUDIT_LOG --> DEPLOY

    %% GIÁM SÁT HỆ THỐNG ĐỘC LẬP
    subgraph MONITOR["Giám sát độc lập của System Admin"]
        SYS_MONITOR["System Admin: Giám sát Platform Health, AI API Quotas, Security Log, Khóa/Mở tài khoản khi vi phạm"]
    end
    DEPLOY -. Ghi nhận API & Quota .-> SYS_MONITOR
```

---

### 3. Tóm tắt ma trận quyền hạn (RBAC Matrix)

| Vai trò (Role)             | Phạm vi (Scope)                         | Quyền hạn chính (Responsibilities)                                                                                              | Giới hạn nghiêm ngặt (Restrictions)                                                                                                                               |
| :-------------------------- | :--------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **System Admin**      | **Platform** (Toàn nền tảng)    | Quản trị API, Quota AI, phân bổ hạ tầng, bảo mật, kích hoạt/khóa Workspace và tài khoản.                             | **Không** xem dữ liệu kinh doanh/chiến dịch; **Không** có quyền duyệt bài; **Không** thuộc Workspace nào.                              |
| **Marketing Manager** | **Workspace** (Công ty)           | Quản lý thành viên, đội nhóm; định hướng mục tiêu; duyệt đề xuất ngân sách lớn & chiến lược; xem Audit Log. | **Không** can thiệp hạ tầng hệ thống; **Không** truy cập Workspace khác; **Không** trực tiếp deploy tiêu ngân sách thật tự động. |
| **Leader**            | **Team** (Nhóm)                   | Điều phối nhóm; kiểm duyệt bài viết AI & chiến dịch trong thẩm quyền; phản hồi sửa đổi; báo cáo cho Manager.    | Chỉ trong phạm vi Team; **Không** tự duyệt bài của mình; **Không** duyệt vượt hạn mức ngân sách; **Không** mời/đổi vai trò.    |
| **Employee**          | **Own / Team** (Cá nhân & Nhóm) | Sử dụng AI tạo nội dung; nháp chiến lược, gửi đề xuất duyệt; theo dõi tiến độ công việc cá nhân.              | **Không** có quyền duyệt hay từ chối bài; **Không** xem dữ liệu toàn công ty; **Không** xuất báo cáo tổng.                         |
