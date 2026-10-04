import { CategoryQuestions } from '../types/question';
import { advancedCategory } from './entitlement';

import { extrasFor, extrasStatus } from './extras';
export type Tier = 'standard' | 'advanced';

// Advanced questions live in a parallel data tree so the standard bank is never
// touched. Cache is keyed by tier so switching tiers can't cross-contaminate.
const cache = new Map<string, CategoryQuestions>();

function dir(tier: Tier): string {
  return tier === 'advanced' ? 'questions-advanced' : 'questions';
}

export async function loadCategoryQuestions(
  categoryId: string,
  tier: Tier = 'standard',
): Promise<CategoryQuestions> {
  // Advanced comes from the Pro-gated entitlement payload (already fetched when
  // the tier was activated), not from a file in this public repo.
  if (tier === 'advanced') {
    return advancedCategory(categoryId);
  }
  // The public file holds the core questions; a signed-in visitor's extras are
  // appended from activetransport.app. Keyed on the extras status too, so a
  // category loaded before sign-in is refetched with its extras afterwards.
  const withExtras = extrasStatus() === 'ok';
  const key = `${tier}:${categoryId}:${withExtras ? 'x' : ''}`;
  if (cache.has(key)) {
    return cache.get(key)!;
  }
  const resp = await fetch(`${import.meta.env.BASE_URL}data/${dir(tier)}/${categoryId}.json`);
  if (!resp.ok) throw new Error(`Failed to load ${tier} questions for ${categoryId}`);
  const data: CategoryQuestions = await resp.json();
  if (withExtras) {
    const extra = await extrasFor(categoryId);
    if (extra.length) data.questions = data.questions.concat(extra);
  }
  cache.set(key, data);
  return data;
}

export async function loadMultipleCategories(
  categoryIds: string[],
  tier: Tier = 'standard',
): Promise<CategoryQuestions[]> {
  return Promise.all(categoryIds.map(id => loadCategoryQuestions(id, tier)));
}

export function clearCache(): void {
  cache.clear();
}
