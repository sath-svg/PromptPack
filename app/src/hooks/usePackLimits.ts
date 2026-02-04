import { useSyncStore } from '../stores/syncStore';
import { useAuthStore } from '../stores/authStore';
import { getCustomPackLimit } from '../lib/constants';
import type { UserTier } from '../types';

export interface PackLimitInfo {
  tier: UserTier;
  currentUserPackCount: number;
  maxCustomPacks: number;
  canCreatePack: boolean;
  remainingPacks: number;
  isAtLimit: boolean;
}

export function usePackLimits(): PackLimitInfo {
  const { userPacks } = useSyncStore();
  const { session } = useAuthStore();

  // Default to 'free' if no session or tier
  const tier = (session?.tier as UserTier) || 'free';
  const maxCustomPacks = getCustomPackLimit(tier);
  const currentUserPackCount = userPacks.length;

  const canCreatePack = maxCustomPacks === -1 || currentUserPackCount < maxCustomPacks;
  const remainingPacks = maxCustomPacks === -1 ? Infinity : Math.max(0, maxCustomPacks - currentUserPackCount);
  const isAtLimit = maxCustomPacks !== -1 && currentUserPackCount >= maxCustomPacks;

  return {
    tier,
    currentUserPackCount,
    maxCustomPacks,
    canCreatePack,
    remainingPacks,
    isAtLimit,
  };
}

export function getPackLimitMessage(tier: UserTier, currentCount: number): string {
  const limit = getCustomPackLimit(tier);

  if (limit === 0) {
    return 'Free plan cannot create custom prompt packs. Upgrade to Pro or Studio to create your own packs.';
  }

  if (currentCount >= limit) {
    if (tier === 'pro') {
      return `You've reached the Pro plan limit of ${limit} custom packs. Upgrade to Studio for up to 14 custom packs.`;
    }
    return `You've reached the limit of ${limit} custom packs for your plan.`;
  }

  return '';
}
