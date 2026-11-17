
Dưới đây là sơ đồ phân tích luồng dữ liệu (**Data Flow Diagrams**) chi tiết cho từng vai trò (**Role**) trong hệ sinh thái CastraVision: **System Admin**, **Marketing Manager (Admin)**, **Leader**, và **Member (Employee)**, kết hợp cùng luồng dữ liệu tổng thể phân cấp giữa các vai trò.

---

### 1. Sơ đồ luồng dữ liệu tổng quan giữa 4 Roles (Hierarchical Data Flow)

Sơ đồ này mô tả cách dữ liệu dịch chuyển từ tầng cấu hình nền tảng, thiết lập doanh nghiệp, triển khai chiến dịch cho tới phê duyệt và báo cáo.

```mermaid
flowchart TD
    subgraph SystemAdminRole["1. System Admin (Quản trị hệ thống)"]
        SA_Input["Tạo & Quản lý Công ty/Khách hàng"] --> SA_DB[("Platform DB / Tenant Meta")]
        SA_DB --> SA_Audit["Giám sát Toàn sàn & Logs"]
    end

    subgraph ManagerRole["2. Marketing Manager (Quản lý cấp cao)"]
        MM_Setup["Cấu hình DN, Tích hợp Ads, Phân quyền Leader/Member"] --> MM_Store[("Workspace DB & Audit Log")]
        MM_Escalated["Xử lý Đề xuất Leo thang (Escalated Proposals)"] --> MM_Decision{"Phê duyệt / Từ chối"}
        MM_Decision -->|Duyệt| MM_Live["Đẩy vào Chiến dịch Thực tế"]
        MM_Decision -->|Trả lại| L_Queue
    end

    subgraph LeaderRole["3. Leader (Trưởng nhóm / Duyệt viên)"]
        L_Assign["Phân bổ Task & Giới hạn Ngân sách"] --> L_Queue["Hàng đợi Phê duyệt (Approval Queue)"]
        L_Review{"Duyệt Đề xuất từ Member"}
        L_Queue --> L_Review
        L_Review -->|Chấp thuận| MM_Live
        L_Review -->|Vượt thẩm quyền| MM_Escalated
        L_Review -->|Yêu cầu sửa / Từ chối| M_Revise["Phản hồi về Member"]
    end

    subgraph MemberRole["4. Member (Chuyên viên Marketing)"]
        M_Import["Import Dữ liệu Chiến dịch (CSV/XLSX/Ads)"] --> M_Propose["Tạo Đề xuất Chiến dịch"]
        M_AI["AI Strategy & Content Studio"] --> M_Propose
        M_Revise --> M_Propose
        M_Propose --> L_Queue
    end

    SA_DB -. Cấp quyền & Khởi tạo Tenant .-> MM_Setup
    MM_Store -. Đồng bộ Ngân sách & Mục tiêu .-> L_Assign
    MM_Live -. Đồng bộ Số liệu Hiệu suất (ROAS, CPC, CTR) .-> M_Import
```

---

### 2. Luồng dữ liệu chi tiết cho từng Role

#### A. System Admin (Quản trị nền tảng toàn hệ thống)

* **Mục tiêu chính**: Quản trị multi-tenant (các doanh nghiệp/công ty), cấp phát tài nguyên, giám sát sức khỏe API, mô hình LLM/RAG và audit log toàn sàn.

```mermaid
sequenceDiagram
    autonumber
    actor SA as System Admin
    participant UI as SystemAdminLayout
    participant API as CastraVision Core API
    participant DB as PostgreSQL / Multi-tenant Store

    SA->>UI: 1. Tạo mới Doanh nghiệp (Company Profile) & Cấp phát Admin ban đầu
    UI->>API: POST /api/companies/ (Tên, ngành hàng, gói dịch vụ)
    API->>DB: Ghi nhận Tenant mới & khởi tạo Workspace
    DB-->>API: Tenant ID & Status
    API-->>UI: 201 Created

    SA->>UI: 2. Tra cứu & Giám sát Hệ thống (Platform Overview)
    UI->>API: GET /api/admin/metrics/ (CPU, API quotas, LLM token usages, Logins)
    API->>DB: Truy vấn Audit Logs & Resource Usage
    DB-->>API: Tổng hợp chỉ số
    API-->>UI: Hiển thị biểu đồ hoạt động & Danh sách công ty
```

---

#### B. Marketing Manager / Company Admin (Quản lý doanh nghiệp)

* **Mục tiêu chính**: Thiết lập hồ sơ doanh nghiệp, kết nối tài khoản quảng cáo (Meta Ads, Google Ads, TikTok), phân quyền nhân sự, và xử lý các đề xuất chiến dịch/ngân sách leo thang từ Leader.

```mermaid
sequenceDiagram
    autonumber
    actor MM as Marketing Manager
    participant UI as MarketingManagerLayout
    participant Auth as Supabase RBAC / Session
    participant Ext as Facebook / Google Ads API
    participant Core as CastraServices Backend

    MM->>UI: 1. Đăng nhập & Xác thực vai trò Manager/Admin
    UI->>Auth: resolveActorRole(user, membership) -> 'manager'
    Auth-->>UI: Cấp quyền truy cập Company Admin Workspace

    MM->>UI: 2. Kết nối kênh quảng cáo (Meta/Google Ads Token)
    UI->>Core: POST /api/datasources/connect/ (Token, Account ID)
    Core->>Ext: Xác thực OAuth & Đồng bộ Ads Insights
    Ext-->>Core: Raw Campaign Metrics (Chi phí, Lượt click, Chuyển đổi)
    Core-->>UI: Trạng thái kết nối thành công

    MM->>UI: 3. Xem xét Đề xuất vượt ngưỡng (Escalated Review)
    UI->>Core: GET /api/v1/manager/escalations/
    Core-->>UI: Danh sách đề xuất ngân sách lớn
    MM->>UI: Phê duyệt đề xuất
    UI->>Core: POST /api/v1/proposals/:id/approve/
    Core-->>UI: Cập nhật trạng thái 'Approved' & Ghi nhận Audit Log (FR11)
```

---

#### C. Leader (Trưởng nhóm Marketing / Duyệt viên)

* **Mục tiêu chính**: Phân bổ mục tiêu cho Member, theo dõi Dashboard hiệu suất của nhóm, duyệt đề xuất Content/Strategy/Budget từ Member và chuyển cấp quản lý nếu vượt hạn mức.

```mermaid
sequenceDiagram
    autonumber
    actor LD as Leader
    participant UI as LeaderLayout / Shell
    participant Queue as LeaderApprovalQueue
    participant Core as Backend / Marketing Store
    actor MB as Member

    LD->>UI: 1. Xem Leader Performance Dashboard
    UI->>Core: GET /api/leader/dashboard/
    Core-->>UI: KPI nhóm, tiến độ chiến dịch, số lượng bài chờ duyệt

    MB->>Core: Gửi đề xuất chiến dịch mới (Content/Budget proposal)
    Core->>Queue: Đẩy vào hàng đợi (Status: 'pending_review')

    LD->>Queue: 2. Mở Hàng đợi phê duyệt (Approval Queue)
    Queue-->>LD: Hiển thị chi tiết nội dung, kênh, ngân sách dự kiến

    alt Chấp thuận đề xuất (Approve)
        LD->>Queue: Bấm Duyệt (Direct Approval)
        Queue->>Core: POST /api/proposals/:id/decision (Action: 'approved')
        Core-->>MB: Thông báo đề xuất đã được thông qua
    else Yêu cầu sửa đổi (Request Revision)
        LD->>Queue: Nhập lý do & Góp ý sửa đổi
        Queue->>Core: POST /api/proposals/:id/decision (Action: 'changes_requested')
        Core-->>MB: Yêu cầu Member chỉnh sửa lại nội dung
    else Vượt thẩm quyền ngân sách (Escalate)
        LD->>Queue: Leo thang lên Quản lý cấp cao (Escalate to Manager)
        Queue->>Core: POST /api/proposals/:id/escalate/
        Core-->>LD: Chuyển sang hàng đợi của Marketing Manager
    end
```

---

#### D. Member (Chuyên viên Marketing thực thi)

* **Mục tiêu chính**: Tải lên dữ liệu hiệu suất (Import CSV/Excel), dùng công cụ AI Strategy & Content Studio để sinh nội dung/chiến lược, sau đó gửi đề xuất lên cho Leader phê duyệt.

```mermaid
sequenceDiagram
    autonumber
    actor MB as Member
    participant UI as MemberShell / Workspace
    participant AI as RAG & LLM Engine (Sprint 1)
    participant Core as CastraServices API
    actor LD as Leader

    MB->>UI: 1. Import Dữ liệu Chiến dịch (Meta, Google, TikTok CSV/XLSX)
    UI->>Core: POST /api/campaigns/import/
    Core-->>UI: Phân tích & Trả về Bảng số liệu chuẩn hóa

    MB->>UI: 2. Sử dụng AI Strategy & Content Studio
    UI->>AI: Gửi ngữ cảnh (Sản phẩm, mục tiêu, kênh ưu tiên, đối thủ)
    AI-->>UI: Gợi ý chiến lược, kịch bản video, bài đăng quảng cáo

    MB->>UI: 3. Đóng gói thành Đề xuất (Submit Proposal)
    UI->>Core: POST /api/proposals/ (Title, Content, Kênh, Ngân sách)
    Core-->>UI: Đề xuất đã chuyển sang 'pending_review'
    Core-->>LD: Gửi thông báo đến hàng đợi duyệt của Leader

    Core-->>MB: 4. Nhận kết quả phản hồi (Duyệt thành công / Yêu cầu sửa / Từ chối)
```

---

### 3. Ma trận ma quyền & điểm truy cập dữ liệu (RBAC Data Access Matrix)

| Loại dữ liệu / Tính năng                     |     System Admin     |     Marketing Manager     |        Leader        |        Member        |
| :------------------------------------------------ | :------------------: | :-----------------------: | :-------------------: | :-------------------: |
| **Quản trị Multi-tenant & Công ty**      | Toàn quyền (CRUD) |   ❌ Không có quyền   | ❌ Không có quyền | ❌ Không có quyền |
| **Audit Log toàn hệ thống**              |      Đầy đủ      |    Chỉ trong công ty    | ❌ Không có quyền | ❌ Không có quyền |
| **Cấu hình API Keys (Meta/Google Ads)**   | ❌ Không can thiệp | Toàn quyền (Read/Write) | Chỉ xem trạng thái | ❌ Không có quyền |
| **Phê duyệt đề xuất ngân sách lớn** |          ❌          |      Duyệt cấp cao      | Leo thang (Escalate) |          ❌          |
| **Phê duyệt đề xuất Content/Strategy** |          ❌          |    Can thiệp khi cần    |  Duyệt trực tiếp  |          ❌          |
| **Tạo đề xuất & sinh nội dung AI**     |          ❌          |         Tạo mẫu         |  Tạo & chỉnh sửa  |  Tạo & đệ trình  |
| **Nhập dữ liệu chiến dịch (Import)**   |          ❌          |        Đầy đủ        |      Đầy đủ      | Nhập theo nhiệm vụ |
