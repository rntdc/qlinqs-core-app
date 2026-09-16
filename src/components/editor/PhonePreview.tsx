import type { CSSProperties } from "react";
import type { Content, Theme } from "@/lib/types";
import { resolveStyle, spacingGapPx } from "@/lib/editor/style";
import { BlockPreviewCard } from "./BlockPreviewCard";
import { ContainerPreviewCard } from "./ContainerPreviewCard";

function paletteStyle(theme: Theme): CSSProperties {
  const p = theme.palette;
  return {
    "--palette-background": p.background,
    "--palette-text": p.text,
    "--palette-surface": p.surface,
    "--palette-on-surface": p.onSurface,
    "--palette-accent": p.accent,
    "--palette-on-accent": p.onAccent,
  } as CSSProperties;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

/**
 * Phone-width live preview. Fixed `max-width: 420px`, always centered — the
 * width cap comes from an inline style (not a Tailwind class) so it holds
 * regardless of the window/container width. Everything inside reads the
 * mock theme's palette through the `--palette-*` variables set here, the
 * same mechanism the `/` test page proves against the real API.
 */
export function PhonePreview({
  content,
  theme,
  onOpenAddBlockPicker,
}: {
  content: Content;
  theme: Theme;
  onOpenAddBlockPicker: () => void;
}) {
  const { header, socialIcons, blocks } = content;
  // Containers have no `hidden` of their own (§5.2's shape) — only atomic
  // blocks can be hidden.
  const visibleBlocks = blocks.filter(
    (block) => block.kind === "container" || !block.hidden,
  );

  return (
    <div
      className="mx-auto w-full"
      style={{ maxWidth: 420 }}
      data-testid="preview-frame"
    >
      <div className="rounded-[2.5rem] border-[10px] border-zinc-900 bg-zinc-900 shadow-xl shadow-zinc-900/20">
        <div
          className="relative max-h-[720px] min-h-[600px] overflow-y-auto rounded-[1.75rem] bg-background px-5 pt-8 pb-10 text-text"
          style={{ ...paletteStyle(theme), fontFamily: theme.fonts.textFont }}
        >
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-lg font-semibold text-on-accent">
              {initials(header.name) || "?"}
            </div>
            <p
              className="text-base font-semibold"
              style={{ fontFamily: theme.fonts.titleFont }}
            >
              {header.name}
            </p>
            {header.bio ? (
              <p className="mt-1 text-xs opacity-70">{header.bio}</p>
            ) : null}
          </div>

          {socialIcons.length > 0 ? (
            <div className="mb-5 flex justify-center gap-2">
              {socialIcons.map((icon) => (
                <span
                  key={`${icon.platform}-${icon.value}`}
                  title={icon.platform}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-[10px] font-medium uppercase text-on-surface"
                >
                  {icon.platform.slice(0, 2)}
                </span>
              ))}
            </div>
          ) : null}

          {visibleBlocks.length === 0 ? (
            <div
              data-testid="preview-empty-state"
              className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-text/20 px-4 py-10 text-center"
            >
              <p className="text-sm font-medium">Nenhum bloco ainda</p>
              <p className="text-xs opacity-70">
                Adicione o primeiro bloco para começar sua página.
              </p>
              <button
                type="button"
                data-testid="preview-empty-state-cta"
                onClick={onOpenAddBlockPicker}
                className="mt-1 rounded-full bg-accent px-4 py-2 text-xs font-medium text-on-accent"
              >
                Adicionar bloco
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              {visibleBlocks.map((block, index) => {
                // "spacing" is the gap to the NEXT block (§5.3), so the last
                // visible block never needs trailing margin. Containers have
                // no `card.overrides` of their own, so their spacing always
                // comes straight from blockDefaults (no per-block override).
                const isLast = index === visibleBlocks.length - 1;
                const resolved = resolveStyle(
                  block.kind === "atomic" ? block.card.overrides : undefined,
                  theme.blockDefaults,
                );
                return (
                  <div
                    key={block.id}
                    style={
                      isLast
                        ? undefined
                        : { marginBottom: spacingGapPx(resolved.spacing) }
                    }
                  >
                    {block.kind === "container" ? (
                      <ContainerPreviewCard
                        block={block}
                        blockDefaults={theme.blockDefaults}
                      />
                    ) : (
                      <BlockPreviewCard
                        block={block}
                        blockDefaults={theme.blockDefaults}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
