// Types for the Qlinqs page data model, aligned to
// API-MAPPING.md (project root) §5 — the *implemented* shape core-api
// validates and accepts today. Where API-MAPPING disagrees with the
// conceptual data doc (DATA-MODEL.md, project root), this file follows
// API-MAPPING; see that doc's §4 for the specific differences.

export interface SocialIcon {
  platform: string;
  value: string;
}

export interface CardLink {
  kind: "url" | "email";
  href: string;
}

export interface CardImage {
  source: "upload" | "icon" | "emoji";
  value: string;
}

export type Tactile =
  "flat" | "concave" | "convex" | "inset" | "glass" | "none";
export type ShadowStyle = "soft" | "solid";
export type Align = "left" | "center" | "right";
export type Size = "large" | "small";
/** Which side the `thumbnail` link layout's image sits on. Unset means "left". */
export type ImagePosition = "left" | "right";

/**
 * Shared by `card.overrides` and `theme.blockDefaults`. `align`/`size` are
 * block-only — allowed on `CardOverrides`, rejected with a 422 inside
 * `blockDefaults` (StyleOverrideRules, API-MAPPING §2).
 */
export interface StyleOverrides {
  tactile?: Tactile;
  color?: string;
  textColor?: string;
  corner?: number; // 0-100
  border?: number; // 0-100
  borderColor?: string;
  shadow?: number; // 0-100
  shadowStyle?: ShadowStyle;
  spacing?: number; // 0-100
}

export interface CardOverrides extends StyleOverrides {
  align?: Align;
  size?: Size;
  /** Block-only, like align/size — rejected (422) inside theme.blockDefaults. */
  imagePosition?: ImagePosition;
}

export interface Card {
  /**
   * Client-only identity for cards living inside a container's `items[]`
   * (dnd-kit + React keys need a stable id per item; the top-level `card`
   * of an atomic block never sets this). Extra keys under `card` are saved
   * as sent, not stripped (API-MAPPING §2 "Persistence behaviour"), so this
   * is forward-compatible with whatever the backend's container validator
   * ends up doing with it.
   */
  id?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  label?: string;
  link?: CardLink;
  image?: CardImage;
  overrides?: CardOverrides;
}

export type BlockType = "link" | "whatsapp" | "maps" | "text" | "heading";
/**
 * "background" is this codebase's own naming (API-MAPPING §4, not in the
 * conceptual doc) — the image fills the whole button as a background with
 * the title overlaid.
 */
export type LinkLayout = "button" | "thumbnail" | "background" | "featured";

export interface AtomicBlock {
  id: string;
  kind: "atomic";
  type: BlockType;
  /**
   * Required non-empty string on every block. Enum-enforced by the backend
   * ONLY when `type === "link"` (`button`/`thumbnail`/`featured`); any other
   * non-empty string is accepted for the other four types. API-MAPPING §4
   * flags this as a real open point with no backend convention yet — this
   * codebase's convention is to reuse the block's own `type` as the layout
   * sentinel for non-link blocks (e.g. `type: "maps"` -> `layout: "maps"`).
   */
  layout: LinkLayout | (string & {});
  hidden: boolean;
  card: Card;
}

export type ContainerType = "carousel" | "grid";

export interface CarouselConfig {
  size: Size;
}

export interface GridConfig {
  columns: 2 | 3;
}

/**
 * Post-v1 in the conceptual doc, now approved for this build
 * (DATA-MODEL.md §5.2, project root). A container never contains another
 * container (§1.2) — its `items` are plain cards, the model's leaf unit.
 * No `card`/`hidden` of its own: the container is a layout wrapper, each
 * item carries its own style via `overrides` exactly like an atomic card.
 *
 * Split into two interfaces (rather than one with `config: A | B`) so
 * narrowing on `type` also narrows `config` — `block.type === "carousel"`
 * gives you a `CarouselConfig`, not `CarouselConfig | GridConfig`.
 */
export interface CarouselBlock {
  id: string;
  kind: "container";
  type: "carousel";
  config: CarouselConfig;
  items: Card[];
}

export interface GridBlock {
  id: string;
  kind: "container";
  type: "grid";
  config: GridConfig;
  items: Card[];
}

export type ContainerBlock = CarouselBlock | GridBlock;

export type Block = AtomicBlock | ContainerBlock;

export interface Header {
  name: string;
  bio?: string;
}

export interface Content {
  header: Header;
  socialIcons: SocialIcon[];
  blocks: Block[];
}

export interface PageHeaderStyle {
  layout: "classic" | "business";
  [key: string]: unknown;
}

export interface PageBackgroundStyle {
  /** Key name is core-api's own choice (API-MAPPING §4) — not in the conceptual doc. */
  type: "none" | "solid" | "gradient";
  [key: string]: unknown;
}

export interface PageStyle {
  header: PageHeaderStyle;
  background: PageBackgroundStyle;
  /** No sub-fields are validated — arbitrary object, may be `{}`. */
  profilePicture: Record<string, unknown>;
}

/** `theme.blockDefaults` — a `StyleOverrides`; align/size are prohibited here. */
export type BlockDefaults = StyleOverrides;

export interface Fonts {
  titleFont?: string;
  textFont?: string;
}

/** The six semantic color roles that drive the whole page's look. */
export interface Palette {
  background: string;
  text: string;
  surface: string;
  onSurface: string;
  accent: string;
  onAccent: string;
}

export interface Theme {
  page: PageStyle;
  blockDefaults: BlockDefaults;
  fonts: Fonts;
  palette: Palette;
}

export interface Page {
  id: string;
  content: Content;
  theme: Theme;
}

export interface PublicPage {
  slug: string;
  content: Content;
  theme: Theme;
}

export interface Template {
  id: string;
  name: string;
  preview: string;
  theme: Theme;
}
