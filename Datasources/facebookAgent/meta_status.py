import os,sys
import pandas as pd
import requests

# cấu hình ra gốc dự án
CURRENT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(CURRENT, "..", "..")
sys.path.append(ROOT)

def check_facebook_api_status():
    """
    Kiểm tra trạng thái của Facebook API.
    Trả về True nếu API hoạt động bình thường, False nếu có sự cố.
    """
    try:
        response = requests.get("https://graph.facebook.com/v17.0/me?access_token=" + os.getenv("FB_ACCESS_TOKEN"))
        if response.status_code == 200:
            return True
        else:
            return False
    except Exception as e:
        print(f"Error checking Facebook API status: {e}")
        return False

