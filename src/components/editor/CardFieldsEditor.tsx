import type { Card } from "@/lib/types";
import type { CardFieldKey } from "@/lib/editor/fields";

/**
 * Editable card fields — shared by the atomic block editor and a container
 * item's editor, since a container item IS a card (API-MAPPING §5). Which
 * fields render is entirely up to the `fields` list the caller passes in
 * (from `cardFieldsFor`/`containerItemFields`); this component never drops
 * data that isn't shown — it only ever patches the keys it renders.
 */
export function CardFieldsEditor({
  card,
  fields,
  onChange,
}: {
  card: Card;
  fields: CardFieldKey[];
  onChange: (patch: Partial<Card>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {fields.includes("title") ? (
        <TextField
          testId="field-title"
          label="Título"
          value={card.title ?? ""}
          onChange={(v) => onChange({ title: v })}
        />
      ) : null}

      {fields.includes("description") ? (
        <TextAreaField
          testId="field-description"
          label="Descrição"
          value={card.description ?? ""}
          onChange={(v) => onChange({ description: v })}
        />
      ) : null}

      {fields.includes("buttonText") ? (
        <TextField
          testId="field-buttonText"
          label="Texto do botão"
          value={card.buttonText ?? ""}
          onChange={(v) => onChange({ buttonText: v })}
        />
      ) : null}

      {fields.includes("label") ? (
        <TextField
          testId="field-label"
          label="Selo (ex: NOVO, PROMO)"
          value={card.label ?? ""}
          onChange={(v) => onChange({ label: v })}
        />
      ) : null}

      {fields.includes("image") ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-zinc-700">Imagem</span>
          <div className="flex gap-2">
            <select
              data-testid="field-image-source"
              value={card.image?.source ?? "emoji"}
              onChange={(e) =>
                onChange({
                  image: {
                    source: e.target.value as "emoji" | "icon",
                    value: card.image?.value ?? "",
                  },
                })
              }
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="emoji">Emoji</option>
              <option value="icon">Ícone</option>
            </select>
            <input
              data-testid="field-image-value"
              type="text"
              placeholder="🔗"
              value={card.image?.value ?? ""}
              onChange={(e) =>
                onChange({
                  image: {
                    source: card.image?.source ?? "emoji",
                    value: e.target.value,
                  },
                })
              }
              className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </div>
          <p className="text-[11px] text-zinc-400">
            Sem upload de arquivo ainda — core-api não tem esse endpoint
            (API-MAPPING §4).
          </p>
        </div>
      ) : null}

      {fields.includes("link") ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-zinc-700">Link</span>
          <div className="flex gap-2">
            <select
              data-testid="field-link-kind"
              value={card.link?.kind ?? "url"}
              onChange={(e) =>
                onChange({
                  link: {
                    kind: e.target.value as "url" | "email",
                    href: card.link?.href ?? "",
                  },
                })
              }
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="url">URL</option>
              <option value="email">E-mail</option>
            </select>
            <input
              data-testid="field-link-href"
              type="text"
              placeholder="https://"
              value={card.link?.href ?? ""}
              onChange={(e) =>
                onChange({
                  link: {
                    kind: card.link?.kind ?? "url",
                    href: e.target.value,
                  },
                })
              }
              className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TextField({
  testId,
  label,
  value,
  onChange,
}: {
  testId: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-700">{label}</span>
      <input
        data-testid={testId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
      />
    </label>
  );
}

function TextAreaField({
  testId,
  label,
  value,
  onChange,
}: {
  testId: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-700">{label}</span>
      <textarea
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
      />
    </label>
  );
}
