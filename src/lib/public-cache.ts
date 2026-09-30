import "server-only";
import { createHash } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";

export const publicDataTag = "rivalry-public-data";
export const publicDataRevalidate = 3600;
// Separate caches when switching providers or running isolated local databases.
// Only the digest becomes part of a cache key; credentials are never stored in it.
export const publicDatabaseCacheKey = createHash("sha256")
  .update(process.env.DATABASE_URL || process.env.ADMIN_DATABASE_PATH || ".data/admin.sqlite")
  .digest("hex");

export function revalidatePublicData() {
  // Admin/cron Route Handlers must expire cached values immediately after writes,
  // including unpublished articles, rather than serve them stale to a new reader.
  revalidateTag(publicDataTag, { expire: 0 });
  revalidatePath("/", "layout");
}
