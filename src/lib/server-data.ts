import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublishedDataCache } from "./published-data-cache";
import { readSnapshot } from "./admin/database";
import { datasetVersion } from "./data";
import { publicDatabaseCacheKey, publicDataRevalidate, statisticsTag } from "./public-cache";

const getCachedPublishedSnapshot = unstable_cache(
  () => readSnapshot(), ["published-football-snapshot-v3", publicDatabaseCacheKey],
  { revalidate: publicDataRevalidate, tags: [statisticsTag] },
);
// Local previews may receive database imports outside the admin API. Read the
// current snapshot on each request there; production retains tagged caching.
export const getPublishedSnapshot = process.env.NODE_ENV === "development"
  ? cache(() => readSnapshot())
  : getCachedPublishedSnapshot;
const calculatePublishedData = createPublishedDataCache();
export const getPublishedData = cache(async () => calculatePublishedData(await getPublishedSnapshot()));

export async function getPublishedVersion() {
  const { revision } = await getPublishedSnapshot();
  return revision ? `${datasetVersion}+r${revision}` : datasetVersion;
}
