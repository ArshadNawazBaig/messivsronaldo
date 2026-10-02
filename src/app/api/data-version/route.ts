import { getPublishedVersion } from "@/lib/server-data";

// Publications invalidate the shared statistics tag immediately. The browser
// still checks every five minutes and only retains this response for 30 seconds.
export const revalidate = 86400;
export async function GET() {
  return Response.json({version:await getPublishedVersion()}, {headers:{"Cache-Control":"public, max-age=30, s-maxage=30"}});
}
