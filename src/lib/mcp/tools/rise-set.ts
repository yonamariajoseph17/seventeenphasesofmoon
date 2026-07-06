import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { riseSetForCivilDate } from "@/lib/astro-accurate";

export default defineTool({
  name: "moon_sun_rise_set",
  title: "Moon & Sun rise/set times",
  description:
    "Compute accurate moonrise, moonset, sunrise, and sunset times for a specific calendar date at a given location. Times are returned as ISO 8601 UTC instants; provide the location's UTC offset so the correct civil day is used.",
  inputSchema: {
    date: z.string().describe("Calendar date 'YYYY-MM-DD' in the location's local civil time."),
    lat: z.number().describe("Latitude in decimal degrees (north positive), e.g. 13.08 for Chennai."),
    lon: z.number().describe("Longitude in decimal degrees (east positive), e.g. 80.27 for Chennai."),
    tzOffsetHours: z
      .number()
      .describe("UTC offset in hours for the location, e.g. 5.5 for India Standard Time. Defaults to 0 if omitted."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ date, lat, lon, tzOffsetHours }) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
    if (!m) {
      return {
        content: [{ type: "text", text: `Invalid date: "${date}". Use YYYY-MM-DD.` }],
        isError: true,
      };
    }
    const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const tz = tzOffsetHours ?? 0;
    const rs = riseSetForCivilDate(year, month, day, tz, lat, lon);
    const iso = (d: Date | null) => (d ? d.toISOString() : null);
    return {
      content: [
        {
          type: "text",
          text:
            `On ${date} at ${lat}, ${lon} (UTC${tz >= 0 ? "+" : ""}${tz}):\n` +
            `Sunrise: ${iso(rs.sunrise) ?? "none"}\n` +
            `Sunset: ${iso(rs.sunset) ?? "none"}\n` +
            `Moonrise: ${iso(rs.moonrise) ?? "none"}\n` +
            `Moonset: ${iso(rs.moonset) ?? "none"}`,
        },
      ],
      structuredContent: {
        date,
        lat,
        lon,
        tzOffsetHours: tz,
        sunrise: iso(rs.sunrise),
        sunset: iso(rs.sunset),
        moonrise: iso(rs.moonrise),
        moonset: iso(rs.moonset),
      },
    };
  },
});
