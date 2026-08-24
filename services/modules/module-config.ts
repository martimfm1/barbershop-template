import type { FeatureKey } from '@/lib/billing/plan-features';

export const MODULE_FEATURES = {
  crm: 'advanced_crm',
  analytics: 'advanced_analytics',
  reminders: 'automated_reminders',
  followups: 'automated_followups',
  marketing: 'marketing_campaigns',
  segments: 'customer_segments',
  loyalty: 'loyalty',
  reports: 'advanced_reports',
  team: 'team_management',
  notifications: 'advanced_notifications',
  locations: 'multi_location',
  global: 'global_dashboard',
  permissions: 'advanced_permissions',
  commissions: 'commissions',
  inventory: 'inventory',
  pos: 'pos',
  enterpriseReports: 'enterprise_reports',
} as const satisfies Record<string, FeatureKey>;

export type ModuleName = keyof typeof MODULE_FEATURES;

export function getModuleFeature(moduleName: string): FeatureKey | null {
  return MODULE_FEATURES[moduleName as ModuleName] ?? null;
}
