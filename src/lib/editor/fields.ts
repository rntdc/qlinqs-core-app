import type { BlockType, Card, ContainerType, LinkLayout } from "@/lib/types";

export type CardFieldKey =
  "title" | "description" | "buttonText" | "label" | "link" | "image";

/**
 * §5.1's layout × field matrix, plus the non-link types (which the matrix
 * doesn't cover — API-MAPPING §4 leaves their fields as an open point, so
 * this is this codebase's own convention: generic card fields that make
 * sense for what each type does).
 */
export function cardFieldsFor(type: BlockType, layout: string): CardFieldKey[] {
  if (type === "link") {
    switch (layout as LinkLayout) {
      case "thumbnail":
        return ["image", "title", "description", "label", "link"];
      case "featured":
        return ["image", "title", "description", "buttonText", "label", "link"];
      case "button":
      default:
        return ["title", "description", "link"];
    }
  }
  if (type === "whatsapp") return ["title", "buttonText", "link"];
  if (type === "maps") return ["title", "description", "link"];
  if (type === "text") return ["description"];
  // heading
  return ["title"];
}

/** §5.1: align/size are only offered where the layout actually has that control. */
export function styleControlsFor(
  type: BlockType,
  layout: string,
): { align: boolean; size: boolean } {
  if (type !== "link") return { align: false, size: false };
  if (layout === "button") return { align: true, size: false };
  if (layout === "thumbnail") return { align: true, size: true };
  return { align: false, size: false }; // featured: no own control
}

/** §5.3: image-dominant layouts hide color/textColor. Only "featured" qualifies here. */
export function hidesColorOverrides(type: BlockType, layout: string): boolean {
  return type === "link" && layout === "featured";
}

/**
 * §5.2's "what each container type displays" — the same fields are what
 * this codebase exposes in a container item's editor (an item IS a card).
 * `link` isn't named in §5.2 but every card can carry one; a clickable
 * carousel/grid item is a natural extension of the same model.
 */
export function containerItemFields(
  containerType: ContainerType,
): CardFieldKey[] {
  if (containerType === "grid") return ["image", "label", "link"];
  return ["image", "title", "description", "buttonText", "label", "link"]; // carousel
}

/**
 * Both container types are image-dominant per §5.2 (grid: image+label only;
 * carousel: image always leads) — same reasoning as `hidesColorOverrides`
 * above for atomic "featured", extended to every container item.
 */
export const CONTAINER_ITEM_HIDES_COLOR = true;

/** §5.2: "imagem obrigatória em todo card de container." */
export function hasRequiredImage(card: Card): boolean {
  return Boolean(card.image?.value?.trim());
}
