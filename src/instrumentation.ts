import type { Instrumentation } from "next";

export function register() {
  // No tracing provider configured (Sentry/OpenTelemetry can be added here).
}

// One structured JSON line per server error (render, route handler, server
// action). Vercel's log view and `docker logs` on AWS pick it up as-is; the
// digest matches the one shown to the user on the error page.
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(
    JSON.stringify({
      level: "error",
      time: new Date().toISOString(),
      message: err.message,
      digest: (err as Error & { digest?: string }).digest,
      stack: err.stack?.split("\n").slice(0, 6).join("\n"),
      method: request.method,
      path: request.path,
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
      revalidateReason: context.revalidateReason,
    })
  );
};
