import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { openStore, encryptConnection } from "../../src/lib/admin/store";
const origin="http://localhost:3002";
async function signIn(page:Page) {await page.goto("/admin");await page.getByLabel("Email address", {exact:true}).fill("admin@example.com");
  await page.getByLabel("Admin password").fill("integration-test-password-only");await page.getByRole("button",{name:"Sign in to dashboard"}).click();await expect(page.getByRole("heading",{name:"Admin dashboard"})).toBeVisible();await expect(page).toHaveTitle(/Admin dashboard/);}
async function navigate(page:Page,name:string) {
  const trigger=page.getByRole("button",{name:"Open admin navigation",exact:true});
  const mobile=await trigger.isVisible();
  if(mobile)await trigger.click();
  await page.getByRole("navigation",{name:mobile?"Mobile admin navigation":"Admin navigation",exact:true}).getByRole("link",{name,exact:true}).click();
}
test("admin pages are private and every endpoint requires authorization",async({request})=>{
  const page=await request.get("/admin");expect(await page.text()).toContain("noindex");expect(await page.text()).not.toContain("Synthetic test opponent");
  for(const route of ["dahsboard","dashboard","players","matches","statistics","updates","activity","settings","review","blog","support"]) {
    const response=await request.get(`/admin/${route}`);const html=await response.text();
    expect(response.status(),route).toBe(200);expect(html,route).toContain("Sign in to dashboard");expect(html,route).not.toContain("admin@example.com");
    expect(response.headers()["cache-control"],route).toContain("no-store");
  }
  for(const path of ["state","backup","daily-sync"])expect((await request.get(`/api/admin/${path}`)).status()).toBe(401);
  for(const action of ["sync","sync-latest","match","remove","undo","connect"])expect((await request.post(`/api/admin/${action}`,{headers:{origin},data:{revision:1}})).status()).toBe(401);
  expect((await request.post("/api/admin/login",{headers:{origin:"https://attacker.example"},data:{email:"admin@example.com",password:"integration-test-password-only"}})).status()).toBe(403);
  expect((await request.post("/api/admin/login",{headers:{origin},data:{email:"admin@example.com",password:"wrong-password"}})).status()).toBe(401);
  expect((await request.post("/api/admin/login",{headers:{origin},data:{email:"wrong@example.com",password:"integration-test-password-only"}})).status()).toBe(401);
  expect((await request.post("/api/admin/login",{headers:{origin},data:{password:"integration-test-password-only"}})).status()).toBe(422);
});
test("login, dashboard navigation, theme and logout work on desktop and mobile",async({page,context})=>{
  test.setTimeout(60000);
  // Audit final theme colors without waiting for animations in collapsed menus.
  await page.emulateMedia({reducedMotion:"reduce"});
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await signIn(page);
  await expect(page).toHaveURL(/\/admin\/dahsboard$/);
  await expect(page.locator(".site-header,.site-footer")).toHaveCount(0);
  await navigate(page,"Data updates");
  await expect(page.getByRole("button",{name:"Update latest stats"})).toBeDisabled();
  await page.getByText("Check a specific match date",{exact:true}).click();
  await expect(page.getByRole("button",{name:"Check selected date"})).toBeDisabled();
  await expect(page.getByText(/A game finishing after midnight/)).toBeVisible();
  await expect(page.getByRole("heading",{name:"Automatic daily updates"})).toBeVisible();
  await expect(page.getByText(/Daily around 1 PM Pakistan time/)).toBeVisible();
  const cookie=(await context.cookies()).find(c=>c.name==="rivalry-admin")!;expect(cookie.httpOnly).toBe(true);expect(cookie.sameSite).toBe("Strict");
  for(const name of ["Overview","Posts & articles","Data updates","Match records","Players","Add statistics","Content review","Support inbox","Activity log","Settings"]) {
    await navigate(page,name);
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),{message:`${name} fits after route layout settles`}).toBe(true);
    const audit=await new AxeBuilder({page}).analyze();expect(audit.violations.map(v=>v.id),name).toEqual([]);
  }
  await expect(page.getByLabel("API-Football key")).toHaveValue("");
  await page.getByRole("button",{name:"Toggle light or dark theme"}).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
  expect((await new AxeBuilder({page}).analyze()).violations.map(v=>v.id)).toEqual([]);
  await expect(page.locator("a[download], a[href=\"/api/admin/backup\"]")).toHaveCount(0);
  expect((await page.request.get("/api/admin/backup")).status()).toBe(404);
  await page.getByRole("button",{name:"Sign out"}).click();await expect(page.getByLabel("Admin password")).toBeVisible();
  expect((await page.request.get("/api/admin/state",{headers:{cookie:`rivalry-admin=${cookie.value}`}})).status()).toBe(401);
  expect(errors).toEqual([]);
});
test("tool search, mobile navigation and player shortcuts work with keyboard and accessible dialogs",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/admin/login");
  expect((await new AxeBuilder({page}).analyze()).violations.map(v=>v.id)).toEqual([]);
  await signIn(page);
  const menu=page.getByRole("button",{name:"Open admin navigation"});
  if(await menu.isVisible()) {
    await menu.click();await expect(page.getByRole("dialog",{name:"Admin navigation",exact:true})).toBeVisible();
    expect((await new AxeBuilder({page}).analyze()).violations.map(v=>v.id)).toEqual([]);
    await page.keyboard.press("Escape");await expect(menu).toBeFocused();
  }
  await page.getByRole("button",{name:"Search admin tools",exact:true}).click();
  const dialog=page.getByRole("dialog",{name:"Search admin tools",exact:true});
  await expect(dialog.getByRole("textbox")).toBeFocused();
  await page.keyboard.press("Escape");await expect(page.getByRole("button",{name:"Search admin tools",exact:true})).toBeFocused();
  await page.getByRole("button",{name:"Search admin tools",exact:true}).click();
  await dialog.getByRole("textbox").fill("players");
  await expect(dialog.getByRole("link")).toHaveCount(1);
  expect((await new AxeBuilder({page}).analyze()).violations.map(v=>v.id)).toEqual([]);
  await dialog.getByRole("link").click();await expect(page).toHaveURL(/\/admin\/players$/);
  await page.locator('a[href="/admin/matches?player=ronaldo"]').click();
  await expect(page.getByRole("combobox",{name:"Filter matches by player"})).toContainText("Cristiano Ronaldo");
  await expect(page.getByRole("heading",{name:"No matching records"})).toBeVisible();
  await page.getByRole("combobox",{name:"Filter matches by player"}).click();await page.getByRole("option",{name:"Lionel Messi"}).click();
  await expect(page.getByRole("table")).toContainText("Synthetic test opponent");
  await page.getByRole("searchbox",{name:"Search matches"}).fill("not-a-match");
  await expect(page.getByRole("heading",{name:"No matching records"})).toBeVisible();
  await navigate(page,"Players");await page.locator('a[href="/admin/statistics?player=ronaldo"]').click();
  await expect(page.getByRole("combobox",{name:"Match player",exact:true})).toContainText("Cristiano Ronaldo");
  await page.goto("/admin/dashboard");await expect(page).toHaveURL(/\/admin\/dahsboard$/);
});
test("latest update sends the revision and displays partial coverage without claiming success",async({page})=>{
  await signIn(page);
  const state=await(await page.request.get("/api/admin/state")).json();
  const connected={...state,providerConnected:true};
  // Seed a synthetic provider only in the isolated database. No external calls occur.
  const previousSecret=process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_SESSION_SECRET="integration-test-secret-only-at-least-32-characters";
  const db=openStore(".artifacts/admin-integration.sqlite");
  const payload=encryptConnection({key:"synthetic-ui-test-only",messi:{player:1,club:2,country:3},ronaldo:{player:4,club:5,country:6}});
  if(previousSecret===undefined)delete process.env.ADMIN_SESSION_SECRET;else process.env.ADMIN_SESSION_SECRET=previousSecret;
  db.prepare("INSERT INTO settings(key,value) VALUES ('provider',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(payload);
  try { await navigate(page,"Data updates"); }
  finally { db.prepare("DELETE FROM settings WHERE key='provider'").run();db.close(); }
  await page.route("**/api/admin/sync-latest",async route=>{
    expect(route.request().postDataJSON()).toEqual({revision:state.revision});
    await route.fulfill({json:{message:"Recent match check: 2 of 7 UTC dates verified.",warnings:["Older dates are blocked by your API-Football subscription."],state:connected}});
  });
  await page.getByRole("button",{name:"Update latest stats",exact:true}).click();
  await expect(page.getByRole("status")).toHaveClass(/warning/);
  await expect(page.getByRole("status")).toContainText("blocked by your API-Football subscription");
  await expect(page.getByRole("status")).toContainText("2 of 7");
});
test("remove and undo publish consistent server HTML, public API, calendar and source coverage",async({page})=>{
  await signIn(page);
  await navigate(page,"Match records");await page.getByRole("button",{name:"Remove",exact:true}).click();await page.getByRole("button",{name:"Confirm removal"}).click();await expect(page.getByRole("status")).toContainText("removed");
  let data=await(await page.request.get("/api/comparison/career")).json();expect(data.comparison.goals.messi).toBe(930);
  await navigate(page,"Activity log");await page.getByRole("button",{name:"Undo last publication"}).click();await expect(page.getByRole("status")).toContainText("restored");
  data=await(await page.request.get("/api/comparison/career")).json();expect(data.comparison.goals.messi).toBe(931);expect(data.coverageNote).toContain("unlisted dates");expect(data.comparison.metrics.find((m:{id:string})=>m.id==="penalties").coverage).toContain("21 September 2026");
  const html=await(await page.request.get("/")).text();expect(html).toContain("931");expect(html).toContain("Updated 22 September 2026");
  await page.goto("/seasons/2026");await expect(page.getByRole("row").filter({has:page.getByRole("rowheader",{name:/2026/})})).toContainText("35");
  await page.goto("/updates");await expect(page.getByRole("table")).toContainText("Synthetic test opponent");
});
test("date validation, missing-provider errors, stale writes and manual form are enforced",async({page})=>{
  await signIn(page);const state=await(await page.request.get("/api/admin/state")).json();
  const post=(action:string,data:unknown)=>page.request.post(`/api/admin/${action}`,{headers:{origin},data});
  const noLatestProvider=await post("sync-latest",{revision:state.revision});expect(noLatestProvider.status()).toBe(409);expect((await noLatestProvider.json()).error).toContain("Connect API-Football");
  const noProvider=await post("sync",{date:state.today,revision:state.revision});expect(noProvider.status()).toBe(409);expect((await noProvider.json()).error).toContain("Connect API-Football");
  expect((await post("remove",{id:"manual:integration-only",revision:state.revision-1})).status()).toBe(409);
  expect((await post("match",{record:{...state.records[0],date:state.baseline},revision:state.revision})).status()).toBe(400);
  await navigate(page,"Add statistics");await expect(page.getByRole("heading",{name:"Match details"})).toBeVisible();
  await page.getByRole("combobox",{name:"Match player",exact:true}).click();await page.getByRole("option",{name:"Cristiano Ronaldo"}).click();await expect(page.getByRole("combobox",{name:"Match player",exact:true})).toContainText("Cristiano Ronaldo");
  expect((await new AxeBuilder({page}).analyze()).violations.map(v=>v.id)).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test("verified free-kick corrections publish through the editor and undo restores the breakdown",async({page})=>{
  await signIn(page);
  const before=await(await page.request.get("/api/admin/state")).json();
  const visitor=await page.context().newPage();
  await visitor.clock.install();
  // Exercise refresh after the focus throttle; bypass browser HTTP caching so
  // advancing the JS clock need not wait for the browser's real-time 30s TTL.
  await visitor.route("**/api/data-version", route => route.continue());
  await visitor.goto("/free-kicks");
  await expect(visitor.locator(".stats-table tbody tr").first()).toContainText("75");
  await navigate(page,"Match records");
  await page.getByRole("button",{name:"Edit messi match on 2026-09-22"}).click();
  await expect(page.getByLabel("Direct free-kick goals",{exact:true})).toHaveValue("");
  await page.getByLabel("Direct free-kick goals",{exact:true}).fill("1");
  await page.getByLabel("Penalties taken",{exact:true}).fill("0");
  await page.getByLabel("Left-foot goals",{exact:true}).fill("1");
  await page.getByRole("button",{name:"Save & publish match"}).click();
  await expect(page.getByRole("status")).toContainText("Match saved");
  try {
    const state=await(await page.request.get("/api/admin/state")).json();
    expect(state.records[0].freeKicks).toBe(1);
    await visitor.clock.fastForward(61_000);
    await visitor.evaluate(()=>window.dispatchEvent(new Event("focus")));
    await expect(visitor.locator(".stats-table tbody tr").first()).toContainText("76");
    await expect(visitor.locator(".stats-table tbody tr").first()).toContainText("Updated 22 September 2026");
    const version=await visitor.request.get("/api/data-version");
    expect(version.headers()["cache-control"]).toBe("public, max-age=30, s-maxage=30");
    expect((await version.json()).version).toContain(`+r${state.revision}`);
    const data=await(await page.request.get("/api/comparison/career")).json();
    expect(data.comparison.goals.messi).toBe(931);
    for(const metric of data.comparison.metrics.filter((m:{group:string})=>m.group === "scoring")) {
      expect(metric.updatedThrough,metric.id).toBe("2026-09-22");
      expect(metric.coverage,metric.id).toBe("Updated 22 September 2026");
    }
    expect(data.comparison.metrics.find((m:{id:string})=>m.id==="freeKicks").values.messi).toBe(76);
    await page.goto("/free-kicks");
    await expect(page.locator(".stats-table tbody tr").first()).toContainText("76");
    const datasets=await page.locator('script[type="application/ld+json"]').evaluateAll(nodes=>nodes.map(n=>JSON.parse(n.textContent||"{}")).filter(d=>d["@type"]==="Dataset"));
    expect(datasets[0].variableMeasured.find((v:{name:string})=>v.name==="Lionel Messi · Direct free-kick goals").value).toBe(76);
    await page.goto("/answers");
    await expect(page.locator("#free-kicks")).toContainText("76");
  } finally {
    const state=await(await page.request.get("/api/admin/state")).json();
    expect((await page.request.post("/api/admin/undo",{headers:{origin},data:{revision:state.revision}})).status()).toBe(200);
    const restored=await(await page.request.get("/api/admin/state")).json();
    expect(restored.records).toEqual(before.records);
    await visitor.close();
  }
});

test("daily scheduler requires its own secret and reports setup failures without changing totals",async({request})=>{
  const before=await(await request.get("/api/comparison/career")).json();
  const denied=await request.get("/api/admin/daily-sync",{headers:{authorization:"Bearer incorrect-cron-secret-only"}});
  expect(denied.status()).toBe(401);
  const response=await request.get("/api/admin/daily-sync",{headers:{authorization:"Bearer integration-cron-secret-only"}});
  // The first browser project records the missing provider; later projects see today's stored run.
  expect([200,503]).toContain(response.status());
  const result=await response.json();expect(result.status).toBe("failed");expect(result.message).toContain("Connect API-Football");
  expect(response.headers()["cache-control"]).toBe("no-store");
  const repeated=await request.get("/api/admin/daily-sync",{headers:{authorization:"Bearer integration-cron-secret-only"}});
  expect(repeated.status()).toBe(200);expect((await repeated.json()).skipped).toBe(true);
  expect(await(await request.get("/api/comparison/career")).json()).toEqual(before);
});
