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
key = Fernet.generate_key()


print("Đường dẫn:",ENV )
print("File tồn tại:", os.path.exists(ENV))
print("Key đọc được:", list(dotenv_values(ENV).keys()))
print("load_dotenv:", load_dotenv(ENV, override=True, encoding="utf-8-sig"))
print("Có biến:", "GOOGLE_ADS_REFRESH_TOKEN" in os.environ)

encoder = Fernet(key)

load_dotenv(os.path.join(ROOT, ".env"))


from Datasources.googleads.ggads_request_account import children
from Datasources.facebookAgent.meta_request import run
# xuất các module chính
# from Datasources.facebookAgent import meta_request
# from Datasources.googleads import customer_checker, refresh_token, ggads_request_account


# from Utils.data_pipline import auto_generate_tasks, set_functions_pipeline

# lớp báo cáo dữ liệu meta user
class Metareports:
    def __init__(self,app_id,app_secret,access_token,account_id):
        self.__app_id = app_id
        self.__app_secret = app_secret
        self.__access_token = access_token
        self.__account_id = account_id

    def encode_frames(self):
        self.data_graphs = {
            "identity_facebook":{
                "app_id":self.__app_id,
                "app_secret":self.__app_secret,
                "access_token":self.__access_token,
                "account_id":self.__account_id
            }
        }
        
        return encoder.encrypt(json.dumps(self.data_graphs).encode("utf-8")).decode("utf-8")

# lớp báo cáo dữ liệu ggads user
class Ggadsreports:
    def __init__(self,client_id,client_secret,rf_token,customer_id,proto_plus):
        self.__client_id = client_id
        self.__client_secret = client_secret
        self.__rf_token = rf_token
        self.__customer_id = customer_id
        self.__proto_plus = proto_plus

    def encode_frames(self):
        self.data_graphs = {
            "identity_google_ads":{
               "client_id":self.__client_id,
               "client_secret":self.__client_secret,
               "refresh_token":self.__rf_token,
               "customer_id":self.__customer_id,
               "use_proto_plus":self.__proto_plus
            }
        }
        
        return encoder.encrypt(json.dumps(self.data_graphs).encode("utf-8")).decode("utf-8")
# lưu cấu hình để chạy các dữ liệu chính của hệ thống
def save_config(filename:str,access_system_data):
    '''Lưu cấu hình vào config / users-access, khi hệ thống cần đến, 
    Các cấu hình trước đó đã lưu sẵn sẽ được mã hoá và lưu vào config json'''
    try:
        if not os.path.exists(filename):
            return {
                "message":f"{filename} is not exits yet."
            }
            
        # if not isinstance(access_system_data,dict):
        #     return {
        #         "message":f"access data configuration must be dictionary."
        #     }
            
        with open(filename,"w",encoding='utf-8') as file:
            
            json.dump(
                {"system-flows": 
                    access_system_data
                }, file,indent=2)
        
        return {
            "message":f"user access configuration has been saved."
        }
        
    except Exception as error:
        return {
            "message":str(error)
        }


if __name__ == "__main__":
    with open(os.path.join(ROOT,"Datasources","googleads", "client_secret.json")) as f:
        oauth = json.load(f)["web"]  # nếu tạo loại Desktop app thì key là "installed"

    # Mẫu cấu hình dữ liệu gg ads 
    gg_ads_config = {
        # "developer_token": os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"],
        "client_id": oauth["client_id"],
        "client_secret": oauth["client_secret"],
        "refresh_token": os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
        "login_customer_id": "6433384358",  # ID MCC, bỏ dòng này nếu không dùng MCC
        "use_proto_plus": True,
    }
    
    # Mẫu cấu hình dữ liệu meta ads 
    APP_ID = os.getenv("FB_APP_ID")
    APP_SECRET = os.getenv("FB_APP_SECRET")
    ACCESS_TOKEN = os.getenv("FB_ACCESS_TOKEN")
    AD_ACCOUNT_ID = os.getenv("FB_AD_ACCOUNT_ID")
    
    # khởi tạo đối tượng
    meta_ads = Metareports(
        APP_ID,APP_SECRET,ACCESS_TOKEN,AD_ACCOUNT_ID
    )
    
    gg_ads = Ggadsreports(
        gg_ads_config['client_id'],
        gg_ads_config['client_secret'],
        gg_ads_config['refresh_token'],
        gg_ads_config['login_customer_id'],
        gg_ads_config['use_proto_plus']
    )
    
    result_meta_ads = encoder.decrypt(meta_ads.encode_frames().encode("utf-8")).decode('utf-8')
    result_gg_ads = encoder.decrypt(gg_ads.encode_frames().encode("utf-8")).decode('utf-8')
    
    print("META ADS FRAME: ")
    print(result_meta_ads)
    
    print("GG ADS FRAME: ")
    print(result_gg_ads)    
        
    frame_result = {
        # "data-flows":{
            "meta_ads": result_meta_ads,
            "google_ads": result_gg_ads,
        # }
    }
    
    saved_config = save_config(CONFIG,frame_result)
    print(saved_config['message'])