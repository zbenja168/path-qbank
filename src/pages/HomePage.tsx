import { TopicsIndex, Category } from '../types/topic';
import { CategoryAccordion } from '../components/TopicFilter/CategoryAccordion';
import { ProgressData } from '../types/progress';
import { getOverallStats } from '../utils/stats';
import { BrandCard } from '../components/Brand';

interface Props {
  topics: TopicsIndex;
  selectedTopicIds: Set<string>;
  selectedCount: number;
  progress: ProgressData;
  onToggleTopic: (topicId: string) => void;
  onToggleCategory: (category: Category) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onStartQuiz: () => void;
  onGoToDashboard: () => void;
  onGoToReview: () => void;
  onClearProgress: () => void;
}

export function HomePage({
  topics, selectedTopicIds, selectedCount, progress,
  onToggleTopic, onToggleCategory, onSelectAll, onClearAll,
  onStartQuiz, onGoToDashboard, onGoToReview, onClearProgress,
}: Props) {
  const stats = getOverallStats(progress);
  const bookmarkCount = progress.bookmarkedQuestions.length;

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Pathology QBank</h1>
            <p className="text-sm text-slate-400">Pathology Question Bank</p>
          </div>
          <a
            href="https://zbenja168.github.io/Resp_QBank/"
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 hover:text-teal-400 hover:border-teal-600 transition-colors"
          >
            Resp QBank &rarr;
          </a>
          <div className="flex items-center gap-3">
            {stats.total > 0 && (
              <button
                onClick={onGoToDashboard}
                className="px-4 py-2 text-sm rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Dashboard ({stats.percentage}%)
              </button>
            )}
            {bookmarkCount > 0 && (
              <button
                onClick={onGoToReview}
                className="px-4 py-2 text-sm rounded-lg border border-amber-700 text-amber-400 hover:bg-amber-900/30 transition-colors"
              >
                Bookmarked ({bookmarkCount})
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <BrandCard />

        {/* Stats summary */}
        {stats.total > 0 && (<>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
              <div className="text-2xl font-bold text-slate-200">{stats.total}</div>
              <div className="text-sm text-slate-400">Answered</div>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.percentage}%</div>
              <div className="text-sm text-slate-400">Correct</div>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
              <div className="text-2xl font-bold text-slate-200">{topics.totalQuestions - stats.total}</div>
              <div className="text-sm text-slate-400">Remaining</div>
            </div>
          </div>
          <div className="text-right">
            <button
              onClick={() => {
                if (window.confirm('Clear all progress? This cannot be undone.')) {
                  onClearProgress();
                }
              }}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Reset Progress
            </button>
          </div>
        </>)}

        {/* Filter controls */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-200">Select Topics</h2>
          <div className="flex items-center gap-3">
            <button onClick={onSelectAll} className="text-sm text-blue-400 hover:text-blue-300">Select All</button>
            <span className="text-slate-600">|</span>
            <button onClick={onClearAll} className="text-sm text-blue-400 hover:text-blue-300">Clear All</button>
          </div>
        </div>

        {/* Category accordions */}
        <div className="space-y-2 mb-8">
          {topics.categories.map(cat => (
            <CategoryAccordion
              key={cat.id}
              category={cat}
              selectedTopicIds={selectedTopicIds}
              onToggleTopic={onToggleTopic}
              onToggleCategory={onToggleCategory}
            />
          ))}
        </div>

        {/* Start button */}
        <div className="sticky bottom-0 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent pt-4 pb-6">
          <button
            onClick={onStartQuiz}
            disabled={selectedCount === 0}
            className="w-full py-4 rounded-xl bg-blue-600 text-white font-semibold text-lg hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {selectedCount > 0
              ? `Start Quiz (${selectedCount} questions)`
              : 'Select topics to begin'}
          </button>
        </div>
      </main>
    </div>
  );
}
