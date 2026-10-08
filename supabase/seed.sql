-- Demo data for Cafe Ông Bụt.
-- Create owner@demo.castravision.vn in Supabase Auth before running this seed.
-- If that Auth user does not exist, this script leaves the database unchanged.
-- This file is safe to run again: an existing owner/workspace pair is not duplicated.

do $seed$
declare
  demo_owner uuid;
  demo_workspace uuid;
  demo_profile uuid;
  strategy_awareness uuid;
  strategy_conversion uuid;
  strategy_retention uuid;
  approved_content uuid;
  pending_budget uuid;
begin
  select id into demo_owner
  from auth.users
  where email = 'owner@demo.castravision.vn'
  limit 1;

  if demo_owner is null then
    raise notice 'Demo seed skipped: create owner@demo.castravision.vn in Authentication > Users, then rerun supabase/seed.sql.';
    return;
  end if;

  if exists (
    select 1 from public.workspaces
    where name = 'Cafe Ông Bụt' and owner_id = demo_owner
  ) then
    raise notice 'Demo seed skipped: Cafe Ông Bụt already exists for this owner.';
    return;
  end if;

  insert into public.profiles (id, full_name)
  values (demo_owner, 'Chủ quán Cafe Ông Bụt')
  on conflict (id) do nothing;

  insert into public.workspaces (name, owner_id, created_at)
  values ('Cafe Ông Bụt', demo_owner, now() - interval '31 days')
  returning id into demo_workspace;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (demo_workspace, demo_owner, 'admin');

  insert into public.business_profiles
    (workspace_id, industry, company_size, target_customer, created_at)
  values
    (demo_workspace, 'Food & Beverage', 'sme',
     'Người đi làm và sinh viên 18–35 tuổi tại TP.HCM, thích cà phê pha máy, không gian yên tĩnh để làm việc hoặc gặp bạn bè.',
     now() - interval '30 days')
  returning id into demo_profile;

  -- ctr is stored as a percentage (for example, 1.40 means 1.40%).
  -- Monetary values are VND. Each channel has six records within the last 30 days.
  insert into public.campaign_performance
    (workspace_id, channel, campaign_name, ctr, cpa, roas, impressions, spend, record_date, source)
  select demo_workspace, v.channel, v.campaign_name, v.ctr, v.cpa,
         v.roas, v.impressions, v.spend, current_date - v.days_ago, 'csv_import'
  from (values
    ('facebook', 'Combo sáng Ông Bụt',       1.42, 42000, 2.65, 42000::bigint, 2100000,  1),
    ('facebook', 'Combo sáng Ông Bụt',       1.58, 39500, 2.82, 38700::bigint, 1900000,  6),
    ('facebook', 'Combo sáng Ông Bụt',       1.35, 45000, 2.41, 40300::bigint, 2050000, 11),
    ('facebook', 'Không gian làm việc',      1.72, 38000, 3.05, 35500::bigint, 1750000, 16),
    ('facebook', 'Không gian làm việc',      1.63, 40500, 2.94, 37100::bigint, 1850000, 21),
    ('facebook', 'Không gian làm việc',      1.51, 43000, 2.72, 39800::bigint, 2000000, 27),
    ('google',   'Cà phê gần tôi',           2.18, 47000, 3.12, 18900::bigint, 1600000,  2),
    ('google',   'Cà phê gần tôi',           2.31, 44500, 3.34, 17600::bigint, 1500000,  7),
    ('google',   'Cà phê gần tôi',           2.06, 49000, 2.95, 20100::bigint, 1700000, 12),
    ('google',   'Quán cà phê làm việc',      2.48, 41000, 3.58, 16200::bigint, 1400000, 17),
    ('google',   'Quán cà phê làm việc',      2.36, 42500, 3.42, 17100::bigint, 1450000, 22),
    ('google',   'Quán cà phê làm việc',      2.22, 46000, 3.17, 18400::bigint, 1550000, 28),
    ('tiktok',   'Một ngày ở Ông Bụt',       0.94, 55000, 1.86, 86000::bigint, 2200000,  3),
    ('tiktok',   'Một ngày ở Ông Bụt',       1.12, 51000, 2.08, 81200::bigint, 2100000,  8),
    ('tiktok',   'Một ngày ở Ông Bụt',       1.08, 53000, 1.98, 83500::bigint, 2150000, 13),
    ('tiktok',   'Thử món mới cùng bạn',     1.26, 48000, 2.31, 76800::bigint, 1950000, 18),
    ('tiktok',   'Thử món mới cùng bạn',     1.19, 50000, 2.17, 79100::bigint, 2050000, 23),
    ('tiktok',   'Thử món mới cùng bạn',     1.03, 54000, 1.91, 84400::bigint, 2180000, 29)
  ) as v(channel, campaign_name, ctr, cpa, roas, impressions, spend, days_ago);

  insert into public.strategies
    (workspace_id, business_profile_id, objective, expected_budget,
     recommended_channels, key_message, target_segment, ai_reasoning, created_by, created_at)
  values
    (demo_workspace, demo_profile, 'Tăng nhận biết quán trong bán kính 5 km',
     12000000,
     '[{"channel":"facebook","allocation_pct":45},{"channel":"google","allocation_pct":35},{"channel":"tiktok","allocation_pct":20}]'::jsonb,
     'Một góc cà phê ấm áp để bắt đầu ngày mới.',
     'Người đi làm 22–35 tuổi quanh cửa hàng',
     'Facebook có lượng tiếp cận địa phương ổn định, Google thu hút người đang tìm quán gần mình, còn TikTok giúp kể câu chuyện không gian quán. Phân bổ này giữ kênh chuyển đổi mạnh đồng thời mở rộng nhận biết.',
     demo_owner, now() - interval '4 days')
  returning id into strategy_awareness;

  insert into public.strategies
    (workspace_id, business_profile_id, objective, expected_budget,
     recommended_channels, key_message, target_segment, ai_reasoning, created_by, created_at)
  values
    (demo_workspace, demo_profile, 'Tăng lượt ghé quán vào buổi sáng',
     9000000,
     '[{"channel":"google","allocation_pct":50},{"channel":"facebook","allocation_pct":35},{"channel":"tiktok","allocation_pct":15}]'::jsonb,
     'Combo cà phê và bánh cho buổi sáng bận rộn.',
     'Nhân viên văn phòng và sinh viên trên đường đi học, đi làm',
     'Dữ liệu mẫu cho thấy Google có ROAS tốt ở nhu cầu tìm quán gần tôi; vì vậy chiến dịch buổi sáng ưu tiên tìm kiếm và dùng Facebook để nhắc lại ưu đãi.',
     demo_owner, now() - interval '3 days')
  returning id into strategy_conversion;

  insert into public.strategies
    (workspace_id, business_profile_id, objective, expected_budget,
     recommended_channels, key_message, target_segment, ai_reasoning, created_by, created_at)
  values
    (demo_workspace, demo_profile, 'Khuyến khích khách quay lại cuối tuần',
     6000000,
     '[{"channel":"facebook","allocation_pct":50},{"channel":"tiktok","allocation_pct":35},{"channel":"google","allocation_pct":15}]'::jsonb,
     'Hẹn bạn cuối tuần tại Cafe Ông Bụt.',
     'Khách đã từng ghé quán và nhóm bạn trẻ 18–30 tuổi',
     'Thông điệp cuối tuần phù hợp nhóm khách quen; Facebook hỗ trợ nhắc lại, TikTok truyền tải trải nghiệm tại quán, còn Google giữ hiện diện khi khách tìm địa điểm gặp bạn.',
     demo_owner, now() - interval '2 days')
  returning id into strategy_retention;

  insert into public.ad_contents
    (workspace_id, strategy_id, channel, headline, description, cta, tone, status, created_by, created_at)
  values
    (demo_workspace, strategy_awareness, 'facebook',
     'Một góc bình yên giữa phố', 'Ghé Cafe Ông Bụt để thưởng thức cà phê thơm và tìm một bàn làm việc thật thoải mái.',
     'Xem đường đi', 'warm', 'approved', demo_owner, now() - interval '2 days')
  returning id into approved_content;

  insert into public.ad_contents
    (workspace_id, strategy_id, channel, headline, description, cta, tone, status, created_by)
  values
    (demo_workspace, strategy_conversion, 'facebook',
     'Sáng nay uống gì?', 'Combo cà phê và bánh tươi đang chờ bạn trước giờ làm.',
     'Xem thực đơn', 'friendly', 'pending', demo_owner),
    (demo_workspace, strategy_conversion, 'google',
     'Cafe Ông Bụt gần bạn', 'Cà phê pha máy, chỗ ngồi yên tĩnh và combo sáng tiện lợi.',
     'Chỉ đường', 'clear', 'approved', demo_owner),
    (demo_workspace, strategy_awareness, 'google',
     'Quán cà phê để làm việc', 'Đến Cafe Ông Bụt để tập trung làm việc cùng một ly cà phê yêu thích.',
     'Xem vị trí', 'clear', 'pending', demo_owner),
    (demo_workspace, strategy_retention, 'tiktok',
     'Cuối tuần đi cà phê nhé?', 'Rủ hội bạn ghé Ông Bụt, trò chuyện và thử món mới trong không gian ấm cúng.',
     'Ghé quán', 'playful', 'pending', demo_owner),
    (demo_workspace, strategy_awareness, 'tiktok',
     'Một ngày ở Cafe Ông Bụt', 'Từ ly cà phê đầu tiên đến góc bàn quen thuộc của bạn.',
     'Khám phá ngay', 'warm', 'approved', demo_owner);

  insert into public.budget_proposals
    (workspace_id, channel, current_allocation, proposed_allocation, estimated_cpa, status, created_at)
  values
    (demo_workspace, 'google', 3000000, 4200000, 43000, 'pending', now() - interval '6 hours')
  returning id into pending_budget;

  insert into public.budget_proposals
    (workspace_id, channel, current_allocation, proposed_allocation, estimated_cpa, status, created_at)
  values
    (demo_workspace, 'tiktok', 2500000, 1800000, 50000, 'pending', now() - interval '5 hours');

  insert into public.approvals
    (workspace_id, target_type, target_id, status, created_at)
  values
    (demo_workspace, 'budget_proposal', pending_budget, 'pending', now() - interval '2 hours');

  insert into public.approvals
    (workspace_id, target_type, target_id, status, reviewer_id, reviewed_at, created_at)
  values
    (demo_workspace, 'ad_content', approved_content, 'approved', demo_owner,
     now() - interval '1 day', now() - interval '2 days');

  insert into public.notifications
    (workspace_id, user_id, type, message, is_read, created_at)
  values
    (demo_workspace, demo_owner, 'approval_pending',
     'Đề xuất tăng ngân sách Google đang chờ phê duyệt.', false, now() - interval '2 hours'),
    (demo_workspace, demo_owner, 'approval_pending',
     'Nội dung quảng cáo combo sáng cần được xem xét.', false, now() - interval '5 hours'),
    (demo_workspace, demo_owner, 'budget_alert',
     'CPA chiến dịch TikTok cao hơn mục tiêu tuần này.', true, now() - interval '2 days'),
    (demo_workspace, demo_owner, 'campaign_update',
     'Dữ liệu chiến dịch 30 ngày gần nhất đã được nhập.', true, now() - interval '3 days');

  insert into public.audit_logs
    (workspace_id, actor_id, action, entity_type, entity_id, before_value, after_value, created_at)
  values
    (demo_workspace, demo_owner, 'create', 'workspace', demo_workspace,
     null, '{"name":"Cafe Ông Bụt"}'::jsonb, now() - interval '31 days'),
    (demo_workspace, demo_owner, 'create', 'strategy', strategy_awareness,
     null, '{"objective":"Tăng nhận biết quán trong bán kính 5 km"}'::jsonb,
     now() - interval '4 days'),
    (demo_workspace, demo_owner, 'approve', 'ad_content', approved_content,
     '{"status":"pending"}'::jsonb, '{"status":"approved"}'::jsonb,
     now() - interval '1 day'),
    (demo_workspace, demo_owner, 'edit', 'budget_proposal', pending_budget,
     '{"proposed_allocation":3600000}'::jsonb, '{"proposed_allocation":4200000}'::jsonb,
     now() - interval '3 hours');

  insert into public.competitor_insights
    (workspace_id, keyword, summary, created_by)
  values
    (demo_workspace, 'cà phê làm việc quận 3',
     'Các quán gần khu vực thường nhấn mạnh Wi-Fi, ổ điện và combo sáng; Cafe Ông Bụt có thể làm nổi bật không gian yên tĩnh cùng cà phê pha máy.',
     demo_owner);

  insert into public.reports
    (workspace_id, format, params, file_url, status, requested_by)
  values
    (demo_workspace, 'pdf',
     jsonb_build_object('date_from', current_date - 30, 'date_to', current_date,
                        'channels', jsonb_build_array('facebook', 'google', 'tiktok')),
     'https://example.com/reports/demo.pdf', 'ready', demo_owner);

  raise notice 'Demo seed complete for workspace %.', demo_workspace;
end;
$seed$;
