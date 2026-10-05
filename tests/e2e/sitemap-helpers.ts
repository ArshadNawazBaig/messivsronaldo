import { getPublicPages } from "../../src/lib/public-pages";
import { calendarYears, snapshotDate } from "../../src/lib/data";
import { locales, localizedPath } from "../../src/lib/i18n/config";

// New public articles must not leave unrelated browser tests with stale counts.
export const expectedSitemapSize = getPublicPages(calendarYears, snapshotDate).length * locales.length;
export const expectedSitemapPaths = locales.flatMap(locale => getPublicPages(calendarYears, snapshotDate).map(page => localizedPath(page.path, locale)));
