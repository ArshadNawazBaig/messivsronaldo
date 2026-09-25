type PendingHash = { owner: symbol; href: string; hash: string };

let pending: PendingHash | undefined;
let timer: number | undefined;
let retryAfter = 0;

function commit() {
  timer = undefined;
  const next = pending;
  // Navigation wins over an update queued on the previous page or history entry.
  if (!next || window.location.href !== next.href || window.location.hash === next.hash) {
    pending = undefined;
    return;
  }
  try {
    window.history.replaceState(window.history.state, "", next.hash);
    pending = undefined;
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== "SecurityError") throw error;
    // An already exhausted browser history budget must not interrupt the tool.
    retryAfter = performance.now() + 10_000;
    timer = window.setTimeout(commit, 10_000);
  }
}

export function queueToolHash(owner: symbol, hash: string) {
  pending = { owner, href: window.location.href, hash };
  window.clearTimeout(timer);
  // Live calculations stay immediate; only URL persistence waits for a pause.
  timer = window.setTimeout(commit, Math.max(300, retryAfter - performance.now()));
}

export function cancelToolHash(owner: symbol) {
  if (pending?.owner !== owner) return;
  window.clearTimeout(timer);
  timer = undefined;
  pending = undefined;
}

export function currentToolUrl() {
  const url = new URL(window.location.href);
  // Language changes can happen before the debounced URL has been committed.
  if (pending?.href === url.href) url.hash = pending.hash;
  return url;
}
