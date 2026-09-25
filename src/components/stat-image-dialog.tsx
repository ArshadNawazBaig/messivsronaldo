"use client";
import { useEffect, useId, useRef, useState } from "react";
import {
  Download,
  ExternalLink,
  LoaderCircle,
  Moon,
  Share2,
  Sun,
  X,
} from "lucide-react";
import { useI18n } from "./i18n-provider";
import { Select } from "./ui/select";
import {
  imageFormats,
  imageValue,
  type ImageFormat,
  type ImagePlayers,
  type ImageTheme,
  type StatImage,
} from "@/lib/stat-image";
import styles from "./stat-image-dialog.module.css";

type ReadyImage = { key: string; url: string; file: File; shareable: boolean };
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
  const [format, setFormat] = useState<ImageFormat>("square");
  const [theme, setTheme] = useState<ImageTheme>(initialTheme);
  const [player, setPlayer] = useState(initialPlayer);
  const [index, setIndex] = useState("0");
  const [image, setImage] = useState<ReadyImage | null>(null);
  const [failure, setFailure] = useState({ key: "", message: "" });
  const [status, setStatus] = useState("");
  const [attempt, setAttempt] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const [portal, setPortal] = useState<HTMLDialogElement | null>(null);
  const close = useRef<HTMLButtonElement>(null);
  const uid = useId();
  const stat = stats[Number(index)];
  const payload = JSON.stringify({ stat, format, players: player, theme });
  const requestKey = `${payload}:${attempt}`;
  const ready = image?.key === requestKey ? image : null;
  const error = failure.key === requestKey ? failure.message : "";

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
    let url = "";
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
        url = URL.createObjectURL(blob);
        let shareable = false;
        try {
          shareable = !!navigator.canShare?.({ files: [file] });
        } catch {
          /* Download remains available. */
        }
        setImage({ key: requestKey, url, file, shareable });
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
    void generate();
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [payload, requestKey]);

  async function share() {
    if (!ready) return;
    try {
      // File is prepared before this click to preserve mobile user activation.
      await navigator.share({
        files: [ready.file],
        title: `${stat.context} · ${stat.title}`,
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
            <span className={styles.badge}>{t("Admin image export")}</span>
            <h2 id={`${uid}-title`}>{t("A stat worth sharing.")}</h2>
            <p id={`${uid}-description`}>
              {t("Your selected comparison, ready for social media.")}
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
        <div className={styles.body}>
          <div className={styles.controls}>
            {stats.length > 1 && (
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
            <div className={styles.summary}>
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
            </div>
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
            <div className={styles.field}>
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
            </div>
            <p className={styles.help}>
              {t(
                "Images use English labels. The selected filters, data date and coverage notes are included.",
              )}
            </p>
            <div className={styles.actions}>
              {ready && !error ? (
                <a
                  className={styles.primary}
                  href={ready.url}
                  download={ready.file.name}
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
                      <button type="button" onClick={share}>
                        <Share2 size={17} />
                        {t("Share image")}
                      </button>
                    )}
                    <a href={ready.url} target="_blank" rel="noopener">
                      <ExternalLink size={17} />
                      {t("Open image")}
                    </a>
                  </div>
                  <p className={styles.help}>
                    {t(
                      "On mobile, save the PNG to Files or use Share image when available. You can also open the image and press and hold to save it.",
                    )}
                  </p>
                </>
              )}
              {status && (
                <p className={styles.help} role="status">
                  {t(status)}
                </p>
              )}
              {error && (
                <div className={styles.error} role="alert">
                  <p>{t(error)}</p>
                  <button
                    type="button"
                    onClick={() => setAttempt((n) => n + 1)}
                  >
                    {t("Try again")}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className={styles.preview} aria-busy={!ready && !error}>
            {ready &&
            !error /* eslint-disable-next-line @next/next/no-img-element -- This is the actual generated PNG, not a remote photo. */ ? (
              <img
                src={ready.url}
                width={imageFormats[format].width}
                height={imageFormats[format].height}
                alt={`${stat.context}: ${stat.title}. ${player !== "ronaldo" ? `Messi ${imageValue(stat, "messi")}. ` : ""}${player !== "messi" ? `Ronaldo ${imageValue(stat, "ronaldo")}.` : ""}`}
              />
            ) : (
              <div className={styles.loading} role="status">
                {!error && <LoaderCircle size={28} className={styles.spin} />}
                <span>
                  {t(error ? "Image unavailable" : "Creating image…")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
