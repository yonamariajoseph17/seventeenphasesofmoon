import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { accurateMoon } from "@/lib/astro-accurate";

export default defineTool({
  name: "moon_phase",
  title: "Moon phase for a date",
  description:
    "Compute the real, astronomy-grade Moon phase for a given date and time (UTC). Returns phase name, illumination fraction, Moon age in days, waxing/waning, and the constellation the Moon is in. Uses VSOP87/ELP2000 ephemerides — never estimated.",
  inputSchema: {
    datetime: z
      .string()
      .describe(
        "ISO 8601 date-time in UTC, e.g. '1998-07-17T14:30:00Z'. A date-only value like '1998-07-17' is treated as UTC midnight.",
      ),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ datetime }) => {
    const date = new Date(datetime);
    if (Number.isNaN(date.getTime())) {
      return {
        content: [{ type: "text", text: `Invalid datetime: "${datetime}". Use ISO 8601, e.g. 1998-07-17T14:30:00Z.` }],
        isError: true,
      };
    }
    const m = accurateMoon(date);
    const summary =
      `${m.emoji} ${m.name} — ${(m.illumination * 100).toFixed(1)}% illuminated, ` +
      `${m.age.toFixed(1)} days old (${m.waxing ? "waxing" : "waning"}). ` +
      `Moon in ${m.constellation} ${m.constellationSymbol}.`;
    return {
      content: [{ type: "text", text: summary }],
      structuredContent: {
        datetime: date.toISOString(),
        name: m.name,
        emoji: m.emoji,
        illumination: m.illumination,
        illuminationPercent: Math.round(m.illumination * 1000) / 10,
        ageDays: Math.round(m.age * 100) / 100,
        phaseAngle: m.phaseAngle,
        waxing: m.waxing,
        constellation: m.constellation,
        constellationSymbol: m.constellationSymbol,
      },
    };
  },
});
