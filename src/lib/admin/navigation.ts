export const adminHome = "/admin/dahsboard";
export const adminNavigation = [
  { label: "Workspace", items: [
    { href: adminHome, label: "Overview", description: "Your publication at a glance", icon: "overview" },
    { href: "/admin/blog", label: "Posts & articles", description: "Write, edit and publish in nine languages", icon: "content" },
    { href: "/admin/matches", label: "Match records", description: "Search and correct published matches", icon: "matches" },
    { href: "/admin/players", label: "Players", description: "Player totals and individual match records", icon: "players" },
    { href: "/admin/statistics", label: "Add statistics", description: "Enter a verified match and scoring breakdown", icon: "statistics" },
  ] },
  { label: "Operations", items: [
    { href: "/admin/updates", label: "Data updates", description: "Sync and verify the latest match statistics", icon: "updates" },
    { href: "/admin/review", label: "Content review", description: "Check content coverage and editorial quality", icon: "review" },
    { href: "/admin/support", label: "Support inbox", description: "Review reader questions and correction requests", icon: "support" },
    { href: "/admin/activity", label: "Activity log", description: "Review publications and restore the last version", icon: "activity" },
    { href: "/admin/settings", label: "Settings", description: "Manage your data provider and account information", icon: "settings" },
  ] },
] as const;
export type AdminNavIcon = (typeof adminNavigation)[number]["items"][number]["icon"];
export const adminSections = {
  matches: { tab: "records", title: "Match records", description: "Every published match, with its source and scoring details." },
  statistics: { tab: "records", title: "Add statistics", description: "Publish a verified match. Player and competition totals update together." },
  updates: { tab: "updates", title: "Data updates", description: "Keep the archive current with verified provider data." },
  activity: { tab: "activity", title: "Activity log", description: "Review every statistical publication and recover a previous version." },
  review: { tab: "content", title: "Content review", description: "A working checklist for the quality and coverage of your publication." },
  settings: { tab: "settings", title: "Settings", description: "Manage the connection that keeps your statistics up to date." },
} as const;
export type AdminSection = keyof typeof adminSections;
export function isAdminSection(value: string): value is AdminSection { return Object.hasOwn(adminSections, value); }
