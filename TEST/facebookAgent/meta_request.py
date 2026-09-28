"""
CastraVision - Facebook/Meta Ads Data Fetcher
===============================================
Module thu thập dữ liệu hiệu suất quảng cáo từ Facebook Marketing API,
chuẩn hóa thành cấu trúc chung (CTR, CPA, ROAS, Impression...) để
đưa vào module phân tích chiến lược và dashboard.

Yêu cầu cài đặt:
    pip install facebook-business pandas python-dotenv tenacity

Yêu cầu file .env (KHÔNG commit vào git):
    FB_APP_ID=xxxxxxxxxx
    FB_APP_SECRET=xxxxxxxxxx
    FB_ACCESS_TOKEN=xxxxxxxxxx      # System User Token hoặc User Access Token
    FB_AD_ACCOUNT_ID=act_xxxxxxxxxx # Bắt buộc có tiền tố "act_"
"""

import os
import json
import logging
from datetime import date, timedelta

import pandas as pd
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.exceptions import FacebookRequestError

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("fb_ads_fetch")


# ---------------------------------------------------------------
# 1. INPUT: Cấu hình & tham số đầu vào
# ---------------------------------------------------------------
load_dotenv()

APP_ID = os.getenv("FB_APP_ID")
APP_SECRET = os.getenv("FB_APP_SECRET")
ACCESS_TOKEN = os.getenv("FB_ACCESS_TOKEN")
AD_ACCOUNT_ID = os.getenv("FB_AD_ACCOUNT_ID")

# Các trường (fields) muốn lấy từ Insights API.
# Đây là input quan trọng nhất — quyết định dữ liệu nào được kéo về.
INSIGHT_FIELDS = [
    "campaign_id",
    "campaign_name",
    "adset_id",
    "adset_name",
    "ad_id",
    "ad_name",
    "impressions",
    "clicks",
    "spend",
    "reach",
    "cpc",          # cost per click
    "cpm",          # cost per 1000 impressions
    "ctr",          # click-through rate
    "actions",      # danh sách hành động (purchase, lead, add_to_cart...)
    "action_values" # giá trị quy đổi của từng action (dùng tính ROAS)
]

# Params điều khiển phạm vi và cách nhóm dữ liệu trả về
def build_params(days_back: int = 7) -> dict:
    """Input: số ngày muốn lấy dữ liệu ngược về trước (mặc định 7 ngày)."""
    end_date = date.today()
    start_date = end_date - timedelta(days=days_back)
    return {
        "level": "ad",  # có thể đổi thành "campaign" hoặc "adset"
        "time_range": {
            "since": start_date.strftime("%Y-%m-%d"),
            "until": end_date.strftime("%Y-%m-%d"),
        },
        "time_increment": 1,  # tách theo từng ngày, phục vụ dashboard real-time
        "limit": 500,
    }


# ---------------------------------------------------------------
# 2. XỬ LÝ: Gọi API, retry khi lỗi, chuẩn hóa dữ liệu
# ---------------------------------------------------------------

def init_facebook_api() -> None:
    """Khởi tạo kết nối tới Facebook Marketing API."""
    if not all([APP_ID, APP_SECRET, ACCESS_TOKEN, AD_ACCOUNT_ID]):
        raise EnvironmentError(
            "Thiếu biến môi trường. Cần FB_APP_ID, FB_APP_SECRET, "
            "FB_ACCESS_TOKEN, FB_AD_ACCOUNT_ID trong file .env"
        )
    FacebookAdsApi.init(APP_ID, APP_SECRET, ACCESS_TOKEN)
    logger.info("Đã khởi tạo kết nối Facebook Marketing API.")


# Retry tự động khi gặp lỗi tạm thời (rate limit, timeout) — đáp ứng NFR04
@retry(
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=2, min=2, max=30),
    retry=retry_if_exception_type(FacebookRequestError),
)
def fetch_raw_insights(days_back: int = 7) -> list:
    """
    Gọi Insights API của tài khoản quảng cáo.
    Trả về: list các dict thô (raw) từ Facebook.
    """
    account = AdAccount(AD_ACCOUNT_ID)
    params = build_params(days_back)

    logger.info(f"Đang lấy dữ liệu từ {params['time_range']['since']} "
                f"đến {params['time_range']['until']}...")

    try:
        insights_cursor = account.get_insights(fields=INSIGHT_FIELDS, params=params)
        raw_data = [dict(item) for item in insights_cursor]
        logger.info(f"Lấy thành công {len(raw_data)} dòng dữ liệu.")
        return raw_data
    except FacebookRequestError as e:
        logger.warning(f"Lỗi gọi API (sẽ retry): {e.api_error_message()}")
        raise


def extract_action_value(actions: list, action_type: str) -> float:
    """Trích giá trị của một loại action cụ thể (vd: 'purchase') từ list actions."""
    if not actions:
        return 0.0
    for a in actions:
        if a.get("action_type") == action_type:
            return float(a.get("value", 0))
    return 0.0


def normalize_insights(raw_data: list) -> pd.DataFrame:
    """
    Chuẩn hóa dữ liệu thô thành DataFrame với schema thống nhất
    dùng chung cho mọi kênh quảng cáo (Facebook / Google / TikTok),
    phục vụ việc gộp dữ liệu đa kênh trong dashboard.
    """
    rows = []
    for item in raw_data:
        spend = float(item.get("spend", 0))
        purchases = extract_action_value(item.get("actions"), "purchase")
        revenue = extract_action_value(item.get("action_values"), "purchase")

        rows.append({
            "platform": "facebook",
            "date": item.get("date_start"),
            "campaign_id": item.get("campaign_id"),
            "campaign_name": item.get("campaign_name"),
            "adset_id": item.get("adset_id"),
            "ad_id": item.get("ad_id"),
            "ad_name": item.get("ad_name"),
            "impressions": int(item.get("impressions", 0)),
            "clicks": int(item.get("clicks", 0)),
            "spend": spend,
            "reach": int(item.get("reach", 0)),
            "ctr": float(item.get("ctr", 0)),
            "cpc": float(item.get("cpc", 0)),
            "cpm": float(item.get("cpm", 0)),
            "conversions": purchases,
            "revenue": revenue,
            # Các chỉ số phái sinh, tính sẵn cho dashboard
            "cpa": round(spend / purchases, 2) if purchases > 0 else None,
            "roas": round(revenue / spend, 2) if spend > 0 else None,
        })

    return pd.DataFrame(rows)


# ---------------------------------------------------------------
# 3. OUTPUT: Xuất dữ liệu ra file / trả về cho module khác
# ---------------------------------------------------------------

def save_output(df: pd.DataFrame, out_dir: str = "output") -> None:
    """Lưu kết quả ra CSV và JSON để module phân tích / dashboard sử dụng."""
    os.makedirs(out_dir, exist_ok=True)
    today_str = date.today().strftime("%Y%m%d")

    csv_path = os.path.join(out_dir, f"fb_ads_insights_{today_str}.csv")
    json_path = os.path.join(out_dir, f"fb_ads_insights_{today_str}.json")

    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    df.to_json(json_path, orient="records", force_ascii=False, indent=2)

    logger.info(f"Đã lưu output: {csv_path}")
    logger.info(f"Đã lưu output: {json_path}")


def run(days_back: int = 7) -> pd.DataFrame:
    """Hàm chính — gọi từ scheduler, API endpoint, hoặc script CLI."""
    init_facebook_api()
    raw_data = fetch_raw_insights(days_back=days_back)
    df = normalize_insights(raw_data)
    save_output(df)
    return df


if __name__ == "__main__":
    result_df = run(days_back=7)
    print(result_df.head())