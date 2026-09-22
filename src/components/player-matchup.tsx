"use client";
import { useI18n } from "@/components/i18n-provider";
import Image from "next/image";
import Link from "@/components/localized-link";
import { ArrowUpRight } from "lucide-react";
import { players, type PlayerId } from "@/lib/data";
type PlayerMatchupProps = {
    values: Record<PlayerId, number | null>;
    label: string;
    accessibleLabel: string;
    context: string;
    details?: Record<PlayerId, string>;
    decimals?: number;
};
export function PlayerMatchup({ values, label, accessibleLabel, context, details, decimals = 0 }: PlayerMatchupProps) {
    const { t, numberLocale } = useI18n();
    return <div className="player-matchup">
    {(["messi", "ronaldo"] as const).map(id => {
            const player = players[id];
            const value = values[id];
            const score = value === null ? "—" : value.toLocaleString(numberLocale, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
            return <article className={`player-card ${id}`} key={id} aria-label={t(`${player.name}: ${value === null ? "unavailable" : value.toFixed(decimals)} ${accessibleLabel}`)}>
        <Link className="player-portrait" href={`/players/${id}`} aria-label={t(`View ${player.name}'s profile`)}>
          <div className="player-photo"><Image src={player.image} alt={t(player.imageAlt)} width={player.imageWidth} height={player.imageHeight} priority quality={85} sizes={id === "messi" ? "(max-width: 540px) 220px, 340px" : "(max-width: 540px) 380px, 580px"}/></div>
          <div className="player-card-shade" aria-hidden="true"/>
          <div className="player-card-copy">
            <div className="player-country"><span className={`country-flag ${id}`} aria-hidden="true"/><span>{t(player.countryCode)}</span><span className="player-epithet"><span className="country-separator" aria-hidden="true">/</span>{t(id === "messi" ? "The playmaker" : "The goal machine")}</span></div>
            <div className="player-identity"><h2><span>{t(id === "messi" ? "Lionel" : "Cristiano")}</span>{t(player.short)}<span className="player-name-period" aria-hidden="true">.</span></h2><p>{t(id === "messi" ? "The art of possibility." : "The pursuit of extraordinary.")}</p></div>
            <div className="player-score"><span className={`big-score${score.length > 4 ? " is-wide-score" : ""}`}>{t(score)}</span><div><span>{t(label)}</span><span>{t(context)}</span>{details && <span>{t(details[id])}</span>}</div></div>
            <span className="player-profile-link" aria-hidden="true"><ArrowUpRight size={20}/></span>
          </div>
        </Link>
      </article>;
        })}
    <span className="versus-badge" aria-hidden="true">{t("VS")}</span>
  </div>;
}
