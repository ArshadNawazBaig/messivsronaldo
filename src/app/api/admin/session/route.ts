import { isAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json({ admin: await isAdmin() }, { headers: {
    "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow",
  } });
}
