// Meta token handling. Short-lived user tokens (~1h) can be exchanged for a
// long-lived token (~60 days) via the app credentials. Shopify Admin API tokens
// don't expire, so no refresh is needed there.
export async function maybeExchangeMetaLongLived(token: string): Promise<string> {
  const appId = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  if (!appId || !appSecret) return token; // no app creds → keep the token as-is

  try {
    const url = new URL('https://graph.facebook.com/v20.0/oauth/access_token');
    url.searchParams.set('grant_type', 'fb_exchange_token');
    url.searchParams.set('client_id', appId);
    url.searchParams.set('client_secret', appSecret);
    url.searchParams.set('fb_exchange_token', token);
    const res = await fetch(url.toString());
    if (!res.ok) return token;
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? token;
  } catch {
    return token;
  }
}
