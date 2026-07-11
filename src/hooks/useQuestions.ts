import { useState, useCallback } from 'react';
import { Question } from '../types/question';
import { loadMultipleCategories } from '../utils/questionLoader';
import { shuffle } from '../utils/shuffle';

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const loadQuestions = useCallback(async (
    categoryIds: string[],
    selectedTopicIds: Set<string>
  ) => {
    setLoading(true);
    try {
      const categories = await loadMultipleCategories(categoryIds);
      const all = categories.flatMap(c => c.questions);
      const filtered = all.filter(q => selectedTopicIds.has(q.topicId));
      setQuestions(shuffle(filtered));
    } catch (err) {
      console.error('Failed to load questions:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllQuestions = useCallback(async (categoryIds: string[]) => {
    setLoading(true);
    try {
      const categories = await loadMultipleCategories(categoryIds);
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
