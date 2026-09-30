import type { Metadata } from "next";
import { StatusScreen } from "@/components/status-screen";

export const metadata: Metadata = { title: "Page Not Found", robots: { index: false, follow: true } };

export default function NotFound() { return <StatusScreen notFound />; }
