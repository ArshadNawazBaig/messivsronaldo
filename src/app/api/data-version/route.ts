import { getPublishedVersion } from "@/lib/server-data";

export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json({version:await getPublishedVersion()}, {headers:{"Cache-Control":"no-store"}});
}
