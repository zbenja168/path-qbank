import { useState, useCallback } from 'react';
import { Question } from '../types/question';
import { ProgressData } from '../types/progress';
import { loadMultipleCategories, Tier } from '../utils/questionLoader';
import { shuffle } from '../utils/shuffle';

/** High Yield mode: a quiz serves only the questions the high-yield pass
 *  picked, from core and (when signed in) extras alike, ignoring the per-topic
 *  extras opt-in. Standard tier only. Module-level so loadQuestions keeps the
 *  signature every QBank shares (see _verify_extras_port.py). */
let highYieldOnly = false;
export function setHighYieldOnly(on: boolean) { highYieldOnly = on; }

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  // Load questions for quiz — filters out already-completed questions
  const loadQuestions = useCallback(async (
    categoryIds: string[],
    selectedTopicIds: Set<string>,
    progress: ProgressData,
    tier: Tier = 'standard',
    /** Topics that opted into their extension questions. Topics not listed
     *  serve only their core 12. Undefined serves everything, which is what
     *  review and the dashboard want. */
    extrasTopicIds?: Set<string>,
  ) => {
    setLoading(true);
    try {
      const categories = await loadMultipleCategories(categoryIds, tier);
      const all = categories.flatMap(c => c.questions);
      const filtered = all.filter(q =>
        selectedTopicIds.has(q.topicId) && !progress.answers[q.id]
        // Questions carry no tier on data assembled before the split, and
        // are then treated as core so nothing silently disappears.
        && (highYieldOnly
          ? q.hy === true
          : (extrasTopicIds === undefined
             || q.tier !== 'extra'
             || extrasTopicIds.has(q.topicId)))
      );
      setQuestions(shuffle(filtered));
    } catch (err) {
      console.error('Failed to load questions:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all questions (for dashboard/review — no filtering)
  const loadAllQuestions = useCallback(async (categoryIds: string[], tier: Tier = 'standard') => {
    setLoading(true);
    try {
      const categories = await loadMultipleCategories(categoryIds, tier);
      const all = categories.flatMap(c => c.questions);
      setQuestions(all);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { questions, loading, loadQuestions, loadAllQuestions };
}
