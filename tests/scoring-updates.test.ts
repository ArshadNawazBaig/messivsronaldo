import assert from "node:assert/strict";
import test from "node:test";
import { buildPublishedData } from "../src/lib/published-data";
import { matchSchema, type MatchRecord } from "../src/lib/admin/model";
import { matchScoring } from "../src/lib/match-scoring";

const match: MatchRecord = {id:"manual:scoring-test",player:"messi",date:"2026-09-27",team:"Inter Miami",opponent:"Test opponent",competition:"Test league",category:"league",goals:1,assists:0,minutes:90,appearances:1,headToHead:false,source:"https://example.com/evidence",provider:"manual",note:"Synthetic verified test data",locked:true};

test("verified scoring partitions update all career rows and corresponding calendar totals", () => {
  const record={...match,freeKicks:1,leftFoot:1,penaltyAttempts:0};
  const before=buildPublishedData();
  const after=buildPublishedData([record]);
  for(const scope of ["career","club","league","current-clubs","2026"] as const) {
    for(const metric of after.scopes[scope].metrics.filter(m=>m.group === "scoring")) {
      const old=before.scopes[scope].metrics.find(m=>m.id === metric.id)!;
      const expectedAddition=["freeKicks","leftFoot","non-penalty-goals"].includes(metric.id) ? 1 : 0;
      assert.equal(metric.values.messi,old.values.messi+expectedAddition,`${scope}: ${metric.id}`);
      assert.equal(metric.values.ronaldo,old.values.ronaldo);
      assert.equal(metric.updatedThrough,"2026-09-27");
      assert.equal(metric.coverage,"Updated 27 September 2026");
    }
  }
  const year=after.calendarYears.find(y=>y.year === 2026)!;
  const previous=before.calendarYears.find(y=>y.year === 2026)!;
  assert.equal(year.career.leftFoot!.messi,previous.career.leftFoot!.messi+1);
  assert.deepEqual(after.scopes.international,before.scopes.international);
  assert.deepEqual(buildPublishedData([record,record]),after);
});

test("goalless games verify scoring zeros but do not prove no penalty attempts", () => {
  const scoring=matchScoring({...match,goals:0});
  for(const field of ["freeKicks","penalties","outsideBox","insideBox","leftFoot","rightFoot","headers","otherBody","hatTricks"] as const) assert.equal(scoring[field],0);
  assert.equal(scoring.penaltyAttempts,undefined);
  const data=buildPublishedData([{...match,goals:0,penaltyAttempts:1}]);
  const attempts=data.scopes.career.metrics.find(m=>m.id === "penaltyAttempts")!;
  assert.equal(attempts.values.messi,150);
  assert.equal(data.scopes.career.metrics.find(m=>m.id === "penalty-conversion")!.values.messi,114/150*100);
});

test("partially classified matches cannot advance complete coverage or mix penalty denominators", () => {
  const records=[{...match,penalties:1}, {...match,id:"manual:later",date:"2026-09-28",goals:0,penalties:0,penaltyAttempts:1}];
  const data=buildPublishedData(records);
  const conversion=data.scopes.career.metrics.find(m=>m.id === "penalty-conversion")!;
  assert.equal(conversion.values.messi,114/150*100,"exclude the unverified denominator match from both sides of the ratio");
  assert.match(conversion.coverage!,/partial coverage/);
  const leftFoot=data.scopes.career.metrics.find(m=>m.id === "leftFoot")!;
  assert.match(leftFoot.coverage!,/partial coverage/);
  assert.match(leftFoot.explanation,/1 match record/);
  assert.equal(matchScoring(match).leftFoot,undefined);
});

test("hat-tricks derive from goals and complete body partitions infer the remaining zeros", () => {
  const data=buildPublishedData([{...match,goals:4,leftFoot:2,rightFoot:1,headers:1}]);
  assert.equal(data.scopes.career.metrics.find(m=>m.id === "hatTricks")!.values.messi,63);
  assert.equal(matchScoring({...match,goals:4,leftFoot:2,rightFoot:1,headers:1}).otherBody,0);
});

test("manual scoring fields reject overlapping counts and impossible penalties", () => {
  for(const fields of [{freeKicks:1,penalties:1},{leftFoot:1,headers:1},{penalties:1,penaltyAttempts:0},{outsideBox:-1},{rightFoot:1.5}]) {
    assert.equal(matchSchema.safeParse({...match,...fields}).success,false,JSON.stringify(fields));
  }
  assert.equal(matchSchema.safeParse({...match,freeKicks:1,leftFoot:1,penaltyAttempts:0}).success,true);
});
