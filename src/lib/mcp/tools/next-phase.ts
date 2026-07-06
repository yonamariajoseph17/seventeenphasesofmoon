import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { nextPhaseTransition } from "@/lib/astro-accurate";

export default defineTool({
  name: "next_moon_phase",
  title: "Next principal moon phase",
  description:
    "Find the next principal Moon phase (New Moon, First Quarter, Full Moon, or Last Quarter) after a given date-time. Returns the phase name and its exact UTC instant.",
  inputSchema: {
    datetime: z
      .string()
      .describe("ISO 8601 date-time in UTC to search after, e.g. '2026-07-06T00:00:00Z'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ datetime }) => {
    const date = new Date(datetime);
    if (Number.isNaN(date.getTime())) {
      return {
        content: [{ type: "text", text: `Invalid datetime: "${datetime}". Use ISO 8601, e.g. 2026-07-06T00:00:00Z.` }],
        isError: true,
      };
    }
    const next = nextPhaseTransition(date);
    if (!next) {
      return {
        content: [{ type: "text", text: "Could not determine the next moon phase transition." }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: `Next: ${next.name} at ${next.date.toISOString()}.` }],
      structuredContent: { name: next.name, datetime: next.date.toISOString() },
    };
  },
});
