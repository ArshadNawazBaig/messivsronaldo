"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUp, Check, Link2, Moon, RefreshCw, Share2, Sun } from "lucide-react";
import { comparisonPosterFilename, comparisonRows, comparisonRowValue, getComparisonPoster, type ComparisonPosterRequest } from "@/lib/comparison-poster";
import { defaultPublicPoster, pagePosterParams, publicPosterImagePath, publicPosterQuery, resolvePublicPoster } from "@/lib/public-comparison-poster";
import { posterScopeIds } from "@/lib/player-poster";
import { imageFormats, type ImageFormat } from "@/lib/stat-image";
import { useFootballData } from "./data-provider";
import { useI18n } from "./i18n-provider";
import { Select } from "./ui/select";
import { ComparisonPosterControls } from "./comparison-poster-controls";
import Link from "./localized-link";
import controls from "./stat-image-dialog.module.css";
import styles from "./public-poster-studio.module.css";

type ReadyPoster = { key: string; url: string; file: File; shareable: boolean };
export function PublicPosterStudio() {
  const data = useFootballData();
  const { t } = useI18n();
  const search = useSearchParams();
  const { request, poster, invalid } = useMemo(() => {
    const params = pagePosterParams(Object.fromEntries([...new Set(search.keys())].map(key => [key, search.getAll(key)])));
    try { return { ...resolvePublicPoster(params, data), invalid: false }; }
    catch { return { request: defaultPublicPoster, poster: getComparisonPoster(data, defaultPublicPoster), invalid: true }; }
  }, [search, data]);
  const rows = comparisonRows(poster, request.metrics);
  const query = publicPosterQuery(request);
  const imageUrl = publicPosterImagePath(request, data.datasetVersion);
  const [attempt, setAttempt] = useState(0);
  const key = `${imageUrl}:${attempt}`;
  const [ready, setReady] = useState<ReadyPoster | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareFallback, setShareFallback] = useState("");
  const [shareError, setShareError] = useState(false);
  const current = ready?.key === key ? ready : null;
  const failed = errorKey === key;
  const size = imageFormats[request.format];
  const filename = comparisonPosterFilename(request, poster);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        // Brief automatic retries cover another visitor occupying the renderer.
        let response = await fetch(imageUrl, { signal: controller.signal });
        for (let retry = 0; response.status === 503 && retry < 2; retry++) {
          await response.body?.cancel();
          await new Promise<void>(resolve => {
            const done = () => { clearTimeout(wait); controller.signal.removeEventListener("abort", done); resolve(); };
            const wait = setTimeout(done, 3000);
            controller.signal.addEventListener("abort", done, { once: true });
          });
          if (cancelled) return;
          response = await fetch(imageUrl, { signal: controller.signal });
        }
        if (!response.ok || !response.headers.get("content-type")?.includes("image/png")) throw new Error("Poster unavailable");
        const blob = await response.blob();
        if (cancelled) return;
        const file = new File([blob], filename, { type: "image/png" });
        const shareable = typeof navigator.share === "function" && !!navigator.canShare?.({ files: [file] });
        setReady({ key, url: URL.createObjectURL(blob), file, shareable });
      } catch { if (!cancelled) setErrorKey(key); }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [imageUrl, key, filename]);
  useEffect(() => () => { if (ready) URL.revokeObjectURL(ready.url); }, [ready]);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);

  function update(change: Partial<ComparisonPosterRequest>) {
    const next = { ...request, ...change };
    const url = new URL(window.location.href);
    url.search = publicPosterQuery(next);
    window.history.replaceState(null, "", url);
    setShareFallback("");
    setCopied(false);
    setShareError(false);
  }
  function posterLink() {
    const url = new URL(window.location.href);
    url.search = query;
    url.hash = "";
    return url.href;
  }
  async function copyLink() {
    const url = posterLink();
    try { await navigator.clipboard.writeText(url); setCopied(true); setShareFallback(""); }
    catch { setShareFallback(url); }
  }
  async function shareImage() {
    if (!current) return;
    setShareError(false);
    const url = posterLink();
    // Include the site link in the caption too: some file-sharing targets only
    // retain text alongside the image rather than the separate URL field.
    try { await navigator.share({ files: [current.file], title: `${poster.competition} · Messi vs Ronaldo`, text: url, url }); }
    catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setShareError(true); }
  }

  return <section className={styles.studio} aria-label={t("Comparison posters")}>
    {invalid && <p className={styles.restoreNotice} role="status">{t("This poster link is invalid. Start with career totals below.")}</p>}
    <div className={styles.layout}>
      <div className={styles.editor}>
        <div className={styles.editorHeading}><span className="section-kicker">{t("MAKE IT YOURS")}</span><h2>{t("Build your poster")}</h2></div>
        <div className={styles.competition}>
          <label htmlFor="poster-competition">{t("Tournament / competition")}</label>
          <Select id="poster-competition" label={t("Tournament / competition")} value={request.scope}
            options={posterScopeIds.map(scope => ({ value: scope, label: scope === "world-cup" ? "World Cup stats" : data.scopes[scope].label }))}
            onValueChange={scope => update({ scope: scope as ComparisonPosterRequest["scope"], metrics: undefined })} />
        </div>
        <fieldset className={controls.fieldset}><legend>{t("Image size")}</legend><div className={controls.formats}>
          {(Object.entries(imageFormats) as [ImageFormat, typeof imageFormats[ImageFormat]][]).map(([format, dimensions]) => <button type="button" key={format} aria-pressed={request.format === format} onClick={() => update({ format })}>
            <span className={controls.shape} style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }} aria-hidden="true" />
            <span>{t(dimensions.label)}</span><small>{dimensions.width} × {dimensions.height}</small>
          </button>)}
        </div></fieldset>
        <fieldset className={controls.fieldset}><legend>{t("Color theme")}</legend><div className={controls.themes}>
          <button type="button" aria-pressed={request.theme === "light"} onClick={() => update({ theme: "light" })}><Sun size={16} aria-hidden="true" />{t("Light")}</button>
          <button type="button" aria-pressed={request.theme === "dark"} onClick={() => update({ theme: "dark" })}><Moon size={16} aria-hidden="true" />{t("Dark")}</button>
        </div></fieldset>
        <ComparisonPosterControls poster={poster} metrics={request.metrics} showBars={request.showBars !== false}
          onBarsChange={showBars => update({ showBars })} onMetricsChange={metrics => update({ metrics: metrics as ComparisonPosterRequest["metrics"] })} />
        <a href="#poster-preview" className={`small-button ${styles.previewJump}`}><ArrowUp size={16} aria-hidden="true" />{t("Preview poster")}</a>
        <p className={styles.help}>{t("Choose a competition, pick your stats, then share your poster. No account needed.")}</p>
        <p className={styles.help}>{t("Poster text is in English. Shared links open the latest published figures.")}</p>
        <Link className="text-link" href="/methodology">{t("Sources & counting rules")}</Link>
      </div>
      <div className={styles.previewPanel} id="poster-preview">
        <div className={styles.previewHeading}><h2>{t("Your poster")}</h2><span>{size.width} × {size.height} · PNG</span></div>
        <div className={styles.canvas}>
          <div className={styles.artwork} style={{ aspectRatio: `${size.width} / ${size.height}`, maxWidth: request.format === "story" ? 390 : 520 }} aria-busy={!current && !failed}>
            {current ? /* Reuse the generated PNG for preview and native sharing. */
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.url} width={size.width} height={size.height} alt={t("{0}: Messi vs Ronaldo comparison poster", { "0": t(poster.competition) })} />
              : <div className={styles.placeholder}>
                <span className={styles.brandMark} aria-hidden="true" />
                <p role="status">{t(failed ? "We could not create the poster. Please try again." : "Creating your poster…")}</p>
                {failed && <button className="small-button" onClick={() => setAttempt(value => value + 1)}><RefreshCw size={14} aria-hidden="true" />{t("Try again")}</button>}
              </div>}
          </div>
        </div>
        <div className={styles.actions}>
          <button className="primary-button" onClick={copyLink}>{copied ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}<span aria-live="polite">{t(copied ? "Link copied" : "Copy poster link")}</span></button>
          {current?.shareable && <button className="small-button" onClick={shareImage}><Share2 size={16} aria-hidden="true" />{t("Share image")}</button>}
        </div>
        {shareFallback && <label className={styles.copyFallback}>{t("Copy this comparison link:")}<input readOnly value={shareFallback} onFocus={event => event.currentTarget.select()} /></label>}
        {shareError && <p className={styles.help} role="status">{t("Could not share the image. Copy the poster link instead.")}</p>}
        <p className={styles.caption}>{t("Stats through {0}", { "0": poster.date })}</p>
        <details className={styles.dataDetails}><summary>{t("View poster statistics")}</summary>
          <table><caption>{t(poster.competition)}</caption><thead><tr><th scope="col">{t("Statistic")}</th><th scope="col">Messi</th><th scope="col">Ronaldo</th></tr></thead>
            <tbody>{rows.map(row => <tr key={row.id}><th scope="row">{t(row.label)}<small>{row.date}</small></th><td>{comparisonRowValue(row, "messi")}</td><td>{comparisonRowValue(row, "ronaldo")}</td></tr>)}</tbody>
          </table>
          {poster.notes.map(note => <p className={styles.help} key={note}>{t(note)}</p>)}
        </details>
      </div>
    </div>
  </section>;
}
