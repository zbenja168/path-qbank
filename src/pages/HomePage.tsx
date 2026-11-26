import { useState, useEffect } from 'react';
import { TopicsIndex, Category } from '../types/topic';
import { CategoryAccordion } from '../components/TopicFilter/CategoryAccordion';
import { TopicStat } from '../hooks/useTopicProgress';
import { ProgressData } from '../types/progress';
import { getOverallStats } from '../utils/stats';
import { BrandCard } from '../components/Brand';
import { ProgressSummary } from '../components/ProgressSummary';
import { MembraneDivider } from '../components/Membrane';
import type { ReviewMode } from './ReviewPage';
import { Tier } from '../utils/questionLoader';
import { EntitlementStatus } from '../utils/entitlement';
import { SkinName, SkinAccess, applySkin, savedSkin, loadSkinAccess } from '../utils/skin';
import { extrasStatus } from '../utils/extras';

interface Props {
  tier: Tier;
  onSetTier: (t: Tier) => void;
  entitlement: EntitlementStatus | null;
  entitlementReason?: string;
  topics: TopicsIndex | null;
  selectedTopicIds: Set<string>;
  selectedCount: number;
  extrasTopicIds: Set<string>;
  /** Extras available on the current selection but not switched on. */
  availableExtras: number;
  topicStats?: Map<string, TopicStat> | null;
  progress: ProgressData;
  onToggleTopic: (topicId: string) => void;
  onToggleCategory: (category: Category) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onToggleExtras: (topicId: string) => void;
  onToggleCategoryExtras: (category: Category) => void;
  onSetAllExtras: (on: boolean) => void;
  onStartQuiz: () => void;
  onGoToDashboard: () => void;
  onGoToReview: (mode?: ReviewMode) => void;
  onClearProgress: () => void;
  /** High Yield mode: each topic condensed to its high-yield picks. Already
   *  false outside the standard tier (App gates it). */
  hyMode: boolean;
  onSetHyMode: (on: boolean) => void;
}

export function HomePage({
  tier, onSetTier, entitlement, entitlementReason, topics, selectedTopicIds, selectedCount,
  extrasTopicIds, availableExtras, topicStats, progress,
  onToggleTopic, onToggleCategory, onSelectAll, onClearAll,
  onToggleExtras, onToggleCategoryExtras, onSetAllExtras,
  onStartQuiz, onGoToDashboard, onGoToReview, onClearProgress,
  hyMode, onSetHyMode,
}: Props) {
  const locked = tier === 'advanced' && entitlement !== null && entitlement !== 'ok';
  // Standard and advanced share topicIds but have distinct question ids (advanced
  // ids contain "-adv-"), so scope the home-screen counts to the active tier.
  const isAdvId = (id: string) => id.includes('-adv-');
  const tierProgress = {
    ...progress,
    answers: Object.fromEntries(
      Object.entries(progress.answers).filter(([id]) => isAdvId(id) === (tier === 'advanced')),
    ),
  };
  const stats = getOverallStats(tierProgress);
  const missedCount = Object.values(tierProgress.answers).filter((a) => !a.isCorrect).length;
  const bookmarkCount = progress.bookmarkedQuestions.length;
  // The advanced tier (and any never-extended brick) ships 12 questions and
  // nothing more, so the whole control hides itself there. `topics` is null
  // while the advanced payload is gated, hence the optional chain.
  const extraTopics = (topics?.categories ?? []).flatMap(c => c.topics).filter(t => (t.extraCount ?? 0) > 0);
  // High Yield mode replaces the core/extras split, so its controls step aside.
  const anyExtras = !hyMode && extraTopics.length > 0;
  const allTopics = (topics?.categories ?? []).flatMap(c => c.topics);
  // High Yield is a standard-tier feature: the switch hides on Advanced.
  const anyHy = tier === 'standard' && allTopics.some(t => (t.hyCount ?? 0) > 0);
  const hyOf = (t: Category['topics'][number]) =>
    topicStats?.get(t.id)?.hyTotal ?? t.hyCoreCount ?? 0;
  const hyTotal = allTopics.reduce((n, t) => n + hyOf(t), 0);
  const hyLockedExtra = allTopics.reduce((n, t) => n + (t.hyCount ?? 0), 0) - hyTotal;
  const signedIn = extrasStatus() === 'ok';
  const allExtrasOn = anyExtras && extraTopics.every(t => extrasTopicIds.has(t.id));

  const [skin, setSkin] = useState<SkinName>(savedSkin);
  const [skinAccess, setSkinAccess] = useState<SkinAccess | null>(null);
  useEffect(() => { loadSkinAccess().then(setSkinAccess); }, []);
  const skinLocked = skinAccess !== null && skinAccess !== 'ok';
  function chooseSkin(next: SkinName) {
    if (skinLocked && next !== 'off') return;
    setSkin(next);
    applySkin(next);
  }

  return (
    <div className="min-h-screen bg-slate-900">

      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Progress shortcuts. The shared header above carries the title and
            the course's sibling tools; empty:hidden drops the row for a new user. */}
        <div className="mb-6 flex items-center gap-2 flex-wrap empty:hidden">
          {stats.total > 0 && (
            <button
              onClick={onGoToDashboard}
              className="px-4 py-2 min-h-10 text-sm rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Dashboard ({stats.percentage}%)
            </button>
          )}
          {missedCount > 0 && (
            <button
              onClick={() => onGoToReview('incorrect')}
              className="px-4 py-2 min-h-10 text-sm rounded-lg border border-amber-600 bg-amber-500/10 text-amber-400 font-medium hover:bg-amber-500/20 transition-colors"
              title="Redo the questions you got wrong"
            >
              Missed ({missedCount})
            </button>
          )}
          {bookmarkCount > 0 && (
            <button
              onClick={() => onGoToReview()}
              className="px-4 py-2 min-h-10 text-sm rounded-lg border border-amber-700 text-amber-400 hover:bg-amber-900/30 transition-colors"
            >
              Bookmarked ({bookmarkCount})
            </button>
          )}
        </div>

        {/* Standard / Advanced tier toggle */}
        <div className="mb-6">
          <div className="inline-flex rounded-xl border border-slate-700 bg-slate-800 p-1">
            <button
              onClick={() => onSetTier('standard')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                tier === 'standard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => onSetTier('advanced')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                tier === 'advanced' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Advanced
            </button>
          </div>
          {/* Exam skins — re-dress the quiz to look like the interfaces you
              actually sit exams in. Signed-in Active Transport accounts only. */}
          <div className="mt-4 min-w-0 max-w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-400">Skin</span>
              <div className="inline-flex max-w-full overflow-x-auto rounded-xl border border-slate-700 bg-slate-800 p-1">
                {([
                  ['off', 'Off'],
                  ['examplify', 'Examplify Skin'],
                  ['examplify-dark', 'Examplify Dark'],
                  ['nbme', 'NBME Skin'],
                ] as [SkinName, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => chooseSkin(value)}
                    disabled={skinLocked && value !== 'off'}
                    title={skinLocked && value !== 'off'
                      ? 'Sign in to Active Transport to use the exam skins'
                      : undefined}
                    className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                      skin === value
                        ? 'bg-blue-600 text-white'
                        : skinLocked && value !== 'off'
                          ? 'text-slate-600 cursor-not-allowed'
                          : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl">
              {skinLocked
                ? 'Sign in to Active Transport and open this QBank from the hub to practise in an exam-style interface.'
                : skin === 'off'
                  ? 'Practise in an interface that looks like the software you sit exams in.'
                  : 'Exam skin on — right and wrong are still marked the usual way.'}
            </p>
          </div>

          <p className="mt-2 text-sm text-slate-400 max-w-2xl">
            {tier === 'advanced'
              ? 'Advanced: UWorld-style, multi-step clinical vignettes that make you apply the bricks, not just recall them. Free with an Active Transport account.'
              : 'Standard: foundational, recall-level questions to learn each brick.'}
          </p>
        </div>

        {/* Pro-gated: advanced is locked unless the user is Active Transport Pro */}
        {locked && (
          <div className="bg-slate-800 border border-amber-500/40 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Sign in to unlock Advanced</h2>
            <p className="text-slate-400 max-w-lg mx-auto mb-6">
              {entitlementReason === 'not_signed_in'
                ? 'Open this QBank from the Active Transport hub while signed in to your free account to unlock UWorld-style advanced questions.'
                : entitlement === 'error'
                  ? "Couldn't reach Active Transport to check your membership. Check your connection and try again."
                  : 'Sign in to your free Active Transport account to unlock UWorld-style, multi-step advanced questions across every brick — plus AI questions from your own notes.'}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a href="https://activetransport.app/signup" target="_blank" rel="noopener"
                 className="px-5 py-2.5 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition-colors">
                Create a free account →
              </a>
              <button onClick={() => onSetTier('standard')}
                 className="px-5 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors">
                Back to Standard
              </button>
            </div>
          </div>
        )}

        {/* Where you are in the bank */}
        {!locked && stats.total > 0 && (
          <ProgressSummary
            answered={stats.total}
            correct={Math.round(stats.total * stats.percentage / 100)}
            total={topics?.totalQuestions ?? stats.total}
            onReset={onClearProgress}
          />
        )}

        {!locked && topics && (<>
        {/* Filter controls */}
        <MembraneDivider />

        {/* High Yield: condense the bank to the questions most likely to be
            on the exam, picked brick by brick against the learning objectives. */}
        {anyHy && (
          <div className={`mb-6 rounded-xl border px-4 py-3 ${
            hyMode ? 'border-amber-500/60 bg-amber-500/10' : 'border-slate-700 bg-slate-800/60'}`}>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex rounded-xl border border-slate-700 bg-slate-800 p-1">
                <button
                  onClick={() => onSetHyMode(false)}
                  aria-pressed={!hyMode}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                    !hyMode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  All questions
                </button>
                <button
                  onClick={() => onSetHyMode(true)}
                  aria-pressed={hyMode}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                    hyMode ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-amber-300'}`}
                >
                  ⚡ High Yield
                </button>
              </div>
              <span className="text-sm text-slate-300">
                {hyMode
                  ? <><strong className="text-amber-300">{hyTotal}</strong> high-yield questions across the block</>
                  : 'Short on time? Condense every topic to what is most likely on the exam.'}
              </span>
            </div>
            {hyMode && (
              <p className="mt-2 text-sm text-slate-400 max-w-3xl">
                Each topic is cut down to its highest-yield questions (about a third of each topic),
                chosen against the brick's learning objectives, its case and conclusion, and the
                classic boards facts for the topic.
                {!signedIn && hyLockedExtra > 0 && (
                  <span className="text-slate-500"> Sign in to Active Transport (free) to add {hyLockedExtra} more from the extended set.</span>
                )}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-slate-200">Select Topics</h2>
          <div className="flex items-center gap-3">
            <button onClick={onSelectAll} className="text-sm text-blue-400 hover:text-blue-300">Select All</button>
            <span className="text-slate-600">|</span>
            <button onClick={onClearAll} className="text-sm text-blue-400 hover:text-blue-300">Clear All</button>
            {anyExtras && (
              <>
                <span className="text-slate-600">|</span>
                <button
                  onClick={() => onSetAllExtras(!allExtrasOn)}
                  className="text-sm text-teal-400 hover:text-teal-300"
                >
                  {allExtrasOn ? 'Core only' : 'Add all extras'}
                </button>
              </>
            )}
          </div>
        </div>
        {anyExtras && (
          <p className="text-sm text-slate-400 mb-4">
            Each topic starts with the core questions that cover it. Use the
            <span className="mx-1 text-xs px-1.5 py-0.5 rounded border border-slate-600 text-slate-400">+24</span>
            next to a topic to add the rest when you want to go deeper.
            {availableExtras > 0 && (
              <span className="text-slate-500"> {availableExtras} more available on your current selection.</span>
            )}
          </p>
        )}

        {/* Category accordions, grouped by teaching week so a student revising
            one week of the block can find its topics together. Falls back to a
            flat list if the data has no week on it. */}
        <div className="mb-8">
          {topics.categories.map((cat, i) => {
            const prev = i > 0 ? topics.categories[i - 1] : undefined;
            const startsWeek = cat.week !== undefined && cat.week !== prev?.week;
            const inWeek = topics.categories.filter(c => c.week === cat.week);
            const topicCount = inWeek.reduce((n, c) => n + c.topics.length, 0);
            const questionCount = inWeek.reduce(
              (n, c) => n + c.topics.reduce((m, t) => m + (hyMode ? hyOf(t) : t.questionCount), 0), 0);
            return (
              <div key={cat.id}>
                {startsWeek && (
                  <div className={`flex items-baseline gap-3 flex-wrap rounded-lg border border-blue-900/60 bg-blue-950/30 px-4 py-3 ${i === 0 ? 'mb-3' : 'mt-6 mb-3'}`}>
                    <span className="text-base font-bold text-blue-300 at-wrap">{cat.weekName}</span>
                    {cat.weekSubtitle && (
                      <span className="text-sm text-slate-300">{cat.weekSubtitle}</span>
                    )}
                    <span className="ml-auto text-xs text-slate-500 whitespace-nowrap">
                      {topicCount} topics &middot; {questionCount} {hyMode ? 'high-yield ' : ''}questions
                    </span>
                  </div>
                )}
                <div className="mb-2">
                  <CategoryAccordion
                    category={cat}
                    selectedTopicIds={selectedTopicIds}
                    extrasTopicIds={extrasTopicIds}
                    topicStats={topicStats}
                    hyMode={hyMode}
                    onToggleTopic={onToggleTopic}
                    onToggleCategory={onToggleCategory}
                    onToggleExtras={onToggleExtras}
                    onToggleCategoryExtras={onToggleCategoryExtras}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Start button */}
        <div className="at-sticky-bottom sticky bottom-0 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent pt-6 pb-6 -mx-4 px-4">
          <button
            onClick={onStartQuiz}
            disabled={selectedCount === 0}
            className="w-full py-4 rounded-xl at-btn-primary font-semibold text-lg transition-colors shadow-lg"
          >
            {selectedCount > 0
              ? `Start ${hyMode ? 'High Yield ' : ''}Quiz (${selectedCount} questions)`
              : 'Select topics to begin'}
          </button>
        </div>
        </>)}

        <BrandCard kind="qbank" />
      </main>
    </div>
  );
}
