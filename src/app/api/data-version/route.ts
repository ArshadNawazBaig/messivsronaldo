import { getPublishedVersion } from "@/lib/server-data";

export const revalidate = 30;
export async function GET() {
  return Response.json({version:await getPublishedVersion()}, {headers:{"Cache-Control":"public, max-age=30, s-maxage=30"}});
}
