"use client";

import { useState } from "react";
import type { AtomicBlock, Block, Card, ContainerBlock } from "@/lib/types";
import { mockContent, mockTheme } from "@/lib/editor/mock";
import {
  duplicateBlock,
  duplicateCard,
  type BlockPreset,
} from "@/lib/editor/presets";
import { BlockPicker } from "@/components/editor/BlockPicker";
import { Canvas } from "@/components/editor/Canvas";
import { ContainerConfigPanel } from "@/components/editor/ContainerConfigPanel";
import { EditPanel } from "@/components/editor/EditPanel";
import { ItemEditPanel } from "@/components/editor/ItemEditPanel";
import { PhonePreview } from "@/components/editor/PhonePreview";

interface Selection {
  blockId: string;
  /** Set when a card *inside* a container is selected, instead of the container itself. */
  itemId?: string;
}

function newContainerItem(): Card {
  return {
    id: crypto.randomUUID(),
    title: "Novo item",
    image: { source: "emoji", value: "🖼️" },
  };
}

/**
 * Batch A + B + C, still fully in-memory (no API calls). `blocks` is the
 * only mutable piece of `content` — `header`/`socialIcons` come from the
 * mock as-is. `theme` (and its `blockDefaults`) is a static import: to see
 * every non-overridden block restyle at once, edit the values in
 * `src/lib/editor/mock.ts` and let the dev server hot-reload.
 *
 * `selection` replaced the old `selectedBlockId` when containers arrived
 * (§5.2): a container's own config and one of its items are different
 * editable targets sharing the same block id, so `itemId` disambiguates.
 */
export default function EditorPage() {
  const [blocks, setBlocks] = useState<Block[]>(mockContent.blocks);
  const [selection, setSelection] = useState<Selection | null>(null);
  // Lifted above Canvas/PhonePreview so either panel's empty-state CTA can
  // open the one canonical add-block picker (never a duplicate menu).
  const [pickerOpen, setPickerOpen] = useState(false);

  const content = { ...mockContent, blocks };
  const selectedBlock = selection
    ? (blocks.find((b) => b.id === selection.blockId) ?? null)
    : null;
  const selectedItem =
    selection?.itemId && selectedBlock?.kind === "container"
      ? (selectedBlock.items.find((item) => item.id === selection.itemId) ??
        null)
      : null;

  function addBlock(preset: BlockPreset) {
    const block = preset.create();
    setBlocks((prev) => [...prev, block]);
    setSelection({ blockId: block.id });
  }

  function handleDelete(id: string) {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
    setSelection((current) => (current?.blockId === id ? null : current));
  }

  function handleDuplicate(id: string) {
    setBlocks((prev) => {
      const index = prev.findIndex((block) => block.id === id);
      if (index === -1) return prev;
      const copy = duplicateBlock(prev[index]);
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  }

  function handleUpdateBlock(updated: Block) {
    setBlocks((prev) =>
      prev.map((block) => (block.id === updated.id ? updated : block)),
    );
  }

  function withContainer(
    blockId: string,
    update: (container: ContainerBlock) => ContainerBlock,
  ) {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId && block.kind === "container"
          ? update(block)
          : block,
      ),
    );
  }

  function handleAddItem(blockId: string) {
    const item = newContainerItem();
    withContainer(blockId, (c) => ({ ...c, items: [...c.items, item] }));
    setSelection({ blockId, itemId: item.id });
  }

  function handleDuplicateItem(blockId: string, itemId: string) {
    withContainer(blockId, (c) => {
      const index = c.items.findIndex((item) => item.id === itemId);
      if (index === -1) return c;
      const copy = duplicateCard(c.items[index], true);
      const items = [...c.items];
      items.splice(index + 1, 0, copy);
      return { ...c, items };
    });
  }

  function handleDeleteItem(blockId: string, itemId: string) {
    withContainer(blockId, (c) => ({
      ...c,
      items: c.items.filter((item) => item.id !== itemId),
    }));
    setSelection((current) =>
      current?.blockId === blockId && current.itemId === itemId
        ? null
        : current,
    );
  }

  function handleReorderItems(blockId: string, items: Card[]) {
    withContainer(blockId, (c) => ({ ...c, items }));
  }

  function handleUpdateItem(
    blockId: string,
    itemId: string,
    updatedCard: Card,
  ) {
    withContainer(blockId, (c) => ({
      ...c,
      items: c.items.map((item) => (item.id === itemId ? updatedCard : item)),
    }));
  }

  // "Edit screen" = any of the three PanelShell-based panels is open
  // (atomic block, container config, or a container item) — they all share
  // the same full-height shell (point 4), so the header hides uniformly for
  // all three rather than special-casing container config differently.
  const isEditing = selection !== null;

  return (
    <div className="min-h-screen bg-zinc-100">
      {!isEditing ? (
        <header className="flex items-center gap-2 border-b border-zinc-200 bg-white px-4 py-2">
          <span className="text-xs font-medium text-indigo-600">Qlinqs</span>
          <span className="text-zinc-300" aria-hidden="true">
            /
          </span>
          <h1 className="text-sm font-semibold text-zinc-900">Editar página</h1>
        </header>
      ) : null}

      <main
        className={`mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-start ${
          isEditing ? "lg:pr-[360px]" : ""
        }`}
      >
        <BlockPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onAddPreset={addBlock}
        />

        <div className="order-2 min-w-0 flex-1 lg:order-1 lg:min-w-[280px]">
          <Canvas
            blocks={blocks}
            selectedBlockId={selection?.blockId ?? null}
            selectedItemId={selection?.itemId ?? null}
            onSelect={(id) => setSelection({ blockId: id })}
            onSelectItem={(blockId, itemId) =>
              setSelection({ blockId, itemId })
            }
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onReorder={setBlocks}
            onAddItem={handleAddItem}
            onDuplicateItem={handleDuplicateItem}
            onDeleteItem={handleDeleteItem}
            onReorderItems={handleReorderItems}
            onPickerOpenChange={setPickerOpen}
          />
        </div>

        <div className="order-1 lg:sticky lg:top-8 lg:order-2 lg:w-[420px] lg:shrink-0">
          <PhonePreview
            content={content}
            theme={mockTheme}
            onOpenAddBlockPicker={() => setPickerOpen(true)}
          />
        </div>

        {selectedBlock && selection ? (
          <div className="order-3">
            {selectedItem && selectedBlock.kind === "container" ? (
              <ItemEditPanel
                item={selectedItem}
                containerType={selectedBlock.type}
                palette={mockTheme.palette}
                blockDefaults={mockTheme.blockDefaults}
                onUpdateItem={(card) =>
                  handleUpdateItem(
                    selectedBlock.id,
                    selectedItem.id as string,
                    card,
                  )
                }
                onClose={() => setSelection(null)}
              />
            ) : selectedBlock.kind === "container" ? (
              <ContainerConfigPanel
                block={selectedBlock}
                onUpdateBlock={handleUpdateBlock}
                onClose={() => setSelection(null)}
              />
            ) : (
              <EditPanel
                block={selectedBlock as AtomicBlock}
                palette={mockTheme.palette}
                blockDefaults={mockTheme.blockDefaults}
                onUpdateBlock={handleUpdateBlock}
                onClose={() => setSelection(null)}
              />
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
