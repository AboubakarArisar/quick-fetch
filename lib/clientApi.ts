export function getClientApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "") ?? "";
}

export function toApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getClientApiBaseUrl()}${normalizedPath}`;
}
