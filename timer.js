function savedTime(attempt) {
  return Number.isFinite(attempt?.elapsedMs) && attempt.elapsedMs >= 0 ? attempt.elapsedMs : 0;
}

export function attemptDuration(attempt) {
  if (Number.isFinite(attempt?.elapsedMs) && attempt.elapsedMs >= 0) return attempt.elapsedMs;
  // Completed attempts from before active-time tracking keep their recorded duration.
  if (Number.isFinite(attempt?.submittedAt) && Number.isFinite(attempt?.startedAt)) {
    return Math.max(0, attempt.submittedAt - attempt.startedAt);
  }
  return 0;
}

export function createQuizTimer(now = () => performance.now()) {
  let active = null, since = 0;

  function checkpoint() {
    if (!active) return;
    const stamp = now();
    active.elapsedMs = savedTime(active) + Math.max(0, stamp - since);
    since = stamp;
  }

  function pause() {
    checkpoint();
    active = null;
  }

  function resume(attempt) {
    if (!attempt || attempt.submittedAt) { pause(); return; }
    if (active === attempt) return;
    pause();
    attempt.elapsedMs = savedTime(attempt);
    active = attempt;
    since = now();
  }

  function elapsed(attempt) {
    return savedTime(attempt) + (active && active === attempt ? Math.max(0, now() - since) : 0);
  }

  return {resume, pause, checkpoint, elapsed, get running() { return active !== null; }};
}
