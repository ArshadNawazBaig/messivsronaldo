import { buildPublishedData, type PublishedData } from "./published-data";
import type { MatchRecord } from "./admin/model";

// One calculated snapshot per server instance, bounded independently of traffic.
// Callers must still read the tagged snapshot first: that read determines the
// current revision and registers publication invalidation for the rendered page.
export function createPublishedDataCache() {
  let previous: { revision: number; data: PublishedData } | undefined;
  return ({ revision, records }: { revision: number; records: MatchRecord[] }) => {
    if (previous?.revision === revision) return previous.data;
    const data = buildPublishedData(records, revision);
    previous = { revision, data };
    return data;
  };
}
