import jsPDF from "jspdf";
import JSZip from "jszip";

/**
 * DIY physical gift print kit — six print-ready PDFs bundled into one ZIP:
 * the letter, a mathematically-precise DL envelope net, the two-sided postcard,
 * an instruction card, a sheet of wax-seal stickers, and a bouquet gift tag.
 *
 * Everything is drawn with vector primitives at true physical dimensions, so
 * the output is resolution-independent (well beyond 300 DPI when printed).
 */

export interface PrintKitData {
  recipient: string;
  recipientCity?: string;
  sender?: string;
  place?: string;
  writtenDate?: string;
  greeting: string;
  occasionLine: string;
  message: string;
  closing: string;
  narration: string;
  city: string;
  dateLabel: string;
  phaseName: string;
  illumPct: string;
  moonAge: string;
  constellation: string;
  moonrise: string;
  moonset: string;
  /** 0..1 illuminated fraction, and whether the lit limb is on the right. */
  illumination: number;
  waxing: boolean;
  milestones: { age: number; phaseAngle: number; illumination: number; waxing: boolean; name?: string }[];
  /** DIY bouquet tag note written by the sender. */
  giftTagText?: string;
  /** The pronoun chosen on the main form — drives the closing tagline's wording. */
  pronoun?: "she/her" | "he/him" | "they/them";
  /**
   * Real photorealistic moon renders captured from the website (base64 PNGs),
   * used to build the moon-cutouts sheet. When present, the postcard and
   * bouquet tag print blank cut-guide circles instead of a drawn moon — the
   * person cuts the matching image from the cutout sheet and glues it on.
   */
  moonImages?: {
    main: string;
    milestones: Record<number, string>;
  };
}

const CREAM: [number, number, number] = [246, 238, 219];
const INK: [number, number, number] = [56, 44, 26];
const SUB: [number, number, number] = [116, 98, 70];
const CRIMSON: [number, number, number] = [140, 26, 44];
const NIGHT: [number, number, number] = [10, 15, 32];

// ── Pronoun helpers — used only for the closing tagline, so it matches
// whatever pronoun the sender picked instead of assuming "she". ─────────
const PRONOUN_SUBJECT: Record<string, string> = { "she/her": "she", "he/him": "he", "they/them": "they" };
const PRONOUN_WAS: Record<string, string> = { "she/her": "was", "he/him": "was", "they/them": "were" };
export function subjectPronoun(p?: string): string { return PRONOUN_SUBJECT[p ?? ""] ?? "they"; }
export function wasWere(p?: string): string { return PRONOUN_WAS[p ?? ""] ?? "were"; }
export function taglineFor(p?: string): string {
  return `Built in love, for someone who gazed at the moon and never knew how much ${subjectPronoun(p)} ${wasWere(p)} watched over by it.`;
}

/** Monogram initial for stamps / wax seals — the sender's initial (classic
 * wax-seal convention), falling back to the recipient's, then to "S" for
 * Sky We Share. Previously this was hardcoded to "C" everywhere. */
function monogram(d: PrintKitData): string {
  const name = (d.sender || d.recipient || "").trim();
  return name ? name[0].toUpperCase() : "S";
}

function paper(doc: jsPDF, w: number, h: number, fill = CREAM) {
  doc.setFillColor(...fill);
  doc.rect(0, 0, w, h, "F");
}

function dashed(doc: jsPDF, x1: number, y1: number, x2: number, y2: number) {
  doc.setLineDashPattern([2, 2], 0);
  doc.setDrawColor(...SUB);
  doc.setLineWidth(0.3);
  doc.line(x1, y1, x2, y2);
  doc.setLineDashPattern([], 0);
}

/** Fill a closed polygon given as absolute points relative to (cx, cy). */
function fillPolygon(doc: jsPDF, cx: number, cy: number, pts: Array<[number, number]>, style: "F" | "S" | "FD" = "F") {
  if (pts.length < 3) return;
  const deltas: Array<[number, number]> = [];
  for (let i = 1; i < pts.length; i++) {
    deltas.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
  }
  doc.lines(deltas, cx + pts[0][0], cy + pts[0][1], [1, 1], style, true);
}

/**
 * A small moon disc: dark disc, lit portion, thin ring.
 *
 * Rewritten to use one continuous closed-form polygon (same terminator-ellipse
 * geometry as the web moon renderer) instead of the old branch-based
 * circle+ellipse+rect subtraction hack. The old version special-cased
 * "near full" / "gibbous" / "crescent" separately and could hit degenerate,
 * zero-area shapes at certain illumination values (e.g. milestones whose
 * illumination came through as NaN/undefined) — those fed NaN into jsPDF's
 * ellipse() calls, which produced malformed drawing instructions that some
 * PDF renderers silently drop, showing up as a blank moon. This version:
 *   1. Guards against any non-finite input, treating it safely as "new moon"
 *      instead of ever passing NaN to a drawing primitive.
 *   2. Uses a single unbroken formula for every phase from new to full, so
 *      there are no special-case branches left to break.
 */
function moonDisc(doc: jsPDF, cx: number, cy: number, r: number, illum: number, waxing: boolean) {
  // Base disc — dark night side, always drawn first regardless of phase.
  doc.setFillColor(24, 28, 44);
  doc.circle(cx, cy, r, "F");

  const safeIllum = typeof illum === "number" && Number.isFinite(illum) ? illum : 0;
  const f = Math.max(0, Math.min(1, safeIllum));

  if (f > 0.003) {
    if (f >= 0.997) {
      // Full moon — the terminator ellipse degenerates to the disc edge, so
      // just fill the whole disc directly rather than building a polygon.
      doc.setFillColor(238, 236, 226);
      doc.circle(cx, cy, r, "F");
    } else {
      // Standard phase geometry: illumination fraction f = (1 - cos(angle)) / 2,
      // so angle = acos(1 - 2f), running 0 (new) .. PI (full). The terminator's
      // horizontal projection is cos(angle): 1 at new, 0 at quarter, -1 at full.
      const angle = Math.acos(1 - 2 * f);
      const terminator = Math.cos(angle);
      const steps = 48;
      const pts: Array<[number, number]> = [];
      // Outer edge, top to bottom, on the illuminated side.
      for (let i = 0; i <= steps; i++) {
        const y = -r + (2 * r * i) / steps;
        const edge = Math.sqrt(Math.max(0, r * r - y * y));
        pts.push([waxing ? edge : -edge, y]);
      }
      // Back up along the terminator curve, bottom to top.
      for (let i = steps; i >= 0; i--) {
        const y = -r + (2 * r * i) / steps;
        const edge = Math.sqrt(Math.max(0, r * r - y * y));
        const boundary = (waxing ? terminator : -terminator) * edge;
        pts.push([boundary, y]);
      }
      doc.setFillColor(238, 236, 226);
      fillPolygon(doc, cx, cy, pts, "F");
    }
  }

  doc.setDrawColor(150, 156, 172);
  doc.setLineWidth(0.2);
  doc.circle(cx, cy, r, "S");
}

/**
 * Blank dashed cut-guide circle — printed on the postcard/bouquet tag in
 * place of a drawn moon when a real cutout image is available. The person
 * cuts the matching moon from the moon-cutouts sheet and glues it on here.
 */
function moonGuide(doc: jsPDF, cx: number, cy: number, r: number, caption = true) {
  doc.setDrawColor(...SUB);
  doc.setLineWidth(0.25);
  doc.setLineDashPattern([1, 1], 0);
  doc.circle(cx, cy, r, "S");
  doc.setLineDashPattern([], 0);
  if (caption) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.4);
    doc.setTextColor(...SUB);
    doc.text("GLUE MOON HERE", cx, cy + r + 3.5, { align: "center" });
  }
}

function heading(doc: jsPDF, text: string, x: number, y: number, size = 9, color = SUB) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.text(text.toUpperCase().split("").join(" "), x, y);
}

/* ───────────────────────── 1. THE LETTER ───────────────────────── */
function buildLetter(d: PrintKitData): jsPDF {
  const W = 210, H = 297;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  paper(doc, W, H);

  // ruled lines + red margin
  doc.setDrawColor(180, 192, 212);
  doc.setLineWidth(0.15);
  for (let y = 40; y < H - 30; y += 8) doc.line(24, y, W - 20, y);
  doc.setDrawColor(198, 128, 134);
  doc.setLineWidth(0.4);
  doc.line(24, 26, 24, H - 26);

  // header: place & date, top right
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.setTextColor(...SUB);
  doc.text([d.place, d.writtenDate].filter(Boolean).join(", "), W - 20, 30, { align: "right" });

  // occasion line, centred
  doc.setFont("times", "italic");
  doc.setFontSize(11.5);
  doc.setTextColor(...INK);
  doc.text(doc.splitTextToSize(d.occasionLine, 140), W / 2, 48, { align: "center" });

  // salutation
  doc.setFont("times", "normal");
  doc.setFontSize(16);
  doc.text(d.greeting, 30, 70);

  // body
  doc.setFontSize(13);
  const body = doc.splitTextToSize(d.message || "", 150);
  doc.text(body, 30, 84, { lineHeightFactor: 1.55 });

  let y = 84 + body.length * 13 * 0.62 + 14;

  // moon narration
  doc.setFont("times", "italic");
  doc.setFontSize(10.5);
  doc.setTextColor(...SUB);
  const narr = doc.splitTextToSize(d.narration, 150);
  doc.text(narr, 30, y, { lineHeightFactor: 1.5 });
  y += narr.length * 10.5 * 0.6 + 18;

  // closing
  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  doc.text(d.closing, 30, Math.min(y, H - 78));
  if (d.sender) doc.text(d.sender, 30, Math.min(y + 9, H - 68));

  // fold guides at exact thirds (letter folds twice into a DL envelope)
  dashed(doc, 10, H / 3, W - 10, H / 3);
  dashed(doc, 10, (H * 2) / 3, W - 10, (H * 2) / 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...SUB);
  doc.text("FOLD", 12, H / 3 - 1.5);
  doc.text("FOLD", 12, (H * 2) / 3 - 1.5);
  doc.text("Fold along dotted lines. Place in envelope.", W / 2, H - 12, { align: "center" });
  heading(doc, "Sky We Share", W / 2, H - 6, 6);
  return doc;
}

/* ─────────────────── 2. THE ENVELOPE TEMPLATE ─────────────────── */
function buildEnvelope(d: PrintKitData): jsPDF {
  // DL envelope: 220 × 110 mm body, side flaps 25, top flap 50, bottom flap 45.
  const W = 297, H = 210;
  const bw = 220, bh = 110, side = 25, top = 50, bottom = 45;
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  paper(doc, W, H, [252, 248, 238]);

  const x0 = (W - (bw + side * 2)) / 2 + side; // body left edge
  const y0 = (H - (bh + top + bottom)) / 2 + top; // body top edge

  // cut outline of the whole net
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.7);
  const pts: [number, number][] = [
    [x0, y0 - top + 6], [x0 + bw / 2, y0 - top], [x0 + bw, y0 - top + 6],   // top flap
    [x0 + bw, y0],
    [x0 + bw + side, y0 + 8], [x0 + bw + side, y0 + bh - 8], [x0 + bw, y0 + bh], // right flap
    [x0 + bw, y0 + bh + bottom - 8], [x0 + bw - 10, y0 + bh + bottom],
    [x0 + 10, y0 + bh + bottom], [x0, y0 + bh + bottom - 8],                 // bottom flap
    [x0, y0 + bh],
    [x0 - side, y0 + bh - 8], [x0 - side, y0 + 8], [x0, y0],                 // left flap
  ];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    doc.line(a[0], a[1], b[0], b[1]);
  }

  // fold lines
  dashed(doc, x0, y0, x0 + bw, y0);
  dashed(doc, x0, y0 + bh, x0 + bw, y0 + bh);
  dashed(doc, x0, y0, x0, y0 + bh);
  dashed(doc, x0 + bw, y0, x0 + bw, y0 + bh);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...SUB);
  doc.text("FOLD", x0 + bw / 2, y0 - 1.5, { align: "center" });
  doc.text("FOLD", x0 + bw / 2, y0 + bh + 4, { align: "center" });
  doc.text("FOLD", x0 - 1.5, y0 + bh / 2, { align: "center", angle: 90 });
  doc.text("FOLD", x0 + bw + 4, y0 + bh / 2, { align: "center", angle: 90 });

  // glue hatching on side + bottom flaps
  doc.setDrawColor(190, 170, 140);
  doc.setLineWidth(0.2);
  const hatch = (ax: number, ay: number, bx: number, by: number) => {
    for (let i = 0; i < 40; i++) {
      const t = i / 40;
      doc.line(ax + (bx - ax) * t, ay, ax + (bx - ax) * t, by);
    }
  };
  hatch(x0 - side + 2, y0 + 10, x0 - 2, y0 + bh - 10);
  hatch(x0 + bw + 2, y0 + 10, x0 + bw + side - 2, y0 + bh - 10);
  hatch(x0 + 12, y0 + bh + 6, x0 + bw - 12, y0 + bh + bottom - 4);
  doc.setFontSize(6);
  doc.setTextColor(...SUB);
  doc.text("GLUE HERE", x0 - side / 2, y0 + bh / 2, { align: "center", angle: 90 });
  doc.text("GLUE HERE", x0 + bw + side / 2, y0 + bh / 2, { align: "center", angle: 90 });
  doc.text("GLUE HERE", x0 + bw / 2, y0 + bh + bottom / 2, { align: "center" });

  // pre-printed front: names, stamp, postmark (this face becomes the envelope front)
  doc.setFont("times", "italic");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  if (d.sender) doc.text(d.sender, x0 + 10, y0 + 14);
  doc.setFontSize(17);
  doc.text(d.recipient, x0 + bw * 0.34, y0 + bh * 0.58);
  if (d.recipientCity) {
    doc.setFontSize(12);
    doc.text(d.recipientCity, x0 + bw * 0.34, y0 + bh * 0.58 + 8);
  }
  doc.setDrawColor(...SUB);
  doc.setLineWidth(0.2);
  doc.line(x0 + bw * 0.34, y0 + bh * 0.58 + 13, x0 + bw * 0.78, y0 + bh * 0.58 + 13);
  doc.line(x0 + bw * 0.34, y0 + bh * 0.58 + 20, x0 + bw * 0.7, y0 + bh * 0.58 + 20);

  // stamp
  doc.setFillColor(...CRIMSON);
  doc.rect(x0 + bw - 44, y0 + 8, 20, 25, "F");
  doc.setTextColor(247, 220, 189);
  doc.setFontSize(13);
  doc.text(monogram(d), x0 + bw - 34, y0 + 22, { align: "center" });
  doc.setFontSize(5);
  doc.text("SKY WE SHARE", x0 + bw - 34, y0 + 29, { align: "center" });
  // postmark
  doc.setDrawColor(...CRIMSON);
  doc.setLineWidth(0.5);
  doc.circle(x0 + bw - 16, y0 + 20, 13, "S");
  doc.circle(x0 + bw - 16, y0 + 20, 10.5, "S");
  doc.setFontSize(5);
  doc.setTextColor(...CRIMSON);
  doc.text(d.city.toUpperCase().slice(0, 16), x0 + bw - 16, y0 + 15, { align: "center" });
  doc.text(d.dateLabel, x0 + bw - 16, y0 + 26, { align: "center" });
  doc.line(x0 + bw - 26, y0 + 20, x0 + bw - 6, y0 + 20);

  // wax seal indicator on the top flap (which becomes the back)
  doc.setFillColor(...CRIMSON);
  doc.circle(x0 + bw / 2, y0 - top + 22, 9, "F");
  doc.setTextColor(240, 207, 166);
  doc.setFontSize(10);
  doc.text(monogram(d), x0 + bw / 2, y0 - top + 25, { align: "center" });

  // instructions in the margin, outside the cut lines
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...SUB);
  const steps = [
    "1. Cut along solid lines",
    "2. Fold along dotted lines — valley folds",
    "3. Glue side flaps first, then bottom flap",
    "4. Let dry before inserting letter",
    "5. Seal with sticker or real wax for authenticity",
  ];
  steps.forEach((s, i) => doc.text(s, 6, 10 + i * 4));
  doc.text("Recommended: cream/ivory card stock 160-200gsm  ·  DL envelope 110 x 220 mm", 6, H - 5);
  return doc;
}

/* ───────────────────── 3. THE POSTCARD (2 pages) ───────────────────── */
function buildPostcard(d: PrintKitData): jsPDF {
  const W = 152, H = 102;
  const doc = new jsPDF({ unit: "mm", format: [W, H], orientation: "landscape" });

  // ── page 1: night sky scene + milestone strip
  doc.setFillColor(...NIGHT);
  doc.rect(0, 0, W, H, "F");
  // horizon glow
  for (let i = 0; i < 30; i++) {
    const t = i / 30;
    doc.setFillColor(12 + t * 18, 18 + t * 22, 40 + t * 26);
    doc.rect(0, 34 + t * 22, W, 1.2, "F");
  }
  // stars
  doc.setFillColor(235, 240, 255);
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < 220; i++) {
    const x = rnd() * W, y = rnd() * 56, r = 0.08 + rnd() * 0.22;
    doc.circle(x, y, r, "F");
  }
  // moon — a blank cut-guide when the real image ships on the cutout sheet,
  // otherwise fall back to the drawn vector moon so nothing is ever blank.
  if (d.moonImages?.main) {
    moonGuide(doc, W - 34, 20, 9);
  } else {
    moonDisc(doc, W - 34, 20, 9, d.illumination, d.waxing);
  }
  // mountains
  doc.setFillColor(9, 12, 24);
  doc.triangle(-6, 60, 44, 30, 90, 60, "F");
  doc.setFillColor(6, 9, 19);
  doc.triangle(52, 60, 104, 34, 158, 60, "F");
  // lake
  doc.setFillColor(8, 13, 30);
  doc.rect(0, 60, W, 14, "F");
  doc.setFillColor(150, 165, 205);
  for (let i = 0; i < 16; i++) {
    const y = 61 + i * 0.8;
    doc.rect(W - 36 - i * 0.5, y, 4 + i * 0.5, 0.25, "F");
  }
  // caption band
  doc.setFillColor(...CREAM);
  doc.rect(0, 74, W, H - 74, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...INK);
  doc.text(`${d.city.toUpperCase()}  ·  ${d.dateLabel.toUpperCase()}  ·  ${d.phaseName.toUpperCase()} · ${d.illumPct}% ILLUMINATED`, W / 2, 79, { align: "center" });
  // milestone strip
  const ms = d.milestones.slice(0, 9);
  const step = W / (ms.length || 1);
  ms.forEach((m, i) => {
    const cx = step * (i + 0.5);
    if (d.moonImages?.milestones?.[m.age]) {
      moonGuide(doc, cx, 88, 4, false);
    } else {
      moonDisc(doc, cx, 88, 4, m.illumination, m.waxing);
    }
    doc.setFontSize(4.6);
    doc.setTextColor(...SUB);
    doc.text(m.age === 0 ? "BIRTH" : `AGE ${m.age}`, cx, 96, { align: "center" });
  });
  doc.setFontSize(4.4);
  doc.text("Print double-sided on 300gsm card stock. Or print each side separately and glue back to back.", W / 2, H - 1.5, { align: "center" });

  // ── page 2: address / message side
  doc.addPage([W, H], "landscape");
  paper(doc, W, H);
  doc.setDrawColor(...SUB);
  doc.setLineWidth(0.3);
  doc.rect(4, 4, W - 8, H - 8, "S");
  heading(doc, "Post Card", W / 2 - 14, 13, 8, INK);
  doc.setLineWidth(0.25);
  doc.line(6, 17, W - 6, 17);
  doc.line(W / 2, 20, W / 2, H - 10);
  heading(doc, "This space for correspondence", 10, 24, 4.6);
  doc.setFont("times", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text(doc.splitTextToSize(d.message || d.occasionLine, W / 2 - 18), 10, 32, { lineHeightFactor: 1.5 });
  doc.setFontSize(8);
  doc.text(d.closing, 10, H - 22);
  if (d.sender) doc.text(d.sender, 10, H - 16);

  // address lines
  const ax = W / 2 + 8;
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text(d.recipient, ax, 46);
  if (d.recipientCity) doc.text(d.recipientCity, ax, 54);
  doc.setDrawColor(...SUB);
  doc.setLineWidth(0.2);
  [50, 58, 66, 74].forEach((y) => doc.line(ax, y, W - 12, y));
  // stamp + postmark
  doc.setFillColor(...CRIMSON);
  doc.rect(W - 30, 8, 16, 20, "F");
  doc.setTextColor(247, 220, 189);
  doc.setFontSize(11);
  doc.text(monogram(d), W - 22, 20, { align: "center" });
  doc.setDrawColor(...CRIMSON);
  doc.setLineWidth(0.35);
  doc.circle(W - 36, 18, 9, "S");
  doc.setFontSize(4);
  doc.setTextColor(...CRIMSON);
  doc.text(d.city.toUpperCase().slice(0, 14), W - 36, 15, { align: "center" });
  doc.text(d.dateLabel, W - 36, 22, { align: "center" });
  heading(doc, "Sky We Share", W / 2 - 12, H - 6, 4.6);
  return doc;
}

/* ─────────────────── 4. INSTRUCTION CARD (A6) ─────────────────── */
function buildInstructions(d: PrintKitData): jsPDF {
  const W = 105, H = 148;
  const doc = new jsPDF({ unit: "mm", format: "a6" });
  paper(doc, W, H);
  doc.setDrawColor(...SUB);
  doc.setLineWidth(0.4);
  doc.rect(6, 6, W - 12, H - 12, "S");
  heading(doc, "How to make it", W / 2 - 22, 20, 8, INK);
  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...SUB);
  doc.text("Some things are worth the effort of making by hand.", W / 2, 28, { align: "center" });

  const steps = [
    "Cut the envelope template along the solid lines.",
    "Fold along the dotted lines and glue the side flaps, then the bottom.",
    "Fold the letter twice along its guides and place it inside.",
    "Seal the flap with a wax seal sticker.",
    "Print the postcard double-sided and trim to size.",
    "Cut each moon from the moon-cutouts sheet and glue it onto the matching circle on the postcard and bouquet tag.",
    "Write the bouquet tag by hand and tie it with twine.",
  ];
  doc.setFont("times", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  steps.forEach((s, i) => {
    const y = 40 + i * 14;
    doc.setDrawColor(...SUB);
    doc.setLineWidth(0.3);
    doc.circle(14, y - 1.5, 3.4, "S");
    doc.setFontSize(7);
    doc.text(String(i + 1), 14, y - 0.2, { align: "center" });
    doc.setFontSize(8);
    doc.text(doc.splitTextToSize(s, W - 34), 22, y);
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(...SUB);
  // Pronoun-aware tagline — previously hardcoded to "she" regardless of the
  // pronoun chosen on the main form.
  doc.text(
    doc.splitTextToSize(`SKY WE SHARE  ·  ${taglineFor(d.pronoun)}`, W - 24),
    W / 2, H - 16, { align: "center" },
  );
  return doc;
}

/* ─────────────────── 5. WAX SEAL STICKERS (A4) ─────────────────── */
function buildSeals(d: PrintKitData): jsPDF {
  const W = 210, H = 297;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  paper(doc, W, H, [255, 255, 255]);
  heading(doc, "Wax seal stickers", 20, 24, 9, INK);
  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.setTextColor(...SUB);
  doc.text("Cut out. Press firmly over the envelope flap.", 20, 32);

  const r = 20;
  const positions: [number, number][] = [
    [62, 70], [148, 70], [62, 140], [148, 140], [62, 210], [148, 210],
  ];
  const letter = monogram(d);
  positions.forEach(([cx, cy]) => {
    doc.setFillColor(...CRIMSON);
    doc.circle(cx, cy, r, "F");
    doc.setFillColor(112, 20, 34);
    doc.circle(cx, cy, r * 0.86, "F");
    doc.setTextColor(240, 207, 166);
    doc.setFont("times", "italic");
    doc.setFontSize(22);
    doc.text(letter, cx, cy + 7, { align: "center" });
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.circle(cx, cy, r + 2.5, "S");
    doc.setLineDashPattern([], 0);
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...SUB);
  doc.text("Print on sticker paper for best results, or plain paper with a glue stick.", 20, H - 20);
  return doc;
}


/* ─────────────────── 6. BOUQUET GIFT TAG ─────────────────── */
function buildBouquetTag(d: PrintKitData): jsPDF {
  const W = 105, H = 148; // A6 sheet holding one cut-out tag
  const doc = new jsPDF({ unit: "mm", format: "a6" });
  paper(doc, W, H, [255, 255, 255]);

  // the tag itself — cream, rounded, punched hole at the top
  const tw = 62, th = 96, tx = (W - tw) / 2, ty = 26;
  doc.setFillColor(...CREAM);
  doc.roundedRect(tx, ty, tw, th, 4, 4, "F");
  doc.setDrawColor(...SUB);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([1.6, 1.6], 0);
  doc.roundedRect(tx - 2, ty - 2, tw + 4, th + 4, 5, 5, "S");
  doc.setLineDashPattern([], 0);

  // punch hole
  doc.setDrawColor(...SUB);
  doc.setLineWidth(0.4);
  doc.circle(W / 2, ty + 8, 2.6, "S");

  if (d.moonImages?.main) {
    moonGuide(doc, W / 2, ty + 24, 7);
  } else {
    moonDisc(doc, W / 2, ty + 24, 7, d.illumination, d.waxing);
  }

  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  const note = doc.splitTextToSize(d.giftTagText || d.occasionLine, tw - 14);
  doc.text(note, W / 2, ty + 44, { align: "center", lineHeightFactor: 1.5 });

  doc.setFontSize(10);
  doc.text(d.closing, W / 2, ty + th - 22, { align: "center" });
  if (d.sender) doc.text(d.sender, W / 2, ty + th - 14, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...SUB);
  doc.text(
    doc.splitTextToSize("Print, cut out, punch a small hole at the top, tie to a real bouquet with ribbon or twine.", W - 20),
    W / 2, H - 12, { align: "center" },
  );
  return doc;
}

/* ─────────────────── 7. MOON CUTOUTS (A4) ─────────────────── */
/**
 * A sheet of real, photorealistic moon renders (captured from the same
 * MoonSvg the website uses) as small circular cutouts — one for the
 * postcard, one for the bouquet tag, and one per milestone — matching the
 * blank "GLUE MOON HERE" guide circles left on those pages. Only produced
 * when the caller has actually supplied moonImages; otherwise those pages
 * fall back to a directly-drawn vector moon and this sheet is skipped.
 */
function buildMoonCutouts(d: PrintKitData): jsPDF {
  const W = 210, H = 297;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  paper(doc, W, H, [255, 255, 255]);
  heading(doc, "Moon cutouts", 20, 24, 9, INK);
  doc.setFont("times", "italic");
  doc.setFontSize(9.5);
  doc.setTextColor(...SUB);
  doc.text(
    doc.splitTextToSize("Cut out each moon along its dashed circle and glue it onto the matching guide circle on the postcard or bouquet tag.", W - 40),
    20, 32,
  );

  type Cutout = { label: string; image?: string };
  const cutouts: Cutout[] = [];
  if (d.moonImages?.main) {
    cutouts.push({ label: "POSTCARD", image: d.moonImages.main });
    cutouts.push({ label: "BOUQUET TAG", image: d.moonImages.main });
  }
  for (const m of d.milestones.slice(0, 9)) {
    const img = d.moonImages?.milestones?.[m.age];
    if (img) cutouts.push({ label: m.age === 0 ? "BIRTH" : `AGE ${m.age}`, image: img });
  }

  const r = 12; // 24mm finished cutout diameter
  const cols = 4;
  const usableW = W - 40;
  const gapX = usableW / cols;
  const startX = 20 + gapX / 2;
  const startY = 55;
  const gapY = 36;

  cutouts.forEach((c, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = startX + col * gapX;
    const cy = startY + row * gapY;
    if (c.image) {
      const size = r * 2;
      doc.addImage(c.image, "PNG", cx - r, cy - r, size, size, undefined, "FAST");
    }
    doc.setDrawColor(...SUB);
    doc.setLineWidth(0.25);
    doc.setLineDashPattern([1, 1], 0);
    doc.circle(cx, cy, r, "S");
    doc.setLineDashPattern([], 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...SUB);
    doc.text(c.label, cx, cy + r + 5, { align: "center" });
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...SUB);
  doc.text("Print on matte photo paper or sticker paper for the crispest finish.", W / 2, H - 14, { align: "center" });
  return doc;
}

export interface PrintKitFile { name: string; label: string; blob: Blob }

/** Build all PDFs — seven when real moon images were captured, six otherwise
 * (the postcard/tag pages fall back to a drawn moon and skip the cutout sheet). */
export function buildPrintKitFiles(d: PrintKitData): PrintKitFile[] {
  const files: PrintKitFile[] = [
    { name: "letter.pdf", label: "The Letter", blob: buildLetter(d).output("blob") },
    { name: "envelope-template.pdf", label: "The Envelope", blob: buildEnvelope(d).output("blob") },
    { name: "postcard.pdf", label: "The Postcard", blob: buildPostcard(d).output("blob") },
    { name: "how-to-make.pdf", label: "How to Make It", blob: buildInstructions(d).output("blob") },
    { name: "wax-seal-stickers.pdf", label: "Wax Seals", blob: buildSeals(d).output("blob") },
    { name: "bouquet-tag.pdf", label: "Bouquet Tag", blob: buildBouquetTag(d).output("blob") },
  ];
  if (d.moonImages?.main) {
    files.push({ name: "moon-cutouts.pdf", label: "Moon Cutouts", blob: buildMoonCutouts(d).output("blob") });
  }
  return files;
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Download a single kit file by its name. */
export function downloadPrintKitFile(d: PrintKitData, name: string) {
  const file = buildPrintKitFiles(d).find((f) => f.name === name);
  if (!file) return;
  saveBlob(file.blob, name);
}


/** Build the kit and download it as a single ZIP. */
export async function downloadPrintKit(d: PrintKitData, filename = "sky-we-share-print-kit.zip") {
  const files = buildPrintKitFiles(d);
  const zip = new JSZip();
  for (const f of files) zip.file(f.name, f.blob);
  const hasCutouts = files.some((f) => f.name === "moon-cutouts.pdf");
  zip.file(
    "README.txt",
    [
      "SKY WE SHARE — DIY PRINT KIT",
      "",
      "letter.pdf ................ A4, fold twice along the dotted guides",
      "envelope-template.pdf ..... A4 landscape, cut & fold into a DL envelope (110x220mm)",
      `postcard.pdf .............. 4x6in, two pages — print double-sided on 250-300gsm${hasCutouts ? " (moons are glued on from moon-cutouts.pdf)" : ""}`,
      "how-to-make.pdf ........... A6 instruction card",
      "wax-seal-stickers.pdf ..... A4 sheet of six seals, print on sticker paper",
      `bouquet-tag.pdf ........... A6, cut out and tie to a real bouquet${hasCutouts ? " (moon glued on from moon-cutouts.pdf)" : ""}`,
      ...(hasCutouts ? ["moon-cutouts.pdf .......... A4 sheet of real moon renders — cut and glue onto the postcard and bouquet tag"] : []),
      "",
      "Built in love, under the same sky.",
    ].join("\n"),
  );
  const blob = await zip.generateAsync({ type: "blob" });
  saveBlob(blob, filename);
  return blob.size;
}
