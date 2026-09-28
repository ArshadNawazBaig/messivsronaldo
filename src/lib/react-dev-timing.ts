const guarded = Symbol.for("rivalry.react-dev-timing-guard");
type Measure = Performance["measure"] & { [guarded]?: true };

// Temporary workaround for the React profiler bundled with Next 16.3.5:
// https://github.com/vercel/next.js/issues/86060
// An interrupted server render can report an end time before navigation began.
// Safari throws "Type error"; Chromium reports a negative timestamp. Keep the
// profiler entry, but represent that unmeasurable interval with zero duration.
// This is installed only in development and does not catch application errors.
export function installReactDevTimingGuard(target: Pick<Performance, "measure">) {
  const original: Measure = target.measure;
  if (original[guarded]) return;

  const measure: Measure = function (name, optionsOrStart, endMark) {
    if (name.startsWith("\u200b") && typeof optionsOrStart === "object" && optionsOrStart !== null) {
      const { start, end, detail, duration } = optionsOrStart;
      if (
        detail?.devtools?.trackGroup === "Server Components ⚛" &&
        ["error", "warning"].includes(detail.devtools.color) &&
        typeof start === "number" && Number.isFinite(start) && start >= 0 &&
        typeof end === "number" && end < 0 && duration === undefined && endMark === undefined
      ) {
        return original.call(target, name, { ...optionsOrStart, end: start });
      }
    }
    return original.call(target, name, optionsOrStart, endMark);
  };
  measure[guarded] = true;
  target.measure = measure;
}
