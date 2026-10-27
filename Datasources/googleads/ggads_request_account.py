import json
import os
from google.ads.googleads.client import GoogleAdsClient
from dotenv import load_dotenv

SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))
load_dotenv(os.path.join(SCRIPT_DIR, "..", "..", ".env"))

with open(os.path.join(SCRIPT_DIR, "client_secret.json")) as f:
    oauth = json.load(f)["web"]  # nếu tạo loại Desktop app thì key là "installed"

config = {
    # "developer_token": os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"],
    "client_id": oauth["client_id"],
    "client_secret": oauth["client_secret"],
    "refresh_token": os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
    "login_customer_id": "6433384358",  # ID MCC, bỏ dòng này nếu không dùng MCC
    "use_proto_plus": True,
}

client = GoogleAdsClient.load_from_dict(config)
print(client)

CUSTOMER_ID = "6433384358"  # ID tài khoản quảng cáo, 10 số, không có dấu gạch

ga_service = client.get_service("GoogleAdsService")
child_query = """
    SELECT customer_client.id,
           customer_client.descriptive_name,
           customer_client.manager,
           customer_client.status
    FROM customer_client
    WHERE customer_client.manager = FALSE
      AND customer_client.status = 'ENABLED'
"""
children = []
for row in ga_service.search(customer_id=CUSTOMER_ID, query=child_query):
    c = row.customer_client
    children.append((str(c.id), c.descriptive_name))
    print("Tài khoản con:", c.id, c.descriptive_name)

# Bước 2: truy vấn metrics trên từng tài khoản con
campaign_query = """
    SELECT campaign.id, campaign.name, campaign.status,
           metrics.impressions, metrics.clicks, metrics.cost_micros
    FROM campaign
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY metrics.impressions DESC
    LIMIT 20
"""
for cid, cname in children:
    print(f"\n=== {cname} ({cid}) ===")
    for row in ga_service.search(customer_id=cid, query=campaign_query):
        print(row.campaign.name,
              row.metrics.impressions,
              row.metrics.clicks,
              row.metrics.cost_micros / 1_000_000)