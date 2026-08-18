export const MAX_BATCH_CODES = 100;

export function splitCodes(raw: string, max = MAX_BATCH_CODES): { codes: string[]; truncated: boolean } {
  const parts = raw.split(/[,;\s]+/);
  const seen = new Set<string>();
  const codes: string[] = [];
  let extra = false;
  for (const part of parts) {
    const code = part.trim();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    if (codes.length >= max) {
      extra = true;
      continue;
    }
    codes.push(code);
  }
  return { codes, truncated: extra };
}
