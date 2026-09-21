import { statusStyles } from "./status-styles";

export const maintenanceHeaders = { "Cache-Control": "no-store, max-age=0", "Retry-After": "300" };

export function maintenanceExempt(path: string) {
  return ["/admin", "/api/admin", "/_next", "/images"].some(prefix => path === prefix || path.startsWith(`${prefix}/`))
    || ["/robots.txt", "/icon.svg", "/favicon.ico", "/maintenance"].includes(path);
}

export function maintenanceResponse(dedicatedPage = false) {
  // Static HTML works during a database outage. Do not put noindex on normal
  // URLs during temporary maintenance; HTTP 503 communicates the outage.
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Maintenance | The Rivalry</title>${dedicatedPage ? '<meta name="robots" content="noindex, follow">' : ""}<style>${statusStyles}</style></head>
<body class="rivalry-status-standalone"><header class="rivalry-status-header"><a href="/" aria-label="The Rivalry home"><img src="/images/brand/the-rivalry-mark.svg" width="38" height="38" alt="">THE RIVALRY</a></header>
<main class="rivalry-status"><div class="rivalry-status-layout"><div><span class="rivalry-status-kicker">503 / TEMPORARILY UNAVAILABLE</span><h1>A short break in play.</h1><p>This page is temporarily unavailable for maintenance. Please try again in a few minutes. Thank you for your patience.</p><div class="rivalry-status-actions"><a href="${dedicatedPage ? "/" : ""}">Try again</a></div></div><div class="rivalry-status-pitch" aria-hidden="true"><span>503</span></div></div><div class="rivalry-status-links"><span>The Rivalry · Two careers. Every chapter.</span><a href="/admin">Admin sign-in</a></div></main></body></html>`;
  return new Response(html, { status: 503, headers: { ...maintenanceHeaders, "Content-Type": "text/html; charset=utf-8", ...(dedicatedPage ? { "X-Robots-Tag": "noindex, follow" } : {}) } });
}
