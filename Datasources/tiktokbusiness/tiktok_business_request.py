"""
CastraVision - TikTok Business Ads Data Fetcher
===============================================
Module thu thập dữ liệu hiệu suất quảng cáo từ TikTok Business Marketing API (v1.3),
chuẩn hóa thành cấu trúc chung (CTR, CPA, ROAS, Impression, Clicks...) để
đưa vào module phân tích chiến lược, sandbox và hệ thống dashboard.

Quy trình thực hiện gồm 3 công đoạn tương tự Meta Ads & Google Ads:
  1. INPUT: Nạp cấu hình (.env), thiết lập tham số lọc thời gian, dimensions, metrics.
  2. XỬ LÝ: Khởi tạo kết nối, gọi TikTok Open API với cơ chế retry (Tenacity), chuẩn hóa DataFrame.
  3. OUTPUT: Xuất dữ liệu đa kênh ra CSV/JSON và cung cấp dữ liệu cho dashboard / sandbox.

Yêu cầu cài đặt:
    pip install requests pandas python-dotenv tenacity

Yêu cầu file .env (ở thư mục gốc dự án):
    TIKTOK_APP_ID=xxxxxxxxxx
    TIKTOK_APP_SECRET=xxxxxxxxxx
    TIKTOK_ACCESS_TOKEN=xxxxxxxxxx
    TIKTOK_ADVERTISER_ID=xxxxxxxxxx
"""

import os
import sys

# Hỗ trợ hiển thị tiếng Việt UTF-8 chuẩn trên Windows console
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import json
import logging
from datetime import date, timedelta
from typing import List, Dict, Any, Optional

import pandas as pd
import requests
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# Cấu hình logging đồng bộ với chuẩn dự án
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("tiktok_ads_fetch")


# ---------------------------------------------------------------
# 1. INPUT: Cấu hình & tham số đầu vào
# ---------------------------------------------------------------
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

APP_ID = os.getenv("TIKTOK_APP_ID")
APP_SECRET = os.getenv("TIKTOK_APP_SECRET") or os.getenv("TIKTOK_SECRET")
ACCESS_TOKEN = os.getenv("TIKTOK_ACCESS_TOKEN")
ADVERTISER_ID = os.getenv("TIKTOK_ADVERTISER_ID") or os.getenv("TIKTOK_AD_ACCOUNT_ID")

# Endpoint TikTok Marketing API v1.3
TIKTOK_API_BASE_URL = "https://business-api.tiktok.com/open_api/v1.3"
REPORT_INTEGRATED_ENDPOINT = f"{TIKTOK_API_BASE_URL}/report/integrated/get/"

# Các trường dimensions (chiều dữ liệu phân nhóm)
REPORT_DIMENSIONS = [
    "ad_id",
    "stat_time_day"
]

# Các trường metrics (chỉ số đo lường hiệu suất tiếp thị)
REPORT_METRICS = [
    "campaign_id",
    "campaign_name",
    "adgroup_id",
    "adgroup_name",
    "ad_name",
    "spend",
    "impressions",
    "clicks",
    "reach",
    "cpc",
    "cpm",
    "ctr",
    "conversion",
    "cost_per_conversion",
    "conversion_rate",
    "total_purchase_value",
    "complete_payment_value"
]


def build_params(days_back: int = 7, page: int = 1, page_size: int = 1000) -> Dict[str, Any]:
    """
    Thiết lập tham số truy vấn báo cáo tích hợp TikTok Business.
    - days_back: Số ngày lấy dữ liệu lùi về trước (mặc định 7 ngày).
    - page: Số trang phân trang.
    - page_size: Số bản ghi mỗi trang (tối đa 1000).
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days_back)

    return {
        "advertiser_id": str(ADVERTISER_ID).strip() if ADVERTISER_ID else "",
        "report_type": "BASIC",
        "data_level": "AUCTION_AD",
        "dimensions": json.dumps(REPORT_DIMENSIONS),
        "metrics": json.dumps(REPORT_METRICS),
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d"),
        "page": page,
        "page_size": page_size,
    }


# ---------------------------------------------------------------
# 2. XỬ LÝ: Khởi tạo, gọi API, retry khi lỗi, chuẩn hóa dữ liệu
# ---------------------------------------------------------------

def init_tiktok_api() -> None:
    """Kiểm tra và xác thực các biến môi trường cần thiết của TikTok Business API."""
    missing = []
    if not ACCESS_TOKEN:
        missing.append("TIKTOK_ACCESS_TOKEN")
    if not ADVERTISER_ID:
        missing.append("TIKTOK_ADVERTISER_ID")

    if missing:
        raise EnvironmentError(
            f"Thiếu biến môi trường TikTok Business: {', '.join(missing)} trong file .env"
        )
    logger.info("Đã xác thực thông tin kết nối TikTok Business Marketing API.")


class TikTokAPIError(Exception):
    """Lớp ngoại lệ riêng cho lỗi phản hồi từ TikTok Business API."""
    def __init__(self, code: int, message: str):
        super().__init__(f"TikTok API Error [Code {code}]: {message}")
        self.code = code
        self.message = message


# Retry tự động khi gặp sự cố mạng hoặc lỗi máy chủ (tương tự NFR04 bên Meta Ads)
@retry(
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=2, min=2, max=30),
    retry=retry_if_exception_type((requests.RequestException, TikTokAPIError)),
)
def _request_tiktok_report_page(params: Dict[str, Any]) -> Dict[str, Any]:
    """Thực hiện một yêu cầu HTTP GET có retry tới TikTok Integrated Report API."""
    headers = {
        "Access-Token": str(ACCESS_TOKEN).strip(),
        "Content-Type": "application/json",
    }
    
    response = requests.get(
        REPORT_INTEGRATED_ENDPOINT,
        headers=headers,
        params=params,
        timeout=30
    )
    response.raise_exception()
    data = response.json()

    code = data.get("code", 0)
    # Mã 0 nghĩa là thành công trong quy ước Open API TikTok
    if code != 0:
        err_msg = data.get("message", "Không rõ lỗi")
        # Nếu là lỗi do rate limit hoặc tạm thời, raise TikTokAPIError để tenacity retry
        if code in (40100, 40101, 50000, 51000):
            logger.warning(f"Gặp mã lỗi tạm thời {code} từ TikTok API, đang thử lại...")
            raise TikTokAPIError(code, err_msg)
        raise TikTokAPIError(code, err_msg)

    return data


def fetch_raw_reports(days_back: int = 7) -> List[Dict[str, Any]]:
    """
    Gọi TikTok Integrated Report API để kéo toàn bộ dữ liệu báo cáo quảng cáo.
    Tự động xử lý phân trang (pagination) cho đến khi lấy hết dữ liệu.
    Trả về: Danh sách các dict thô (raw list) từ TikTok.
    """
    init_tiktok_api()

    all_records: List[Dict[str, Any]] = []
    current_page = 1
    page_size = 1000

    logger.info(f"Đang lấy dữ liệu TikTok Ads trong {days_back} ngày qua (Advertiser: {ADVERTISER_ID})...")

    while True:
        params = build_params(days_back=days_back, page=current_page, page_size=page_size)
        payload = _request_tiktok_report_page(params)

        data_obj = payload.get("data", {})
        page_list = data_obj.get("list", [])
        page_info = data_obj.get("page_info", {})

        all_records.extend(page_list)

        total_pages = page_info.get("total_page", 1)
        logger.info(f"Đã tải trang {current_page}/{total_pages} - ({len(page_list)} bản ghi)")

        if current_page >= total_pages or not page_list:
            break
        current_page += 1

    logger.info(f"Tổng cộng đã lấy thành công {len(all_records)} bản ghi từ TikTok Ads.")
    return all_records


def normalize_tiktok_insights(raw_data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Chuẩn hóa dữ liệu thô từ TikTok thành DataFrame với schema thống nhất
    dùng chung cho mọi kênh quảng cáo (Facebook / Google / TikTok),
    phục vụ hiển thị trên Dashboard và lưu trữ tập trung.
    """
    rows = []
    for item in raw_data:
        dims = item.get("dimensions", {})
        metrics = item.get("metrics", {})

        # Trích xuất thời gian (stat_time_day thường có định dạng 'YYYY-MM-DD 00:00:00')
        raw_date = dims.get("stat_time_day", "")
        formatted_date = str(raw_date).split(" ")[0] if raw_date else date.today().strftime("%Y-%m-%d")

        spend = float(metrics.get("spend", 0) or 0)
        impressions = int(metrics.get("impressions", 0) or 0)
        clicks = int(metrics.get("clicks", 0) or 0)
        reach = int(metrics.get("reach", 0) or 0)
        
        # Chuyển đổi và doanh thu
        conversions = float(metrics.get("conversion", 0) or 0)
        # TikTok có thể ghi nhận 'total_purchase_value' hoặc 'complete_payment_value'
        revenue = float(
            metrics.get("total_purchase_value") 
            or metrics.get("complete_payment_value") 
            or 0.0
        )

        # Các chỉ số tỷ lệ
        ctr = float(metrics.get("ctr", 0) or 0)
        if ctr == 0 and impressions > 0:
            ctr = round((clicks / impressions) * 100, 2)

        cpc = float(metrics.get("cpc", 0) or 0)
        if cpc == 0 and clicks > 0:
            cpc = round(spend / clicks, 2)

        cpm = float(metrics.get("cpm", 0) or 0)
        if cpm == 0 and impressions > 0:
            cpm = round((spend / impressions) * 1000, 2)

        cpa = round(spend / conversions, 2) if conversions > 0 else None
        roas = round(revenue / spend, 2) if spend > 0 else None

        rows.append({
            "platform": "tiktok",
            "date": formatted_date,
            "campaign_id": str(metrics.get("campaign_id") or ""),
            "campaign_name": metrics.get("campaign_name", "Chiến dịch TikTok"),
            "adset_id": str(metrics.get("adgroup_id") or ""),
            "adset_name": metrics.get("adgroup_name", "Nhóm quảng cáo TikTok"),
            "ad_id": str(dims.get("ad_id") or ""),
            "ad_name": metrics.get("ad_name", "Quảng cáo TikTok"),
            "impressions": impressions,
            "clicks": clicks,
            "spend": spend,
            "reach": reach,
            "ctr": ctr,
            "cpc": cpc,
            "cpm": cpm,
            "conversions": conversions,
            "revenue": revenue,
            "cpa": cpa,
            "roas": roas,
        })

    return pd.DataFrame(rows)


# ---------------------------------------------------------------
# 3. OUTPUT: Xuất dữ liệu ra file / trả về cho module phân tích
# ---------------------------------------------------------------

def save_output(df: pd.DataFrame, out_dir: Optional[str] = None) -> None:
    """Lưu kết quả ra file CSV và JSON phục vụ module phân tích / dashboard."""
    if out_dir is None:
        out_dir = os.path.join(CURRENT_DIR, "output")

    os.makedirs(out_dir, exist_ok=True)
    today_str = date.today().strftime("%Y%m%d")

    csv_path = os.path.join(out_dir, f"tiktok_ads_insights_{today_str}.csv")
    json_path = os.path.join(out_dir, f"tiktok_ads_insights_{today_str}.json")

    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    df.to_json(json_path, orient="records", force_ascii=False, indent=2)

    logger.info(f"Đã lưu output TikTok Ads: {csv_path}")
    logger.info(f"Đã lưu output TikTok Ads: {json_path}")


def run(days_back: int = 7) -> pd.DataFrame:
    """
    Hàm thực thi chính của module TikTok Business Ads.
    Được gọi từ Scheduler, API Endpoint, hoặc Sandbox dashboard_request.py.
    """
    init_tiktok_api()
    raw_data = fetch_raw_reports(days_back=days_back)
    df = normalize_tiktok_insights(raw_data)
    save_output(df)
    return df


if __name__ == "__main__":
    try:
        result_df = run(days_back=7)
        print("\n=== KẾT QUẢ DỮ LIỆU TIKTOK ADS (MẪU) ===")
        print(result_df.head())
    except EnvironmentError as env_err:
        logger.error(f"[Cấu hình] {env_err}")
    except Exception as exc:
        logger.error(f"[Lỗi thực thi] {exc}")
