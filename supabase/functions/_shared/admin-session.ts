/** Tokens are never stored in plaintext; legacy stateless tokens fail closed. */
export async function hashAdminToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyAdminSession(token: string, db: any): Promise<boolean> {
  try {
    const { data, error } = await db.from("admin_sessions")
      .select("expires_at, revoked_at")
      .eq("token_hash", await hashAdminToken(token))
      .maybeSingle();
    return !error && !!data && data.revoked_at === null &&
      Date.parse(data.expires_at) > Date.now();
  } catch {
    return false;
  }
}