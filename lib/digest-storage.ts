import { createAdmin } from './supabase/admin';

const BUCKET = 'digest-figures';
let ensured = false;

// Upload a rendered figure PNG to a public bucket and return its public URL.
// Service-role; safe on the server only. Returns null on any failure so a
// delivery still goes out as text.
export async function uploadDigestFigure(png: Buffer, name: string): Promise<string | null> {
  try {
    const admin = createAdmin();
    if (!ensured) {
      // Idempotent: createBucket errors if it exists — we ignore that.
      await admin.storage.createBucket(BUCKET, { public: true }).catch(() => {});
      ensured = true;
    }
    const path = `${name}-${crypto.randomUUID()}.png`;
    const { error } = await admin.storage.from(BUCKET).upload(path, png, {
      contentType: 'image/png',
      upsert: true,
    });
    if (error) return null;
    return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}
