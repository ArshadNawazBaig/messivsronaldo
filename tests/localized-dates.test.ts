import assert from "node:assert/strict";
import { test } from "node:test";
import { locales, numberLocales, type Locale } from "../src/lib/i18n/config";
import { translatedDate } from "../src/lib/i18n/date-format";
import { createTranslator } from "../src/lib/i18n/translate";

const expected: Record<Locale, string> = {
  en: "21 September 2026", es: "21 de septiembre de 2026", pt: "21 de setembro de 2026",
  nl: "21 september 2026", fr: "21 septembre 2026", de: "21. September 2026",
  ar: "21 سبتمبر 2026", hi: "21 सितंबर 2026",
};

test("localized dates use identical text regardless of the runtime's Intl locale data", context => {
  context.mock.method(Intl, "DateTimeFormat", () => { throw new Error("Runtime locale data must not format shared date labels"); });
  for (const locale of locales) {
    for (const source of ["2026-09-21", "21 September 2026", "21 SEPTEMBER 2026"]) {
      assert.equal(translatedDate(source, locale), expected[locale]);
      if (locale !== "en") assert.equal(createTranslator(locale, {})(source), expected[locale]);
    }
  }
});

test("calendar dates validate leap years without rolling invalid dates into another month", () => {
  assert.equal(translatedDate("2024-02-29", "ar"), "29 فبراير 2024");
  assert.equal(translatedDate("1 January 2026", "es"), "1 de enero de 2026");
  for (const invalid of ["2026-02-29", "31 April 2026", "2026-13-01", "2026-01-00", "2026-9-1", "21 NotAMonth 2026", "2026", "2026-09-21T00:00:00Z"]) {
    assert.equal(translatedDate(invalid, "ar"), undefined, invalid);
    assert.equal(createTranslator("ar", {})(invalid), invalid);
  }
});

test("translated dates remain stable in composed messages and preserve surrounding whitespace", () => {
  const t = createTranslator("ar", { "Updated {0}": "تم التحديث {0}" });
  assert.equal(t(" 21 September 2026 "), " 21 سبتمبر 2026 ");
  assert.equal(t("Updated 21 September 2026"), "تم التحديث 21 سبتمبر 2026");
  assert.equal(t("Updated {0}", { "0": t("2026-09-21") }), "تم التحديث 21 سبتمبر 2026");
  const en = createTranslator("en", {});
  assert.equal(en("2026-09-21"), "2026-09-21", "English ISO labels retain their existing format");
  assert.equal(en("21 September 2026"), "21 September 2026");
});

test("Arabic statistics explicitly retain the site's Latin digits and separators", () => {
  assert.equal(new Intl.NumberFormat(numberLocales.ar).resolvedOptions().numberingSystem, "latn");
  assert.equal((1176).toLocaleString(numberLocales.ar), "1,176");
  assert.equal((0.79).toLocaleString(numberLocales.ar, { minimumFractionDigits: 2 }), "0.79");
});
