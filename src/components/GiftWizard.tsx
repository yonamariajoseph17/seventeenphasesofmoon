import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { format, parseISO } from "date-fns";
import type { AccurateMoonInfo } from "@/lib/astro-accurate";
import { poeticLine } from "@/lib/poetic";
import {
  LETTER_OCCASIONS, OCCASION_LABELS, FLOWERS, WRAPS,
  type LetterOccasion, type LetterPayload, type FlowerId, type WrapId,
} from "@/lib/letter";
import { createLetter, uploadLetterSong, SONG_ACCEPT, SONG_MAX_BYTES } from "@/lib/letter-store";
import {
  PostcardFront, PostcardBack, POSTCARD_W, POSTCARD_H, type PostcardMilestone,
} from "@/components/Postcard";
import { FlowerBloom, WrapShape, BouquetArrangement, FLOWER_META, WRAP_META } from "@/components/Bouquet";

type BasePayload = Omit<LetterPayload, "style" | "to" | "from" | "msg" | "closing" | "occasion" | "song" | "bouquet" | "place" | "writtenDate">;

interface Props {
  base: BasePayload;
  moon: AccurateMoonInfo;
  city: string;
  dateLabel: string;      // "April 17, 2004"
  timeLabel: string;
  sunriseLabel?: string;
  sunsetLabel?: string;
  moonriseLabel?: string;
  moonsetLabel?: string;
  illumPct: string;
  milestones: PostcardMilestone[];
  personName: string;
}

const PREVIEW_W = 470;
const MAX_FLOWERS = 15;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Linearly scale a font size from `max` down to `min` as text length grows. */
function fitFontPx(len: number, max: number, min: number): number {
  const start = 120; // full size up to this many chars
  const end = 500;   // clamped to min beyond this
  if (len <= start) return max;
  if (len >= end) return min;
  const t = (len - start) / (end - start);
  return Math.round((max - (max - min) * t) * 10) / 10;
}

export function GiftWizard(props: Props) {
  const { base, moon, city, dateLabel, timeLabel, sunriseLabel, sunsetLabel, illumPct, milestones, personName } = props;

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — the letter
  const [to, setTo] = useState("");
  const [greetName, setGreetName] = useState("");
  const [message, setMessage] = useState("");
  const [from, setFrom] = useState("");
  const [place, setPlace] = useState(city);
  const [writtenDate, setWrittenDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [occasion, setOccasion] = useState<LetterOccasion>("birthday");

  // Step 2 — the postcard
  const [flipped, setFlipped] = useState(false);
  const [flipHint, setFlipHint] = useState(false);
  const [exporting, setExporting] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  // Step 3 — the bouquet
  const [subStep, setSubStep] = useState<"flowers" | "wrap" | "assemble">("flowers");
  const [flowers, setFlowers] = useState<FlowerId[]>([]);
  const [wrap, setWrap] = useState<WrapId>("kraft");
  const [songFile, setSongFile] = useState<File | null>(null);
  const songInputRef = useRef<HTMLInputElement>(null);

  // Result
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [letterId, setLetterId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const recipient = to.trim() || greetName.trim() || personName;
  const poetic = poeticLine(moon, recipient);
  // Exact letter-header values chosen by the sender — never auto-derived from astronomy.
  const writtenDateLabel = writtenDate ? format(parseISO(writtenDate), "MMMM d, yyyy") : "";
  const headerPlace = place.trim();
  // Scale handwriting down as the letter grows so it never spills past the paper.
  const composerFontPx = fitFontPx(message.length, 22, 15);

  useEffect(() => {
    if (step !== 2) { setFlipHint(false); return; }
    const t = window.setTimeout(() => setFlipHint(true), 2000);
    return () => window.clearTimeout(t);
  }, [step]);

  const pcProps = {
    style: "vintage" as const,
    moon,
    date: new Date(),
    tz: base.tz,
    city,
    recipient,
    sender: from.trim(),
    occasion: OCCASION_LABELS[occasion],
    message: buildPostcardMessage(recipient, message),
    poetic,
    letterExcerpt: message.trim(),
    illumPct,
    dateLabel,
    timeLabel,
    sunriseLabel,
    sunsetLabel,
    moonriseLabel: props.moonriseLabel,
    moonsetLabel: props.moonsetLabel,
    milestones,
  };

  const countOf = (f: FlowerId) => flowers.filter((x) => x === f).length;
  function incFlower(f: FlowerId) {
    setFlowers((prev) => (prev.length >= MAX_FLOWERS ? prev : [...prev, f]));
  }
  function decFlower(f: FlowerId) {
    setFlowers((prev) => {
      const i = prev.lastIndexOf(f);
      if (i < 0) return prev;
      const next = [...prev];
      next.splice(i, 1);
      return next;
    });
  }

  function pickSong(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > SONG_MAX_BYTES) { setError("Song must be 20MB or smaller."); setSongFile(null); return; }
    setError(null);
    setSongFile(file);
  }

  async function downloadPostcard() {
    if (!frontRef.current || !backRef.current) return;
    setExporting(true);
    try {
      const opts = { pixelRatio: 2, cacheBust: true };
      const [frontUrl, backUrl] = await Promise.all([toPng(frontRef.current, opts), toPng(backRef.current, opts)]);
      const scale = 2;
      const gap = 60 * scale;
      const canvas = document.createElement("canvas");
      canvas.width = POSTCARD_W * scale * 2 + gap;
      canvas.height = POSTCARD_H * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const [imgF, imgB] = await Promise.all([loadImage(frontUrl), loadImage(backUrl)]);
        ctx.drawImage(imgF, 0, 0, POSTCARD_W * scale, POSTCARD_H * scale);
        ctx.drawImage(imgB, POSTCARD_W * scale + gap, 0, POSTCARD_W * scale, POSTCARD_H * scale);
      }
      const a = document.createElement("a");
      a.download = `moon-postcard-${recipient.replace(/[^a-z0-9-_]+/gi, "_").toLowerCase() || "moon"}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } finally {
      setExporting(false);
    }
  }

  async function createGift() {
    setCreating(true);
    setError(null);
    try {
      let payload: LetterPayload = {
        ...base,
        style: "vintage",
        to: to.trim() || greetName.trim() || undefined,
        from: from.trim() || undefined,
        msg: message.trim() || undefined,
        closing: "Yours,",
        place: headerPlace || undefined,
        writtenDate: writtenDateLabel || undefined,
        occasion,
        bouquet: { flowers, wrap },
      };
      if (songFile) payload = { ...payload, song: await uploadLetterSong(songFile) };
      const id = await createLetter(payload);
      setLetterId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the gift. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  const giftUrl = letterId
    ? (typeof window !== "undefined" ? `${window.location.origin}/letter/${letterId}` : `/letter/${letterId}`)
    : "";

  async function copyLink() {
    if (!giftUrl) return;
    try { await navigator.clipboard.writeText(giftUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  }

  // ── Final: gift created ────────────────────────────────────────────
  if (letterId) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-8 text-center backdrop-blur-sm">
        <p className="font-display text-xs tracking-[0.3em] text-accent uppercase">Your gift is ready</p>
        <h3 className="mt-3 font-display text-3xl">A gift for {recipient}, sealed and sent</h3>
        <p className="mt-3 text-sm text-muted-foreground">One link — letter, postcard, and bouquet unfold together when they open it.</p>
        <div className="mx-auto mt-6 max-w-md rounded-lg border border-border bg-background/40 p-3">
          <p className="truncate font-mono text-xs text-foreground/80">{giftUrl}</p>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={copyLink} className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {copied ? "Link copied" : "Copy gift link"}
          </button>
          <a href={`/letter/${letterId}`} target="_blank" rel="noopener noreferrer" className="rounded-md border border-accent px-5 py-2.5 text-sm text-accent hover:bg-accent/10">Open gift</a>
          <a href={`https://wa.me/?text=${encodeURIComponent(`A gift under the same sky for ${recipient} — ${giftUrl}`)}`} target="_blank" rel="noopener noreferrer" className="rounded-md border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground">Share via WhatsApp</a>
        </div>
        <button type="button" onClick={() => { setLetterId(null); setStep(1); }} className="mt-6 text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-foreground">Create another gift</button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress indicator */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {([[1, "The Letter"], [2, "The Postcard"], [3, "The Bouquet"]] as const).map(([n, label]) => (
          <div key={n} className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${step >= n ? "bg-accent text-background" : "border border-border text-muted-foreground"}`}>
              {step > n ? "✓" : n}
            </span>
            <span className={`text-[11px] tracking-[0.25em] uppercase ${step === n ? "text-accent" : "text-muted-foreground"}`}>
              Step {n} of 3 — {label}
            </span>
          </div>
        ))}
      </div>

      {/* ── STEP 1 — THE LETTER ───────────────────────────────────── */}
      {step === 1 && (
        <div>
          <LetterPaper city={city} dateLabel={dateLabel}>
            <div className="text-left">
              <label className="mb-3 block">
                <span className="letterpaper-hand text-2xl">Dear{" "}
                  <input
                    value={greetName}
                    onChange={(e) => setGreetName(e.target.value)}
                    placeholder={personName}
                    maxLength={40}
                    className="letterpaper-hand w-48 border-b border-[#b98a86]/60 bg-transparent text-2xl outline-none placeholder:text-[#7a5a2e]/40"
                  />,
                </span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                rows={7}
                placeholder="Write it as if the pen never lifts — everything you'd want them to read again years from now…"
                className="letterpaper-hand block w-full max-w-full resize-none bg-transparent outline-none placeholder:text-[#7a5a2e]/40"
                style={{ fontSize: composerFontPx, lineHeight: "34px", backgroundImage: "repeating-linear-gradient(transparent, transparent 33px, rgba(90,120,160,0.22) 34px)", overflowWrap: "anywhere", wordBreak: "break-word" }}
              />
              <div className="mt-6 flex items-baseline gap-2">
                <span className="letterpaper-hand text-2xl">Yours,</span>
                <input
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder=""
                  maxLength={40}
                  className="letterpaper-hand min-w-0 flex-1 border-b border-[#b98a86]/40 bg-transparent text-2xl outline-none"
                />
              </div>
            </div>
          </LetterPaper>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-3 text-xs tracking-[0.2em] text-muted-foreground uppercase">
              Occasion
              <select value={occasion} onChange={(e) => setOccasion(e.target.value as LetterOccasion)} className="input max-w-[200px]">
                {LETTER_OCCASIONS.map((o) => <option key={o} value={o}>{OCCASION_LABELS[o]}</option>)}
              </select>
            </label>
            <p className="max-w-xs text-[11px] text-muted-foreground/80">The occasion only sets the quiet opening line they read first — the letter itself stays the same.</p>
          </div>

          <WizardNav onNext={() => { setTo(greetName); setStep(2); }} nextLabel="Continue to the postcard" />
        </div>
      )}

      {/* ── STEP 2 — THE POSTCARD ─────────────────────────────────── */}
      {step === 2 && (
        <div className="flex flex-col items-center">
          <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
            A vintage keepsake — the birth-night moon, your milestone moons, and your message on the back. Every value is drawn from the same verified sky.
          </p>
          <div style={{ perspective: 1600, width: PREVIEW_W, height: PREVIEW_W * (POSTCARD_H / POSTCARD_W) }}>
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="relative h-full w-full cursor-pointer rounded-2xl"
              style={{ transformStyle: "preserve-3d", transition: "transform 0.8s cubic-bezier(0.4,0,0.2,1)", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
              aria-label="Flip postcard"
            >
              <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: 16, overflow: "hidden", boxShadow: "0 22px 60px -20px rgba(0,0,0,0.65)" }}>
                <div style={{ transform: `scale(${PREVIEW_W / POSTCARD_W})`, transformOrigin: "top left", width: POSTCARD_W, height: POSTCARD_H }}>
                  <PostcardFront {...pcProps} />
                </div>
              </div>
              <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: 16, overflow: "hidden", boxShadow: "0 22px 60px -20px rgba(0,0,0,0.65)" }}>
                <div style={{ transform: `scale(${PREVIEW_W / POSTCARD_W})`, transformOrigin: "top left", width: POSTCARD_W, height: POSTCARD_H }}>
                  <PostcardBack {...pcProps} />
                </div>
              </div>
            </button>
          </div>
          {flipHint && !flipped && <p className="mt-4 animate-pulse text-[11px] tracking-[0.3em] text-accent uppercase">Tap to flip ↓</p>}
          <div className="mt-3 flex gap-3">
            <button type="button" onClick={() => setFlipped((f) => !f)} className="rounded-full border border-border px-4 py-1.5 text-[11px] tracking-[0.2em] text-muted-foreground uppercase hover:text-foreground">
              {flipped ? "Show front" : "Flip to back"}
            </button>
            <button type="button" onClick={downloadPostcard} disabled={exporting} className="rounded-full border border-accent/50 px-4 py-1.5 text-[11px] tracking-[0.2em] text-accent uppercase hover:bg-accent/10 disabled:opacity-50">
              {exporting ? "Rendering…" : "Download PNG"}
            </button>
          </div>

          {/* hidden hi-res export nodes */}
          <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none", opacity: 0 }} aria-hidden>
            <PostcardFront ref={frontRef} {...pcProps} />
            <PostcardBack ref={backRef} {...pcProps} />
          </div>

          <WizardNav onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Continue to the bouquet" />
        </div>
      )}

      {/* ── STEP 3 — THE BOUQUET ──────────────────────────────────── */}
      {step === 3 && (
        <div className="flex flex-col items-center">
          {subStep === "flowers" && (
            <>
              <p className="font-display text-xl">Choose Your Flowers <span className="text-accent">({flowers.length}/{MAX_FLOWERS})</span></p>
              <p className="mt-1 text-xs text-muted-foreground">Add as many of each bloom as you like — up to {MAX_FLOWERS} stems.</p>
              <div className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
                {FLOWERS.map((f) => {
                  const count = countOf(f);
                  const atCap = flowers.length >= MAX_FLOWERS;
                  return (
                    <div
                      key={f}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${count > 0 ? "border-accent bg-accent/10" : "border-border/60"}`}
                    >
                      <FlowerBloom flower={f} size={56} />
                      <span className={`text-[11px] tracking-wide ${count > 0 ? "text-accent" : "text-muted-foreground"}`}>{FLOWER_META[f].label}</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => decFlower(f)}
                          disabled={count === 0}
                          aria-label={`Remove one ${FLOWER_META[f].label}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-base leading-none text-foreground disabled:opacity-30 hover:border-accent/60"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm tabular-nums text-foreground">{count}</span>
                        <button
                          type="button"
                          onClick={() => incFlower(f)}
                          disabled={atCap}
                          aria-label={`Add one ${FLOWER_META[f].label}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-base leading-none text-foreground disabled:opacity-30 hover:border-accent/60"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {flowers.length >= MAX_FLOWERS && (
                <p className="mt-3 text-[11px] text-accent">That's a full bunch — {MAX_FLOWERS} stems is the most one wrap can hold.</p>
              )}
              <WizardNav onBack={() => setStep(2)} onNext={() => setSubStep("wrap")} nextLabel="Choose the wrap" nextDisabled={flowers.length === 0} />
            </>
          )}


          {subStep === "wrap" && (
            <>
              <p className="font-display text-xl">Choose the Wrap</p>
              <div className="mt-6 grid w-full max-w-xl grid-cols-3 gap-4 sm:grid-cols-4">
                {WRAPS.map((w) => {
                  const selected = wrap === w;
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWrap(w)}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${selected ? "border-accent bg-accent/10" : "border-border/60 hover:border-accent/40"}`}
                    >
                      <WrapShape wrap={w} width={58} />
                      <span className={`text-[11px] tracking-wide ${selected ? "text-accent" : "text-muted-foreground"}`}>{WRAP_META[w].label}</span>
                    </button>
                  );
                })}
              </div>
              <WizardNav onBack={() => setSubStep("flowers")} onNext={() => setSubStep("assemble")} nextLabel="Assemble bouquet" />
            </>
          )}

          {subStep === "assemble" && (
            <>
              <p className="font-display text-xl">Your bouquet for {recipient}</p>
              <div className="mt-4">
                <BouquetArrangement flowers={flowers} wrap={wrap} size={320} showTag monogram={recipient} />
              </div>

              {/* Song upload */}
              <div className="mt-6 w-full max-w-md text-center">
                <input ref={songInputRef} type="file" accept={SONG_ACCEPT} onChange={pickSong} className="hidden" />
                <button type="button" onClick={() => songInputRef.current?.click()} className="rounded-full border border-accent/50 px-5 py-2 text-xs tracking-[0.2em] text-accent uppercase hover:bg-accent/10">
                  Add their song ♪
                </button>
                {songFile && (
                  <span className="ml-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="max-w-[12rem] truncate text-foreground/85">{songFile.name}</span>
                    <button type="button" onClick={() => { setSongFile(null); if (songInputRef.current) songInputRef.current.value = ""; }} className="hover:text-foreground">✕</button>
                  </span>
                )}
                <p className="mt-2 text-[11px] text-muted-foreground/80">
                  {songFile ? "It will play softly when they open this." : "It will play softly when they open this. Falls back to the Night Garden soundscape."}
                </p>
              </div>

              {error && <p className="mt-4 text-xs text-amber-300">{error}</p>}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <button type="button" onClick={() => setSubStep("wrap")} className="text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-foreground">← Back</button>
                <button type="button" onClick={createGift} disabled={creating} className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {creating ? "Sealing your gift…" : "Create & Send Gift"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function buildPostcardMessage(recipient: string, message: string): string {
  const parts: string[] = [`Dear ${recipient},`];
  if (message.trim()) parts.push(message.trim());
  return parts.join(" ");
}

function WizardNav({ onBack, onNext, nextLabel, nextDisabled }: { onBack?: () => void; onNext?: () => void; nextLabel: string; nextDisabled?: boolean }) {
  return (
    <div className="mt-8 flex items-center justify-between">
      {onBack ? (
        <button type="button" onClick={onBack} className="rounded-full border border-border px-5 py-2.5 text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-foreground">← Back</button>
      ) : <span />}
      {onNext && (
        <button type="button" onClick={onNext} disabled={nextDisabled} className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40">
          {nextLabel} →
        </button>
      )}
    </div>
  );
}

/* Aged wartime letter paper wrapper */
function LetterPaper({ city, dateLabel, children }: { city: string; dateLabel: string; children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden rounded-lg p-8 sm:p-12"
      style={{
        background: "linear-gradient(160deg, #f5ecd2 0%, #efe3bf 45%, #e8d8ab 100%)",
        boxShadow: "inset 0 0 70px rgba(150,115,55,0.28), 0 20px 50px rgba(0,0,0,0.35)",
        color: "#3a2a14",
      }}
    >
      {/* foxing spots */}
      <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full" style={{ background: "radial-gradient(circle, rgba(120,80,35,0.2), transparent 65%)", filter: "blur(6px)" }} />
      <div className="pointer-events-none absolute -bottom-8 right-2 h-32 w-32 rounded-full" style={{ background: "radial-gradient(circle, rgba(120,80,35,0.16), transparent 68%)", filter: "blur(8px)" }} />
      {/* faint blue rule lines + red left margin */}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 33px, rgba(90,120,160,0.14) 34px)" }} />
      <div className="pointer-events-none absolute inset-y-0 left-10 w-px" style={{ background: "rgba(190,90,90,0.4)" }} />
      {/* grain */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity: 0.12, mixBlendMode: "multiply" }} aria-hidden>
        <filter id="lp-grain"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#lp-grain)" />
      </svg>

      <p className="relative mb-6 text-right text-sm italic" style={{ fontFamily: "'Caveat', cursive", fontSize: 20 }}>{city}, {dateLabel}</p>
      <div className="relative">{children}</div>
    </div>
  );
}
