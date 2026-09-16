import type { CSSProperties } from "react";
import type { AtomicBlock, BlockDefaults } from "@/lib/types";
import { hidesColorOverrides, isFilled } from "@/lib/editor/fields";
import {
  alignToJustify,
  alignToTextAlign,
  buildCardStyle,
  resolveStyle,
} from "@/lib/editor/style";

/** Fixed width for the "button" link layout — a real button, not a
 * full-bleed bar: it never stretches to its container or shrinks/grows
 * with its text. */
const BUTTON_WIDTH_PX = 220;

/**
 * Renders one block the way it would look on the live page, with the full
 * inheritance model applied: every style value is
 * `card.overrides?.x ?? theme.blockDefaults.x` (resolveStyle), and §5.3's
 * rules are enforced here (tactile !== flat hides border/shadow, image-
 * dominant layouts hide color/textColor, align/size only where the layout
 * has that control). A palette swap still recolors everything with no
 * className changes — only the `--palette-*` variables set on the preview
 * frame change.
 */
export function BlockPreviewCard({
  block,
  blockDefaults,
}: {
  block: AtomicBlock;
  blockDefaults: BlockDefaults;
}) {
  const resolved = resolveStyle(block.card.overrides, blockDefaults);
  const hideColor = hidesColorOverrides(block.type, block.layout);
  const { style, cardless } = buildCardStyle(resolved, hideColor);
  const testId = `preview-block-${block.id}`;

  if (block.type === "heading") {
    const textStyle: CSSProperties = resolved.textColor
      ? { color: resolved.textColor }
      : {};
    return (
      <div data-testid={testId} className="pt-2 pb-1 text-center">
        <p
          className={`text-sm font-semibold tracking-tight ${resolved.textColor ? "" : "text-text"}`}
          style={textStyle}
        >
          {block.card.title || "Seção"}
        </p>
      </div>
    );
  }

  if (block.type === "text") {
    const textStyle: CSSProperties = resolved.textColor
      ? { color: resolved.textColor }
      : {};
    return (
      <p
        data-testid={testId}
        className={`px-1 text-sm leading-relaxed ${resolved.textColor ? "" : "text-text/80"}`}
        style={textStyle}
      >
        {block.card.description || "Texto"}
      </p>
    );
  }

  if (cardless) {
    // tactile: "none" — the card disappears, the link becomes plain text.
    const label =
      block.card.buttonText ||
      block.card.title ||
      (block.type === "whatsapp" ? "WhatsApp" : "Link");
    return (
      <div data-testid={testId} className="px-1 py-1">
        <p className="text-sm font-medium underline decoration-accent underline-offset-2 text-accent">
          {label}
        </p>
        {block.card.description ? (
          <p className="mt-0.5 text-xs text-text/70">
            {block.card.description}
          </p>
        ) : null}
      </div>
    );
  }

  if (block.type === "whatsapp") {
    return (
      <button
        type="button"
        data-testid={testId}
        style={style}
        className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
      >
        {block.card.buttonText || block.card.title || "WhatsApp"}
      </button>
    );
  }

  if (block.type === "maps") {
    return (
      <div
        data-testid={testId}
        style={style}
        className="flex items-center gap-3 p-3"
      >
        <span aria-hidden className="text-lg">
          📍
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {block.card.title || "Localização"}
          </p>
          {block.card.description ? (
            <p className="truncate text-xs opacity-70">
              {block.card.description}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  // type === "link"

  if (block.layout === "featured") {
    // Progressive card: starts as just the image (the preset), and each
    // field appears only once filled — no empty placeholders. An empty
    // string counts as not filled.
    const hasTitle = isFilled(block.card.title);
    const hasDescription = isFilled(block.card.description);
    const hasButtonText = isFilled(block.card.buttonText);
    const hasLink = isFilled(block.card.link?.href);
    const hasTextArea = hasTitle || hasDescription || hasButtonText;

    return (
      <div
        data-testid={testId}
        style={style}
        className={`overflow-hidden ${hasLink ? "cursor-pointer" : ""}`}
      >
        <div className="relative flex h-24 items-center justify-center bg-accent/10 text-3xl">
          {block.card.label ? (
            <span className="absolute top-1 left-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-medium text-on-accent">
              {block.card.label}
            </span>
          ) : null}
          {block.card.image?.value || "🔗"}
        </div>
        {hasTextArea ? (
          <div className="p-3">
            {hasTitle ? (
              <p className="text-sm font-medium">{block.card.title}</p>
            ) : null}
            {hasDescription ? (
              <p className="mt-0.5 text-xs opacity-70">
                {block.card.description}
              </p>
            ) : null}
            {hasButtonText ? (
              <div
                style={{
                  borderRadius: Math.max((style.borderRadius as number) - 6, 4),
                }}
                className="mt-2 inline-block bg-accent px-3 py-1.5 text-xs font-medium text-on-accent"
              >
                {block.card.buttonText}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  if (block.layout === "background") {
    const imageValue = block.card.image?.value;
    if (!imageValue) {
      // Graceful no-image fallback: plain surface card with the title,
      // same treatment as a cardless/plain layout — no broken gradient
      // over nothing.
      return (
        <div
          data-testid={testId}
          style={style}
          className="flex h-28 items-center justify-center p-3 text-center"
        >
          <p className="text-sm font-medium">{block.card.title || "Link"}</p>
        </div>
      );
    }
    return (
      <div
        data-testid={testId}
        style={style}
        className="relative flex h-28 items-end overflow-hidden p-3"
      >
        <div className="absolute inset-0 flex items-center justify-center bg-accent/20 text-4xl">
          {imageValue}
        </div>
        {/* Scrim: keeps the overlaid title legible over any image. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <p className="relative text-sm font-semibold text-white">
          {block.card.title || "Link"}
        </p>
      </div>
    );
  }

  if (block.layout === "thumbnail") {
    const sizeIsLarge = resolved.size === "large";
    const rowHeight = sizeIsLarge ? "h-20" : "h-16";
    const reversed = resolved.imagePosition === "right";
    return (
      <div
        data-testid={testId}
        style={style}
        className={`flex w-full overflow-hidden ${reversed ? "flex-row-reverse" : ""}`}
      >
        {/* Edge-to-edge image: no padding, full row height, cropped to fit. */}
        <div
          className={`flex ${rowHeight} w-20 shrink-0 items-center justify-center bg-accent/10 text-2xl`}
        >
          {block.card.image?.value || "🔗"}
        </div>
        <div
          className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 p-3"
          style={{ textAlign: alignToTextAlign(resolved.align) }}
        >
          {block.card.label ? (
            <span
              className={`w-fit rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-medium text-on-accent ${
                resolved.align === "right"
                  ? "self-end"
                  : resolved.align === "center"
                    ? "self-center"
                    : ""
              }`}
            >
              {block.card.label}
            </span>
          ) : null}
          <p
            className={`truncate font-medium ${sizeIsLarge ? "text-sm" : "text-xs"}`}
          >
            {block.card.title || "Link"}
          </p>
          {block.card.description ? (
            <p className="truncate text-xs opacity-70">
              {block.card.description}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  // "button" layout (default) and any unrecognized link layout: fixed
  // width, never stretching with its container or its own text.
  return (
    <div
      style={{
        display: "flex",
        justifyContent: alignToJustify(resolved.align),
      }}
    >
      <div
        data-testid={testId}
        style={{ ...style, width: BUTTON_WIDTH_PX, maxWidth: "100%" }}
        className="px-4 py-3 text-center"
      >
        <p className="text-sm font-medium">{block.card.title || "Link"}</p>
        {block.card.description ? (
          <p className="mt-0.5 text-xs opacity-70">{block.card.description}</p>
        ) : null}
      </div>
    </div>
  );
}
