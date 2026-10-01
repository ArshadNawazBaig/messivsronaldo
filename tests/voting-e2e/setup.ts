import { openStore } from "../../src/lib/admin/store";
export default function setup() {
  const db = openStore(".artifacts/voting-e2e.sqlite");
  db.exec("DELETE FROM fan_votes; DELETE FROM fan_vote_limits; UPDATE fan_vote_counts SET votes=0;");
  db.close();
}
