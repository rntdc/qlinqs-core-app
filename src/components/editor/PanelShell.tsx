"use client";

import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "./icons";

/**
 * Shared chrome for every side panel (atomic block editor, container config,
 * container item editor): the responsive shell — a bottom sheet on narrow
 * screens, and on wide ones a `sticky` column that opens NEXT TO the block
 * list (a sibling in EditorPage's canvas+panel sub-row), not fixed past the
 * preview — the preview is a sibling of that whole sub-row, so it's never
 * displaced by whether a panel is open. Nearly full viewport height either
 * way (independent of the page header, which hides itself while a panel is
 * open — see EditorPage), the header with a close button, and
 * Escape-to-close. Only one panel is ever mounted at a time, so reusing
 * `edit-panel`/`edit-panel-close` test ids across all three is safe.
 */
export function PanelShell({
  eyebrow,
  title,
  onClose,
  children,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      data-testid="edit-panel"
      className="fixed inset-x-0 bottom-0 z-30 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-zinc-200 bg-white shadow-2xl lg:sticky lg:top-4 lg:right-auto lg:bottom-auto lg:left-auto lg:z-auto lg:h-[calc(100vh-2rem)] lg:max-h-none lg:w-[300px] lg:shrink-0 lg:rounded-2xl lg:border lg:shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div>
          <p className="text-xs text-zinc-500">{eyebrow}</p>
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        </div>
        <button
          type="button"
          data-testid="edit-panel-close"
          aria-label="Fechar painel de edição"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
    </div>
  );
}
