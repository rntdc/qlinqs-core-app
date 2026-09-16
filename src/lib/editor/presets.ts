import type { Block, Card } from "@/lib/types";

function newId(): string {
  return crypto.randomUUID();
}

export interface BlockPreset {
  /** Stable slug used in the picker's data-testid, e.g. "link-button". */
  id: string;
  label: string;
  hint: string;
  create: () => Block;
}

function newContainerItem(placeholder: string): Card {
  return {
    id: newId(),
    title: "Novo item",
    image: { source: "emoji", value: placeholder },
  };
}

/**
 * Every preset below produces a block that passes `PageContentRules`
 * (API-MAPPING §2) on its own: valid `id`/`kind`/`type`/`layout`/`hidden`,
 * and a `card` with enough placeholder content to render something
 * recognizable in the preview immediately. The two container presets
 * (§5.2) seed two starter items each, already carrying a placeholder
 * image so they start out passing the required-image rule.
 */
export const blockPresets: BlockPreset[] = [
  {
    id: "link-button",
    label: "Link (Button)",
    hint: "Um botão de texto simples",
    create: () => ({
      id: newId(),
      kind: "atomic",
      type: "link",
      layout: "button",
      hidden: false,
      card: {
        title: "Novo link",
        link: { kind: "url", href: "https://" },
      },
    }),
  },
  {
    id: "link-thumbnail",
    label: "Link (Thumbnail)",
    hint: "Com uma pequena imagem ao lado",
    create: () => ({
      id: newId(),
      kind: "atomic",
      type: "link",
      layout: "thumbnail",
      hidden: false,
      card: {
        title: "Novo link",
        description: "Descrição curta",
        image: { source: "emoji", value: "🔗" },
        link: { kind: "url", href: "https://" },
      },
    }),
  },
  {
    id: "link-background",
    label: "Link (Image Background)",
    hint: "Imagem preenche o botão, título por cima",
    create: () => ({
      id: newId(),
      kind: "atomic",
      type: "link",
      layout: "background",
      hidden: false,
      card: {
        title: "Novo link",
        image: { source: "emoji", value: "🌄" },
        link: { kind: "url", href: "https://" },
      },
    }),
  },
  {
    id: "link-featured",
    label: "Link (Featured)",
    hint: "Cresce conforme você preenche os campos",
    create: () => ({
      id: newId(),
      kind: "atomic",
      type: "link",
      layout: "featured",
      hidden: false,
      // Starts with JUST an image on purpose — title/description/buttonText/
      // link each reveal in the preview only once filled in (progressive
      // card), instead of showing empty placeholders.
      card: {
        image: { source: "emoji", value: "⭐" },
      },
    }),
  },
  {
    id: "whatsapp",
    label: "WhatsApp CTA",
    hint: "Chamada direta para o WhatsApp",
    create: () => ({
      id: newId(),
      kind: "atomic",
      type: "whatsapp",
      layout: "whatsapp",
      hidden: false,
      card: {
        title: "Fale comigo",
        buttonText: "Chamar no WhatsApp",
        link: { kind: "url", href: "https://wa.me/5511999999999" },
      },
    }),
  },
  {
    id: "maps",
    label: "Maps / Location",
    hint: "Endereço com link para o mapa",
    create: () => ({
      id: newId(),
      kind: "atomic",
      type: "maps",
      layout: "maps",
      hidden: false,
      card: {
        title: "Nossa localização",
        description: "Av. Paulista, 1000 — São Paulo",
        link: { kind: "url", href: "https://maps.google.com" },
      },
    }),
  },
  {
    id: "text",
    label: "Text",
    hint: "Parágrafo de texto livre",
    create: () => ({
      id: newId(),
      kind: "atomic",
      type: "text",
      layout: "text",
      hidden: false,
      card: {
        description: "Escreva um texto para seus visitantes.",
      },
    }),
  },
  {
    id: "heading",
    label: "Heading",
    hint: "Título ou divisória de seção",
    create: () => ({
      id: newId(),
      kind: "atomic",
      type: "heading",
      layout: "heading",
      hidden: false,
      card: {
        title: "Nova seção",
      },
    }),
  },
  {
    id: "carousel",
    label: "Carousel",
    hint: "Cards deslizáveis com imagem, título e descrição",
    create: () => ({
      id: newId(),
      kind: "container",
      type: "carousel",
      config: { size: "large" },
      items: [newContainerItem("🖼️"), newContainerItem("🎨")],
    }),
  },
  {
    id: "grid",
    label: "Grid",
    hint: "Grade de cards com imagem e selo",
    create: () => ({
      id: newId(),
      kind: "container",
      type: "grid",
      config: { columns: 2 },
      items: [newContainerItem("🖼️"), newContainerItem("🎨")],
    }),
  },
];

/** Deep-copies a card (`link`/`image`/`overrides`), optionally with a new id. */
export function duplicateCard(card: Card, assignNewId: boolean): Card {
  return {
    ...card,
    id: assignNewId ? newId() : card.id,
    link: card.link ? { ...card.link } : undefined,
    image: card.image ? { ...card.image } : undefined,
    overrides: card.overrides ? { ...card.overrides } : undefined,
  };
}

/** Deep-copies a block so editing the duplicate never mutates the original
 * through a shared nested object — including every item, for containers. */
export function duplicateBlock(block: Block): Block {
  if (block.kind === "container") {
    const items = block.items.map((item) => duplicateCard(item, true));
    // Branches are identical on purpose: narrowing on `block.type` here is
    // what lets TS confirm `config`'s shape matches `block`'s own variant
    // (CarouselBlock vs GridBlock) — a single shared branch loses that link.
    return block.type === "carousel"
      ? { ...block, id: newId(), config: { ...block.config }, items }
      : { ...block, id: newId(), config: { ...block.config }, items };
  }
  return {
    ...block,
    id: newId(),
    card: duplicateCard(block.card, false),
  };
}

/** Human-readable label for a canvas row, e.g. "Link (Thumbnail)" or "Carousel". */
export function describeBlock(block: Block): string {
  if (block.kind === "container") {
    return block.type === "carousel" ? "Carousel" : "Grid";
  }
  switch (`${block.type}:${block.layout}`) {
    case "link:button":
      return "Link (Button)";
    case "link:thumbnail":
      return "Link (Thumbnail)";
    case "link:background":
      return "Link (Image Background)";
    case "link:featured":
      return "Link (Featured)";
    case "whatsapp:whatsapp":
      return "WhatsApp CTA";
    case "maps:maps":
      return "Maps / Location";
    case "text:text":
      return "Text";
    case "heading:heading":
      return "Heading";
    default: {
      const typeLabel = block.type[0].toUpperCase() + block.type.slice(1);
      return `${typeLabel} · ${block.layout}`;
    }
  }
}
