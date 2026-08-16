import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { MoonSvg } from "@/components/MoonSvg";

export interface MoonImageSpec {
  key: string;
  phaseAngle: number;
  illumination: number;
  waxing: boolean;
}

interface MoonImageCaptureProps {
  specs: MoonImageSpec[];
  /** Render size (px) for each off-screen moon before capture. */
  size?: number;
  /** Called once with every successfully captured image, keyed by spec.key. */
  onReady: (images: Record<string, string>) => void;
}

/**
 * Renders each requested moon phase off-screen (using the same MoonSvg the
 * rest of the site uses), captures it to a PNG data URL, and reports the
 * full set back via onReady. Used only for the DIY print kit, which needs
 * static images rather than live SVGs baked into the PDFs.
 */
export function MoonImageCapture({ specs, size = 320, onReady }: MoonImageCaptureProps) {
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [done, setDone] = useState(false);
  // Keep the latest onReady without re-triggering the capture effect if the
  // caller passes a fresh function identity on every render.
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const specsKey = specs.map((s) => s.key).join(",");

  useEffect(() => {
    if (done || specs.length === 0) return;
    let cancelled = false;

    async function capture() {
      const images: Record<string, string> = {};
      for (const spec of specs) {
        const node = nodeRefs.current[spec.key];
        if (!node) continue;
        try {
          const dataUrl = await toPng(node, {
            pixelRatio: 2,
            cacheBust: true,
            backgroundColor: undefined,
          });
          images[spec.key] = dataUrl;
        } catch {
          // Skip a failed capture — the print kit treats a missing entry
          // as "no image" rather than failing the whole gift.
        }
      }
      if (!cancelled) {
        setDone(true);
        onReadyRef.current(images);
      }
    }

    // Let the off-screen SVGs paint before snapshotting them.
    const t = window.setTimeout(capture, 60);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specsKey, done]);

  return (
    <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none", opacity: 0 }} aria-hidden>
      {specs.map((spec) => (
        <div
          key={spec.key}
          ref={(el) => {
            nodeRefs.current[spec.key] = el;
          }}
        >
          <MoonSvg
            phaseAngle={spec.phaseAngle}
            illumination={spec.illumination}
            waxing={spec.waxing}
            size={size}
          />
        </div>
      ))}
    </div>
  );
}
