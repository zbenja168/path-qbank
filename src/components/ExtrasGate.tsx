import { useEffect, useState } from 'react';
import { closeExtrasPrompt, extrasStatus, isExtrasPromptOpen, onExtrasPromptChange } from '../utils/extras';

// The dialog shown when a visitor without an Active Transport sign-in reaches
// for the extra questions. Rendered once in App; utils/extras.ts opens it.
// Self-contained so it copies between the QBank repos unchanged.
export function ExtrasGate() {
  const [open, setOpen] = useState(isExtrasPromptOpen());
  useEffect(() => onExtrasPromptChange(() => setOpen(isExtrasPromptOpen())), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeExtrasPrompt(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (!open) return null;

  const offline = extrasStatus() === 'error';
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={closeExtrasPrompt}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="extras-gate-title"
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="extras-gate-title" className="text-lg font-semibold text-slate-100 mb-2">
          {offline ? "Couldn't reach Active Transport" : 'Unlock the extra questions'}
        </h2>
        {offline ? (
          <p className="text-sm text-slate-300 mb-5">
            The extra questions load from activetransport.app, which didn&apos;t answer just now.
            Check your connection and try again.
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-300 mb-3">
              Every topic&apos;s core questions are open to everyone. The extra questions that take
              each topic deeper are free with an Active Transport account.
            </p>
            <p className="text-sm text-slate-400 mb-5">
              Sign in (or create a free account), then open this QBank from your Active Transport
              home page. Already signed in? Reopen it from your home page and the extras unlock.
            </p>
          </>
        )}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeExtrasPrompt}
            className="text-sm text-slate-400 hover:text-slate-200 px-3 py-2"
          >
            Not now
          </button>
          {!offline && (
            <a
              href="https://activetransport.app/login"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-2"
            >
              Sign in to Active Transport
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
