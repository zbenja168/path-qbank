// Extra questions (the "+24 per topic" tier) are free with an Active Transport
// account. They no longer ship in this public repo: activetransport.app serves
// them per category to a signed-in visitor, identified by the signed token the
// hub appends (?at=...) and tool-track.js keeps in sessionStorage.
//
// Self-contained on purpose — the QBank repos have diverged, and this file is
// meant to be copied between them unchanged.
import { Question } from '../types/question';

const API = 'https://activetransport.app';

export type ExtrasStatus = 'unknown' | 'ok' | 'locked' | 'error';

let status: ExtrasStatus = 'unknown';
let pending: Promise<ExtrasStatus> | null = null;
const byCategory = new Map<string, Question[]>();
const listeners = new Set<() => void>();

function toolSlug(): string {
  try {
    const el = document.querySelector('script[data-tool]');
    const override = el && el.getAttribute('data-tool');
    if (override) return override.toLowerCase();
    return (location.pathname || '').split('/').filter(Boolean)[0]?.toLowerCase() || '';
  } catch { return ''; }
}

function token(): string | null {
  try {
    const m = (location.search || '').match(/[?&]at=([A-Za-z0-9._-]+)/);
    if (m) return m[1];
    return sessionStorage.getItem('at_tool_uid');
  } catch { return null; }
}

function url(path: string): string {
  const t = token();
  return `${API}/api/study-tools/${encodeURIComponent(toolSlug())}/extras${path}`
    + (t ? `?at=${encodeURIComponent(t)}` : '');
}

export function extrasStatus(): ExtrasStatus { return status; }

/** Ask once whether this visitor may have extras; later calls reuse the answer.
 *  A network failure is NOT cached, so the next attempt asks again. */
export function ensureExtras(): Promise<ExtrasStatus> {
  if (status === 'ok' || status === 'locked') return Promise.resolve(status);
  if (pending) return pending;
  // No token means no account we can see: locked, without a round trip.
  if (!token()) { status = 'locked'; return Promise.resolve(status); }
  pending = fetch(url(''), { mode: 'cors' })
    .then(r => (r.ok ? 'ok' : r.status === 403 ? 'locked' : 'error') as ExtrasStatus)
    .catch(() => 'error' as ExtrasStatus)
    .then(s => { status = s; pending = null; return s; });
  return pending;
}

/** The category's extra questions, or [] when locked/unavailable. */
export async function extrasFor(categoryId: string): Promise<Question[]> {
  if (status !== 'ok') return [];
  const hit = byCategory.get(categoryId);
  if (hit) return hit;
  try {
    const r = await fetch(url(`/${encodeURIComponent(categoryId)}`), { mode: 'cors' });
    if (r.status === 403) { status = 'locked'; return []; }   // token expired mid-session
    if (!r.ok) return [];
    const d = await r.json() as { questions?: Question[] };
    const qs = d.questions || [];
    byCategory.set(categoryId, qs);
    return qs;
  } catch {
    return [];
  }
}

// ── The sign-in prompt ────────────────────────────────────────────────────
// The topic picker's "+24" controls call requestExtrasPrompt() when locked; the
// <ExtrasGate/> component rendered once in App listens and shows the dialog.
let promptOpen = false;
export function isExtrasPromptOpen(): boolean { return promptOpen; }
export function requestExtrasPrompt(): void { promptOpen = true; listeners.forEach(f => f()); }
export function closeExtrasPrompt(): void { promptOpen = false; listeners.forEach(f => f()); }
export function onExtrasPromptChange(f: () => void): () => void {
  listeners.add(f);
  return () => { listeners.delete(f); };
}
