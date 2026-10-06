import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium, devices } from "@playwright/test";

const { values } = parseArgs({ options: {
  origin: { type: "string", default: "http://localhost:3012" },
  output: { type: "string", default: ".artifacts/page-performance.json" },
  paths: { type: "string", default: "/,/ar,/th,/nl/insights/ballon-dor-2026-date-voting-rules,/insights/messi-2012-vs-ronaldo-2013-goals" },
  runs: { type: "string", default: "2" },
  ads: { type: "string", default: "block" },
} });
const runs = Number(values.runs);
if (!Number.isInteger(runs) || runs < 1 || runs > 5) throw new Error("Use 1–5 runs.");
if (!["allow", "block"].includes(values.ads)) throw new Error("Use --ads allow or --ads block.");
const origin = new URL(values.origin).origin;
const report = { origin, checkedAt: new Date().toISOString(), kind: "laboratory; not field Core Web Vitals or a Lighthouse score",
  setup: { device: "iPhone 13 viewport in Chromium", cpuSlowdown: 4, latencyMs: 150, downloadMbps: 1.6, uploadMbps: 0.75,
    coldBrowserContexts: true, ads: values.ads, observationMsAfterDomReady: 7000, runs }, pages: [] };
const browser = await chromium.launch();
try {
  for (const pathname of values.paths.split(",")) {
    const url = new URL(pathname, origin);
    if (url.origin !== origin || !pathname.startsWith("/")) throw new Error("Paths must stay on the selected origin.");
    for (let run = 1; run <= runs; run++) {
      const context = await browser.newContext({ ...devices["iPhone 13"], locale: "en-US" });
      if (values.ads === "block") await context.route(/googlesyndication\.com|doubleclick\.net|fundingchoicesmessages\.google\.com/, route => route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      const session = await context.newCDPSession(page);
      await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await session.send("Network.enable");
      await session.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 1.6 * 1_000_000 / 8, uploadThroughput: 0.75 * 1_000_000 / 8 });
      await page.addInitScript(() => {
        const state = { lcp: null, cls: 0, sessionStart: 0, sessionLast: 0, sessionValue: 0, shifts: [], supported: PerformanceObserver.supportedEntryTypes };
        window.__rivalryPerformanceAudit = state;
        if (state.supported.includes("largest-contentful-paint")) new PerformanceObserver(list => {
          for (const entry of list.getEntries()) state.lcp = entry.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        if (state.supported.includes("layout-shift")) new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.hadRecentInput) continue;
            if (!state.sessionStart || entry.startTime - state.sessionLast >= 1000 || entry.startTime - state.sessionStart >= 5000) {
              state.sessionStart = entry.startTime; state.sessionValue = 0;
            }
            state.sessionLast = entry.startTime; state.sessionValue += entry.value;
            state.cls = Math.max(state.cls, state.sessionValue);
            state.shifts.push({ timeMs: entry.startTime, value: entry.value, sources: entry.sources?.map(source => ({
              element: source.node instanceof Element ? `${source.node.tagName}.${source.node.className}` : null,
              previous: source.previousRect.toJSON(), current: source.currentRect.toJSON(),
            })) });
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      try {
        const response = await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 60_000 });
        await page.waitForTimeout(7000);
        const measurement = await page.evaluate(() => {
          const state = window.__rivalryPerformanceAudit;
          const navigation = performance.getEntriesByType("navigation")[0];
          const resources = performance.getEntriesByType("resource");
          return { lcpMsObserved: state.lcp, clsObserved: state.supported.includes("layout-shift") ? state.cls : null,
            shifts: state.shifts, documentTransferBytes: navigation?.transferSize, documentDecodedBytes: navigation?.decodedBodySize,
            resourceTransferBytes: resources.reduce((total, resource) => total + resource.transferSize, 0),
            ttfbMs: navigation ? navigation.responseStart - navigation.requestStart : null,
            hasAdLoader: !!document.querySelector("#rivalry-adsense-state"),
            adsEnabledInDocument: document.querySelector("#rivalry-adsense-state")?.textContent?.includes("pauseAdRequests=0") ?? false,
            horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1 };
        });
        report.pages.push({ path: pathname, run, status: response?.status(), ...measurement, pageErrors: errors });
        console.log(JSON.stringify(report.pages.at(-1)));
      } catch (error) {
        report.pages.push({ path: pathname, run, error: String(error), pageErrors: errors });
      } finally { await context.close(); }
    }
  }
} finally {
  await browser.close();
  mkdirSync(path.dirname(values.output), { recursive: true });
  writeFileSync(values.output, JSON.stringify(report, null, 2) + "\n");
}
if (report.pages.some(page => page.error || page.status !== 200)) process.exitCode = 1;
