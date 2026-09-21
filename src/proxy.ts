import { NextResponse, type NextRequest } from "next/server";
import { maintenanceExempt, maintenanceHeaders, maintenanceResponse } from "@/lib/maintenance";

export function proxy(request: NextRequest) {
  if (process.env.MAINTENANCE_MODE !== "true" || maintenanceExempt(request.nextUrl.pathname)) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Temporarily unavailable for maintenance. Please try again shortly." }, { status: 503, headers: maintenanceHeaders });
  return maintenanceResponse();
}

export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
