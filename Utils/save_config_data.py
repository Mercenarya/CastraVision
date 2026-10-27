import os,sys
from dotenv import load_dotenv,set_key
from pathlib import Path

# cấu hình đường dẫn, biến môi trường
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))
load_dotenv(os.path.join(SCRIPT_DIR, "..", ".env"))


# lưu thông tin cấu hình vào env
def save_env(key:str,data:str,filename=".env"):
    '''lưu thông tin cấu hình : key là biến - data
    thông tin cần lưu cho biến đó'''
    try:
        load_dotenv(filename)
        try:
            set_key(filename, key, data, quote_mode="always")
            if key in os.environ:
                result = os.getenv(f"{key}","")
                if result == data:
                    return {
                        "message": f"{key} has been updated.",
                        "data":os.environ[key]
                    }
                else:
                    return {
                        "message": f"{key} hasn't updated before.",
                        "data":None
                    }
        except Exception as internal_errors:
            return {
                "message": f"{internal_errors}",
                "data":None
            }
        
    except Exception as error:
        return {
            "message":str(error)
        }
        
if __name__ == "__main__":
    result = save_env("LOGIN_CUSTOMER_ID","12345678")
    print(result['message'])
    print(result['data'])