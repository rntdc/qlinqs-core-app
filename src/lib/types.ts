// Loose types for the Qlinqs page data model.
// See core-api/qlinqs-estrutura-de-dados.md §3-§7 for the source of truth;
// the API validates payloads, so these stay permissive rather than exhaustive.

export interface Header {
  name: string;
  bio: string;
}

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

export interface CardOverrides {
  tactile?: Tactile;
  color?: string;
  textColor?: string;
  corner?: number;
  border?: number;
  borderColor?: string;
  shadow?: number;
  shadowStyle?: ShadowStyle;
  spacing?: number;
  align?: Align;
  size?: Size;
}

export interface Card {
  id: string;
  link?: CardLink;
  image?: CardImage;
  title?: string;
  description?: string;
  buttonText?: string;
  label?: string;
  overrides?: CardOverrides;
}

export type AtomicBlockType = "link" | "whatsapp" | "maps" | "text" | "heading";
export type AtomicLayout = "button" | "thumbnail" | "featured";

export interface AtomicBlock {
  id: string;
  kind: "atomic";
  type: AtomicBlockType;
  layout?: AtomicLayout;
  hidden: boolean;
  card: Card;
}

export type ContainerType = "carousel" | "grid";

export interface ContainerBlock {
  id: string;
  kind: "container";
  type: ContainerType;
  config?: { size?: Size; columns?: 2 | 3 };
  items: Card[];
}

export type Block = AtomicBlock | ContainerBlock;

export interface Content {
  header: Header;
  socialIcons: SocialIcon[];
  blocks: Block[];
}

export interface PageStyle {
  header?: {
    layout?: "classic" | "business" | "banner" | "headshot";
    sheetColor?: string;
    fade?: boolean;
    textColor?: string;
  };
  background?: {
    type?: "none" | "solid" | "gradient" | "split" | "image" | "animated";
    value?: string;
  };
  profilePicture?: {
    size?: number;
    shadow?: number;
    border?: number;
    borderColor?: string;
    collapseBioWhenLong?: boolean;
  };
}

export interface Fonts {
  titleFont: string;
  textFont: string;
}

/** blockDefaults mirrors CardOverrides, minus align/size (never global). */
export type BlockDefaults = Omit<CardOverrides, "align" | "size">;

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
