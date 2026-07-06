import { defineMcp } from "@lovable.dev/mcp-js";
import moonPhaseTool from "./tools/moon-phase";
import riseSetTool from "./tools/rise-set";
import nextPhaseTool from "./tools/next-phase";
import findLocationTool from "./tools/find-location";

export default defineMcp({
  name: "sky-we-share-mcp",
  title: "Sky We Share",
  version: "0.1.0",
  instructions:
    "Verified-astronomy tools from Sky We Share. Use `find_location` to resolve a birthplace to coordinates and UTC offset, `moon_phase` for the exact Moon phase at a moment, `moon_sun_rise_set` for rise/set times on a date, and `next_moon_phase` for the upcoming phase transition. All results are computed with real ephemerides — never estimated.",
  tools: [findLocationTool, moonPhaseTool, riseSetTool, nextPhaseTool],
});
