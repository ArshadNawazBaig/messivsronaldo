import assert from "node:assert/strict";
import test from "node:test";
import { buildPublishedData } from "../src/lib/published-data";
import { matchSchema, checkDate, type MatchRecord } from "../src/lib/admin/model";
import { mergeDate, saveMatch } from "../src/lib/admin/service";
import { openStore, commitRecords, readRecords, revision, undoLast, history, acquireSync, saveConnection, getConnection } from "../src/lib/admin/store";
import { connectProvider, fetchDate, type ProviderFetch } from "../src/lib/admin/provider";
import { comparisonCsv } from "../src/lib/data";
const sample: MatchRecord = {id:"api:100:messi",player:"messi",date:"2026-09-22",team:"Inter Miami",opponent:"Test opponent",competition:"Major League Soccer",category:"league",goals:2,assists:1,minutes:90,appearances:1,headToHead:false,source:"https://www.api-football.com/",provider:"api-football",note:"Test fixture only; not a real match record.",locked:false};
const connection = {key:"test-only-key",messi:{player:154,club:9568,country:26},ronaldo:{player:874,club:2939,country:27}};
const fixture = {fixture:{id:100,date:"2026-09-22T20:00:00+00:00",status:{short:"FT"}},goals:{home:3,away:0},league:{id:253,name:"Major League Soccer",type:"League",round:"Regular Season - 30"},teams:{home:{id:9568,name:"Inter Miami"},away:{id:1000,name:"Test opponent"}}};
const playerStats = [{team:{id:9568},players:[{player:{id:154},statistics:[{games:{minutes:90},goals:{total:2,assists:1}}]}]}];
const events = [{type:"Goal",detail:"Normal Goal",player:{id:154},assist:{id:null}},{type:"Goal",detail:"Penalty",player:{id:154},assist:{id:null}},{type:"Goal",detail:"Normal Goal",player:{id:1001},assist:{id:154}}];
const provider = (overrides:Record<string,unknown[]> = {}): ProviderFetch => async(path)=>overrides[path] ?? ({fixtures:[fixture],"fixtures/players":playerStats,"fixtures/events":events}[path] || []);

test("new match updates all relevant scopes and rates without mutating the baseline",()=>{
  const before = buildPublishedData();const after = buildPublishedData([sample],1);
  for (const scope of ["career","club","current-clubs","league","2026"] as const) assert.equal(after.scopes[scope].goals.messi,before.scopes[scope].goals.messi+2,scope);
  assert.equal(after.scopes.international.goals.messi,before.scopes.international.goals.messi);
  assert.equal(after.scopes["champions-league"].goals.messi,129);
  assert.equal(after.scopes.career.metrics.find(m=>m.id==="goals-per-90")!.values.messi,932*90/(96747+90));
  assert.equal(buildPublishedData().scopes.career.goals.messi,930);
  for (const field of ["goals","assists","appearances","minutes"] as const) {
    assert.equal(after.calendarYears.reduce((sum,y)=>sum+y.career[field].messi,0),after.scopes.career.metrics.find(m=>m.id===field)!.values.messi);
    assert.equal(after.clubs.filter(c=>c.player==="messi").reduce((sum,c)=>sum+c[field],0),after.scopes.club.metrics.find(m=>m.id===field)!.values.messi);
  }
  assert.match(after.coverageNote,/unlisted dates have not been verified/);
});
test("goal-type rows and CSV retain their actual earlier cutoff",()=>{
  const after = buildPublishedData([sample],1);
  assert.match(after.scopes.career.metrics.find(m=>m.id==="penalties")!.coverage!,/21 September 2026/);
  assert.match(comparisonCsv(after.scopes.career),/Penalty goals.*Through 21 September 2026/);
  assert.ok(after.scopes.career.source.includes("updates"));
});
test("international, tournament and new calendar years aggregate independently",()=>{
  const record:MatchRecord={...sample,id:"api:200:ronaldo",player:"ronaldo",date:"2027-01-01",category:"world-cup",team:"Portugal"};
  const result=buildPublishedData([record]);
  assert.equal(result.scopes.club.goals.ronaldo,833);
  assert.equal(result.scopes.international.goals.ronaldo,148);
  assert.equal(result.scopes["2026"].goals.ronaldo,22);
  assert.equal(result.calendarYears.at(-1)!.year,2027);
  assert.equal(result.calendarYears.at(-1)!.career.goals.ronaldo,2);
});
test("duplicate IDs and baseline matches cannot inflate public totals",()=>{
  assert.equal(buildPublishedData([sample,sample]).scopes.career.goals.messi,932);
  assert.equal(buildPublishedData([{...sample,date:"2026-09-21"}]).scopes.career.goals.messi,930);
  assert.throws(()=>checkDate("2026-09-21","2026-09-22",true),/baseline/);
  assert.throws(()=>checkDate("2026-09-23","2026-09-22",true),/today/);
  assert.throws(()=>checkDate("2026-02-30","2026-09-22"),/valid/);
  assert.equal(matchSchema.safeParse({...sample,goals:-1}).success,false);
  assert.equal(matchSchema.safeParse({...sample,source:"javascript:alert(1)"}).success,false);
});
test("repeat imports replace a date, remove cancelled records, and preserve manual corrections",()=>{
  const first=mergeDate([], [sample], sample.date);
  assert.deepEqual(mergeDate(first,[sample],sample.date),first);
  assert.equal(mergeDate(first,[{...sample,goals:1}],sample.date)[0].goals,1);
  assert.throws(()=>mergeDate(first,[],sample.date),/previously published match is missing/);
  assert.equal(mergeDate(first,[],sample.date,[sample.id]).length,0);
  const manual={...sample,goals:3,locked:true};
  assert.deepEqual(mergeDate([manual],[sample],sample.date),[manual]);
  assert.throws(()=>mergeDate([],[sample,{...sample,id:"api:101:messi"}],sample.date),/manual review/);
});
test("database publications are atomic, reject stale writes, and support undo",()=>{
  const db=openStore(":memory:");
  try {
    commitRecords(0,[sample],sample.date,"sync","test update",db);
    assert.equal(revision(db),1);
    assert.throws(()=>commitRecords(0,[],sample.date,"remove","stale",db),/Data changed/);
    assert.equal(readRecords(db).length,1);
    assert.throws(()=>commitRecords(1,[sample,sample],sample.date,"sync","duplicate",db));
    assert.equal(revision(db),1);assert.equal(readRecords(db).length,1);
    commitRecords(1,[{...sample,goals:3}],sample.date,"manual","correction",db);
    undoLast(2,db);assert.equal(readRecords(db)[0].goals,2);assert.equal(revision(db),3);
    assert.equal(history(db).length,3);
  } finally {db.close();}
});
test("concurrent syncs are locked and provider secrets are encrypted at rest",()=>{
  const db=openStore(":memory:");const previous=process.env.ADMIN_SESSION_SECRET;process.env.ADMIN_SESSION_SECRET="test-only-security-secret-with-at-least-32-characters";
  try {
    const release=acquireSync(db);assert.throws(()=>acquireSync(db),/already running/);release();acquireSync(db)();
    saveConnection(connection,db);assert.deepEqual(getConnection(db),connection);
    const raw=db.prepare("SELECT value FROM settings WHERE key='provider'").get() as {value:string};assert.equal(raw.value.includes(connection.key),false);
  } finally {if(previous===undefined)delete process.env.ADMIN_SESSION_SECRET;else process.env.ADMIN_SESSION_SECRET=previous;db.close();}
});
test("API-Football finished fixtures map to verified stats with stable IDs",async()=>{
  const result=await fetchDate(sample.date,connection,provider());
  assert.equal(result.records.length,1);assert.equal(result.records[0].id,sample.id);assert.equal(result.records[0].goals,2);assert.equal(result.records[0].assists,1);assert.equal(result.records[0].category,"league");
  const playoffs=await fetchDate(sample.date,connection,provider({fixtures:[{...fixture,league:{...fixture.league,round:"Play-offs - Final"}}]}));
  assert.equal(playoffs.records[0].category,"club-cup");
});
test("real fixture responses without competition type resolve league metadata",async()=>{
  for (const type of ["League", "Cup"]) {
    const result=await fetchDate(sample.date,connection,provider({
      fixtures:[{...fixture,league:{...fixture.league,type:undefined}}],
      leagues:[{league:{id:253,type}}],
    }));
    assert.equal(result.records[0].category,type === "League" ? "league" : "club-cup");
  }
  const playoffs=await fetchDate(sample.date,connection,provider({
    fixtures:[{...fixture,league:{...fixture.league,type:undefined,round:"Play-offs - Final"}}],
    leagues:[{league:{id:253,type:"League"}}],
  }));
  assert.equal(playoffs.records[0].category,"club-cup");
});
test("missing competition metadata cannot silently turn league appearances into cup appearances",async()=>{
  for (const leagues of [[],[{league:{id:999,type:"League"}}],[{league:{id:253,type:"Unknown"}}]]) {
    await assert.rejects(()=>fetchDate(sample.date,connection,provider({
      fixtures:[{...fixture,league:{...fixture.league,type:undefined}}],leagues,
    })),/Could not verify competition/);
  }
});
test("untracked fixtures need no competition-type lookup",async()=>{
  const calls:string[]=[];
  const result=await fetchDate(sample.date,connection,async(path)=>{
    calls.push(path);
    return [{...fixture,league:{...fixture.league,type:undefined},teams:{...fixture.teams,home:{id:7777,name:"Untracked team"}}}];
  });
  assert.equal(result.records.length,0);
  assert.deepEqual(calls,["fixtures"]);
});
test("provider null goal/assist fields require corroborating complete goal events",async()=>{
  const nullStats=[{team:{id:9568},players:[{player:{id:154},statistics:[{games:{minutes:90},goals:{total:null,assists:null}}]}]}];
  const result=await fetchDate(sample.date,connection,provider({"fixtures/players":nullStats}));
  assert.equal(result.records[0].goals,2);assert.equal(result.records[0].assists,1);
  await assert.rejects(()=>fetchDate(sample.date,connection,provider({"fixtures/players":nullStats,"fixtures/events":[]})),/coverage/);
});
test("incomplete, disputed, live and shootout data never publish partial statistics",async()=>{
  await assert.rejects(()=>fetchDate(sample.date,connection,provider({"fixtures/players":[]})),/Missing player coverage/);
  for (const status of ["2H","PEN","SUSP"]) await assert.rejects(()=>fetchDate(sample.date,connection,provider({fixtures:[{...fixture,fixture:{...fixture.fixture,status:{short:status}}}]})),/live, suspended/);
  const inconsistent=[{team:{id:9568},players:[{player:{id:154},statistics:[{games:{minutes:90},goals:{total:1,assists:1}}]}]}];
  await assert.rejects(()=>fetchDate(sample.date,connection,provider({"fixtures/players":inconsistent})),/disagree/);
});
test("friendlies, cancelled fixtures and wrong-date responses are handled explicitly",async()=>{
  const friendly=await fetchDate(sample.date,connection,provider({fixtures:[{...fixture,league:{...fixture.league,name:"Friendlies Clubs"}}]}));assert.equal(friendly.records.length,0);assert.equal(friendly.skipped,1);
  const cancelled=await fetchDate(sample.date,connection,provider({fixtures:[{...fixture,fixture:{...fixture.fixture,status:{short:"CANC"}}}]}));assert.equal(cancelled.records.length,0);assert.ok(cancelled.withdrawnIds.includes(sample.id));
  await assert.rejects(()=>fetchDate("2026-09-23",connection,provider()),/outside/);
});
test("connection discovers player identities by birth date and verifies national teams",async()=>{
  const teams = {
    "Inter Miami": {id:9568,name:"Inter Miami",country:"USA",national:false},
    Argentina: {id:26,name:"Argentina",country:"Argentina",national:true},
    Nassr: {id:2939,name:"Al-Nassr",country:"Saudi-Arabia",national:false},
    Portugal: {id:27,name:"Portugal",country:"Portugal",national:true},
  };
  const fetcher:ProviderFetch=async(path,params)=>path==="players/profiles" ? [{player:{id:params.search==="Messi"?154:874,birth:{date:params.search==="Messi"?"1987-06-24":"1985-02-05"}}}] : [{team:teams[params.search as keyof typeof teams]}];
  assert.deepEqual(await connectProvider(connection.key,fetcher),connection);
  await assert.rejects(()=>connectProvider(connection.key,async()=>[]),/uniquely verify/);
});


test("manual publication validates dates, persists protected corrections and rejects duplicate days",()=>{
  const db=openStore(":memory:");
  try {
    saveMatch(sample,0,db,"2026-09-22");
    assert.equal(readRecords(db)[0].locked,true);assert.equal(readRecords(db)[0].provider,"manual");
    assert.equal(buildPublishedData(readRecords(db)).scopes.career.goals.messi,932);
    saveMatch({...sample,goals:3},1,db,"2026-09-22");
    assert.equal(buildPublishedData(readRecords(db)).scopes.career.goals.messi,933);
    assert.throws(()=>saveMatch({...sample,id:"manual:duplicate"},2,db,"2026-09-22"),/already exists/);
    assert.throws(()=>saveMatch({...sample,date:"2026-09-21"},2,db,"2026-09-22"),/baseline/);
    assert.throws(()=>saveMatch({...sample,date:"2026-09-23"},2,db,"2026-09-22"),/today/);
    assert.equal(revision(db),2);
  } finally {db.close();}
});
