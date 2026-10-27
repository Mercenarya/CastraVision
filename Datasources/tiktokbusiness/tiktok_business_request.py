from tiktok.business.oauth2 import OAuth2
from tiktok.business.client import TikTokBusinessClient


access_token = OAuth2.get_access_token(
    app_id='YOUR_APP_ID',
    secret='YOUR_APP_SECRET',
    auth_code='AUTH_CODE FROM CALLBACK',
    write_to_file=True,
    file_path="access_token.json"
)


client_file = TikTokBusinessClient.from_json_file(
    json_file_path="/path/to/file",
    sandbox=True
)

client_api = TikTokBusinessClient(
    access_token='YOUR_ACCESS_TOKEN',
    advertiser_id='AD_ADVERTISER_ID'
)

client_api_sandbox = TikTokBusinessClient(
    access_token='SANDBOX_ACCESS_TOKEN',
    advertiser_id='SANDBOX_ADVERTISER_ID',
    sandbox=True
)


def get_campaigns(params):
    client_api_sandbox.campaign.get_campaigns(params)
