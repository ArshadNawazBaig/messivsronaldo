"use client";
import NextLink from "next/link";
import { useRouter as useNextRouter } from "next/navigation";
import { type ComponentProps } from "react";
import { localizedPath } from "@/lib/i18n/config";
import { useI18n } from "./i18n-provider";

export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const { locale } = useI18n();
  const localized = typeof href === "string" ? localizedPath(href, locale) : { ...href, pathname: href.pathname ? localizedPath(href.pathname, locale) : href.pathname };
  return <NextLink {...props} href={localized} />;
}
export function useRouter() {
  const router = useNextRouter();
  const { locale } = useI18n();
  return { ...router, push: (href: string) => router.push(localizedPath(href, locale)), replace: (href: string) => router.replace(localizedPath(href, locale)) };
}
