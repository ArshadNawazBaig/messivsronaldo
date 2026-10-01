import Link from "@/components/localized-link";
import { getI18n } from "@/lib/i18n/server";
import { periodAnalysis, type PeriodSample } from "@/lib/period-analysis";
import type { CalendarYear } from "@/lib/published-data";
import type { SeasonRecord } from "@/lib/seasons";
import styles from "./period-reading.module.css";
import { publisherConfiguration } from "@/lib/publisher-config";

export async function PeriodReading({ sample, previous, note, source, period, incomplete = false }: {
  sample: PeriodSample; previous?: PeriodSample; note?: string; source: string; period: string; incomplete?: boolean;
}) {
  const { t, numberLocale, locale } = await getI18n();
  const analysis = periodAnalysis(sample, incomplete ? undefined : previous);
  const fmt = (n: number, decimals = 0) => n.toLocaleString(numberLocale, { maximumFractionDigits: decimals });
  const signed = (n: number, decimals = 0) => `${n > 0 ? "+" : ""}${fmt(n, decimals)}`;
  const translatedNote = note && t(note);
  const { editor } = publisherConfiguration(process.env);
  return <section className={`prose panel ${styles.reading}`} aria-labelledby="period-reading-title" data-period-reading>
    <span className="section-kicker">{t("THE RECORD, INTERPRETED")}</span>
    <h2 id="period-reading-title">{t("What changes the comparison in {0}?", { 0: period })}</h2>
    {translatedNote && <p className={styles.lead} lang={locale !== "en" && translatedNote === note ? "en" : undefined}>{translatedNote}</p>}
    {note && editor && <p><Link href="/about#editor">{t("Editor")}: {editor.name}</Link></p>}
    <div className={styles.grid}>
      <section><h3>{t("Separate opportunity from frequency")}</h3>
        {analysis.equalMinutes ? <>
          <p>{t("At the smaller shared sample of {0} minutes, Messi’s recorded rate gives {1} goals and Ronaldo’s gives {2}. This calculation scales both rates to the same playing time; these are not goals actually scored.", { 0: fmt(analysis.commonMinutes), 1: fmt(analysis.equalMinutes.messi, 2), 2: fmt(analysis.equalMinutes.ronaldo, 2) })}</p>
          <p>{t("Equal minutes remove the difference in playing-time volume. They do not equalise opponents, chances, competitions or responsibilities. Use this alongside the actual totals, not as a prediction.")}</p>
        </> : <p>{t("There is no shared playing-time comparison because at least one player has no recorded minutes. A missing playing sample cannot be converted into a zero scoring rate.")}</p>}
        {Math.min(sample.minutes.messi, sample.minutes.ronaldo) > 0 && Math.min(sample.minutes.messi, sample.minutes.ronaldo) < 900 && <p>{t("At least one sample is shorter than ten full matches. A single additional goal can move its rate noticeably; avoid projecting this sample over a full season.")}</p>}
      </section>
      <section><h3>{t("What the final pass changes")}</h3>
        <p>{t("Goals plus recorded assists give Messi {0} and Ronaldo {1}. Counting goals alone gives a Messi-minus-Ronaldo difference of {2}; including assists changes it to {3}.", { 0: fmt(analysis.contributions.messi), 1: fmt(analysis.contributions.ronaldo), 2: signed(analysis.goalsGap), 3: signed(analysis.contributionGap) })}</p>
        <p>{t("A positive difference favours Messi; a negative one favours Ronaldo. Goals and assists are different actions, so their sum is a description of recorded final actions, not a complete creativity or player-quality score.")}</p>
      </section>
    </div>
    {analysis.changes && <section><h3>{t("What changed from the previous period?")}</h3>
      <div className={styles.tableWrap} tabIndex={0} role="region" aria-label={t("Change from the previous period")}><table>
        <caption>{t("Change from the previous period")}</caption>
        <thead><tr><th scope="col">{t("Player")}</th><th scope="col">{t("Goals")}</th><th scope="col">{t("Assists")}</th><th scope="col">{t("Minutes played")}</th><th scope="col">{t("Goals per 90 minutes")}</th></tr></thead>
        <tbody>{(["messi", "ronaldo"] as const).map(id => { const change = analysis.changes![id]; return <tr key={id}><th scope="row">{t(id === "messi" ? "Messi" : "Ronaldo")}</th><td>{signed(change.goals)}</td><td>{signed(change.assists)}</td><td>{signed(change.minutes)}</td><td>{change.rate === null ? "—" : signed(change.rate, 2)}</td></tr>; })}</tbody>
      </table></div>
      <p>{t("Each change is this period minus the previous one, using the same scope. A lower goal total can coexist with a higher rate when minutes fall. These differences do not identify the cause of a change.")}</p>
    </section>}
    {incomplete && <p>{t("This period is incomplete. Changes against a completed previous period are deliberately omitted because the observation windows differ.")}</p>}
    <details><summary>{t("Reproduce this analysis")}</summary>
      <p>{t("Equal-time goals = recorded goals × the smaller minute total ÷ the player’s minutes. Combined output = goals + source-defined assists. Rates and differences are calculated before rounding. All inputs come from the linked period record.")}</p>
    </details>
    <div className={styles.sources}><a href={source}>{t("Check the period source")}</a><Link href="/methodology">{t("Sources & methodology")}</Link><Link href="/contact">{t("Report a correction")}</Link></div>
  </section>;
}

export async function CalendarScopeReading({ year }: { year: CalendarYear }) {
  const { t, numberLocale } = await getI18n();
  const signed = (n: number) => `${n > 0 ? "+" : ""}${n.toLocaleString(numberLocale)}`;
  const clubGap = year.club.goals.messi - year.club.goals.ronaldo;
  const countryGap = year.international.goals.messi - year.international.goals.ronaldo;
  const totalGap = year.career.goals.messi - year.career.goals.ronaldo;
  const leagueGap = year.league.goals.messi - year.league.goals.ronaldo;
  const reversed = clubGap !== 0 && totalGap !== 0 && Math.sign(clubGap) !== Math.sign(totalGap);
  return <section className={`prose panel ${styles.reading}`} data-scope-reading>
    <h2>{t("Where does the {0} goal gap come from?", { 0: year.year })}</h2>
    <p>{t("The Messi-minus-Ronaldo gap is {0} in club football and {1} for their national teams. Adding those separate samples gives the overall difference of {2}.", { 0: signed(clubGap), 1: signed(countryGap), 2: signed(totalGap) })}</p>
    <p>{t(reversed ? "Adding international matches reverses the club-only leader in this year. A headline that omits the scope would therefore give a different answer to a different question." : clubGap === 0 && countryGap !== 0 ? "Club goals are tied in this year. The entire difference in the combined total comes from international matches, rather than club scoring." : countryGap === 0 ? "International goals make no difference to this year’s overall gap. The difference comes entirely from the club sample." : Math.sign(clubGap) !== Math.sign(countryGap) ? "The club and international differences pull in opposite directions. The combined total hides some of the contrast between the two settings." : "The club and international differences point in the same direction. The combined lead is supported by both settings, although their playing samples and opponents differ.")}</p>
    <p>{t("Within club football, the league gap is {0}; the remaining club competitions account for {1}. League goals are already included in club goals and must not be added again.", { 0: signed(leagueGap), 1: signed(clubGap - leagueGap) })}</p>
    <p>{t("These are differences between the players’ goal totals, not shares of their teams’ goals. They show where a lead accumulates; they cannot establish which competition was harder.")}</p>
    <a href={year.source}>{t("Check the period source")}</a>
  </section>;
}

export async function CompetitionScopeReading({ season }: { season: SeasonRecord }) {
  const { t, numberLocale } = await getI18n();
  const fmt = (n: number) => `${n > 0 ? "+" : ""}${n.toLocaleString(numberLocale)}`;
  const league = season.league.messi.goals - season.league.ronaldo.goals;
  const europe = season.ucl.messi.goals - season.ucl.ronaldo.goals;
  return <section className={`prose panel ${styles.reading}`} data-scope-reading>
    <h2>{t("Two competitions, two questions")}</h2>
    <p>{t("In {0}, the Messi-minus-Ronaldo goal difference is {1} in La Liga and {2} in the Champions League.", { 0: season.label, 1: fmt(league), 2: fmt(europe) })}</p>
    <p>{t(league * europe < 0 ? "The competition leaders differ. Selecting only one tournament would conceal the other player’s advantage in the second sample." : "The competition samples do not reverse the goal-total leader. Their different match counts still matter: a league campaign and a knockout tournament offer different opportunities to accumulate goals.")}</p>
    <p>{t("Goals per appearance use matches in which the player appeared, including substitute appearances. Without verified minutes in this archive, that measure cannot be described as goals per 90. The two competitions also exclude domestic cups and other club fixtures.")}</p>
    <Link href={`/club-stats/${season.slug.slice(0, 4)}-${Number(season.slug.slice(0, 4)) + 1}`}>{t("Read the full club-season interpretation")}</Link>
  </section>;
}
