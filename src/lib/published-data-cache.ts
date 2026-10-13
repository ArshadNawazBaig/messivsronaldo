import { buildPublishedData, type PublishedData } from "./published-data";
import type { MatchRecord } from "./admin/model";

// One calculated snapshot per server instance, bounded independently of traffic.
// Callers must still read the tagged snapshot first: that read determines the
// current revision and registers publication invalidation for the rendered page.
export function createPublishedDataCache() {
  let previous: { revision: number; publishedAt: string | null; data: PublishedData } | undefined;
  return ({ revision, records, publishedAt = null }: { revision: number; records: MatchRecord[]; publishedAt?: string | null }) => {
    if (previous?.revision === revision && previous.publishedAt === publishedAt) return previous.data;
    const data = buildPublishedData(records, revision, publishedAt);
    previous = { revision, publishedAt, data };
    return data;
  };
}
