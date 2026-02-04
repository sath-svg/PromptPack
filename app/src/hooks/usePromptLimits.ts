import { useSyncStore } from '../stores/syncStore';
import { useAuthStore } from '../stores/authStore';
import { getPromptLimit } from '../lib/constants';
import type { UserTier } from '../types';

export interface PromptLimitInfo {
  tier: UserTier;
  currentPromptCount: number;
  maxPrompts: number;
  canAddPrompt: boolean;
  remainingPrompts: number;
  isAtLimit: boolean;
}

export function usePromptLimits(): PromptLimitInfo {
  const { loadedPacks, loadedUserPacks } = useSyncStore();
  const { session } = useAuthStore();

  // Default to 'free' if no session or tier
  const tier = (session?.tier as UserTier) || 'free';
  const maxPrompts = getPromptLimit(tier);

  // Count total prompts across all loaded packs (saved packs + user packs)
  let currentPromptCount = 0;

  // Count prompts in saved packs
  for (const packId of Object.keys(loadedPacks)) {
    currentPromptCount += loadedPacks[packId]?.prompts?.length || 0;
  }

  // Count prompts in user packs
  for (const packId of Object.keys(loadedUserPacks)) {
    currentPromptCount += loadedUserPacks[packId]?.prompts?.length || 0;
  }

  const canAddPrompt = currentPromptCount < maxPrompts;
  const remainingPrompts = Math.max(0, maxPrompts - currentPromptCount);
  const isAtLimit = currentPromptCount >= maxPrompts;

  return {
    tier,
    currentPromptCount,
    maxPrompts,
    canAddPrompt,
    remainingPrompts,
    isAtLimit,
  };
}

export function getPromptLimitMessage(tier: UserTier, currentCount: number): string {
  const limit = getPromptLimit(tier);

  if (currentCount >= limit) {
    if (tier === 'free') {
      return `You've reached the Free plan limit of ${limit} prompts. Upgrade to Pro for up to 40 prompts.`;
    }
    if (tier === 'pro') {
      return `You've reached the Pro plan limit of ${limit} prompts. Upgrade to Studio for up to 200 prompts.`;
    }
    return `You've reached the limit of ${limit} prompts for your plan.`;
  }

  return '';
}

// Utility function to get current prompt count (for use in syncStore)
export function getTotalPromptCount(
  loadedPacks: Record<string, { prompts?: { text: string }[] }>,
  loadedUserPacks: Record<string, { prompts?: { text: string }[] }>
): number {
  let count = 0;

  for (const packId of Object.keys(loadedPacks)) {
    count += loadedPacks[packId]?.prompts?.length || 0;
  }

  for (const packId of Object.keys(loadedUserPacks)) {
    count += loadedUserPacks[packId]?.prompts?.length || 0;
  }

  return count;
}
