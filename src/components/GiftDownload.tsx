import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { downloadPrintKit, downloadPrintKitFile, taglineFor, type PrintKitData } from "@/lib/printkit";

/**
 * The download screen — share the digital gift, or download the DIY print kit
 * that turns it into a real, physical keepsake.
 */

const KIT_FILES = [
  { name: "letter.pdf", label: "The Letter", note: "A4 · fold guides" },
  { name: "envelope-template.pdf", label: "The Envelope", note: "A4 · cut & fold net" },
  { name: "postcard.pdf", label: "The Postcard", note: "4×6in · 2 sides" },
  { name: "how-to-make.pdf", label: "How To Make It", note: "A6 instruction card" },
  { name: "wax-seal-stickers.pdf", label: "Wax Seals", note: "A4 · 6 stickers" },
  { name: "bouquet-tag.pdf", label: "Bouquet Tag", note: "A6 · cut & tie" },
  { name: "moon-cutouts.pdf", label: "Moon Cutouts", note: "A4 · cut & glue" },
];

interface Props {
  data: PrintKitData;
  giftUrl: string;
  recipient: string;
  /** DIY gifts have no shareable link, so the digital section is hidden. */
  diyOnly?: boolean;
}

export function GiftDownload({ data, giftUrl, recipient, diyOnly = false }: Props) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sizeMb, setSizeMb] = useState<string | null>(null);

  async function copy() {
    try { await navigator.clipboard.writeText(giftUrl); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* ignore */ }
  }

  async function download() {
    setBusy(true);
    try {
      const bytes = await downloadPrintKit(data);
      setSizeMb((bytes / (1024 * 1024)).toFixed(1));
    } finally {
      setBusy(false);
    }
  }

  const shareText = `A moon letter for ${recipient} — ${giftUrl}`;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center" style={{ color: "#ece3d6" }}>
      <h1 className="text-3xl md:text-4xl" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
        Your gift is ready.
      </h1>
      <p className="mt-3 text-sm" style={{ color: "#9aa6c4" }}>Choose how to share or experience it.</p>

      {/* ── Digital ── */}
      {!diyOnly && (
        <section className="mt-12 rounded-2xl p-6 text-left" style={{ border: "1px solid rgba(200,215,255,0.16)", background: "rgba(255,255,255,0.03)" }}>
          <p className="text-[10px] tracking-[0.35em] uppercase" style={{ color: "#9fb3ff" }}>Digital gift</p>
          <h2 className="mt-2 text-xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Share this experience</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={copy} className="rounded-full px-5 py-2.5 text-[11px] tracking-[0.25em] uppercase" style={{ background: "#9fb3ff", color: "#0a1024" }}>
              {copied ? "Link copied" : "Copy gift link"}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="rounded-full px-5 py-2.5 text-[11px] tracking-[0.25em] uppercase" style={{ border: "1px solid rgba(200,215,255,0.4)", color: "#dfe6ff" }}>
              WhatsApp
            </a>
            <a href={`mailto:?subject=${encodeURIComponent(`A moon letter for ${recipient}`)}&body=${encodeURIComponent(shareText)}`} className="rounded-full px-5 py-2.5 text-[11px] tracking-[0.25em] uppercase" style={{ border: "1px solid rgba(200,215,255,0.4)", color: "#dfe6ff" }}>
              Email
            </a>
          </div>
        </section>
      )}

      {/* ── Physical ── */}
      <section className="mt-6 rounded-2xl p-6 text-left" style={{ border: "1px solid rgba(243,201,105,0.28)", background: "rgba(243,201,105,0.05)" }}>
        <p className="text-[10px] tracking-[0.35em] uppercase" style={{ color: "#f3c969" }}>Make it real</p>
        <h2 className="mt-2 text-xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Print, cut and send by hand</h2>
        <p className="mt-2 text-sm" style={{ color: "#c9c0ae" }}>
          Everything you need to recreate this gift as a real physical keepsake.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {KIT_FILES.filter((f) => f.name !== "moon-cutouts.pdf" || data.moonImages?.main).map((f) => (
            <button
              key={f.name}
              type="button"
              onClick={() => downloadPrintKitFile(data, f.name)}
              className="rounded-lg p-3 text-center transition-colors hover:bg-[rgba(243,201,105,0.08)]"
              style={{ border: "1px solid rgba(243,201,105,0.22)" }}
            >
              <div className="mx-auto mb-2 h-8 w-6 rounded-sm" style={{ background: "linear-gradient(160deg,#f6eedb,#e2d0a6)" }} />
              <p className="text-[10px] leading-tight" style={{ color: "#ece3d6" }}>{f.label}</p>
              <p className="mt-1 text-[9px]" style={{ color: "#a09a88" }}>{f.note}</p>
              <p className="mt-1 text-[8px] tracking-[0.2em] uppercase" style={{ color: "#f3c969" }}>Download</p>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={download}
          disabled={busy}
          className="mt-6 w-full rounded-full px-6 py-3 text-[11px] tracking-[0.3em] uppercase disabled:opacity-60"
          style={{ background: "#f3c969", color: "#1a1202" }}
        >
          {busy ? "Preparing your kit…" : "Download Everything (ZIP)  ↓"}
        </button>
        <p className="mt-3 text-center text-[10px] tracking-[0.2em] uppercase" style={{ color: "#a09a88" }}>
          6 files · PDF format{sizeMb ? ` · ${sizeMb}MB` : ""}
        </p>
        <p className="mt-4 text-center text-[11px] leading-relaxed italic" style={{ color: "#c9c0ae", fontFamily: "'Cormorant Garamond', serif" }}>
          This kit was made to be touched, folded and sent by hand. The sky above {data.city} on {data.dateLabel} was real. So is this.
        </p>
      </section>

      <div className="mt-10">
        <Link to="/" className="rounded-full px-6 py-2.5 text-[11px] tracking-[0.3em] uppercase" style={{ border: "1px solid rgba(200,215,255,0.35)", color: "#dfe6ff" }}>
          Create your own →
        </Link>
      </div>

      {/* Pronoun-aware tagline — previously hardcoded to "she" regardless of
          the pronoun chosen on the main form. */}
      <p className="mx-auto mt-12 max-w-md text-[9px] leading-relaxed tracking-[0.22em] uppercase" style={{ color: "#7f8aa6" }}>
        Sky We Share ✦ {taglineFor(data.pronoun)}
      </p>
    </div>
  );
}
