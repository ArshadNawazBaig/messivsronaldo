"use client";
import { StatImageButton } from "@/components/admin-stat-export";
import type { StatImage } from "@/lib/stat-image";
import { useI18n } from "@/components/i18n-provider";
import Image from "next/image";
import Link from "@/components/localized-link";
import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { players, type PlayerId } from "@/lib/data";
import { playerArtworkStyle, playerPortraits } from "@/lib/player-artwork";
import portraitStyles from "./player-portrait.module.css";
type PlayerMatchupProps = {
    values: Record<PlayerId, number | null>;
    label: string;
    accessibleLabel: string;
    context: string;
    details?: Record<PlayerId, string>;
    decimals?: number;
    exportData: Omit<StatImage, "values" | "decimals">;
};
export function PlayerMatchup({ values, label, accessibleLabel, context, details, decimals = 0, exportData }: PlayerMatchupProps) {
    const { t, numberLocale } = useI18n();
    return <><div className="player-matchup">
    {(["messi", "ronaldo"] as const).map(id => {
            const player = players[id];
            const portrait = playerPortraits[id];
            const colors = playerArtworkStyle(id) as CSSProperties;
            const value = values[id];
            const score = value === null ? "—" : value.toLocaleString(numberLocale, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
            return <article className={`player-card ${id}`} style={colors} key={id} aria-label={t(`${player.name}: ${value === null ? "unavailable" : value.toFixed(decimals)} ${accessibleLabel}`)}>
        <Link className="player-portrait" href={`/players/${id}`} aria-label={t(`View ${player.name}'s profile`)}>
          <div className="player-card-copy">
            <div className="player-card-stage">
              {/* Match the 154%-height portrait crop, including the narrow-card layout. */}
              <div className={`player-photo ${portraitStyles.frame}`}><Image className={portraitStyles.image} src={portrait.src} alt={t(player.imageAlt)} width={portrait.width} height={portrait.height} loading="eager" fetchPriority="high" quality={75} sizes="(max-width: 440px) 132px, (max-width: 700px) calc(35vw - 20px), (max-width: 925px) 220px, 253px"/></div>
              <div className="player-country"><span className={`country-flag ${id}`} aria-hidden="true"/><span>{t(player.countryCode)}</span><span className="player-epithet"><span className="country-separator" aria-hidden="true">/</span>{t(id === "messi" ? "The playmaker" : "The goal machine")}</span></div>
              <span className="player-shirt-number" aria-hidden="true">#{player.number}</span>
              <div className="player-identity"><h2><span>{t(id === "messi" ? "Lionel" : "Cristiano")}</span>{t(player.short)}</h2><p>{t(id === "messi" ? "The art of possibility." : "The pursuit of extraordinary.")}</p></div>
            </div>
            <div className="player-score"><span className={`big-score${score.length > 4 ? " is-wide-score" : ""}`}>{t(score)}</span><div><span>{t(label)}</span><span>{t(context)}</span>{details && <span>{t(details[id])}</span>}</div><span className="player-profile-link" aria-hidden="true"><ArrowUpRight size={20}/></span></div>
          </div>
        </Link>
      </article>;
        })}
    <span className="versus-badge" aria-hidden="true">{t("VS")}</span>
  </div><StatImageButton placement="toolbar" stat={{ ...exportData, values, decimals }}/></>;
}
