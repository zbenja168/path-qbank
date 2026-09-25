import { useState, useEffect, useCallback } from 'react';
import { TopicsIndex, Category, Topic } from '../types/topic';
import { Tier } from '../utils/questionLoader';
import { loadEntitlement, advancedTopics, EntitlementStatus } from '../utils/entitlement';

/** Topic ids to leave out of bulk selection — the completed ones. Set by App
 *  once the per-topic counts are known; empty until then, which just means
 *  Select All behaves as it always did. */
let completedTopicIds: Set<string> = new Set();
export function setCompletedTopicIds(ids: Set<string>) { completedTopicIds = ids; }

export function useTopics(tier: Tier = 'standard') {
  const [topics, setTopics] = useState<TopicsIndex | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
  /** Topics whose extension questions are folded in. Everything else serves
   *  just the core 12, which is the point of the split. */
  const [extrasTopicIds, setExtrasTopicIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [entitlement, setEntitlement] = useState<EntitlementStatus | null>(null);
  const [entitlementReason, setEntitlementReason] = useState<string | undefined>();

  useEffect(() => {
    setLoading(true);
    setSelectedTopicIds(new Set());
    // The two tiers are separate banks with their own counts, so an extras
    // opt-in made in one must not carry over into the other.
    setExtrasTopicIds(new Set());
    if (tier === 'advanced') {
      let cancelled = false;
      setEntitlement(null);
      loadEntitlement().then(res => {
        if (cancelled) return;
        setEntitlement(res.status);
        setEntitlementReason(res.reason);
        setTopics(res.status === 'ok' ? advancedTopics() : null);
        setLoading(false);
      });
      return () => { cancelled = true; };
    }
    setEntitlement(null);
    fetch(`${import.meta.env.BASE_URL}data/topics.json`)
      .then(r => r.json())
      .then((data: TopicsIndex) => {
        setTopics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tier]);

  const toggleTopic = useCallback((topicId: string) => {
    setSelectedTopicIds(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }, []);

  const toggleExtras = useCallback((topicId: string) => {
    setExtrasTopicIds(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }, []);

  /** Category-level: turn extras on unless every topic already has them. */
  const toggleCategoryExtras = useCallback((category: Category) => {
    setExtrasTopicIds(prev => {
      const next = new Set(prev);
      const withExtras = category.topics.filter(t => (t.extraCount ?? 0) > 0);
      const allOn = withExtras.length > 0 && withExtras.every(t => next.has(t.id));
      for (const t of withExtras) {
        if (allOn) next.delete(t.id);
        else next.add(t.id);
      }
      return next;
    });
  }, []);

  const setAllExtras = useCallback((on: boolean) => {
    if (!topics) return;
    if (!on) { setExtrasTopicIds(new Set()); return; }
    const all = new Set<string>();
    for (const cat of topics.categories) {
      for (const t of cat.topics) if ((t.extraCount ?? 0) > 0) all.add(t.id);
    }
    setExtrasTopicIds(all);
  }, [topics]);

  const toggleCategory = useCallback((category: Category) => {
    setSelectedTopicIds(prev => {
      const next = new Set(prev);
      // Completed topics are skipped: ticking a category should queue up what
      // is left in it, not re-serve questions already answered.
      const pickable = category.topics.filter(t => !completedTopicIds.has(t.id));
      const target = pickable.length ? pickable : category.topics;
      const allSelected = target.every(t => next.has(t.id));
      for (const t of target) {
        if (allSelected) next.delete(t.id);
        else next.add(t.id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!topics) return;
    const all = new Set<string>();
    for (const cat of topics.categories) {
      for (const t of cat.topics) if (!completedTopicIds.has(t.id)) all.add(t.id);
    }
    setSelectedTopicIds(all);
  }, [topics]);

  const clearAll = useCallback(() => {
    setSelectedTopicIds(new Set());
  }, []);

  // A selected topic contributes its core 12, plus its extras only if asked.
  // Data assembled before the split has no counts, so fall back to the total.
  const countFor = (t: Topic) => {
    if (t.coreCount === undefined) return t.questionCount;
    return t.coreCount + (extrasTopicIds.has(t.id) ? (t.extraCount ?? 0) : 0);
  };

  const selectedCount = topics
    ? topics.categories.reduce((sum, cat) =>
        sum + cat.topics.reduce((s, t) =>
          s + (selectedTopicIds.has(t.id) ? countFor(t) : 0), 0), 0)
    : 0;

  /** How many extras the current selection is leaving on the table. */
  const availableExtras = topics
    ? topics.categories.reduce((sum, cat) =>
        sum + cat.topics.reduce((s, t) =>
          s + (selectedTopicIds.has(t.id) && !extrasTopicIds.has(t.id)
               ? (t.extraCount ?? 0) : 0), 0), 0)
    : 0;

  const categoriesForSelected = topics
    ? [...new Set(
        topics.categories
          .filter(cat => cat.topics.some(t => selectedTopicIds.has(t.id)))
          .map(cat => cat.id)
      )]
    : [];

  return {
    topics,
    loading,
    entitlement,
    entitlementReason,
    selectedTopicIds,
    selectedCount,
    categoriesForSelected,
    toggleTopic,
    toggleCategory,
    selectAll,
    clearAll,
    setSelectedTopicIds,
    extrasTopicIds,
    availableExtras,
    toggleExtras,
    toggleCategoryExtras,
    setAllExtras,
  };
}
