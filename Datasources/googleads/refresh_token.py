from google_auth_oauthlib.flow import InstalledAppFlow
import os, sys

CURRENT = os.getcwd()
ROOT = os.path.join(CURRENT, "..", "..")
sys.path.append(ROOT)

client_secret = os.path.join(CURRENT, "Datasources", "googleads", "client_secret.json")


flow = InstalledAppFlow.from_client_secrets_file(
    client_secret,
    scopes=["https://www.googleapis.com/auth/adwords"],
    redirect_uri="http://localhost:8080/",
)

creds = flow.run_local_server(port=8080, prompt="consent", access_type="offline")
print("Refresh token:", creds.refresh_token)
