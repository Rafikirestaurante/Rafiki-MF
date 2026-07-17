const configuredOrigin = String(Deno.env.get("APP_PUBLIC_URL") || "").replace(/\/$/, "");

export function corsHeaders(request?: Request): Record<string, string> {
  const requestOrigin = request?.headers.get("origin") || "";
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestOrigin);
  const origin = requestOrigin === configuredOrigin || isLocal ? requestOrigin : configuredOrigin || "null";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-employee-access-token",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

export function optionsResponse(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;
  return new Response("ok", { headers: corsHeaders(request) });
}
