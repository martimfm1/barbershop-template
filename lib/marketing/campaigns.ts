export const MARKETING_CHANNELS = ['email', 'sms'] as const;
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];

export const CAMPAIGN_STATUSES = [
  'draft',
  'scheduled',
  'sending',
  'completed',
  'cancelled',
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const MARKETING_PLAN = 'pro' as const;

export function isMarketingChannel(value: unknown): value is MarketingChannel {
  return (
    typeof value === 'string' &&
    (MARKETING_CHANNELS as readonly string[]).includes(value)
  );
}

export function isCampaignStatus(value: unknown): value is CampaignStatus {
  return (
    typeof value === 'string' &&
    (CAMPAIGN_STATUSES as readonly string[]).includes(value)
  );
}

export const DEFAULT_MARKETING_QUOTAS = {
  monthlyCampaigns: 10,
  maxRecipientsPerCampaign: 5000,
} as const;
