import type { Content, Theme } from "@/lib/types";

/**
 * In-memory starting state for the editor. No API calls yet (Batch A) — this
 * mirrors exactly what `GET /api/page` returns, per API-MAPPING §5, so
 * wiring the real endpoint later is a drop-in.
 */
export const mockContent: Content = {
  header: {
    name: "Ana Studio",
    bio: "Fotografia e design de marca em São Paulo",
  },
  socialIcons: [
    { platform: "instagram", value: "ana.studio" },
    { platform: "whatsapp", value: "5511999999999" },
  ],
  blocks: [],
};

export const mockTheme: Theme = {
  page: {
    header: { layout: "classic" },
    background: { type: "solid" },
    profilePicture: {},
  },
  // Edit these values (and reload) to see every block without its own
  // override restyle at once — that's the "change a blockDefaults value"
  // test hook for Batch B item 4. `align`/`size` never belong here (they're
  // block-only, API-MAPPING §2 rejects them on blockDefaults with a 422).
  blockDefaults: {
    tactile: "flat",
    corner: 16,
    border: 0,
    shadow: 15,
    shadowStyle: "soft",
    spacing: 50,
  },
  fonts: {
    titleFont: "Inter",
    textFont: "Inter",
  },
  palette: {
    background: "#FFFFFF",
    text: "#111111",
    surface: "#F5F5F5",
    onSurface: "#111111",
    accent: "#6D28D9",
    onAccent: "#FFFFFF",
  },
};
