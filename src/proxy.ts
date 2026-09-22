import { NextResponse, type NextRequest } from "next/server";
import { maintenanceExempt, maintenanceHeaders, maintenanceResponse } from "@/lib/maintenance";
import { isPublicPath, localizedPath, pathLocale, stripLocale } from "@/lib/i18n/config";
import { isLanguageCrawler, languageCookie, languageCookieMaxAge, preferredLocale } from "@/lib/i18n/detection";

function privateLanguageResponse(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.append("Vary", "Accept-Language, Cookie, User-Agent");
  return response;
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const locale = pathLocale(path);
  const bare = stripLocale(path);
  if (process.env.MAINTENANCE_MODE === "true" && !maintenanceExempt(bare)) {
    if (bare.startsWith("/api/")) return NextResponse.json({ error: "Temporarily unavailable for maintenance. Please try again shortly." }, { status: 503, headers: maintenanceHeaders });
    return maintenanceResponse();
  }
  const headers = new Headers(request.headers);
  // Never trust a client-supplied locale header. The URL is authoritative.
  headers.set("x-rivalry-locale", isPublicPath(bare) ? locale : "en");
  if (!isPublicPath(bare) || bare === "/maintenance") {
    if (path !== bare) { const url = request.nextUrl.clone(); url.pathname = bare; return NextResponse.redirect(url, 308); }
    return NextResponse.next({ request: { headers } });
  }
  if (path === "/en" || path.startsWith("/en/")) {
    const url = request.nextUrl.clone(); url.pathname = localizedPath(path, "en");
    const response = privateLanguageResponse(NextResponse.redirect(url, 308));
    // /en explicitly requests English; remember it before removing the prefix
    // so the canonical redirect cannot negotiate another language on arrival.
    if (!isLanguageCrawler(request.headers.get("user-agent"))) response.cookies.set(languageCookie, "en", { path: "/", maxAge: languageCookieMaxAge, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
    return response;
  }
  if (locale !== "en") return NextResponse.next({ request: { headers } });
  const isPageVisit = ["GET", "HEAD"].includes(request.method)
    && request.headers.get("rsc") !== "1"
    && !request.headers.has("next-router-prefetch")
    && !/prefetch/i.test(`${request.headers.get("purpose") ?? ""} ${request.headers.get("sec-purpose") ?? ""}`);
  if (isPageVisit && !isLanguageCrawler(request.headers.get("user-agent"))) {
    const preferred = preferredLocale(request.cookies.get(languageCookie)?.value, request.headers.get("accept-language"));
    if (preferred !== "en") {
      const url = request.nextUrl.clone(); url.pathname = localizedPath(path, preferred);
      return privateLanguageResponse(NextResponse.redirect(url, 307));
    }
  }
  const url = request.nextUrl.clone(); url.pathname = `/en${path === "/" ? "" : path}`;
  return privateLanguageResponse(NextResponse.rewrite(url, { request: { headers } }));
}

export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
