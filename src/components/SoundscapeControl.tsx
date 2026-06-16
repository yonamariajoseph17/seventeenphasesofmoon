import { useState } from "react";
import { SOUNDSCAPES, type SoundscapeId } from "@/lib/useAmbient";

interface Props {
  current: SoundscapeId;
  onSelect: (id: SoundscapeId) => void;
  /** Optional theme colors for use on letter pages (overrides design tokens). */
  accent?: string;
  panelBg?: string;
}

/**
 * Elegant, minimal soundscape control. Collapsed it shows a single ☾ button;
 * expanded it reveals the curated soundscape list. Default state is muted.
 */
export function SoundscapeControl({ current, onSelect, accent, panelBg }: Props) {
  const [open, setOpen] = useState(false);
  const playing = current !== "off";

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Soundscape"
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] tracking-[0.25em] uppercase backdrop-blur-md transition-colors ${
          accent ? "" : "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20"
        }`}
        style={accent ? { borderColor: `${accent}66`, color: accent, background: `${accent}14` } : undefined}
      >
        <span className={playing ? "inline-block animate-pulse" : "inline-block"}>☾</span>
        Soundscape
      </button>

      {open && (
        <div
          className={`w-60 overflow-hidden rounded-2xl border p-1.5 backdrop-blur-md ${
            accent ? "" : "border-border bg-card/90"
          }`}
          style={accent ? { borderColor: `${accent}44`, background: panelBg ?? "rgba(8,10,24,0.9)" } : undefined}
        >
          {SOUNDSCAPES.map((s) => {
            const active = current === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  accent ? "" : active ? "bg-accent/15" : "hover:bg-foreground/5"
                }`}
                style={active && accent ? { background: `${accent}22` } : undefined}
              >
                <span className="min-w-0">
                  <span
                    className={`block truncate text-sm ${accent ? "" : active ? "text-accent" : "text-foreground"}`}
                    style={accent ? { color: active ? accent : `${accent}cc` } : undefined}
                  >
                    {s.label}
                  </span>
                  <span
                    className={`block truncate text-[10px] ${accent ? "" : "text-muted-foreground"}`}
                    style={accent ? { color: `${accent}88` } : undefined}
                  >
                    {s.desc}
                  </span>
                </span>
                {active && s.id !== "off" && (
                  <span className={`shrink-0 text-xs ${accent ? "" : "text-accent"}`} style={accent ? { color: accent } : undefined}>♪</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
