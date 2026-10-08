-- =====================================================================
-- CastraVision — Supabase Database Schema (starter version)
-- Chạy trong Supabase SQL Editor, hoặc lưu vào supabase/migrations/
-- Yêu cầu: bật extension pgvector (cho RAG ở FR01) trước khi chạy phần cuối.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists vector; -- dùng cho FR01 (RAG embeddings)

-- ---------------------------------------------------------------------
-- 1. PROFILES  (FR12 — nối vào auth.users có sẵn của Supabase Auth)
-- KHÔNG tự tạo bảng "users" riêng — Supabase Auth đã quản lý đăng ký/
-- đăng nhập/JWT/hash password. Bảng này chỉ lưu thông tin bổ sung.
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. WORKSPACES & MEMBERS  (FR06)
-- ---------------------------------------------------------------------
create type workspace_role as enum ('admin', 'manager', 'member');

create table public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role workspace_role not null default 'member',
  invited_email text,
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- ---------------------------------------------------------------------
-- 3. BUSINESS PROFILES  (FR12)
-- ---------------------------------------------------------------------
create table public.business_profiles (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  industry text,
  company_size text check (company_size in ('micro','sme','enterprise')),
  target_customer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. CAMPAIGN DATA IMPORT & PERFORMANCE  (FR08)
-- ---------------------------------------------------------------------
create table public.campaign_performance (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel text not null check (channel in ('facebook','google','tiktok')),
  campaign_name text,
  ctr numeric,
  cpa numeric,
  roas numeric,
  impressions bigint,
  spend numeric,
  record_date date not null,
  source text not null default 'csv_import' check (source in ('csv_import','sandbox_api')),
  created_at timestamptz not null default now()
);
create index idx_campaign_perf_workspace_date on public.campaign_performance(workspace_id, record_date);

-- ---------------------------------------------------------------------
-- 5. STRATEGIES  (FR01)
-- ---------------------------------------------------------------------
create table public.strategies (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  business_profile_id uuid references public.business_profiles(id),
  objective text,
  expected_budget numeric,
  recommended_channels jsonb,      -- vd: [{"channel":"facebook","allocation_pct":40}, ...]
  key_message text,
  target_segment text,
  ai_reasoning text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Embeddings cho RAG pipeline (FR01) — lưu embedding của dữ liệu lịch sử/ngữ cảnh
create table public.strategy_context_embeddings (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_type text not null,       -- vd: 'campaign_performance', 'business_profile'
  source_id uuid,
  content text not null,
  embedding vector(1536),          -- khớp dimension model embedding đang dùng
  created_at timestamptz not null default now()
);
create index idx_embeddings_vector on public.strategy_context_embeddings
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ---------------------------------------------------------------------
-- 6. AD CONTENT  (FR02)
-- ---------------------------------------------------------------------
create table public.ad_contents (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  strategy_id uuid references public.strategies(id),
  channel text not null check (channel in ('facebook','google','tiktok')),
  headline text,
  description text,
  cta text,
  image_prompt text,
  tone text default 'neutral',
  status text not null default 'draft' check (status in ('draft','pending','approved','rejected')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 7. BUDGET PROPOSALS  (FR03)
-- ---------------------------------------------------------------------
create table public.budget_proposals (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel text not null,
  current_allocation numeric,
  proposed_allocation numeric,
  estimated_cpa numeric,
  status text not null default 'pending' check (status in ('pending','approved','rejected','edited')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8. APPROVALS  (FR04 — human-in-the-loop, áp dụng cho cả ad_contents & budget_proposals)
-- ---------------------------------------------------------------------
create table public.approvals (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  target_type text not null check (target_type in ('ad_content','budget_proposal')),
  target_id uuid not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','edited')),
  reviewer_id uuid references auth.users(id),
  reject_reason text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 9. NOTIFICATIONS  (FR10)
-- ---------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,              -- vd: 'approval_pending','budget_alert','anomaly'
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_user_unread on public.notifications(user_id, is_read);

-- ---------------------------------------------------------------------
-- 10. AUDIT LOG  (FR11)
-- ---------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,            -- vd: 'approve','reject','edit','create'
  entity_type text not null,       -- vd: 'ad_content','budget_proposal','workspace_member'
  entity_id uuid,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_logs_workspace_time on public.audit_logs(workspace_id, created_at desc);

-- ---------------------------------------------------------------------
-- 11. COMPETITOR INSIGHTS  (FR09 — Should-have)
-- ---------------------------------------------------------------------
create table public.competitor_insights (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  keyword text not null,
  summary text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 12. REPORTS  (FR07)
-- ---------------------------------------------------------------------
create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  format text not null check (format in ('pdf','csv')),
  params jsonb,                    -- vd: {"date_from":"...","date_to":"...","channels":[...]}
  file_url text,
  status text not null default 'processing' check (status in ('processing','ready','failed')),
  requested_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- ROW LEVEL SECURITY — bắt buộc vì mô hình multi-tenant theo Workspace.
-- Nguyên tắc chung: user chỉ thấy dữ liệu của Workspace mà mình là thành viên.
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.business_profiles enable row level security;
alter table public.campaign_performance enable row level security;
alter table public.strategies enable row level security;
alter table public.ad_contents enable row level security;
alter table public.budget_proposals enable row level security;
alter table public.approvals enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.competitor_insights enable row level security;
alter table public.reports enable row level security;

-- Helper: kiểm tra user hiện tại có phải thành viên của workspace không
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

-- Profiles: ai cũng xem được profile của chính mình
create policy "profiles_self" on public.profiles
  for all using (id = auth.uid());

-- Workspaces: chỉ thành viên mới thấy/sửa
create policy "workspaces_member_select" on public.workspaces
  for select using (public.is_workspace_member(id));
create policy "workspaces_owner_modify" on public.workspaces
  for update using (owner_id = auth.uid());

-- Workspace members: chỉ thành viên cùng workspace mới thấy danh sách
create policy "workspace_members_select" on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));

-- Áp dụng pattern tương tự cho toàn bộ bảng còn lại (workspace_id scoped)
create policy "business_profiles_scoped" on public.business_profiles
  for all using (public.is_workspace_member(workspace_id));
create policy "campaign_performance_scoped" on public.campaign_performance
  for all using (public.is_workspace_member(workspace_id));
create policy "strategies_scoped" on public.strategies
  for all using (public.is_workspace_member(workspace_id));
create policy "ad_contents_scoped" on public.ad_contents
  for all using (public.is_workspace_member(workspace_id));
create policy "budget_proposals_scoped" on public.budget_proposals
  for all using (public.is_workspace_member(workspace_id));
create policy "approvals_scoped" on public.approvals
  for all using (public.is_workspace_member(workspace_id));
create policy "notifications_scoped" on public.notifications
  for all using (user_id = auth.uid());
create policy "audit_logs_scoped" on public.audit_logs
  for select using (public.is_workspace_member(workspace_id));
create policy "competitor_insights_scoped" on public.competitor_insights
  for all using (public.is_workspace_member(workspace_id));
create policy "reports_scoped" on public.reports
  for all using (public.is_workspace_member(workspace_id));

-- =====================================================================
-- GHI CHÚ CHO DB OWNER (Phúc):
-- 1. Đây là schema khởi điểm (khung chung), từng FR owner tự thêm cột/bảng
--    phụ nếu cần, nhưng phải giữ nguyên tắc: mọi bảng nghiệp vụ đều có
--    cột workspace_id + bật RLS theo đúng pattern is_workspace_member().
-- 2. Trước khi code FR12, cả nhóm nên đọc qua Supabase Auth docs thay vì
--    tự code lại register/login/JWT — chỉ cần bảng "profiles" ở trên.
-- 3. Khi review migration mỗi sprint: kiểm tra (a) bảng mới có workspace_id
--    chưa, (b) đã bật RLS + có policy chưa, (c) có index cho cột hay lọc
--    (workspace_id, created_at, status...) chưa.
-- =====================================================================
