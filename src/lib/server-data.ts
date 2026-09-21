import "server-only";
import { cache } from "react";
import { buildPublishedData } from "./published-data";
import { readRecords, revision, store } from "./admin/store";
export const getPublishedData = cache(() => {
  const db = store();
  return db.transaction(() => buildPublishedData(readRecords(db), revision(db)))();
});
