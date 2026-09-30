import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { buildPublishedData } from "./published-data";
import { readSnapshot } from "./admin/database";
import { datasetVersion } from "./data";
import { publicDatabaseCacheKey, publicDataRevalidate, publicDataTag } from "./public-cache";

export const getPublishedSnapshot = unstable_cache(
  () => readSnapshot(), ["published-football-snapshot-v1", publicDatabaseCacheKey],
  { revalidate: publicDataRevalidate, tags: [publicDataTag] },
);
export const getPublishedData = cache(async () => {
  const { records, revision } = await getPublishedSnapshot();
  return buildPublishedData(records, revision);
});

export async function getPublishedVersion() {
  const { revision } = await getPublishedSnapshot();
  return revision ? `${datasetVersion}+r${revision}` : datasetVersion;
}
