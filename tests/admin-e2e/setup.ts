import { openStore, commitRecords } from "../../src/lib/admin/store";
export default function setup() {
  const db=openStore(".artifacts/admin-integration.sqlite");
  db.exec("DELETE FROM matches; DELETE FROM runs; DELETE FROM sessions; DELETE FROM login_attempts; DELETE FROM settings; DELETE FROM locks; UPDATE state SET revision=0 WHERE id=1;");
  commitRecords(0,[{id:"manual:integration-only",player:"messi",date:"2026-09-22",team:"Inter Miami",opponent:"Synthetic test opponent",competition:"Integration test only",category:"league",goals:1,assists:0,appearances:1,minutes:90,headToHead:false,source:"https://example.com/test-evidence",provider:"manual",note:"Synthetic test fixture in an isolated database. Not real football data.",locked:true}],"2026-09-22","manual","Isolated test fixture",db);
  db.close();
}
