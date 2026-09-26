"use client";

import { ArrowUpRight, Facebook, Instagram } from "lucide-react";
import { useI18n } from "./i18n-provider";
import { socialProfiles } from "@/lib/social-profiles";
import styles from "./social-links.module.css";

export function SocialLinks({ showHandles = false }: { showHandles?: boolean }) {
  const { t } = useI18n();
  return <nav className={styles.links} data-details={showHandles} aria-label={t("Follow The Rivalry")}>
    {socialProfiles.map(profile => {
      const Icon = profile.id === "instagram" ? Instagram : Facebook;
      return <a key={profile.id} href={profile.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
        <Icon size={18} aria-hidden="true" />
        <span className={styles.label}><span>{profile.name}</span>{showHandles && <span className={styles.handle} dir="ltr">{profile.handle}</span>}</span>
        <ArrowUpRight className={styles.arrow} size={14} aria-hidden="true" />
        <span className="sr-only"> · {t("Opens in a new tab")}</span>
      </a>;
    })}
  </nav>;
}
