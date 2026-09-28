"use client";
import { useEffect, useId, useRef, useState } from "react";
import {
  Download,
  Check,
  ChevronDown,
  ExternalLink,
  Focus,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Minus,
  Moon,
  Plus,
  Share2,
  Sun,
  X,
} from "lucide-react";
import { useI18n } from "./i18n-provider";
import { Select } from "./ui/select";
import { useFootballData } from "./data-provider";
import { getPlayerPoster, posterScopeIds, posterScopeLabel, type PlayerPosterRequest } from "@/lib/player-poster";
import { comparisonRows, comparisonRowValue, comparisonScopeLabel, getComparisonPoster } from "@/lib/comparison-poster";
import { ComparisonPosterControls } from "./comparison-poster-controls";
import { ComparisonPosterHotspots, ComparisonPosterInsight } from "./comparison-poster-explorer";
import {
  imageFormats,
  imageValue,
  type ImageFormat,
  type ImagePlayers,
  type ImageTheme,
  type StatImage,
} from "@/lib/stat-image";
import styles from "./stat-image-dialog.module.css";

type ReadyImage = { key: string; url: string; file: File; shareable: boolean; format: ImageFormat; description: string };
const designs = [
  { id: "stat", label: "Stat card", description: "One number. All the impact." },
  { id: "poster", label: "Player poster", description: "Put a player in the spotlight." },
  { id: "comparison", label: "Comparison poster", description: "Two legends. Side by side." },
] as const;
export default function StatImageDialog({
  stats,
  initialPlayer,
  initialTheme,
  onClose,
}: {
  stats: StatImage[];
  initialPlayer: ImagePlayers;
  initialTheme: ImageTheme;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const data = useFootballData();
  const [design, setDesign] = useState<"stat" | "poster" | "comparison">("stat");
  const [comparisonMetrics, setComparisonMetrics] = useState<string[] | undefined>();
  const [showComparisonBars, setShowComparisonBars] = useState(true);
  const [inspectedStat, setInspectedStat] = useState<string | null>(null);
  const comparisonOpened = useRef(false);
  const [posterPlayer, setPosterPlayer] = useState<"messi" | "ronaldo">(initialPlayer === "ronaldo" ? "ronaldo" : "messi");
  const [scope, setScope] = useState<PlayerPosterRequest["scope"]>(() => posterScopeIds.find(id =>
    [data.scopes[id].label, data.scopes[id].shortLabel].some(label => stats[0].context === label || stats[0].context.startsWith(`${label} ·`)),
  ) ?? "career");
  const [format, setFormat] = useState<ImageFormat>("square");
  const [theme, setTheme] = useState<ImageTheme>(initialTheme);
  const [player, setPlayer] = useState(initialPlayer);
  const [index, setIndex] = useState("0");
  const [image, setImage] = useState<ReadyImage | null>(null);
  const [failure, setFailure] = useState({ key: "", message: "" });
  const [status, setStatus] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [portal, setPortal] = useState<HTMLDialogElement | null>(null);
  const close = useRef<HTMLButtonElement>(null);
  const uid = useId();
  const stat = stats[Number(index)];
  const poster = getPlayerPoster(data, { scope, player: posterPlayer });
  const availableComparison = getComparisonPoster(data, { scope });
  const comparison = { ...availableComparison, rows: comparisonRows(availableComparison, comparisonMetrics) };
  const inspectedRow = comparison.rows.find(row => row.id === inspectedStat);
  const payload = JSON.stringify(design === "comparison"
    ? { design, scope, format, theme, showBars: showComparisonBars, metrics: comparisonMetrics }
    : design === "poster"
    ? { design, scope, player: posterPlayer, format, theme }
    : { stat, format, players: player, theme });
  const imageTitle = design === "comparison"
    ? `Messi vs Ronaldo · ${comparison.competition}`
    : design === "poster"
    ? `${posterPlayer === "messi" ? "Lionel Messi" : "Cristiano Ronaldo"} · ${poster.competition}`
    : `${stat.context} · ${stat.title}`;
  const imageDescription = design === "comparison"
    ? `${imageTitle}. ${comparison.rows.map(row => `${row.label}: Messi ${comparisonRowValue(row, "messi")}, Ronaldo ${comparisonRowValue(row, "ronaldo")}`).join(". ")}. Core stats as of ${comparison.date}. ${comparison.notes.join(" ")}`
    : design === "poster"
    ? `${imageTitle}. ${posterPlayer === "messi" ? "Argentina" : "Portugal"} flag. ${poster.goals} goals. ${poster.metrics.map(metric => `${metric.label}: ${metric.value}`).join(". ")}. As of ${poster.date}.`
    : `${stat.context}: ${stat.title}. ${player !== "ronaldo" ? `Messi ${imageValue(stat, "messi")}. ` : ""}${player !== "messi" ? `Ronaldo ${imageValue(stat, "ronaldo")}.` : ""}`;
  const downloadUrl = `/api/admin/stat-image?data=${encodeURIComponent(payload)}`;
  const requestKey = `${payload}:${attempt}`;
  const ready = image?.key === requestKey ? image : null;
  const error = failure.key === requestKey ? failure.message : "";
  const previewFormat = image?.format ?? format;
  const dimensions = imageFormats[previewFormat];
  const canvasPadding = viewport.width < 460 ? 12 : 24;
  const fitScale = Math.min(1, Math.max(0, viewport.width - canvasPadding * 2) / dimensions.width, Math.max(0, viewport.height - canvasPadding * 2) / dimensions.height);
  const scale = zoom ?? fitScale;

  useEffect(() => {
    const node = stage.current!;
    const observer = new ResizeObserver(([entry]) => {
      setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Keep the last preview visible while its replacement is being rendered.
  useEffect(() => () => { if (image) URL.revokeObjectURL(image.url); }, [image]);

  useEffect(() => {
    const node = dialog.current!;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const overflow = document.body.style.overflow;
    node.showModal();
    setPortal(node);
    document.body.style.overflow = "hidden";
    close.current?.focus();
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function generate() {
      try {
        const response = await fetch("/api/admin/stat-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok)
          throw new Error(
            response.status === 401
              ? "Your admin session has expired. Sign in again to download images."
              : "The image could not be created. Please try again.",
          );
        if (!response.headers.get("content-type")?.startsWith("image/png"))
          throw new Error("The image could not be created. Please try again.");
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        const filename =
          response.headers
            .get("content-disposition")
            ?.match(/filename="([a-z0-9.-]+)"/)?.[1] ?? "the-rivalry.png";
        const file = new File([blob], filename, { type: "image/png" });
        const url = URL.createObjectURL(blob);
        let shareable = false;
        try {
          shareable = !!navigator.canShare?.({ files: [file] });
        } catch {
          /* Download remains available. */
        }
        setImage({ key: requestKey, url, file, shareable, format, description: imageDescription });
      } catch (e) {
        if (!controller.signal.aborted)
          setFailure({
            key: requestKey,
            message:
              e instanceof Error
                ? e.message
                : "The image could not be created. Please try again.",
          });
      }
    }
    // A short debounce avoids rendering every intermediate selection.
    const timer = window.setTimeout(() => { void generate(); }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [payload, requestKey, format, imageDescription]);

  async function share() {
    if (!ready) return;
    try {
      // File is prepared before this click to preserve mobile user activation.
      await navigator.share({
        files: [ready.file],
        title: imageTitle,
      });
      setStatus("Image shared.");
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        setStatus(
          "Sharing is unavailable. Use Download PNG or Open image instead.",
        );
    }
  }
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={`${uid}-title`}
      aria-describedby={`${uid}-description`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <span className={styles.badge}><span className={styles.brandMark} aria-hidden="true" />{t("The Rivalry")}<span aria-hidden="true">/</span>{t("Export studio")}</span>
            <h2 id={`${uid}-title`}>{t("A stat worth sharing.")}</h2>
            <p id={`${uid}-description`}>
              {t("Choose your look. Make it yours. Share the rivalry.")}
            </p>
          </div>
          <button
            type="button"
            ref={close}
            className={styles.close}
            onClick={onClose}
            aria-label={t("Close image preview")}
          >
            <X size={22} />
          </button>
        </header>
        <div className={styles.body} data-expanded={expanded}>
          <div className={styles.controls} hidden={expanded}>
            <fieldset className={styles.fieldset}>
              <legend>{t("Image design")}</legend>
              <div className={styles.designs}>
                {designs.map(({ id: choice, label, description }) => <button
                  type="button"
                  key={choice}
                  aria-label={t(label)}
                  aria-pressed={design === choice}
                  onClick={() => {
                    if (design !== choice) {
                      setDesign(choice);
                      if (choice === "comparison" && !comparisonOpened.current) {
                        setFormat("portrait");
                        setZoom(null);
                        comparisonOpened.current = true;
                      }
                      setStatus("");
                    }
                  }}
                >
                  <span className={styles.designArt} data-design={choice} aria-hidden="true">
                    {choice === "stat" ? <><b>10</b><span className={styles.miniLines} /></> : <><span className={styles.miniMessi} />{choice === "comparison" && <span className={styles.miniRonaldo} />}<span className={styles.miniLines} /></>}
                  </span>
                  <span className={styles.designCopy}><strong>{t(label)}</strong><small>{t(description)}</small></span>
                  <span className={styles.selectionMark} aria-hidden="true">{design === choice && <Check size={12} strokeWidth={3} />}</span>
                </button>)}
              </div>
            </fieldset>
            {design !== "stat" && <>
              {design === "poster" && <div className={styles.field}>
                <label htmlFor={`${uid}-poster-player`}>{t("Player")}</label>
                <Select id={`${uid}-poster-player`} label="Player" value={posterPlayer}
                  portalContainer={portal}
                  onValueChange={value => { setPosterPlayer(value as "messi" | "ronaldo"); setStatus(""); }}
                  options={[{ value: "messi", label: "Lionel Messi" }, { value: "ronaldo", label: "Cristiano Ronaldo" }]}
                />
              </div>}
              <div className={styles.field}>
                <label htmlFor={`${uid}-scope`}>{t("Tournament / competition")}</label>
                <Select id={`${uid}-scope`} label="Tournament / competition" value={scope}
                  portalContainer={portal}
                  onValueChange={value => { setScope(value as PlayerPosterRequest["scope"]); setComparisonMetrics(undefined); setInspectedStat(null); setStatus(""); }}
                  options={posterScopeIds.map(id => ({ value: id, label: design === "comparison" ? comparisonScopeLabel(data, id) : posterScopeLabel(data, id, posterPlayer) }))}
                />
              </div>
              {design === "comparison" && <ComparisonPosterControls poster={availableComparison} metrics={comparisonMetrics} showBars={showComparisonBars}
                onMetricsChange={metrics => { setComparisonMetrics(metrics); setInspectedStat(null); setStatus(""); }}
                onBarsChange={show => { setShowComparisonBars(show); setStatus(""); }} />}
              <details className={styles.statistics}>
                <summary>{t("View statistics")}<ChevronDown size={15} aria-hidden="true" /></summary>
              {design === "poster" ? <div className={`${styles.summary} ${styles.posterSummary}`}>
                <strong>{posterPlayer === "messi" ? "Lionel Messi" : "Cristiano Ronaldo"}</strong>
                <span>{t(poster.competition)} · {poster.date}</span>
                <dl>
                  {[{ label: "Goals", value: poster.goals }, ...poster.metrics].map(metric => <div key={metric.label}>
                    <dt>{t(metric.label)}</dt><dd>{metric.value}</dd>
                  </div>)}
                </dl>
              </div> : <div className={styles.summary}>
                <strong>Messi vs Ronaldo</strong>
                <span>{t(comparison.competition)} · {comparison.date}</span>
                <table className={styles.comparisonSummary}>
                  <caption className="sr-only">{t("Comparison poster statistics")}</caption>
                  <thead><tr><th scope="col">{t("Statistic")}</th><th scope="col">Messi</th><th scope="col">Ronaldo</th></tr></thead>
                  <tbody>{comparison.rows.map(row => <tr key={row.id}>
                    <th scope="row">{t(row.label)}</th>
                    <td>{comparisonRowValue(row, "messi")}</td><td>{comparisonRowValue(row, "ronaldo")}</td>
                  </tr>)}</tbody>
                </table>
              </div>}
              </details>
            </>}
            {design === "stat" && stats.length > 1 && (
              <div className={styles.field}>
                <label htmlFor={`${uid}-stat`}>{t("Statistic")}</label>
                <Select
                  id={`${uid}-stat`}
                  label="Statistic"
                  value={index}
                  onValueChange={(value) => {
                    setIndex(value);
                    setAttempt((n) => n + 1);
                    setStatus("");
                  }}
                  portalContainer={portal}
                  options={stats.map((s, i) => ({
                    value: String(i),
                    label: stats.some(
                      (other, n) => n !== i && other.title === s.title,
                    )
                      ? `${s.title} · ${s.context}`
                      : s.title,
                  }))}
                />
              </div>
            )}
            {design === "stat" && <div className={styles.summary}>
              <strong>{t(stat.title)}</strong>
              <span>{t(stat.context)}</span>
              <dl>
                {(["messi", "ronaldo"] as const)
                  .filter((p) => player === "both" || p === player)
                  .map((p) => (
                    <div key={p}>
                      <dt>{p === "messi" ? "Messi" : "Ronaldo"}</dt>
                      <dd>{imageValue(stat, p)}</dd>
                    </div>
                  ))}
              </dl>
            </div>}
            <fieldset className={styles.fieldset}>
              <legend>{t("Image theme")}</legend>
              <div className={styles.themes}>
                {(["dark", "light"] as const).map((choice) => (
                  <button
                    type="button"
                    key={choice}
                    aria-pressed={theme === choice}
                    onClick={() => {
                      if (choice !== theme) {
                        setTheme(choice);
                        setAttempt((n) => n + 1);
                        setStatus("");
                      }
                    }}
                  >
                    {choice === "dark" ? (
                      <Moon size={17} aria-hidden="true" />
                    ) : (
                      <Sun size={17} aria-hidden="true" />
                    )}
                    {t(choice === "dark" ? "Dark" : "Light")}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className={styles.fieldset}>
              <legend>{t("Image format")}</legend>
              <div className={styles.formats}>
                {(
                  Object.entries(imageFormats) as [
                    ImageFormat,
                    (typeof imageFormats)[ImageFormat],
                  ][]
                ).map(([key, value]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => {
                      if (key !== format) {
                        setFormat(key);
                        setZoom(null);
                        setAttempt((n) => n + 1);
                        setStatus("");
                      }
                    }}
                    aria-pressed={format === key}
                  >
                    <span
                      className={styles.shape}
                      style={{ aspectRatio: `${value.width}/${value.height}` }}
                      aria-hidden="true"
                    />
                    <span>{t(value.label)}</span>
                    <small>
                      {value.width} × {value.height}
                    </small>
                  </button>
                ))}
              </div>
            </fieldset>
            {design === "stat" && <div className={styles.field}>
              <label htmlFor={`${uid}-player`}>{t("Players in image")}</label>
              <Select
                id={`${uid}-player`}
                label="Players in image"
                value={player}
                onValueChange={(value) => {
                  setPlayer(value as ImagePlayers);
                  setAttempt((n) => n + 1);
                  setStatus("");
                }}
                portalContainer={portal}
                options={[
                  ...(initialPlayer === "both"
                    ? [{ value: "both", label: "Both players" }]
                    : []),
                  ...(["messi", "ronaldo"] as const)
                    .filter(
                      (p) => initialPlayer === "both" || initialPlayer === p,
                    )
                    .map((p) => ({
                      value: p,
                      label:
                        p === "messi" ? "Lionel Messi" : "Cristiano Ronaldo",
                    })),
                ]}
              />
            </div>}
            <p className={styles.help}>
              {t(
                design === "comparison"
                  ? "Compare both players using published stats. Career posters include trophies and awards; tournament posters use competition totals. Data dates and counting notes are included."
                  : design === "poster"
                  ? "Posters use published tournament totals, national flags and English labels. The data date and coverage notes are included."
                  : "Images use English labels. The selected filters, data date and coverage notes are included.",
              )}
            </p>
          </div>
          <section className={styles.preview} aria-label={t("Image preview")}>
            <div className={styles.previewToolbar}>
              <span className={styles.previewLabel}><span className={styles.liveDot} data-loading={!ready && !error} />{t("Live preview")}</span>
              <button type="button" className={styles.iconButton} aria-label={t(expanded ? "Show controls" : "Expand preview")} aria-pressed={expanded} onClick={() => setExpanded(value => !value)}>
                {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>
            </div>
            <div ref={stage} className={styles.stage} tabIndex={0} role="region" aria-label={t("Scrollable image preview")} aria-busy={!ready && !error}>
              {image && !error && (
                <div className={styles.canvas} style={{ width: dimensions.width * scale + canvasPadding * 2, height: dimensions.height * scale + canvasPadding * 2, padding: canvasPadding, minWidth: "100%", minHeight: "100%" }}>
                  <div className={styles.artworkFrame} style={{ width: dimensions.width * scale, height: dimensions.height * scale }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- Preview the actual generated PNG. */}
                    <img key={image.url} src={image.url} width={dimensions.width} height={dimensions.height} alt={image.description} className={styles.artwork} style={{ width: dimensions.width * scale, height: dimensions.height * scale }} />
                    {ready && design === "comparison" && <ComparisonPosterHotspots rows={comparison.rows} format={format} scale={scale} selected={inspectedStat} onSelect={setInspectedStat} />}
                  </div>
                </div>
              )}
              {!image && !error && <div className={styles.skeleton} aria-hidden="true"><span /><span /><span /></div>}
            </div>
            {ready && design === "comparison" && inspectedRow && <ComparisonPosterInsight row={inspectedRow} onClose={() => setInspectedStat(null)} />}
            {(!ready || error) && <div className={styles.previewNotice}>
              {error ? <div className={styles.error} role="alert">
                <p>{t(error)}</p>
                <button type="button" onClick={() => setAttempt(n => n + 1)}>{t("Try again")}</button>
              </div> : <div className={styles.loading} role="status"><LoaderCircle size={17} className={styles.spin} />{t(image ? "Updating preview…" : "Creating image…")}</div>}
            </div>}
            <div className={styles.previewBottom}>
              <span className={styles.previewDimensions}>{design === "comparison" ? t("Tap a stat to explore") : `${imageFormats[format].width} × ${imageFormats[format].height}`} <span>PNG</span></span>
              <div className={styles.zoomControls} role="group" aria-label={t("Preview zoom")}>
                <button type="button" aria-label={t("Zoom out")} disabled={!ready || scale <= .25} onClick={() => setZoom(Math.max(.25, Math.ceil(scale * 4 - 1) / 4))}><Minus size={15} /></button>
                <output aria-live="polite" aria-label={t("Zoom level")}>{Math.round(scale * 100)}%</output>
                <button type="button" aria-label={t("Zoom in")} disabled={!ready || scale >= 1.5} onClick={() => setZoom(Math.min(1.5, Math.floor(scale * 4 + 1) / 4))}><Plus size={15} /></button>
                <button type="button" className={styles.fitButton} aria-pressed={zoom === null} onClick={() => setZoom(null)}><Focus size={15} />{t("Fit")}</button>
              </div>
            </div>
          </section>
        </div>
        <footer className={styles.footer}>
          <div className={styles.exportInfo} aria-live="polite">
            <strong>{status ? t(status) : t(ready ? "Ready to share" : error ? "Image unavailable" : "Preparing your image…")}</strong>
            <span>{t(imageFormats[format].label)} · {imageFormats[format].width} × {imageFormats[format].height}{ready ? ` · ${(ready.file.size / 1024 / 1024).toFixed(1)} MB` : ""}</span>
          </div>
          <div className={styles.actions}>
              {ready && !error ? (
                <a
                  className={styles.primary}
                  href={downloadUrl}
                  download={ready.file.name}
                  target="_blank"
                  rel="noopener"
                  onClick={() => setStatus("Download started.")}
                >
                  <Download size={18} />
                  {t("Download PNG")}
                </a>
              ) : (
                <button type="button" className={styles.primary} disabled>
                  <LoaderCircle
                    size={18}
                    className={!error ? styles.spin : undefined}
                  />
                  {t(error ? "Image unavailable" : "Creating image…")}
                </button>
              )}
              {ready && !error && (
                <>
                  <div className={styles.secondaryActions}>
                    {ready.shareable && (
                      <button type="button" onClick={share} title={t("Share image")}>
                        <Share2 size={17} />
                        <span className={styles.secondaryLabel}>{t("Share image")}</span>
                      </button>
                    )}
                    <a href={`${downloadUrl}&inline=1`} target="_blank" rel="noopener" title={t("Open image")}>
                      <ExternalLink size={17} />
                      <span className={styles.secondaryLabel}>{t("Open image")}</span>
                    </a>
                  </div>
                </>
              )}
            </div>
        </footer>
      </div>
    </dialog>
  );
}
