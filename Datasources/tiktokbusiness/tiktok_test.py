"""
TikTok Business Ads Testing & Inspection Script
==============================================
Kiểm tra danh sách chiến dịch, nhóm quảng cáo và mẫu báo cáo từ TikTok Ads.
Tương tự meta_test.py của Facebook Ads.
"""

import os
import sys

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import json
import requests
from dotenv import load_dotenv

CURRENT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(CURRENT, "..", ".."))
sys.path.append(ROOT)
load_dotenv(os.path.join(ROOT, ".env"))

ACCESS_TOKEN = os.getenv("TIKTOK_ACCESS_TOKEN")
ADVERTISER_ID = os.getenv("TIKTOK_ADVERTISER_ID") or os.getenv("TIKTOK_AD_ACCOUNT_ID")
BASE_URL = "https://business-api.tiktok.com/open_api/v1.3"


def get_headers():
    return {
        "Access-Token": str(ACCESS_TOKEN).strip() if ACCESS_TOKEN else "",
        "Content-Type": "application/json"
    }


def check_campaigns():
    """Lấy danh sách các chiến dịch từ TikTok Ads."""
    if not ACCESS_TOKEN or not ADVERTISER_ID:
        print("[ERROR] Cần cấu hình TIKTOK_ACCESS_TOKEN và TIKTOK_ADVERTISER_ID trong .env")
        return []

    url = f"{BASE_URL}/campaign/get/"
    params = {
        "advertiser_id": ADVERTISER_ID,
        "page_size": 20
    }

    try:
        response = requests.get(url, headers=get_headers(), params=params, timeout=15)
        res_data = response.json()
        if res_data.get("code") == 0:
            campaigns = res_data.get("data", {}).get("list", [])
            print("=== DANH SÁCH CHIẾN DỊCH TIKTOK ===")
            for c in campaigns:
                c_id = c.get("campaign_id")
                c_name = c.get("campaign_name")
                c_status = c.get("operation_status")
                c_objective = c.get("objective_type")
                print(f"ID: {c_id} | Tên: {c_name} | Trạng thái: {c_status} | Mục tiêu: {c_objective}")
            return campaigns
        else:
            print(f"[FAIL] Lỗi lấy danh sách chiến dịch: {res_data.get('message')}")
            return []
    except Exception as e:
        print(f"[ERROR] Ngoại lệ khi gọi TikTok Campaign API: {e}")
        return []


def check_adgroups():
    """Lấy danh sách các nhóm quảng cáo (AdGroups) từ TikTok Ads."""
    if not ACCESS_TOKEN or not ADVERTISER_ID:
        return []

    url = f"{BASE_URL}/adgroup/get/"
    params = {
        "advertiser_id": ADVERTISER_ID,
        "page_size": 20
    }

    try:
        response = requests.get(url, headers=get_headers(), params=params, timeout=15)
        res_data = response.json()
        if res_data.get("code") == 0:
            adgroups = res_data.get("data", {}).get("list", [])
            print("=== DANH SÁCH NHÓM QUẢNG CÁO TIKTOK ===")
            for ag in adgroups:
                print(f"ID: {ag.get('adgroup_id')} | Tên: {ag.get('adgroup_name')} | Chiến dịch: {ag.get('campaign_id')}")
            return adgroups
        else:
            print(f"[FAIL] Lỗi lấy AdGroups: {res_data.get('message')}")
            return []
    except Exception as e:
        print(f"[ERROR] Ngoại lệ khi lấy AdGroups: {e}")
        return []


if __name__ == "__main__":
    print(f"--- Kiểm tra kết nối TikTok Marketing API (Advertiser: {ADVERTISER_ID}) ---")
    camps = check_campaigns()
    if camps:
        check_adgroups()
