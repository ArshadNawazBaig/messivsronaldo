import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const sharp = (await import("sharp")).default;
    // Both next/image and next/og use this native module. Their final responses
    // are already cached; retaining libvips' intermediate images raises idle
    // memory after poster generation. Bound native work before either is used.
    sharp.cache(false);
    sharp.concurrency(1);
  }
}

export const onRequestError: Instrumentation.onRequestError = async (error, _request, context) => {
  // Load the Node-only logger only in the server runtime, not in the proxy.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportServerError } = await import("./lib/operations");
    reportServerError(error, context.routeType);
  }
};
