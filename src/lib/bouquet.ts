// Digital bouquet model — flower types, color variants, meanings, and wrapping.
// A bouquet is part of a Moon Letter gift: it welcomes; the letter stays.

export interface FlowerColor {
  id: string;
  name: string;
  /** Petal base, petal shade (deeper), and centre/accent. */
  petal: string;
  shade: string;
  center: string;
}

export interface FlowerType {
  id: string;
  name: string;
  meaning: string;
  colors: FlowerColor[];
}

export const FLOWERS: FlowerType[] = [
  {
    id: "rose", name: "Rose", meaning: "love and devotion",
    colors: [
      { id: "blush", name: "Blush", petal: "#f3c0cb", shade: "#dd97a8", center: "#c9788c" },
      { id: "crimson", name: "Crimson", petal: "#c8344b", shade: "#9e2138", center: "#7c1729" },
      { id: "ivory", name: "Ivory", petal: "#f6ead6", shade: "#e3d2b4", center: "#cdb98f" },
      { id: "coral", name: "Coral", petal: "#f08a6e", shade: "#d96b51", center: "#b85138" },
    ],
  },
  {
    id: "tulip", name: "Tulip", meaning: "perfect, enduring love",
    colors: [
      { id: "rose", name: "Rose", petal: "#e87aa0", shade: "#cc5a82", center: "#a8456a" },
      { id: "saffron", name: "Saffron", petal: "#f4b13f", shade: "#dd9220", center: "#b97515" },
      { id: "plum", name: "Plum", petal: "#8e5aa6", shade: "#6f4286", center: "#553168" },
      { id: "white", name: "White", petal: "#f4efe6", shade: "#ddd4c2", center: "#c2b89f" },
    ],
  },
  {
    id: "sunflower", name: "Sunflower", meaning: "adoration and loyalty",
    colors: [
      { id: "gold", name: "Gold", petal: "#f3b62b", shade: "#d6951a", center: "#5a3a18" },
      { id: "amber", name: "Amber", petal: "#e89a2a", shade: "#c97c18", center: "#4d3014" },
    ],
  },
  {
    id: "lily", name: "Lily", meaning: "purity and renewal",
    colors: [
      { id: "white", name: "White", petal: "#f7f1e6", shade: "#e0d8c6", center: "#d8a24a" },
      { id: "pink", name: "Pink", petal: "#f1afc1", shade: "#d98aa3", center: "#c66a86" },
      { id: "tiger", name: "Tiger", petal: "#f08a3c", shade: "#d36c22", center: "#7a3d12" },
    ],
  },
  {
    id: "peony", name: "Peony", meaning: "a happy, honoured life",
    colors: [
      { id: "blush", name: "Blush", petal: "#f4c4cf", shade: "#e09fae", center: "#cf8294" },
      { id: "coral", name: "Coral", petal: "#f29a8b", shade: "#dd7768", center: "#c45a4c" },
      { id: "white", name: "White", petal: "#f7efe6", shade: "#e6dac8", center: "#d6c3a4" },
    ],
  },
  {
    id: "orchid", name: "Orchid", meaning: "rare and refined beauty",
    colors: [
      { id: "violet", name: "Violet", petal: "#b27ad0", shade: "#8f57ad", center: "#f0d24a" },
      { id: "white", name: "White", petal: "#f5eef4", shade: "#e3d6e2", center: "#d8a23a" },
      { id: "magenta", name: "Magenta", petal: "#d0529a", shade: "#aa3a7c", center: "#f0cf52" },
    ],
  },
  {
    id: "lavender", name: "Lavender", meaning: "calm and quiet devotion",
    colors: [
      { id: "lilac", name: "Lilac", petal: "#9d86d6", shade: "#7b63b8", center: "#5f4a99" },
      { id: "deep", name: "Deep", petal: "#7a5fbf", shade: "#5e459e", center: "#473378" },
    ],
  },
  {
    id: "daisy", name: "Daisy", meaning: "innocence and new beginnings",
    colors: [
      { id: "white", name: "White", petal: "#f8f3ea", shade: "#e6ddca", center: "#f0b62b" },
      { id: "pink", name: "Pink", petal: "#f3bcce", shade: "#dd97ad", center: "#f0b62b" },
      { id: "yellow", name: "Yellow", petal: "#f5d96a", shade: "#e0bf3f", center: "#c98a1a" },
    ],
  },
  {
    id: "carnation", name: "Carnation", meaning: "fascination and remembrance",
    colors: [
      { id: "rose", name: "Rose", petal: "#ec8aab", shade: "#d2658c", center: "#b34d72" },
      { id: "white", name: "White", petal: "#f6efe6", shade: "#e4d8c6", center: "#cdbd9f" },
      { id: "scarlet", name: "Scarlet", petal: "#d83f54", shade: "#b22a3e", center: "#8c1d2d" },
    ],
  },
  {
    id: "hydrangea", name: "Hydrangea", meaning: "heartfelt gratitude",
    colors: [
      { id: "blue", name: "Blue", petal: "#86a9dd", shade: "#6386c0", center: "#4a6aa3" },
      { id: "lilac", name: "Lilac", petal: "#b193d2", shade: "#9070b4", center: "#6f5396" },
      { id: "pink", name: "Pink", petal: "#eeaec6", shade: "#d889a8", center: "#bf6c8c" },
    ],
  },
  {
    id: "jasmine", name: "Jasmine", meaning: "sweetness and grace",
    colors: [
      { id: "white", name: "White", petal: "#f8f3ec", shade: "#e7ddcd", center: "#e9c24a" },
      { id: "cream", name: "Cream", petal: "#f5ead2", shade: "#e2d3b2", center: "#d6a93f" },
    ],
  },
  {
    id: "marigold", name: "Marigold", meaning: "warmth and the light of the sun",
    colors: [
      { id: "orange", name: "Orange", petal: "#ef8a25", shade: "#d36c14", center: "#a8500c" },
      { id: "gold", name: "Gold", petal: "#f3b327", shade: "#d99417", center: "#b1700e" },
    ],
  },
];

export const FLOWER_MAP: Record<string, FlowerType> = Object.fromEntries(
  FLOWERS.map((f) => [f.id, f]),
);

export type WrapId = "kraft" | "linen" | "vintage" | "satin" | "twine";

export interface WrapStyle {
  id: WrapId;
  name: string;
  /** Wrapping cone gradient stops. */
  light: string;
  mid: string;
  dark: string;
  /** Whether a ribbon bow is drawn (twine uses a plain cord). */
  ribbon: boolean;
}

export const WRAPS: WrapStyle[] = [
  { id: "kraft", name: "Kraft paper", light: "#c8a374", mid: "#a8814f", dark: "#7c5c33", ribbon: true },
  { id: "linen", name: "Linen", light: "#e6ddca", mid: "#cbbfa3", dark: "#a89b7c", ribbon: true },
  { id: "vintage", name: "Vintage paper", light: "#d8c5a0", mid: "#b59f76", dark: "#8a7450", ribbon: true },
  { id: "satin", name: "Satin", light: "#e9d6dd", mid: "#cfa9b6", dark: "#a87f8e", ribbon: true },
  { id: "twine", name: "Twine", light: "#cdb487", mid: "#a98f63", dark: "#7d6741", ribbon: false },
];

export const WRAP_MAP: Record<WrapId, WrapStyle> = Object.fromEntries(
  WRAPS.map((w) => [w.id, w]),
) as Record<WrapId, WrapStyle>;

export const RIBBON_COLORS: Array<{ id: string; name: string; hex: string }> = [
  { id: "blush", name: "Blush", hex: "#e0a0b0" },
  { id: "ivory", name: "Ivory", hex: "#ece2cd" },
  { id: "sage", name: "Sage", hex: "#a8b896" },
  { id: "dusk", name: "Dusk", hex: "#8a7fb0" },
  { id: "wine", name: "Wine", hex: "#8e2f43" },
  { id: "gold", name: "Gold", hex: "#d6a84a" },
  { id: "charcoal", name: "Charcoal", hex: "#3f3a44" },
];

export interface BouquetStem {
  flower: string;   // FlowerType id
  color: string;    // FlowerColor id
}

export interface BouquetSpec {
  stems: BouquetStem[];
  wrap: WrapId;
  ribbon: string;   // ribbon color hex
  tag?: string;     // optional gift tag note (<= 60 chars)
}

export const MAX_STEMS = 11;
export const TAG_MAX = 60;

export function flowerColor(stem: BouquetStem): FlowerColor {
  const f = FLOWER_MAP[stem.flower] ?? FLOWERS[0];
  return f.colors.find((c) => c.id === stem.color) ?? f.colors[0];
}

export function isBouquetMeaningful(b: BouquetSpec | undefined | null): b is BouquetSpec {
  return !!b && Array.isArray(b.stems) && b.stems.length > 0;
}
