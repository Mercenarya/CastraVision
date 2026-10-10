import sys
import bcrypt


sys.path.append('/opt/homebrew/lib/python2.7/site-packages') # Replace this with the place you installed facebookads using pip
sys.path.append('/opt/homebrew/lib/python2.7/site-packages/facebook_business-3.0.0-py2.7.egg-info') # same as above
	
from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.adobjects.ad import Ad
from facebook_business.adobjects.adcreative import AdCreative
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
        return list_ads
    except Exception as e:
        print(f"Lỗi khi lấy danh sách quảng cáo: {e}")
 
def get_ads_content():
    try:
        list_ads_content = []
        ads_content = my_account.get_ads(
            fields=[
                Ad.Field.id,
                Ad.Field.name,
                Ad.Field.status,
                Ad.Field.creative
            ]
        )
        for content in ads_content:
            ads_id = content.get("id")
            ad_name = content.get("name")
            ads_creative_info = content.get("creative",{})
            ads_creative_id = ads_creative_info.get("id")
            print(f"Ads: {ad_name} - {ads_id}")
            if ads_creative_id:
                creative = AdCreative(ads_creative_id)
                creative.api_get(
                    fields=[
                        AdCreative.Field.name,
                        AdCreative.Field.body,          # Text chính (caption) của quảng cáo
                        AdCreative.Field.title,         # Tiêu đề (Headline)
                        AdCreative.Field.image_url,     # Link hình ảnh quảng cáo
                        AdCreative.Field.video_id,      # ID video (nếu là dạng video)
                        AdCreative.Field.object_story_spec, # Dữ liệu bài viết gốc trên Page
                    ]
                )
            body_text = creative.get('body', 'Không có body text trực tiếp')
            title_text = creative.get('title', 'Không có title trực tiếp')
            image_url = creative.get('image_url', 'Không có ảnh tĩnh trực tiếp')
            
            print(f"  + Tiêu đề (Title): {title_text}")
            print(f"  + Nội dung (Body): {body_text}")
            print(f"  + Hình ảnh URL: {image_url}")
            
            # Trường hợp quảng cáo dùng bài viết có sẵn trên Page (Page Post)
            # Nội dung đôi khi nằm sâu bên trong object_story_spec
            story_spec = creative.get('object_story_spec')
            if story_spec:
                link_data = story_spec.get('link_data', {})
                page_message = link_data.get('message') # Message của bài post gốc
                if page_message:
                    print(f"  + Message bài gốc (Page Post): {page_message}")
            list_ads_content.append(
                {
                    "ad_id": ads_id,
                    "ad_name": ad_name,
                    "images": image_url,
                    "ad_title": title_text,
                    "ad_content": body_text
                }
            )
            
            return list_ads_content
    except Exception as error:
        print(f'Lỗi xảy ra khi lấy dữ liệu nội dung : ',error)
                
if __name__ == "__main__":
    result_id = check_campaigns()
    print(f"ID chiến dịch đầu tiên: {result_id}")
    insights_start_date = '2026-01-01'
    insights_end_date = '2026-01-07'
    # print(get_insights(result_id, insights_start_date, insights_end_date))
    # print(get_ads())
    print("=="*100)
    print(get_ads_content())
    # Ví dụ: Lấy dữ liệu Insights cho chiến dịch đầu tiên trong khoảng thời gian 7 ngày gần đây
    # get_insights(campaign_id='YOUR_CAMPAIGN_ID', start_date='2024-01-01', end_date='2024-01-07')