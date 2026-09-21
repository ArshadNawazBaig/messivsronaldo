import "server-only";
import { cache } from "react";
import { buildPublishedData } from "./published-data";
import { readSnapshot } from "./admin/database";
export const getPublishedData = cache(async () => {
  const { records, revision } = await readSnapshot();
  return buildPublishedData(records, revision);
});
