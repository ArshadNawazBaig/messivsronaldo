import assert from "node:assert/strict";
import { test } from "node:test";
import { scryptSync } from "node:crypto";
import { normalizeAdminEmail, validAdminEmail, verifyAdminCredentials } from "../src/lib/admin/credentials";
const salt = "isolated-credential-test";
const password = "test-only-password-not-a-real-secret";
const hash = `${salt}:${scryptSync(password,salt,64).toString("hex")}`;
test("administrator authentication requires both email and password", () => {
  assert.ok(verifyAdminCredentials(" Admin@Example.com ",password,"admin@example.com",hash));
  assert.equal(verifyAdminCredentials("other@example.com",password,"admin@example.com",hash),false);
  assert.equal(verifyAdminCredentials("admin@example.com","incorrect","admin@example.com",hash),false);
  assert.equal(verifyAdminCredentials("",password,"admin@example.com",hash),false);
  assert.equal(verifyAdminCredentials("",password,"",hash),false);
});
test("invalid administrator configuration fails closed", () => {
  assert.equal(normalizeAdminEmail(" Admin@Example.com "),"admin@example.com");
  for(const email of ["", "invalid", "a@b", "a b@example.com", "x".repeat(255)+"@example.com"]) assert.equal(validAdminEmail(email),false);
  for(const malformed of ["", "missing-separator", "salt:xyz", `salt:${"g".repeat(128)}`, `${hash}:extra`]) assert.equal(verifyAdminCredentials("admin@example.com",password,"admin@example.com",malformed),false);
});
