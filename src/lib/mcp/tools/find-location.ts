import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { searchPresets, resolvePreset } from "@/lib/india-locations";

export default defineTool({
  name: "find_location",
  title: "Find a birthplace location",
  description:
    "Look up coordinates and UTC offset for a city, town, or district — covering every Indian state and union territory (all IST, UTC+05:30) plus major world cities. Accepts alternate/colonial spellings (e.g. Bombay → Mumbai). Returns the best matches for use with the moon and rise/set tools.",
  inputSchema: {
    query: z.string().describe("Place name to search, e.g. 'Madurai', 'Bombay', or 'Guwahati'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query }) => {
    const exact = resolvePreset(query);
    const matches = searchPresets(query, 8);
    const list = exact && !matches.some((p) => p.name === exact.name) ? [exact, ...matches] : matches;
    if (list.length === 0) {
      return {
        content: [{ type: "text", text: `No location found matching "${query}".` }],
        structuredContent: { query, matches: [] },
      };
    }
    const text = list
      .map((p) => `${p.name} — lat ${p.lat}, lon ${p.lon}, UTC+${p.tz}`)
      .join("\n");
    return {
      content: [{ type: "text", text }],
      structuredContent: {
        query,
        matches: list.map((p) => ({ name: p.name, lat: p.lat, lon: p.lon, tzOffsetHours: p.tz })),
      },
    };
  },
});
