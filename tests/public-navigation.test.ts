import assert from "node:assert/strict";
import test from "node:test";
import { needsDocumentNavigation } from "../src/lib/public-navigation";

test("active Auto ads gets a new document for public page changes, including localized years", () => {
  assert.equal(needsDocumentNavigation("/goals", "https://example.com/", true), true);
  assert.equal(needsDocumentNavigation("/fr/seasons/2012#scope=club", "https://example.com/fr/seasons", true), true);
  assert.equal(needsDocumentNavigation("/goals", "https://example.com/", false), false);
});

test("filters, anchors, external destinations and private routes do not use the ad navigation override", () => {
  const current = "https://example.com/compare";
  for (const href of ["#goals", "?scope=club", "/compare#assists", "https://other.example/goals", "mailto:editor@example.com", "/admin/login", "/fr/admin/login", "/api/data", "/images/chart.png"]) {
    assert.equal(needsDocumentNavigation(href, current, true), false, href);
  }
});
