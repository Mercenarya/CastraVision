export const memberDashboardPreview = {
  label: 'Preview data · not account activity',
  metrics: [
    { title: 'My Assigned Tasks', value: '8', unit: 'Total', note: '5 active in sprint', badge: '3 Due Today', progress: 62, footer: '62%', tone: 'violet', icon: '▦' },
    { title: 'Tasks Completed', value: '14', unit: 'Done', note: '93% on-time pace', badge: '+4 this week', progress: 93, footer: 'Sprint pace', tone: 'cyan', icon: '✓' },
    { title: 'Pending Submissions', value: '2', unit: 'Items', note: 'Awaiting Marcus Vance review', badge: 'In Review', progress: 40, footer: '', tone: 'blue', icon: '◷' },
    { title: 'Revisions Req.', value: '1', unit: 'Item', note: 'TikTok Hook Variant B', badge: 'Action Req', progress: 100, footer: '', tone: 'rose', icon: '↻' },
    { title: 'Sprint Deadline', value: '2', unit: 'Days left', note: 'Friday, Oct 26, 17:00 UTC', badge: 'Sprint End', progress: 75, footer: '', tone: 'amber', icon: '◷' },
  ],
  tasks: [
    { title: 'Revise TikTok Hook Copy for Gen Z UGC #3', priority: 'High', status: 'Revision Required', due: 'Today, 15:00', campaign: 'Summer Streetwear Launch 2025', context: 'Leader: Marcus Vance' },
    { title: 'Draft 3 Variations of Instagram Reels Ad Captions', priority: 'Medium', status: 'In Progress', due: 'Today, 18:00', campaign: 'Summer Streetwear Launch 2025', context: 'Meta Placement Specs' },
    { title: 'Generate Headline A/B Options for Google Search Ad', priority: 'Medium', status: 'To Do', due: 'Tomorrow, 12:00', campaign: "Men's Athletic Shoes P-Max", context: 'Max 30 characters each' },
    { title: 'Submit Final Hashtag Cluster & Creator Guidelines', priority: 'Low', status: 'To Do', due: 'Oct 26', campaign: 'Summer Streetwear Launch 2025', context: 'Micro-influencer kit' },
    { title: 'Review Audience Persona Brief: Gen Z Urban Runners', priority: 'Low', status: 'In Progress', due: 'Oct 27', campaign: 'Q4 Winter Activewear', context: 'Audience Intel Hub' },
  ],
  submissions: [
    { title: 'TikTok Video Hook Script v1.2', campaign: 'Summer Streetwear', submitted: 'Oct 24, 09:30', status: 'Changes Requested', reviewer: 'Marcus Vance: “Tone down urgency in Hook B”' },
    { title: 'Instagram Carousel Ad Copy v1.0', campaign: 'Summer Streetwear', submitted: 'Oct 23, 14:15', status: 'Pending Review', reviewer: 'Marcus Vance (Leader)' },
    { title: 'Google Search Headlines v2.0', campaign: "Men's Athletic Shoes", submitted: 'Oct 22, 11:00', status: 'Approved', reviewer: 'Marcus Vance (Leader)' },
    { title: 'Email Teaser: Early Drop', campaign: 'Summer Streetwear', submitted: 'Oct 21, 16:45', status: 'Approved', reviewer: 'Marcus Vance (Leader)' },
  ],
  campaigns: [
    { name: 'Summer Streetwear Launch 2025', channels: 'Meta & TikTok Ads', objective: 'Brand Conversions', progress: '2 / 4 tasks', tone: 'violet' },
    { name: 'Men’s Athletic Shoes P-Max', channels: 'Google Search & P-Max', objective: 'High-Intent Sales', progress: '1 / 2 tasks', tone: 'cyan' },
  ],
  studio: [
    { title: 'Social Media Post', detail: 'Generate Instagram & TikTok captions with tested hashtags.', icon: '↗' },
    { title: 'Ad Copy Generator', detail: 'Produce punchy headlines and primary text variants for P-Max.', icon: '▣' },
    { title: 'Campaign Caption & Hook', detail: 'Ideate 5 opening 3-second hooks for short-form video UGC.', icon: '▷' },
  ],
  assistant: [
    { title: 'Tone Guideline Check', detail: 'The Summer 2025 voice emphasizes effortless street confidence without overt discount jargon. Consider replacing “Buy Now 50% Off” with “Explore the Drop”.' },
    { title: 'Pre-Submission Checklist', detail: 'Remember to verify character counts (Headlines < 90 chars, Descriptions < 280 chars) before submitting to Leader Marcus Vance.' },
  ],
  sprint: { name: 'Squad Alpha #42', complete: '14 / 16', pace: '87.5%', target: 'Personal Target: 16 tasks', note: 'Pacing 1.4 days ahead of scheduled review milestone. Keep it up!', progress: 87.5 },
}
