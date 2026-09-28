import { getPublishedData } from "@/lib/server-data";

export const dynamic = "force-dynamic";
export async function GET() {
  const data = await getPublishedData();
  return Response.json({version:data.datasetVersion}, {headers:{"Cache-Control":"no-store"}});
}
