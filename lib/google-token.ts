import { cookies } from 'next/headers';
import { refreshToken } from './google-oauth';

// Interactive: return a valid Google access token, refreshing from the stored
// refresh-token cookie if the access token expired. Updates the cookie in place.
export async function getValidGoogleToken(): Promise<string | null> {
  const jar = await cookies();
  const access = jar.get('g_token')?.value;
  if (access) return access;

  const refresh = jar.get('g_refresh')?.value;
  if (!refresh) return null;
  try {
    const t = await refreshToken(refresh);
    jar.set('g_token', t.access_token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: t.expires_in });
    return t.access_token;
  } catch {
    return null;
  }
}

// Cron/server: refresh from a stored refresh token (no cookies available).
export async function accessTokenFromRefresh(refresh: string): Promise<string | null> {
  try {
    const t = await refreshToken(refresh);
    return t.access_token;
  } catch {
    return null;
  }
}
