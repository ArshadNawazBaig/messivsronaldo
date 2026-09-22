import { NextResponse, type NextRequest } from "next/server";
import { maintenanceExempt, maintenanceHeaders, maintenanceResponse } from "@/lib/maintenance";
import { isPublicPath, localizedPath, pathLocale, stripLocale } from "@/lib/i18n/config";

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
    return NextResponse.redirect(url, 308);
  }
  if (locale !== "en") return NextResponse.next({ request: { headers } });
  const url = request.nextUrl.clone(); url.pathname = `/en${path === "/" ? "" : path}`;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
