import {
  Accessibility, ArrowLeftRight, Award, BadgeCheck, BookOpen, Calculator,
  CalendarDays, CalendarRange, ChartNoAxesCombined, CircleDot, CircleHelp,
  Cookie, Earth, Flag, FlagTriangleRight, Gamepad2, Goal, History, Info,
  ListOrdered, Mail, Map, Medal, Milestone, PanelsTopLeft, Route, ScrollText,
  Shield, ShieldCheck, Shirt, Signpost, Swords, Target, Trophy, Waypoints,
  type LucideProps,
} from "lucide-react";

// Football-specific symbols use the same 24px grid and stroke as the icon set.
function GoldenBall({ size = 24, strokeWidth = 1.7, ...props }: LucideProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="9" r="7"/><path d="m12 5 3.8 2.8-1.4 4.5H9.6L8.2 7.8 12 5ZM12 5V2M8.2 7.8 5.3 6.9m4.3 5.4-1.8 2.8m6.6-2.8 1.8 2.8m-.4-7.3 2.9-.9M9 16l-1 3h8l-1-3M7 19v3h10v-3"/></svg>;
}

function GoldenBoot({ size = 24, strokeWidth = 1.7, ...props }: LucideProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h5l2 5 8 3c2 .7 3 1.8 3 4H3V6ZM3 14h4M9 9l-2 1m4 1-2 1m5 0-2 1M3 18v2h3v-2m4 0v2h3v-2m4 0v2h3v-2"/></svg>;
}

function EuropeanCup({ size = 24, strokeWidth = 1.7, ...props }: LucideProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M7 3h10v7c0 4-2.2 6-5 6s-5-2-5-6V3ZM7 5C2 1 1 7 4 10l3 2m10-7c5-4 6 2 3 5l-3 2m-7 4v3h4v-3m-6 6v-3h8v3H8Z"/></svg>;
}

function FreeKick({ size = 24, strokeWidth = 1.7, ...props }: LucideProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="5" cy="19" r="2.5"/><path d="M5 12c0-5 4-9 9-9h6m-4 4 4-4M16 3h4v4M12 20v-7m4 7v-7m4 7v-7"/></svg>;
}

function HatTrick({ size = 24, strokeWidth = 1.7, ...props }: LucideProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="6" r="4"/><circle cx="6" cy="17" r="4"/><circle cx="18" cy="17" r="4"/><path d="M11 5h1v3M5 16h2l-2 2h2m10-2h2l-1 1 1 1h-2"/></svg>;
}

const icons = {
  "/": PanelsTopLeft, "/compare": ArrowLeftRight,
  "/2026": CalendarDays, "/seasons": CalendarRange,
  "/clubs": Shirt, "/champions-league": EuropeanCup, "/la-liga": CircleDot,
  "/league": ListOrdered, "/european-clubs": Map,
  "/international": Flag, "/world-cup": Earth, "/copa-america-vs-euros": FlagTriangleRight,
  "/scoring-calculator": Calculator, "/goals": Goal, "/assists": Waypoints,
  "/penalties": Target, "/free-kicks": FreeKick, "/hat-tricks": HatTrick,
  "/head-to-head": Swords, "/records": Milestone,
  "/honours": Trophy, "/ballon-dor": GoldenBall, "/golden-boots": GoldenBoot,
  "/man-of-the-match": Medal, "/fifa-awards": Award, "/uefa-awards": BadgeCheck,
  "/tools": Gamepad2, "/football-quiz": CircleHelp, "/career-timeline": ChartNoAxesCombined,
  "/milestone-planner": Route, "/insights": BookOpen, "/methodology": ShieldCheck,
  "/updates": History, "/about": Info,
  "/terms": ScrollText, "/privacy": Shield, "/cookies": Cookie,
  "/contact": Mail, "/accessibility": Accessibility, "/sitemap": Signpost,
} as const;

export function NavigationIcon({ href, ...props }: LucideProps & { href: string }) {
  const Icon = icons[href as keyof typeof icons] ?? BookOpen;
  return <Icon {...props}/>;
}
