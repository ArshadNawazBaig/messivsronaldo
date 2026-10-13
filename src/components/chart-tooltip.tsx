"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { PlayerId } from "@/lib/football";
import { useI18n } from "./i18n-provider";
import styles from "./chart-tooltip.module.css";

type Entry = { player: PlayerId; value: string };

export function useChartTooltip<T extends Element>() {
  const id = useId();
  const anchorRef = useRef<T>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const cancelDismiss = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
  }, []);
  const show = useCallback(() => { cancelDismiss(); setOpen(true); }, [cancelDismiss]);
  const hide = useCallback(() => { cancelDismiss(); setOpen(false); }, [cancelDismiss]);
  const leave = (event: PointerEvent<Element>) => {
    // A tap keeps the readout open until another tap or Escape dismisses it.
    if (event.pointerType === "touch") return;
    cancelDismiss();
    dismissTimer.current = setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => cancelDismiss, [cancelDismiss]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") hide(); };
    const outside = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && !anchorRef.current?.contains(event.target) && !tooltipRef.current?.contains(event.target)) hide();
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", escape); document.removeEventListener("pointerdown", outside); };
  }, [open, hide]);

  return {
    show,
    hide,
    triggerProps: {
      ref: anchorRef,
      tabIndex: 0,
      "data-chart-trigger": true,
      "aria-describedby": open ? id : undefined,
      onFocus: show,
      onBlur: hide,
      onPointerEnter: (event: PointerEvent<Element>) => { if (event.pointerType === "mouse") show(); },
      onPointerDown: show,
      onPointerLeave: leave,
    },
    tooltipProps: { id, open, anchorRef, tooltipRef, onPointerEnter: show, onPointerLeave: leave },
  };
}

export function ChartTooltip({ id, open, anchorRef, tooltipRef, x = .5, y = 0, title, metric, entries, note, footer, onPointerEnter, onPointerLeave }: {
  id: string;
  open: boolean;
  anchorRef: RefObject<Element | null>;
  tooltipRef: RefObject<HTMLDivElement | null>;
  x?: number;
  y?: number;
  title: string;
  metric: string;
  entries: Entry[];
  note?: string;
  footer?: string;
  onPointerEnter: () => void;
  onPointerLeave: (event: PointerEvent<Element>) => void;
}) {
  const { t, locale } = useI18n();

  // Render outside chart panels so small screens and overflow clipping cannot
  // cut off a readout. Reposition on scroll, resize and changing values.
  useLayoutEffect(() => {
    if (!open || !anchorRef.current || !tooltipRef.current) return;
    const anchor = anchorRef.current;
    const tooltip = tooltipRef.current;
    const viewport = window.visualViewport;
    function position() {
      const bounds = anchor.getBoundingClientRect();
      const point = { x: bounds.left + bounds.width * x, y: bounds.top + bounds.height * y };
      const edge = 12;
      const width = tooltip.offsetWidth;
      const height = tooltip.offsetHeight;
      const viewportWidth = Math.min(document.documentElement.clientWidth, viewport?.width ?? window.innerWidth);
      const viewportHeight = Math.min(window.innerHeight, viewport?.height ?? window.innerHeight);
      const above = point.y - height - 16 >= edge;
      const left = Math.max(edge, Math.min(point.x - width / 2, viewportWidth - width - edge));
      const top = Math.max(edge, Math.min(above ? point.y - height - 16 : point.y + 16, viewportHeight - height - edge));
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.style.setProperty("--tooltip-arrow", `${Math.max(16, Math.min(width - 16, point.x - left))}px`);
      tooltip.dataset.side = above ? "above" : "below";
      tooltip.style.visibility = bounds.bottom > 0 && bounds.top < window.innerHeight && bounds.width > 0 ? "visible" : "hidden";
    }
    position();
    const observer = new ResizeObserver(position);
    observer.observe(anchor);
    observer.observe(tooltip);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    viewport?.addEventListener("resize", position);
    viewport?.addEventListener("scroll", position);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      viewport?.removeEventListener("resize", position);
      viewport?.removeEventListener("scroll", position);
    };
  }, [open, anchorRef, tooltipRef, x, y, title, metric, entries, note, footer]);

  if (!open) return null;
  return createPortal(<div ref={tooltipRef} id={id} className={styles.tooltip} role="tooltip" dir={locale === "ar" ? "rtl" : "ltr"} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
    <div className={styles.heading}><strong>{title}</strong><span>{metric}</span></div>
    <dl className={styles.values}>{entries.map(({ player, value }) => <div key={player} data-player={player}><dt><i aria-hidden="true"/>{t(player === "messi" ? "Messi" : "Ronaldo")}</dt><dd>{value === "—" ? <abbr title={t("Not available")}>{value}</abbr> : value}</dd></div>)}</dl>
    {footer && <p className={styles.footer}>{footer}</p>}
    {note && <p className={styles.note}>{note}</p>}
  </div>, document.body);
}

/** A shared target for horizontal comparison bars without a time axis. */
export function ChartBarTooltip({ children, className, title, metric, entries, note, footer }: {
  children: ReactNode; className?: string; title: string; metric: string; entries: Entry[]; note?: string; footer?: string;
}) {
  const tooltip = useChartTooltip<HTMLDivElement>();
  return <>
    <div {...tooltip.triggerProps} className={className} role="group" aria-label={`${title} · ${metric}`}>{children}</div>
    <ChartTooltip {...tooltip.tooltipProps} title={title} metric={metric} entries={entries} note={note} footer={footer}/>
  </>;
}
