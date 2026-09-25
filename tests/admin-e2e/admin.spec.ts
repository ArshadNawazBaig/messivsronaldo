import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const origin="http://localhost:3002";
async function signIn(page:Page) {await page.goto("/admin");await page.getByLabel("Admin password").fill("integration-test-password-only");await page.getByRole("button",{name:"Sign in to dashboard"}).click();await expect(page.getByRole("heading",{name:"Admin dashboard"})).toBeVisible();await expect(page).toHaveTitle(/Admin dashboard/);}
test("admin pages are private and every endpoint requires authorization",async({request})=>{
  const page=await request.get("/admin");expect(await page.text()).toContain("noindex");expect(await page.text()).not.toContain("Synthetic test opponent");
  for(const path of ["state","backup"])expect((await request.get(`/api/admin/${path}`)).status()).toBe(401);
  for(const action of ["sync","match","remove","undo","connect"])expect((await request.post(`/api/admin/${action}`,{headers:{origin},data:{revision:1}})).status()).toBe(401);
  expect((await request.post("/api/admin/login",{headers:{origin:"https://attacker.example"},data:{password:"integration-test-password-only"}})).status()).toBe(403);
  expect((await request.post("/api/admin/login",{headers:{origin},data:{password:"wrong-password"}})).status()).toBe(401);
});
test("login, dashboard tabs, theme and logout work on desktop and mobile",async({page,context})=>{
  // Audit final theme colors without waiting for animations in collapsed menus.
  await page.emulateMedia({reducedMotion:"reduce"});
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await signIn(page);
  await expect(page.getByRole("button",{name:"Fetch & update stats"})).toBeDisabled();
  const cookie=(await context.cookies()).find(c=>c.name==="rivalry-admin")!;expect(cookie.httpOnly).toBe(true);expect(cookie.sameSite).toBe("Strict");
  for(const name of ["Daily updates","Match records","Activity log","Settings"]) {
    await page.getByRole("navigation",{name:"Admin sections"}).getByRole("button",{name:new RegExp(name)}).click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
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
test("remove and undo publish consistent server HTML, public API, calendar and source coverage",async({page})=>{
  await signIn(page);
  await page.getByRole("button",{name:/Match records/}).click();await page.getByRole("button",{name:"Remove",exact:true}).click();await page.getByRole("button",{name:"Confirm removal"}).click();await expect(page.getByRole("status")).toContainText("removed");
  let data=await(await page.request.get("/api/comparison/career")).json();expect(data.comparison.goals.messi).toBe(930);
  await page.getByRole("button",{name:"Activity log",exact:true}).click();await page.getByRole("button",{name:"Undo last publication"}).click();await expect(page.getByRole("status")).toContainText("restored");
  data=await(await page.request.get("/api/comparison/career")).json();expect(data.comparison.goals.messi).toBe(931);expect(data.coverageNote).toContain("unlisted dates");expect(data.comparison.metrics.find((m:{id:string})=>m.id==="penalties").coverage).toContain("21 September 2026");
  const html=await(await page.request.get("/")).text();expect(html).toContain("931");expect(html).toContain("recorded matches to 2026-09-22");
  await page.goto("/seasons/2026");await expect(page.getByRole("row").filter({has:page.getByRole("rowheader",{name:/2026/})})).toContainText("35");
  await page.goto("/updates");await expect(page.getByRole("table")).toContainText("Synthetic test opponent");
});
test("date validation, missing-provider errors, stale writes and manual form are enforced",async({page})=>{
  await signIn(page);const state=await(await page.request.get("/api/admin/state")).json();
  const post=(action:string,data:unknown)=>page.request.post(`/api/admin/${action}`,{headers:{origin},data});
  const noProvider=await post("sync",{date:state.today,revision:state.revision});expect(noProvider.status()).toBe(409);expect((await noProvider.json()).error).toContain("Connect API-Football");
  expect((await post("remove",{id:"manual:integration-only",revision:state.revision-1})).status()).toBe(409);
  expect((await post("match",{record:{...state.records[0],date:state.baseline},revision:state.revision})).status()).toBe(400);
  await page.getByRole("button",{name:"Add verified match"}).click();await expect(page.getByRole("heading",{name:"Match details"})).toBeVisible();
  await page.getByRole("combobox",{name:"Match player",exact:true}).click();await page.getByRole("option",{name:"Cristiano Ronaldo"}).click();await expect(page.getByRole("combobox",{name:"Match player",exact:true})).toContainText("Cristiano Ronaldo");
  expect((await new AxeBuilder({page}).analyze()).violations.map(v=>v.id)).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
