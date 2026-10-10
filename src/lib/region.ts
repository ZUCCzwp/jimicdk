export function countryName(code: string, locale: "zh" | "en"): string {
  const region = code.trim().toUpperCase();
  if (!region) return "";
  try {
    return new Intl.DisplayNames([locale === "en" ? "en" : "zh-Hans"], { type: "region" }).of(region) || region;
  } catch {
    return region;
  }
}
