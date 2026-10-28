import os
from google.ads.googleads.client import GoogleAdsClient
from dotenv import load_dotenv
import json

SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))
load_dotenv(os.path.join(SCRIPT_DIR, "..", "..", ".env"))

with open(os.path.join(SCRIPT_DIR, "client_secret.json")) as f:
    oauth = json.load(f)["web"]  # nếu tạo loại Desktop app thì key là "installed"

config = {
    # "developer_token": os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"],
    "client_id": oauth["client_id"],
    "client_secret": oauth["client_secret"],
    "refresh_token": os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
    # "login_customer_id": "1234567890",  # ID MCC, bỏ dòng này nếu không dùng MCC
    "use_proto_plus": True,
}

client = GoogleAdsClient.load_from_dict(config)
print(client)

CUSTOMER_ID = "1234567890"


customer_service = client.get_service("CustomerService")
accessible = customer_service.list_accessible_customers()
for name in accessible.resource_names:
    print(name)