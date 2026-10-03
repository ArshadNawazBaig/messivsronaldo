// A separate Railway cron service calls the web process so its Next.js caches
// are invalidated by the existing authenticated handler.
try {
  if (process.env.DAILY_SYNC_ENABLED !== "true") {
    console.log("Daily sync is disabled for this deployment.");
  } else {
    if (!process.env.SYNC_SITE_URL || !process.env.CRON_SECRET) throw new Error();
    const origin = new URL(process.env.SYNC_SITE_URL);
    if (origin.protocol !== "https:" || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/") throw new Error();
    const response = await fetch(new URL("/api/admin/daily-sync", origin), {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      redirect: "error", signal: AbortSignal.timeout(290_000),
    });
    if (!response.ok) throw new Error();
    const result = await response.json();
    if (!["success", "partial"].includes(result.status)) throw new Error();
    console.log(`Daily sync finished: ${result.status}.`);
  }
} catch {
  // URLs, response bodies and fetch errors can contain private values.
  console.error("Daily sync failed. Check private variables and the admin activity log.");
  process.exitCode = 1;
}
