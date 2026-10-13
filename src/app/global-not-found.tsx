import { StatusScreen } from "@/components/status-screen";

export const metadata = { title: "Page Not Found", robots: { index: false, follow: true } };

export default function GlobalNotFound() {
  return <html lang="en"><body className="rivalry-status-standalone"><main><StatusScreen notFound /></main></body></html>;
}
