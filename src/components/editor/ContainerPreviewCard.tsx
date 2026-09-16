import type { BlockDefaults, Card, ContainerBlock } from "@/lib/types";
import { buildCardStyle, resolveStyle } from "@/lib/editor/style";

/**
 * §5.2's preview rules: carousel shows image + title + description (+
 * buttonText, label) and scrolls horizontally; grid shows image + label
 * only, in `config.columns` columns. Each item resolves its own style
 * exactly like an atomic block's card (`item.overrides?.x ?? blockDefaults.x`)
 * — both container types are image-dominant, so color/textColor never apply.
 */
export function ContainerPreviewCard({
  block,
  blockDefaults,
}: {
  block: ContainerBlock;
  blockDefaults: BlockDefaults;
}) {
  if (block.items.length === 0) return null;

  const testId = `preview-block-${block.id}`;

  if (block.type === "grid") {
    return (
      <div
        data-testid={testId}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${block.config.columns}, minmax(0, 1fr))`,
          gap: 8,
        }}
      >
        {block.items.map((item) => (
          <GridItem key={item.id} item={item} blockDefaults={blockDefaults} />
        ))}
      </div>
    );
  }

  const cardWidth = block.config.size === "small" ? 120 : 168;
  return (
    <div
      data-testid={testId}
      className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1"
      style={{ scrollSnapType: "x proximity" }}
    >
      {block.items.map((item) => (
        <CarouselItem
          key={item.id}
          item={item}
          width={cardWidth}
          blockDefaults={blockDefaults}
        />
      ))}
    </div>
  );
}

function CarouselItem({
  item,
  width,
  blockDefaults,
}: {
  item: Card;
  width: number;
  blockDefaults: BlockDefaults;
}) {
  const resolved = resolveStyle(item.overrides, blockDefaults);
  const { style, cardless } = buildCardStyle(resolved, true);
  const imageValue = item.image?.value;

  return (
    <div
      data-testid={`preview-item-${item.id}`}
      style={{ ...style, width, scrollSnapAlign: "start", flexShrink: 0 }}
      className={cardless ? "" : "overflow-hidden"}
    >
      <div className="relative flex h-20 items-center justify-center bg-accent/10 text-2xl">
        {item.label ? (
          <span className="absolute top-1 left-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-medium text-on-accent">
            {item.label}
          </span>
        ) : null}
        {imageValue || (
          <span className="text-[10px] opacity-50">Sem imagem</span>
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-xs font-medium">{item.title || "Item"}</p>
        {item.description ? (
          <p className="truncate text-[11px] opacity-70">{item.description}</p>
        ) : null}
        {item.buttonText ? (
          <div className="mt-1 inline-block rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-on-accent">
            {item.buttonText}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GridItem({
  item,
  blockDefaults,
}: {
  item: Card;
  blockDefaults: BlockDefaults;
}) {
  const resolved = resolveStyle(item.overrides, blockDefaults);
  const { style } = buildCardStyle(resolved, true);
  const imageValue = item.image?.value;

  return (
    <div
      data-testid={`preview-item-${item.id}`}
      style={style}
      className="flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden p-2 text-center"
    >
      <span className="text-2xl">{imageValue || "🚫"}</span>
      {item.label ? (
        <span className="truncate text-[10px] font-medium">{item.label}</span>
      ) : null}
    </div>
  );
}
