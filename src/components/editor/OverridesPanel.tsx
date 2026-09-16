"use client";

import type { ReactNode } from "react";
import type { BlockDefaults, CardOverrides, Palette } from "@/lib/types";
import {
  ALIGN_OPTIONS,
  SHADOW_STYLE_OPTIONS,
  SIZE_OPTIONS,
  TACTILE_OPTIONS,
  resolveStyle,
} from "@/lib/editor/style";

type OverrideKey = keyof CardOverrides;

function Field({
  label,
  fieldKey,
  isSet,
  onReset,
  children,
}: {
  label: string;
  fieldKey: OverrideKey;
  isSet: boolean;
  onReset: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-700">{label}</span>
        {isSet ? (
          <button
            type="button"
            data-testid={`override-reset-${fieldKey}`}
            onClick={onReset}
            className="text-[11px] font-medium text-indigo-600 hover:underline"
          >
            Usar do tema
          </button>
        ) : (
          <span className="text-[11px] text-zinc-400">Herda do tema</span>
        )}
      </div>
      {children}
    </div>
  );
}

/**
 * `card.overrides` editor (§5.3). Generic over any card — an atomic block's
 * card or a container item — since the inheritance model
 * (`card.overrides?.x ?? theme.blockDefaults.x`) is identical for both.
 * Every control starts unset — it shows the *resolved* (inherited) value as
 * its hint, and only writes an explicit key once the user changes it. Reset
 * deletes the key entirely (never sets it to a value equal to the theme's).
 */
export function OverridesPanel({
  overrides,
  blockDefaults,
  palette,
  hideColor,
  showAlign,
  showSize,
  onChangeOverride,
}: {
  overrides: CardOverrides | undefined;
  blockDefaults: BlockDefaults;
  palette: Palette;
  hideColor: boolean;
  showAlign: boolean;
  showSize: boolean;
  onChangeOverride: (
    field: OverrideKey,
    value: CardOverrides[OverrideKey],
  ) => void;
}) {
  const current = overrides ?? {};
  const resolved = resolveStyle(current, blockDefaults);
  const showBorderShadow = resolved.tactile === "flat";

  function isSet(field: OverrideKey): boolean {
    return field in current;
  }

  function reset(field: OverrideKey) {
    onChangeOverride(field, undefined);
  }

  return (
    <div data-testid="overrides-panel" className="flex flex-col gap-4">
      <Field
        label="Efeito tátil"
        fieldKey="tactile"
        isSet={isSet("tactile")}
        onReset={() => reset("tactile")}
      >
        <select
          data-testid="override-tactile"
          value={resolved.tactile}
          onChange={(e) =>
            onChangeOverride(
              "tactile",
              e.target.value as CardOverrides["tactile"],
            )
          }
          className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm"
        >
          {TACTILE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>

      {!hideColor ? (
        <>
          <Field
            label="Cor de fundo"
            fieldKey="color"
            isSet={isSet("color")}
            onReset={() => reset("color")}
          >
            <input
              data-testid="override-color"
              type="color"
              value={resolved.color || palette.surface}
              onChange={(e) => onChangeOverride("color", e.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-300"
            />
          </Field>

          <Field
            label="Cor do texto"
            fieldKey="textColor"
            isSet={isSet("textColor")}
            onReset={() => reset("textColor")}
          >
            <input
              data-testid="override-textColor"
              type="color"
              value={resolved.textColor || palette.onSurface}
              onChange={(e) => onChangeOverride("textColor", e.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-300"
            />
          </Field>
        </>
      ) : (
        <p className="text-xs text-zinc-500">
          Cor de fundo e do texto ficam escondidas neste layout — a imagem
          domina o card.
        </p>
      )}

      <Field
        label="Arredondamento"
        fieldKey="corner"
        isSet={isSet("corner")}
        onReset={() => reset("corner")}
      >
        <RangeInput
          testId="override-corner"
          value={resolved.corner}
          onChange={(v) => onChangeOverride("corner", v)}
        />
      </Field>

      {showBorderShadow ? (
        <>
          <Field
            label="Borda"
            fieldKey="border"
            isSet={isSet("border")}
            onReset={() => reset("border")}
          >
            <RangeInput
              testId="override-border"
              value={resolved.border}
              onChange={(v) => onChangeOverride("border", v)}
            />
          </Field>

          <Field
            label="Cor da borda"
            fieldKey="borderColor"
            isSet={isSet("borderColor")}
            onReset={() => reset("borderColor")}
          >
            <input
              data-testid="override-borderColor"
              type="color"
              value={resolved.borderColor || palette.onSurface}
              onChange={(e) => onChangeOverride("borderColor", e.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-300"
            />
          </Field>

          <Field
            label="Sombra"
            fieldKey="shadow"
            isSet={isSet("shadow")}
            onReset={() => reset("shadow")}
          >
            <RangeInput
              testId="override-shadow"
              value={resolved.shadow}
              onChange={(v) => onChangeOverride("shadow", v)}
            />
          </Field>

          <Field
            label="Estilo da sombra"
            fieldKey="shadowStyle"
            isSet={isSet("shadowStyle")}
            onReset={() => reset("shadowStyle")}
          >
            <select
              data-testid="override-shadowStyle"
              value={resolved.shadowStyle}
              onChange={(e) =>
                onChangeOverride(
                  "shadowStyle",
                  e.target.value as CardOverrides["shadowStyle"],
                )
              }
              className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm"
            >
              {SHADOW_STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        </>
      ) : (
        <p className="text-xs text-zinc-500">
          Borda e sombra ficam escondidas: o efeito tátil já define o relevo do
          bloco (§5.3).
        </p>
      )}

      <Field
        label="Espaçamento até o próximo"
        fieldKey="spacing"
        isSet={isSet("spacing")}
        onReset={() => reset("spacing")}
      >
        <RangeInput
          testId="override-spacing"
          value={resolved.spacing}
          onChange={(v) => onChangeOverride("spacing", v)}
        />
      </Field>

      {showAlign ? (
        <Field
          label="Alinhamento"
          fieldKey="align"
          isSet={isSet("align")}
          onReset={() => reset("align")}
        >
          <div data-testid="override-align" className="flex gap-1">
            {ALIGN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                data-testid={`override-align-${opt.value}`}
                aria-pressed={resolved.align === opt.value}
                onClick={() => onChangeOverride("align", opt.value)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium ${
                  resolved.align === opt.value
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-zinc-300 bg-white text-zinc-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>
      ) : null}

      {showSize ? (
        <Field
          label="Tamanho"
          fieldKey="size"
          isSet={isSet("size")}
          onReset={() => reset("size")}
        >
          <div data-testid="override-size" className="flex gap-1">
            {SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                data-testid={`override-size-${opt.value}`}
                aria-pressed={resolved.size === opt.value}
                onClick={() => onChangeOverride("size", opt.value)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium ${
                  resolved.size === opt.value
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-zinc-300 bg-white text-zinc-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>
      ) : null}
    </div>
  );
}

function RangeInput({
  testId,
  value,
  onChange,
}: {
  testId: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        data-testid={testId}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-zinc-500">
        {value}
      </span>
    </div>
  );
}
