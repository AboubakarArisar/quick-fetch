export type ClipBounds = {
  start?: number;
  end?: number;
};

export function sanitizeClipBounds(bounds: ClipBounds): ClipBounds {
  const { start, end } = bounds;
  if (start === undefined || end === undefined) return {};
  if (!Number.isFinite(start) || !Number.isFinite(end)) return {};
  if (start < 0 || end <= start) return {};
  return { start, end };
}

export function toTrimDescription(bounds: ClipBounds): string {
  if (bounds.start === undefined || bounds.end === undefined) return "full";
  return `trim-${bounds.start}-${bounds.end}`;
}
