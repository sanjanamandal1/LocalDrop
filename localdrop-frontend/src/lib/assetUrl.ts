export function assetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  let base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/api$/, "");
  if (typeof window !== "undefined") {
    const currentHost = window.location.hostname;
    if (currentHost && currentHost !== "localhost" && currentHost !== "127.0.0.1") {
      base = base.replace("localhost", currentHost).replace("127.0.0.1", currentHost);
    }
  }
  return `${base}${path}`;
}
