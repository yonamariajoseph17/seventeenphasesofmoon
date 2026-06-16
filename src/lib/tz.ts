// Timezone formatting helpers.
// Converts a decimal UTC offset (e.g. 5.5, -5, 9) into an official label
// such as "IST (UTC+05:30)", "EST (UTC−05:00)", "JST (UTC+09:00)".

const MINUS = "\u2212"; // proper minus sign

const TZ_ABBR: Record<string, string> = {
  "5.5": "IST",
  "0": "GMT",
  "1": "CET",
  "2": "EET",
  "-5": "EST",
  "-6": "CST",
  "-7": "MST",
  "-8": "PST",
  "9": "JST",
  "8": "CST",
  "10": "AEST",
  "5.75": "NPT",
  "4": "GST",
  "3": "MSK",
  "-3": "ART",
  "5": "PKT",
  "6": "BST",
  "7": "ICT",
  "-4": "AST",
  "11": "AEDT",
  "12": "NZST",
  "-10": "HST",
};

/** "UTC+05:30" / "UTC−05:00" style offset. */
export function formatUtcOffset(tz: number): string {
  const sign = tz < 0 ? MINUS : "+";
  const abs = Math.abs(tz);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `UTC${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Full label: "IST (UTC+05:30)" when known, otherwise just the offset. */
export function tzLabel(tz: number): string {
  const abbr = TZ_ABBR[String(tz)];
  const off = formatUtcOffset(tz);
  return abbr ? `${abbr} (${off})` : off;
}
