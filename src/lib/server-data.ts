import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublishedDataCache } from "./published-data-cache";
import { readSnapshot } from "./admin/database";
import { datasetVersion } from "./data";
import { publicDatabaseCacheKey, publicDataRevalidate, statisticsTag } from "./public-cache";

export const getPublishedSnapshot = unstable_cache(
  () => readSnapshot(), ["published-football-snapshot-v2", publicDatabaseCacheKey],
  { revalidate: publicDataRevalidate, tags: [statisticsTag] },
);
const calculatePublishedData = createPublishedDataCache();
export const getPublishedData = cache(async () => calculatePublishedData(await getPublishedSnapshot()));

export async function getPublishedVersion() {
  const { revision } = await getPublishedSnapshot();
  return revision ? `${datasetVersion}+r${revision}` : datasetVersion;
}
