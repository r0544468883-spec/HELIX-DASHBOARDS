import type { MetricPoint, ConnectorConfig } from './types';
import { fetchGa4Metrics } from './ga4';
import { fetchMetaMetrics } from './meta';
import { fetchStripeMetrics } from './stripe';
import { fetchShopifyMetrics } from './shopify';
import { fetchPlausibleMetrics } from './plausible';
import { fetchMailchimpMetrics } from './mailchimp';
import { accessTokenFromRefresh } from '@/lib/google-token';
import { decryptConfig } from '@/lib/secrets';

// Run a connector by provider from its stored config. Returns [] (never throws)
// when the config is incomplete, so a cron pass over many connections is resilient.
export async function runConnector(provider: string, storedConfig: ConnectorConfig, days = 30): Promise<MetricPoint[]> {
  const config = decryptConfig(storedConfig); // secrets are encrypted at rest
  try {
    if (provider === 'ga4') {
      if (!config.refresh_token || !config.propertyId) return [];
      const token = await accessTokenFromRefresh(config.refresh_token);
      if (!token) return [];
      return fetchGa4Metrics(token, config.propertyId, days);
    }
    if (provider === 'meta_ads') {
      if (!config.access_token || !config.ad_account_id) return [];
      return fetchMetaMetrics(config.access_token, config.ad_account_id, days);
    }
    if (provider === 'stripe') {
      if (!config.secret_key) return [];
      return fetchStripeMetrics(config.secret_key, days);
    }
    if (provider === 'shopify') {
      if (!config.shop || !config.access_token) return [];
      return fetchShopifyMetrics(config.shop, config.access_token, days);
    }
    if (provider === 'plausible') {
      if (!config.site_id || !config.api_key) return [];
      return fetchPlausibleMetrics(config.site_id, config.api_key, config.base_url || undefined, days);
    }
    if (provider === 'mailchimp') {
      if (!config.api_key) return [];
      return fetchMailchimpMetrics(config.api_key);
    }
  } catch {
    return [];
  }
  return [];
}

export const LIVE_PROVIDERS = ['ga4', 'meta_ads', 'stripe', 'shopify', 'plausible', 'mailchimp'] as const;
