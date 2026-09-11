import { supabase } from '@/integrations/supabase/client';

export type BadgeKey = 'explorer' | 'sentinel';

export interface UserBadges {
  explorer: boolean;
  sentinel: boolean;
  spotsCount: number;
  approvedReportsCount: number;
}

export const BADGE_META: Record<BadgeKey, { emoji: string; labelKey: string }> = {
  explorer: { emoji: '🧭', labelKey: 'badges.explorer' },
  sentinel: { emoji: '🛡️', labelKey: 'badges.sentinel' },
};

export async function fetchUserBadges(userId: string): Promise<UserBadges> {
  const [spotsRes, reportsRes] = await Promise.all([
    supabase.from('spots').select('id', { count: 'exact', head: true }).eq('created_by', userId),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'approved'),
  ]);
  const spotsCount = spotsRes.count || 0;
  const approvedReportsCount = reportsRes.count || 0;
  return {
    spotsCount,
    approvedReportsCount,
    explorer: spotsCount >= 5,
    sentinel: approvedReportsCount >= 1,
  };
}
