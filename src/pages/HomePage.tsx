import { useState, useEffect } from 'react';
import { TopicsIndex, Category } from '../types/topic';
import { TopicStat } from '../hooks/useTopicProgress';
import { ProgressData } from '../types/progress';
import { getOverallStats } from '../utils/stats';
import { BrandCard } from '../components/Brand';
import { CourseArt } from '../components/SiteHeader';
import { ProgressSummary } from '../components/ProgressSummary';
import { QBankToolbar } from '../components/QBankToolbar';
import { TopicPicker } from '../components/TopicPicker';
import { StartBar } from '../components/StartBar';
import type { ReviewMode } from './ReviewPage';
import { Tier } from '../utils/questionLoader';
import { EntitlementStatus } from '../utils/entitlement';
import { SkinName, SkinAccess, applySkin, savedSkin, loadSkinAccess } from '../utils/skin';
import { ExtrasStatus, ensureExtras, extrasStatus } from '../utils/extras';

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
   *  false while the Advanced tier is active (HY is standard-tier only). */
  hyMode: boolean;
  onSetHyMode: (on: boolean) => void;
}

export function HomePage({
  tier, onSetTier, entitlement, entitlementReason, topics, selectedTopicIds, selectedCount,
  extrasTopicIds, topicStats, progress,
  onToggleTopic, onToggleCategory, onClearAll, onSetAllExtras,
  onStartQuiz, onGoToDashboard, onGoToReview, onClearProgress,
  hyMode, onSetHyMode,
}: Props) {
  const [skin, setSkin] = useState<SkinName>(savedSkin);
  const [skinAccess, setSkinAccess] = useState<SkinAccess | null>(null);
  useEffect(() => { loadSkinAccess().then(setSkinAccess); }, []);
  const skinLocked = skinAccess !== null && skinAccess !== 'ok';
  function chooseSkin(next: SkinName) {
    if (skinLocked && next !== 'off') return;
    setSkin(next);
    applySkin(next);
  }

  const locked = tier === 'advanced' && entitlement !== null && entitlement !== 'ok';
  // Scope progress stats to the active tier (advanced ids contain "-adv-").
  const isAdvId = (id: string) => id.includes('-adv-');
  const tierProgress = {
    ...progress,
    answers: Object.fromEntries(
      Object.entries(progress.answers).filter(([id]) => isAdvId(id) === (tier === 'advanced')),
    ),
  };
  const stats = getOverallStats(tierProgress);
  const allTopics = (topics?.categories ?? []).flatMap(c => c.topics);
  // Bricks that were never extended ship 12 questions and nothing more, so the
  // extras switch hides itself where there is nothing to add — including the
  // advanced tier, whose payload carries no core/extra counts.
  const extraTopics = allTopics.filter(t => (t.extraCount ?? 0) > 0);
  // High Yield is a standard-tier feature; the switch hides on Advanced.
  const anyHy = tier === 'standard' && allTopics.some(t => (t.hyCount ?? 0) > 0);
  const hyOf = (t: Category['topics'][number]) =>
    topicStats?.get(t.id)?.hyTotal ?? t.hyCoreCount ?? 0;
  const hyTotal = allTopics.reduce((n, t) => n + hyOf(t), 0);
  const hyLockedExtra = allTopics.reduce((n, t) => n + (t.hyCount ?? 0), 0) - hyTotal;
  const missedCount = Object.values(tierProgress.answers).filter((a) => !a.isCorrect).length;
  const bookmarkCount = progress.bookmarkedQuestions.length;

  // Extras: the global switch drives the same per-topic set the old "+ Extras"
  // buttons did (on = every topic that has extras). Needs a sign-in.
  const [extrasAccess, setExtrasAccess] = useState<ExtrasStatus>(extrasStatus);
  useEffect(() => { ensureExtras().then(setExtrasAccess); }, []);
  const allExtrasOn = extraTopics.length > 0 && extraTopics.every(t => extrasTopicIds.has(t.id));
  const extraQs = extraTopics.reduce((n, t) => n + (t.extraCount ?? 0), 0);

  const sessionsPicked = (topics?.categories ?? [])
    .filter(c => c.topics.some(t => selectedTopicIds.has(t.id))).length;

  const tierSwitch = (
    <div className="at-tb-seg" role="group" aria-label="Question level">
      <button type="button" aria-pressed={tier === 'standard'} className={tier === 'standard' ? 'is-on' : ''}
              title="Foundational, recall-level questions" onClick={() => onSetTier('standard')}>
        Standard
      </button>
      <button type="button" aria-pressed={tier === 'advanced'} className={`is-hy${tier === 'advanced' ? ' is-on' : ''}`}
              title="Multi-step clinical vignettes" onClick={() => onSetTier('advanced')}>
        Advanced
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900">
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <CourseArt />

        {/* Progress shortcuts; empty:hidden drops the row for a new user. */}
        <div className="mb-5 flex items-center gap-2 flex-wrap empty:hidden">
          {stats.total > 0 && (
            <button
              onClick={onGoToDashboard}
              className="px-3.5 py-2 min-h-10 text-sm rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Dashboard ({stats.percentage}%)
            </button>
          )}
          {missedCount > 0 && (
            <button
              onClick={() => onGoToReview('incorrect')}
              className="px-3.5 py-2 min-h-10 text-sm rounded-lg border border-amber-600/70 text-amber-400 hover:bg-amber-500/10 transition-colors"
              title="Redo the questions you got wrong"
            >
              Missed ({missedCount})
            </button>
          )}
          {bookmarkCount > 0 && (
            <button
              onClick={() => onGoToReview()}
              className="px-3.5 py-2 min-h-10 text-sm rounded-lg border border-slate-700 text-amber-400 hover:bg-slate-800 transition-colors"
            >
              Bookmarked ({bookmarkCount})
            </button>
          )}
        </div>

        {!locked && stats.total > 0 && (
          <ProgressSummary
            answered={stats.total}
            correct={Math.round(stats.total * stats.percentage / 100)}
            total={topics?.totalQuestions ?? stats.total}
            onReset={onClearProgress}
          />
        )}

        <QBankToolbar
          leading={tierSwitch}
          hy={anyHy && !locked ? {
            on: hyMode,
            onChange: onSetHyMode,
            title: `${hyTotal} high-yield questions`
              + (extrasAccess !== 'ok' && hyLockedExtra > 0 ? `; sign in to add ${hyLockedExtra} more` : ''),
          } : null}
          skin={{
            value: skin,
            locked: skinLocked,
            onChange: v => chooseSkin(v as SkinName),
          }}
          extras={!locked && extraTopics.length > 0 ? {
            on: allExtrasOn,
            onChange: onSetAllExtras,
            locked: extrasAccess === 'locked',
            disabledReason: hyMode ? 'High Yield already picks from the extras' : undefined,
            title: `Adds ${extraQs} more questions across the bank`,
          } : null}
        />

        {/* Pro-gated: advanced is locked unless the user is signed in to Active Transport */}
        {locked && (
          <div className="mb-6 bg-slate-800 border border-amber-500/40 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Sign in to unlock Advanced</h2>
            <p className="text-slate-400 max-w-lg mx-auto mb-6">
              {entitlementReason !== 'not_signed_in' && entitlement === 'error'
                ? "Couldn't reach Active Transport. Check your connection."
                : 'Open this QBank from the Active Transport hub while signed in.'}
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

        {/* Topic selection + quiz start: only when unlocked and topics loaded */}
        {!locked && topics && (
          <TopicPicker
            categories={topics.categories}
            selectedTopicIds={selectedTopicIds}
            extrasTopicIds={extrasTopicIds}
            topicStats={topicStats}
            hyMode={hyMode}
            sessions={tierProgress.sessions}
            onToggleTopic={onToggleTopic}
            onToggleCategory={onToggleCategory}
          />
        )}

        <BrandCard kind="qbank" />

        {!locked && topics && (
          <StartBar
            sessions={sessionsPicked}
            questions={selectedCount}
            hy={hyMode}
            onStart={onStartQuiz}
            onClear={onClearAll}
          />
        )}
      </main>
    </div>
  );
}
