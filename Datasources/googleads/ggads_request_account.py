from google.ads.googleads.client import GoogleAdsClient, GoogleAdsServiceClient
import os,sys

CURRENT = os.getcwd()
ROOT = os.path.join(CURRENT,"..")
sys.path.append(ROOT)

client = GoogleAdsClient.load_from_storage()




def get_authorization_gg_ads():
    pass

def dashboard(client: GoogleAdsClient, customer_id: str) -> None:
    ga_service: GoogleAdsServiceClient = client.get_service("GoogleAdsService")

    query: str = """
        SELECT
          campaign.id,
          campaign.name
        FROM campaign
        ORDER BY campaign.id"""

    # Issues a search request using streaming.
    # stream: Iterator[SearchGoogleAdsStreamResponse] = ga_service.search_stream(
    #     customer_id=customer_id, query=query
    # )

    # for batch in stream:
    #     rows: List[GoogleAdsRow] = batch.results
    #     for row in rows:
    #         print(
    #             f"Campaign with ID {row.campaign.id} and name "
    #             f'"{row.campaign.name}" was found.'
    #         )
