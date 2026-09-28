import assert from "node:assert/strict";
import test from "node:test";
import { installReactDevTimingGuard } from "../src/lib/react-dev-timing";

const details = (color = "error") => ({ devtools: { trackGroup: "Server Components ⚛", color, properties: [["Error", "NEXT_HTTP_ERROR_FALLBACK;404"]] } });
function timing() {
  // An isolated facade keeps the native validation without patching global APIs.
  const target = { measure: performance.measure.bind(performance) };
  installReactDevTimingGuard(target);
  return target;
}

test("rejected and aborted server renders keep valid profiler entries instead of throwing", () => {
  const target = timing();
  for (const end of [-119.08, -Infinity]) {
    for (const color of ["error", "warning"]) {
      const entry = target.measure("\u200bMissingPage", { start: 0, end, detail: details(color) });
      assert.equal(entry.duration, 0);
      assert.equal(entry.startTime, 0);
      assert.deepEqual(entry.detail, details(color));
    }
  }
});

test("valid server and application measurements retain their timestamps and return values", () => {
  const target = timing();
  for (const name of ["\u200bValidPage", "application-measure"]) {
    const entry = target.measure(name, { start: 5, end: 17, detail: details() });
    assert.equal(entry.startTime, 5);
    assert.equal(entry.duration, 12);
  }
  performance.mark("rivalry-test-start");
  performance.mark("rivalry-test-end");
  const entry = target.measure("mark-measure", "rivalry-test-start", "rivalry-test-end");
  assert.equal(entry.entryType, "measure");
  performance.clearMarks("rivalry-test-start");
  performance.clearMarks("rivalry-test-end");
});

test("unrelated invalid timings and missing marks still throw their original errors", () => {
  const target = timing();
  assert.throws(() => target.measure("application", { start: 0, end: -1, detail: details() }), TypeError);
  assert.throws(() => target.measure("\u200bOtherProfiler", { start: 0, end: -1, detail: { devtools: { trackGroup: "Other", color: "error" } } }), TypeError);
  assert.throws(() => target.measure("\u200bPage", { start: 0, end: -1, detail: details("primary") }), TypeError);
  assert.throws(() => target.measure("\u200bPage", { start: -1, end: -2, detail: details() }), TypeError);
  assert.throws(() => target.measure("\u200bPage", { start: 0, end: -1, duration: 2, detail: details() }), TypeError);
  assert.throws(() => target.measure("missing-mark", "rivalry-mark-does-not-exist"));
});

test("hot reload does not wrap the timing function repeatedly", () => {
  const target = timing();
  const once = target.measure;
  installReactDevTimingGuard(target);
  assert.equal(target.measure, once);
});
