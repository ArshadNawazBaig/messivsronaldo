import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { players, type PlayerId } from "@/lib/data";

type PlayerMatchupProps = {
  values: Record<PlayerId, number>;
  label: string;
  accessibleLabel: string;
  context: string;
  decimals?: number;
};

export function PlayerMatchup({ values, label, accessibleLabel, context, decimals = 0 }: PlayerMatchupProps) {
  return <div className="player-matchup">
    {(["messi", "ronaldo"] as const).map(id => {
      const player = players[id];
      return <article className={`player-card ${id}`} key={id} aria-label={`${player.name}: ${values[id].toFixed(decimals)} ${accessibleLabel}`}>
        <Link className="player-portrait" href={`/players/${id}`} aria-label={`View ${player.name}'s profile`}>
          <div className="player-photo"><Image src={player.image} alt={player.imageAlt} width={player.imageWidth} height={player.imageHeight} priority quality={85} sizes={id === "messi" ? "(max-width: 540px) 220px, 340px" : "(max-width: 540px) 380px, 580px"} /></div>
          <div className="player-card-shade" aria-hidden="true" />
          <div className="player-card-copy">
            <div className="player-country"><span className={`country-flag ${id}`} aria-hidden="true" /><span>{player.countryCode}</span><span className="player-epithet"><span className="country-separator" aria-hidden="true">/</span>{id === "messi" ? "The playmaker" : "The goal machine"}</span></div>
            <div className="player-identity"><h2><span>{id === "messi" ? "Lionel" : "Cristiano"}</span>{player.short}<span className="player-name-period" aria-hidden="true">.</span></h2><p>{id === "messi" ? "The art of possibility." : "The pursuit of extraordinary."}</p></div>
            <div className="player-score"><span className="big-score">{values[id].toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}</span><div><span>{label}</span><span>{context}</span></div></div>
            <span className="player-profile-link" aria-hidden="true"><ArrowUpRight size={20} /></span>
          </div>
        </Link>
      </article>;
    })}
    <span className="versus-badge" aria-hidden="true">VS</span>
  </div>;
}
