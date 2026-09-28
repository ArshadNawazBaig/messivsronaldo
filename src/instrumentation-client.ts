import { installReactDevTimingGuard } from "@/lib/react-dev-timing";

// Run before hydration, when React flushes server-component timing entries.
if (process.env.NODE_ENV === "development") {
  installReactDevTimingGuard(performance);
}
