export function isLocalhost(apiUrl: string): boolean {
  const url = new URL(apiUrl);
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "::1") return true;
  if (hostname.startsWith("127.")) return true;
  if (hostname === "0.0.0.0") return true;
  return false;
}
