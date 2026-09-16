import type { CSSProperties } from "react";
import type {
  Align,
  BlockDefaults,
  CardOverrides,
  ImagePosition,
  ShadowStyle,
  Size,
  Tactile,
} from "@/lib/types";

/**
 * `align`/`size` never live in `theme.blockDefaults` (API-MAPPING §2:
 * sending them there is a guaranteed 422) — they're block-only, so a value
 * an override doesn't set falls back to a hard, documented default instead
 * of a theme lookup. Every other field falls back through blockDefaults.
 */
export const HARD_DEFAULTS = {
  tactile: "flat" as Tactile,
  corner: 0,
  border: 0,
  shadow: 0,
  shadowStyle: "soft" as ShadowStyle,
  spacing: 50,
  align: "center" as Align,
  size: "large" as Size,
  imagePosition: "left" as ImagePosition,
};

export interface ResolvedStyle {
  tactile: Tactile;
  color?: string;
  textColor?: string;
  corner: number;
  border: number;
  borderColor?: string;
  shadow: number;
  shadowStyle: ShadowStyle;
  spacing: number;
  align: Align;
  size: Size;
  imagePosition: ImagePosition;
}

/** `card.overrides?.x ?? theme.blockDefaults.x` for every style field, per §5.3/§7.3. */
export function resolveStyle(
  overrides: CardOverrides | undefined,
  blockDefaults: BlockDefaults,
): ResolvedStyle {
  const o = overrides ?? {};
  return {
    tactile: o.tactile ?? blockDefaults.tactile ?? HARD_DEFAULTS.tactile,
    color: o.color ?? blockDefaults.color,
    textColor: o.textColor ?? blockDefaults.textColor,
    corner: o.corner ?? blockDefaults.corner ?? HARD_DEFAULTS.corner,
    border: o.border ?? blockDefaults.border ?? HARD_DEFAULTS.border,
    borderColor: o.borderColor ?? blockDefaults.borderColor,
    shadow: o.shadow ?? blockDefaults.shadow ?? HARD_DEFAULTS.shadow,
    shadowStyle:
      o.shadowStyle ?? blockDefaults.shadowStyle ?? HARD_DEFAULTS.shadowStyle,
    spacing: o.spacing ?? blockDefaults.spacing ?? HARD_DEFAULTS.spacing,
    // Block-only — never read from blockDefaults.
    align: o.align ?? HARD_DEFAULTS.align,
    size: o.size ?? HARD_DEFAULTS.size,
    imagePosition: o.imagePosition ?? HARD_DEFAULTS.imagePosition,
  };
}

export function cornerRadiusPx(corner: number): number {
  return Math.round((corner / 100) * 32);
}

export function spacingGapPx(spacing: number): number {
  return Math.round((spacing / 100) * 32);
}

function shadowValue(shadow: number, shadowStyle: ShadowStyle): string {
  const t = shadow / 100;
  if (shadowStyle === "solid") {
    return `0 ${Math.round(2 + t * 4)}px 0 rgba(0,0,0,${(0.15 + t * 0.15).toFixed(2)})`;
  }
  return `0 ${Math.round(t * 10)}px ${Math.round(t * 24)}px rgba(0,0,0,${(t * 0.22).toFixed(2)})`;
}

/** CSS approximation for each `tactile` value (§5.3) beyond flat's own border/shadow. */
function tactileEffect(tactile: Tactile): CSSProperties {
  switch (tactile) {
    case "concave":
      return {
        boxShadow:
          "inset 0 3px 6px rgba(0,0,0,0.25), inset 0 -1px 1px rgba(255,255,255,0.4)",
      };
    case "convex":
      return {
        boxShadow:
          "0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)",
      };
    case "inset":
      return { boxShadow: "inset 0 2px 5px rgba(0,0,0,0.35)" };
    case "glass":
      return {
        backgroundColor:
          "color-mix(in srgb, var(--palette-surface) 45%, transparent)",
        backdropFilter: "blur(10px)",
        border: "1px solid color-mix(in srgb, white 35%, transparent)",
      };
    default:
      return {};
  }
}

/**
 * Turns a resolved style into inline CSS for a card-shaped block. `hideColor`
 * implements §5.3's "image-dominant layouts hide color/textColor" rule —
 * the caller decides which layouts qualify (this repo: link/featured).
 * `tactile: "none"` returns `cardless: true` — render as bare text, no box.
 */
export function buildCardStyle(
  resolved: ResolvedStyle,
  hideColor: boolean,
): { style: CSSProperties; cardless: boolean } {
  if (resolved.tactile === "none") {
    return { style: {}, cardless: true };
  }

  const style: CSSProperties = {
    borderRadius: cornerRadiusPx(resolved.corner),
  };

  if (!hideColor) {
    style.backgroundColor = resolved.color || "var(--palette-surface)";
    style.color = resolved.textColor || "var(--palette-on-surface)";
  }

  // §5.3: tactile !== "flat" means the relief IS the border/shadow — the
  // user's own border/shadow/shadowStyle values are ignored (UI hides them).
  if (resolved.tactile === "flat") {
    if (resolved.border > 0) {
      style.borderWidth = Math.max(1, Math.round((resolved.border / 100) * 6));
      style.borderStyle = "solid";
      style.borderColor =
        resolved.borderColor ||
        "color-mix(in srgb, var(--palette-on-surface) 20%, transparent)";
    }
    if (resolved.shadow > 0) {
      style.boxShadow = shadowValue(resolved.shadow, resolved.shadowStyle);
    }
  } else {
    Object.assign(style, tactileEffect(resolved.tactile));
  }

  return { style, cardless: false };
}

export function alignToJustify(align: Align): CSSProperties["justifyContent"] {
  return { left: "flex-start", center: "center", right: "flex-end" }[align];
}

export function alignToTextAlign(align: Align): CSSProperties["textAlign"] {
  return align;
}

export const TACTILE_OPTIONS: { value: Tactile; label: string }[] = [
  { value: "flat", label: "Flat" },
  { value: "concave", label: "Côncavo" },
  { value: "convex", label: "Convexo" },
  { value: "inset", label: "Inset" },
  { value: "glass", label: "Vidro" },
  { value: "none", label: "Nenhum (texto puro)" },
];

export const SHADOW_STYLE_OPTIONS: { value: ShadowStyle; label: string }[] = [
  { value: "soft", label: "Suave" },
  { value: "solid", label: "Sólida" },
];

export const ALIGN_OPTIONS: { value: Align; label: string }[] = [
  { value: "left", label: "Esquerda" },
  { value: "center", label: "Centro" },
  { value: "right", label: "Direita" },
];

export const SIZE_OPTIONS: { value: Size; label: string }[] = [
  { value: "small", label: "Pequeno" },
  { value: "large", label: "Grande" },
];

export const IMAGE_POSITION_OPTIONS: { value: ImagePosition; label: string }[] =
  [
    { value: "left", label: "Esquerda" },
    { value: "right", label: "Direita" },
  ];
