/**
 * dashboardMock.js — Dữ liệu chuẩn cho Performance Dashboard (FR05)
 * Đồng bộ trực tiếp từ kết quả phân tích đa kênh trong config/data_request.json & docs/dashboard_flow.md
 */

/** 4 KPI cards hàng đầu (Cross-Channel Summary) */
export const KPI_CARDS = [
  {
    id: 'impressions',
    label: 'TỔNG LƯỢT HIỂN THỊ (IMPRESSIONS)',
    value: '286.3K',
    delta: '+14.2% so với tuần trước',
    deltaPositive: true,
    status: 'Tăng trưởng tốt',
    statusTone: 'healthy',
  },
  {
    id: 'ctr',
    label: 'TỶ LỆ CLICK (CTR)',
    value: '3.65%',
    benchmark: 'Mục tiêu: 3.00% (+0.65%)',
    status: 'Vượt mục tiêu',
    statusTone: 'above-target',
  },
  {
    id: 'cpa',
    label: 'CHI PHÍ / CHUYỂN ĐỔI (CPA)',
    value: '37.258 ₫',
    benchmark: 'Ngưỡng trần: 40.000 ₫ (-2.742 ₫)',
    status: 'Tối ưu',
    statusTone: 'optimized',
  },
  {
    id: 'roas',
    label: 'TỶ SUẤT DOANH THU QUẢNG CÁO (ROAS)',
    value: '2.97×',
    benchmark: 'Hòa vốn: 2.00× (+0.97×)',
    status: 'Hiệu quả cao',
    statusTone: 'outperforming',
  },
]

/** Bảng phân bổ & hiệu suất 3 kênh quảng cáo chính */
export const CHANNEL_ROWS = [
  {
    id: 'google',
    icon: '🔍',
    channel: 'Google Search & P-Max',
    subtitle: 'Từ khóa tìm kiếm & Performance Max',
    spend: '8.000.000 ₫',
    revenue: '25.680.000 ₫',
    impressions: '77.5K',
    ctr: '4.48%',
    ctrPositive: true,
    cpa: '33.333 ₫',
    roas: '3.21×',
    status: 'Hoạt động tốt · Tỷ suất cao',
    statusTone: 'active-high',
    action: 'Xem chi tiết kênh',
  },
  {
    id: 'meta',
    icon: '🌐',
    channel: 'Meta Ads (Facebook & Instagram)',
    subtitle: 'Reels Video & Dynamic Carousel Feed',
    spend: '10.000.000 ₫',
    revenue: '30.750.000 ₫',
    impressions: '76.8K',
    ctr: '3.12%',
    ctrPositive: true,
    cpa: '38.462 ₫',
    roas: '3.08×',
    status: 'Hoạt động tốt · Tiếp cận lớn',
    statusTone: 'active-retarget',
    action: 'Xem chi tiết kênh',
  },
  {
    id: 'tiktok',
    icon: '▶',
    channel: 'TikTok Video Ads',
    subtitle: 'Top-of-Funnel Spark Ads & UGC Creator',
    spend: '7.000.000 ₫',
    revenue: '17.700.000 ₫',
    impressions: '132.0K',
    ctr: '3.48%',
    ctrPositive: false,
    cpa: '40.936 ₫',
    cpaAlert: true,
    roas: '2.53×',
    status: 'Cần tối ưu ngân sách',
    statusTone: 'needs-opt',
    action: 'Tối ưu chi phí',
  },
]

/** So sánh ROAS thực tế và mục tiêu theo kênh */
export const ROAS_BARS = [
  { id: 'google', label: 'Google Ads', value: 3.21, goal: 3.0, color: '#4f9de8' },
  { id: 'meta',   label: 'Meta Ads',   value: 3.08, goal: 2.8, color: '#7777f6' },
  { id: 'tiktok', label: 'TikTok Ads', value: 2.53, goal: 2.7, color: '#ef4444' },
]
export const ROAS_BASELINE = 2.0

/** Cảnh báo & Đề xuất hành động thông minh */
export const ALERT = {
  severity: 'alert',
  code: 'CẢNH BÁO TỐI ƯU HÓA',
  label: 'Chẩn đoán tự động từ Pipeline Engine',
  title: 'CPA TikTok (40.936 ₫) đã vượt ngưỡng hiệu quả',
  body: 'Kênh TikTok Ads đang có CPA 40.936 ₫ cao hơn mức trung bình toàn sàn (37.258 ₫). Khuyến nghị điều chuyển 7.000.000 ₫ sang Google Ads và Meta Ads để bảo toàn biên lợi nhuận ròng.',
  cta: 'Mở Công cụ Tối ưu Ngân sách',
  ctaPage: 'budget',
}

/** Thông tin tổng quan Workspace */
export const DASHBOARD_META = {
  workspace: 'CastraVision Marketing Omnichannel',
  totalSpend: '25.000.000 ₫',
  totalRevenue: '74.130.000 ₫',
  netProfit: '49.130.000 ₫',
  dateRange: '7 ngày qua (26/10/2026 - 02/11/2026)',
  dataLatency: 'Đồng bộ 3 phút trước',
  dataSource: 'Dữ liệu trực tiếp từ Meta API, Google Ads API & TikTok Business API',
  activeChannels: 3,
}
