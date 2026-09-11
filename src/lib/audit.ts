import { supabase } from '@/integrations/supabase/client';

export type AuditAction =
  | 'user.registered'
  | 'user.login'
  | 'user.login_failed'
  | 'user.password_reset'
  | 'user.deleted'
  | 'post.created'
  | 'post.deleted'
  | 'spot.created'
  | 'spot.deleted'
  | 'review.created'
  | 'review.deleted';

/**
 * Fire-and-forget audit log writer. Never throws. Never blocks the UI.
 * The edge function resolves the actor from the user's JWT automatically.
 */
export function logAudit(
  action: AuditAction,
  resource_type: string,
  resource_id?: string | null,
  details?: Record<string, unknown>,
  emailOverride?: string,
): void {
  try {
    supabase.functions
      .invoke('audit-log', {
        body: {
          action,
          resource_type,
          resource_id: resource_id ?? undefined,
          details,
          email: emailOverride,
        },
      })
      .catch((err) => console.warn('[audit] log failed:', action, err));
  } catch (err) {
    console.warn('[audit] log threw:', action, err);
  }
}
