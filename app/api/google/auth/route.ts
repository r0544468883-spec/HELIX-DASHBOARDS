import { NextResponse } from 'next/server';
import { buildAuthUrl } from '@/lib/google-oauth';

// Kicks off Google OAuth (Analytics read-only) for the GA4 connector.
export async function GET() {
  return NextResponse.redirect(buildAuthUrl('ga4'));
}
