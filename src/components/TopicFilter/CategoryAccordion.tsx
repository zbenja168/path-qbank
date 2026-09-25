import { useState } from 'react';
import { Category } from '../../types/topic';
import { TopicStat } from '../../hooks/useTopicProgress';

interface Props {
  category: Category;
  selectedTopicIds: Set<string>;
  /** Topics showing their extension questions as well as the core 12. */
  extrasTopicIds: Set<string>;
  onToggleTopic: (topicId: string) => void;
  onToggleCategory: (category: Category) => void;
  onToggleExtras: (topicId: string) => void;
  onToggleCategoryExtras: (category: Category) => void;
  /** Per-topic completion. Null until the question files have loaded, in which
   *  case the picker falls back to plain question counts. */
  topicStats?: Map<string, TopicStat> | null;
}

export function CategoryAccordion({
  category, selectedTopicIds, extrasTopicIds, onToggleTopic, onToggleCategory,
  onToggleExtras, onToggleCategoryExtras, topicStats,
}: Props) {
  // Only offer the extras control where extras actually exist: bricks that
  // were never extended, and the whole advanced tier, ship 12 and no more.
  const topicsWithExtras = category.topics.filter(t => (t.extraCount ?? 0) > 0);
  const extrasOn = topicsWithExtras.filter(t => extrasTopicIds.has(t.id)).length;
  const allExtrasOn = topicsWithExtras.length > 0 && extrasOn === topicsWithExtras.length;
  const [open, setOpen] = useState(false);
  const selectedCount = category.topics.filter(t => selectedTopicIds.has(t.id)).length;
  const allSelected = selectedCount === category.topics.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const stat = (id: string) => topicStats?.get(id);
  /** Counts follow the tier each topic has switched on, so the header
   *  never promises questions the quiz would not serve. */
  const on = (id: string) => extrasTopicIds.has(id);
  const remainingOf = (t: Category['topics'][number]) => {
    const s = stat(t.id);
    if (!s) return on(t.id) ? t.questionCount : (t.coreCount ?? t.questionCount);
    return on(t.id) ? s.remaining : s.coreRemaining;
  };
  const totalOf = (t: Category['topics'][number]) => {
    const s = stat(t.id);
    if (!s) return on(t.id) ? t.questionCount : (t.coreCount ?? t.questionCount);
    return on(t.id) ? s.total : s.coreTotal;
  };
  const remaining = topicStats
    ? category.topics.reduce((n, t) => n + remainingOf(t), 0)
    : null;
  const catTotal = category.topics.reduce((n, t) => n + totalOf(t), 0);
  const isDone = (t: Category['topics'][number]) => {
    const s = stat(t.id);
    return !!s && (on(t.id) ? s.complete : s.coreComplete);
  };
  const catComplete = topicStats !== null && topicStats !== undefined
    && category.topics.length > 0
    && category.topics.every(t => isDone(t));

  return (
    <div className={`border rounded-lg overflow-hidden ${
      catComplete ? 'border-slate-800 opacity-60' : 'border-slate-700'}`}>
      <div
        className="flex items-center gap-3 px-4 py-3 bg-slate-800 cursor-pointer hover:bg-slate-750 select-none"
        onClick={() => setOpen(!open)}
      >
        <button
          onClick={e => { e.stopPropagation(); onToggleCategory(category); }}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            allSelected ? 'bg-blue-500 border-blue-500' :
            someSelected ? 'bg-blue-800 border-blue-600' :
            'border-slate-500'
          }`}
        >
          {allSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          {someSelected && <div className="w-2 h-0.5 bg-blue-400 rounded" />}
        </button>
        <span className={`font-semibold flex-1 ${catComplete ? 'text-slate-500' : 'text-slate-200'}`}>
          {category.name}
        </span>
        {catComplete
          ? <span className="text-xs font-semibold text-green-500 uppercase tracking-wide">Complete</span>
          : remaining !== null && (
            <>
              {/* How far through this category you are, at a glance. */}
              <div className="hidden sm:block w-24 h-1.5 rounded-full bg-slate-700 overflow-hidden" aria-hidden="true">
                <div className="h-full bg-blue-500/80"
                     style={{ width: `${catTotal ? ((catTotal - remaining) / catTotal) * 100 : 0}%` }} />
              </div>
              <span className="text-sm text-slate-400 tabular-nums">{remaining} left</span>
            </>
          )}
        {topicsWithExtras.length > 0 && (
          <button
            onClick={e => { e.stopPropagation(); onToggleCategoryExtras(category); }}
            title={allExtrasOn
              ? 'Drop back to the core questions for this category'
              : 'Add the extra questions for every topic in this category'}
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              allExtrasOn
                ? 'border-teal-600 bg-teal-500/15 text-teal-300'
                : 'border-slate-600 text-slate-400 hover:text-slate-200'
            }`}
          >
            {allExtrasOn ? 'Extras on' : '+ Extras'}
          </button>
        )}
        <span className="text-xs text-slate-600 tabular-nums" title="Topics selected">
          {selectedCount}/{category.topics.length}
        </span>
        <svg className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
      {open && (
        <div className="bg-slate-850 px-4 py-2 space-y-1 border-t border-slate-700" style={{ backgroundColor: '#1a2332' }}>
          {category.topics.map(topic => {
            const s = stat(topic.id);
            // Finishing the core 12 marks a topic done only while its
            // extras are off -- switching them on gives it more to serve.
            const done = isDone(topic);
            return (
              <label
                key={topic.id}
                title={done ? 'Every question here is answered — Reset Progress to take them again' : undefined}
                className={`flex items-center gap-3 py-1.5 px-2 rounded ${
                  done ? 'cursor-default opacity-60' : 'cursor-pointer hover:bg-slate-700'}`}
              >
                <input
                  type="checkbox"
                  checked={selectedTopicIds.has(topic.id)}
                  disabled={done}
                  onChange={() => onToggleTopic(topic.id)}
                  className="w-4 h-4 rounded border-slate-500 text-blue-500 focus:ring-blue-500 bg-slate-700 disabled:opacity-50"
                />
                <span className={`text-sm flex-1 ${done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                  {topic.name}
                </span>
                {/* The extras opt-in. Core questions cover the topic; this
                    folds in the deeper set for the topics you want it on. */}
                {(topic.extraCount ?? 0) > 0 && (
                  <span
                    onClick={e => { e.stopPropagation(); e.preventDefault(); onToggleExtras(topic.id); }}
                    role="checkbox"
                    aria-checked={extrasTopicIds.has(topic.id)}
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault(); onToggleExtras(topic.id);
                      }
                    }}
                    title={extrasTopicIds.has(topic.id)
                      ? `Serving all ${topic.questionCount} — click for just the core ${topic.coreCount ?? 12}`
                      : `Add ${topic.extraCount} more questions on this topic`}
                    className={`text-xs px-1.5 py-0.5 rounded border cursor-pointer select-none transition-colors ${
                      extrasTopicIds.has(topic.id)
                        ? 'border-teal-600 bg-teal-500/15 text-teal-300'
                        : 'border-slate-600 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    +{topic.extraCount}
                  </span>
                )}
                {done ? (
                  <span className="text-xs font-semibold text-green-500 uppercase tracking-wide">Complete</span>
                ) : s ? (
                  <span className="text-xs text-slate-500">
                    {remainingOf(topic)}/{totalOf(topic)} left
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">
                    {extrasTopicIds.has(topic.id)
                      ? topic.questionCount
                      : (topic.coreCount ?? topic.questionCount)}q
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
