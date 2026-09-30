import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (error, _request, context) => {
  // Load the Node-only logger only in the server runtime, not in the proxy.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportServerError } = await import("./lib/operations");
    reportServerError(error, context.routeType);
  }
};
