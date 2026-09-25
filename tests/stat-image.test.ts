import { test } from "node:test";
import assert from "node:assert/strict";
import {
  imageFilename,
  imageLeader,
  imageValue,
  statImageSchema,
  type StatImage,
} from "../src/lib/stat-image";

const stat: StatImage = {
  title: "Goals per 90 minutes",
  context: "Career",
  values: { messi: 0.78549, ronaldo: 0.72611 },
  decimals: 2,
  date: "2026-09-21",
};
test("social images round only the display, preserve missing values and use the metric's direction", () => {
  assert.equal(imageValue(stat, "messi"), "0.79");
  assert.equal(
    imageValue({ ...stat, values: { messi: null, ronaldo: 0 } }, "messi"),
    "—",
  );
  assert.equal(imageLeader(stat, "messi"), true);
  assert.equal(imageLeader({ ...stat, lowerIsBetter: true }, "ronaldo"), true);
  for (const player of ["messi", "ronaldo"] as const) {
    assert.equal(
      imageLeader({ ...stat, values: { messi: 5, ronaldo: 5 } }, player),
      true,
    );
    assert.equal(
      imageLeader({ ...stat, values: { messi: null, ronaldo: 5 } }, player),
      false,
    );
  }
});
test("image requests reject invalid values, dates and untrusted renderer options", () => {
  const request = { stat, format: "square", players: "both" };
  assert.equal(statImageSchema.safeParse(request).success, true);
  assert.equal(statImageSchema.parse(request).theme, "dark");
  assert.equal(
    statImageSchema.parse({ ...request, theme: "light" }).theme,
    "light",
  );
  assert.equal(
    statImageSchema.safeParse({ ...request, theme: "unknown" }).success,
    false,
  );
  for (const change of [
    { date: "2026-02-30" },
    { values: { messi: Infinity, ronaldo: 1 } },
    { values: { messi: -1, ronaldo: 2 } },
    { decimals: 20 },
    { title: "x".repeat(141) },
    { imageUrl: "https://example.com" },
  ]) {
    assert.equal(
      statImageSchema.safeParse({ ...request, stat: { ...stat, ...change } })
        .success,
      false,
    );
  }
  assert.equal(
    statImageSchema.safeParse({ ...request, width: 100000 }).success,
    false,
  );
});
test("download names are ASCII, bounded and include comparison date and format", () => {
  const data = statImageSchema.parse({
    stat: { ...stat, title: 'Ballon d’Or / "test"', context: "Éditions" },
    format: "portrait",
    players: "messi",
  });
  assert.equal(
    imageFilename(data),
    "messi-editions-ballon-d-or-test-2026-09-21-dark-portrait.png",
  );
  assert.equal(
    imageFilename({ ...data, theme: "light" }),
    "messi-editions-ballon-d-or-test-2026-09-21-light-portrait.png",
  );
});
