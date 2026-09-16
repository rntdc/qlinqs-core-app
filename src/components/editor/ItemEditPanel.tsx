"use client";

import type {
  BlockDefaults,
  Card,
  CardOverrides,
  ContainerType,
  Palette,
} from "@/lib/types";
import { containerItemFields, hasRequiredImage } from "@/lib/editor/fields";
import { CardFieldsEditor } from "./CardFieldsEditor";
import { OverridesPanel } from "./OverridesPanel";
import { PanelShell } from "./PanelShell";

/**
 * Editing a container item reuses the exact same card editor as an atomic
 * block (§5.2: "an item IS a card") — just with the fields §5.2 says that
 * container type displays, no layout switcher (items have no layout of
 * their own) and no `hidden` toggle (containers/items don't carry one per
 * the documented shape). Both container types are image-dominant, so
 * color/textColor stay hidden and align/size are never offered (neither
 * container config assigns per-item alignment or size).
 */
export function ItemEditPanel({
  item,
  containerType,
  palette,
  blockDefaults,
  onUpdateItem,
  onClose,
}: {
  item: Card;
  containerType: ContainerType;
  palette: Palette;
  blockDefaults: BlockDefaults;
  onUpdateItem: (card: Card) => void;
  onClose: () => void;
}) {
  function updateCard(patch: Partial<Card>) {
    onUpdateItem({ ...item, ...patch });
  }

  function changeOverride(
    field: keyof CardOverrides,
    value: CardOverrides[keyof CardOverrides],
  ) {
    const overrides: CardOverrides = { ...item.overrides };
    if (value === undefined) {
      delete overrides[field];
    } else {
      (overrides as Record<string, unknown>)[field] = value;
    }
    updateCard({ overrides });
  }

  const fields = containerItemFields(containerType);
  const imageOk = hasRequiredImage(item);

  return (
    <PanelShell
      eyebrow="Editando item"
      title={item.title || item.label || "Item"}
      onClose={onClose}
    >
      {!imageOk ? (
        <p
          data-testid="item-panel-image-error"
          className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
        >
          Este item precisa de uma imagem (obrigatória em todo card de
          container, §5.2).
        </p>
      ) : null}

      <div className="mb-6">
        <CardFieldsEditor card={item} fields={fields} onChange={updateCard} />
      </div>

      <div className="border-t border-zinc-200 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Estilo
        </p>
        <OverridesPanel
          overrides={item.overrides}
          blockDefaults={blockDefaults}
          palette={palette}
          hideColor
          showAlign={false}
          showSize={false}
          onChangeOverride={changeOverride}
        />
      </div>
    </PanelShell>
  );
}
