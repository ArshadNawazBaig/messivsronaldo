import { maintenanceResponse } from "@/lib/maintenance";

export const dynamic = "force-dynamic";
export function GET() { return maintenanceResponse(true); }
