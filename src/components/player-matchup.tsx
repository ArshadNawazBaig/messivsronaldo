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
        <div className="player-portrait">
        <div className="player-photo"><Image src={player.image} alt={id === "messi" ? "Lionel Messi playing for Argentina at the 2022 World Cup" : "Cristiano Ronaldo playing for Portugal at the 2018 World Cup"} fill priority sizes="(max-width: 640px) 46vw, (max-width: 1100px) 35vw, 550px" /></div>
        <div className="player-card-shade" />
        <div className="player-country"><span className={`country-flag ${id}`} aria-hidden="true" />{player.country}<span className="player-shirt">NO. {player.number}</span></div>
        <div className="player-identity"><h2><span>{id === "messi" ? "Lionel" : "Cristiano"}</span>{player.short}</h2></div>
        <Link className="player-profile-link" href={`/players/${id}`} aria-label={`View ${player.name}'s profile`}><ArrowUpRight size={21} /></Link>
        </div>
        <div className="player-score"><span className="big-score">{values[id].toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}</span><div><span>{label}</span><span>{context}</span></div></div>
      </article>;
    })}
  </div>;
}
