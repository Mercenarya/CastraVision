import os
import sys

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import requests
from dotenv import load_dotenv

# Cấu hình đường dẫn ra gốc dự án
CURRENT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(CURRENT, "..", ".."))
sys.path.append(ROOT)
load_dotenv(os.path.join(ROOT, ".env"))

def check_tiktok_api_status() -> bool:
    """
    Kiểm tra trạng thái kết nối tới TikTok Business Marketing API.
    Trả về True nếu API xác thực thành công (Token hợp lệ), False nếu có lỗi.
    """
    token = os.getenv("TIKTOK_ACCESS_TOKEN")
    app_id = os.getenv("TIKTOK_APP_ID")
    secret = os.getenv("TIKTOK_APP_SECRET") or os.getenv("TIKTOK_SECRET")

    if not token:
        print("[WARNING] Chưa có TIKTOK_ACCESS_TOKEN trong file .env.")
        return False

    url = "https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/"
    headers = {
        "Access-Token": token.strip(),
        "Content-Type": "application/json"
    }
    params = {}
    if app_id:
        params["app_id"] = app_id
    if secret:
        params["secret"] = secret

    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        if response.status_code == 200:
            res_data = response.json()
            if res_data.get("code") == 0:
                print(f"[SUCCESS] TikTok API hoạt động bình thường: {res_data.get('message', 'OK')}")
                return True
            else:
                print(f"[FAIL] TikTok API trả lời lỗi code {res_data.get('code')}: {res_data.get('message')}")
                return False
        else:
            print(f"[FAIL] HTTP Status: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Lỗi kiểm tra trạng thái TikTok API: {e}")
        return False


if __name__ == "__main__":
    status = check_tiktok_api_status()
    print(f"Trạng thái kết nối TikTok API: {'HỢP LỆ' if status else 'KHÔNG KHẢ DỤNG'}")
