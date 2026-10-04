import sys
import bcrypt


sys.path.append('/opt/homebrew/lib/python2.7/site-packages') # Replace this with the place you installed facebookads using pip
sys.path.append('/opt/homebrew/lib/python2.7/site-packages/facebook_business-3.0.0-py2.7.egg-info') # same as above
	
from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount

from facebook_business.adobjects.campaign import Campaign


my_app_id = ''
my_app_secret = None
my_access_token = ''
FacebookAdsApi.init(my_app_id, my_app_secret, my_access_token)
my_account = AdAccount('')
campaigns = my_account.get_campaigns()
print(campaigns)

fields = [
    Campaign.Field.id,
    Campaign.Field.name,
    Campaign.Field.status,
    Campaign.Field.objective,
    Campaign.Field.effective_status,
]


# kiểm tra thử dữ liệu fetch từ meta ads managers
def check_campaigns():
    try:
        list_campaigns = []
        campaigns = my_account.get_campaigns(fields=fields)
        print("=== DANH SÁCH CHIẾN DỊCH ===")
        for campaign in campaigns:
            c_id = campaign.get("id")
            c_name = campaign.get("name")
            c_status = campaign.get("status")
            c_objective = campaign.get("objective")
            print(
                f"ID: {c_id} | Tên: {c_name} | Trạng thái: {c_status} | Mục tiêu: {c_objective}"
            )
            list_campaigns.append(
                {
                    "id": c_id,
                    "name": c_name,
                    "status": c_status,
                    "objective": c_objective,
                }
            )
        return list_campaigns
    except Exception as e:
        print(f"Lỗi khi lấy danh sách chiến dịch: {e}")
        
def get_insights(campaign_id, start_date, end_date):
    """
    Lấy dữ liệu Insights cho một chiến dịch cụ thể trong khoảng thời gian nhất định.
    """
    try:
        list_insights = []
        params = {
            'time_range': {'since': start_date, 'until': end_date},
            'fields': 'impressions,clicks,spend,cpc,cpm,ctr',
        }
        insights = my_account.get_insights(params=params)
        print(f"=== DỮ LIỆU INSIGHTS CHO CHIẾN DỊCH {campaign_id} ===")
        for insight in insights:
            print(insight)
            list_insights.append(
                {
                    "impressions": insight.get("impressions"),
                    "clicks": insight.get("clicks"),
                    "spend": insight.get("spend"),
                    "cpc": insight.get("cpc"),
                    "cpm": insight.get("cpm"),
                    "ctr": insight.get("ctr"),
                }
            )
        return list_insights
    except Exception as e:
        print(f"Lỗi khi lấy dữ liệu Insights: {e}")
        
def get_ads():
    try:
        list_ads = []
        ads_result = my_account.get_ads(fields=['id', 'name', 'status'])
        print("=== DANH SÁCH QUẢNG CÁO ===")
        for ad in ads_result:
            print(f"ID: {ad.get('id')} | Tên: {ad.get('name')} | Trạng thái: {ad.get('status')}")
            list_ads.append(
                {
                    "id": ad.get("id"),
                    "name": ad.get("name"),
                    "status": ad.get("status"),
                }
            )
    except Exception as e:
        print(f"Lỗi khi lấy danh sách quảng cáo: {e}")
 
 
                
if __name__ == "__main__":
    result_id = check_campaigns()
    print(f"ID chiến dịch đầu tiên: {result_id}")
    insights_start_date = '2024-01-01'
    insights_end_date = '2024-01-07'
    get_insights(result_id, insights_start_date, insights_end_date)
    get_ads()
    
    # Ví dụ: Lấy dữ liệu Insights cho chiến dịch đầu tiên trong khoảng thời gian 7 ngày gần đây
    # get_insights(campaign_id='YOUR_CAMPAIGN_ID', start_date='2024-01-01', end_date='2024-01-07')