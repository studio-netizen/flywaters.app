import { describe, expect, it } from 'vitest';
import { hashAdminToken, verifyAdminSession } from '../../supabase/functions/_shared/admin-session';

function db(data: unknown, error: unknown = null) {
  return { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data, error }) }) }) }) };
}

describe('server-side admin session revocation', () => {
  it('hashes tokens without storing plaintext', async () => {
    expect(await hashAdminToken('test-only-token')).toMatch(/^[a-f0-9]{64}$/);
  });
  it('accepts an active registered session', async () => {
    expect(await verifyAdminSession('test-token', db({ expires_at: new Date(Date.now() + 60000).toISOString(), revoked_at: null }))).toBe(true);
  });
  it('rejects copied tokens after logout', async () => {
    expect(await verifyAdminSession('test-token', db({ expires_at: new Date(Date.now() + 60000).toISOString(), revoked_at: new Date().toISOString() }))).toBe(false);
  });
  it('rejects expired, legacy and unknown sessions or failed lookups', async () => {
    expect(await verifyAdminSession('test-token', db({ expires_at: new Date(0).toISOString(), revoked_at: null }))).toBe(false);
    expect(await verifyAdminSession('legacy-token', db(null))).toBe(false);
    expect(await verifyAdminSession('test-token', db(null, { message: 'unavailable' }))).toBe(false);
  });
});