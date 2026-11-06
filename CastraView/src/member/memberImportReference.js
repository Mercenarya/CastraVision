export const importValidationReference = {
  isExample: true,
  label: 'Illustrative validation example · not a staged file',
  filename: 'Q3_SneakerX_Performance_Metrics_v2.csv',
  size: '3.4 MB',
  rowCount: 1420,
  errorCount: 0,
  mappings: [
    ['spend_usd', 'ad_spend'],
    ['user_clicks', 'clicks'],
    ['conversion_vol', 'conversions'],
    ['target_demographic', 'demographic_age'],
  ],
}

export const importHistoryReference = [
  { filename: 'Q3_SneakerX_Performance_Metrics_v2.csv', source: 'Meta Ads Marketing API', rows: 1420, campaign: 'Summer Campaign 2025', importedBy: 'Alex Rivera', date: 'Today · example', status: 'Ready for Strategy', isExample: true },
  { filename: 'TikTok_Conversions_Sprint_July.json', source: 'TikTok Ads Pixel Payload', rows: 850, campaign: 'Summer Campaign 2025', importedBy: 'Alex Rivera', date: 'Yesterday · example', status: 'Ingested · example', isExample: true },
  { filename: 'Google_Search_Keyword_CTR_Batch4.xlsx', source: 'Google Ads Automation', rows: 3410, campaign: "Men's Athletic Shoes", importedBy: 'Marcus Vance', date: 'Jul 18 · example', status: 'Ingested · example', isExample: true },
  { filename: 'Influencer_UTM_Cohort_Spring_Rebound.csv', source: 'Multitouch Ingestion', rows: 620, campaign: 'SneakerX Streetwear', importedBy: 'Elena Rostova', date: 'Jul 15 · example', status: 'Ready for Strategy · example', isExample: true },
]
