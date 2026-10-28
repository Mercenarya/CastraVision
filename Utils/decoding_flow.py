import os,sys
from cryptography.fernet import Fernet
from dotenv import load_dotenv,dotenv_values
import json

# cấu hình khoá mã hoá, đường dẫn modules
CURRENT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(CURRENT,"..")
sys.path.append(ROOT)
print(ROOT)

CONFIG = os.path.join(ROOT,"config","users_access.json")
ENV = os.path.join(ROOT,".env")

load_dotenv(ENV)

token_key = os.getenv('CRYPTOGRAPHY_KEY')

decoder = Fernet(token_key.encode("utf-8"))


def decoding_flows(filename:str,):
    try:
        if not os.path.exists(filename):
            return {
                "message":f"{filename} is not exists.",
                "data":None
            }
         # Đọc chuỗi JSON từ file
        with open(filename, "r", encoding="utf-8") as file:
            encrypted_data = json.load(file)

        # Giải mã dữ liệu
        result = decoder.decrypt(
            encrypted_data.encode("utf-8")
        )

        # Chuyển dữ liệu JSON sau giải mã thành Python object
        data = json.loads(result.decode("utf-8"))
        return {
            "message":"Decoding data successfully.",
            "data":data
        }
    except Exception as error:
        return {
            "message":str(error),
            "data":None
        }
if __name__ == "__main__":
    result = decoding_flows(CONFIG)
    print(result['message'])
    print(result['data'])