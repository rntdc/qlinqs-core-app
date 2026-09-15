import type { CSSProperties } from "react";
import { ApiError, getPublicPage } from "@/lib/api";
import type { PublicPage } from "@/lib/types";

// This page exists to prove a live connection to core-api, so fetch on
// every request instead of baking a build-time snapshot into static HTML.
export const dynamic = "force-dynamic";

const TEST_SLUG = "teste";

/** Maps a fetched theme.palette onto the CSS variables globals.css reads from. */
function paletteStyle(theme: PublicPage["theme"] | undefined): CSSProperties {
  if (!theme) return {};
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

export default async function Home() {
  let page: PublicPage | null = null;
  let error: { status: number; body: unknown } | null = null;

  try {
    page = await getPublicPage(TEST_SLUG);
  } catch (err) {
    if (err instanceof ApiError) {
      error = { status: err.status, body: err.body };
    } else {
      error = { status: 0, body: String(err) };
    }
  }

  return (
    <div
      className="min-h-screen bg-background px-6 py-12 text-text"
      style={paletteStyle(page?.theme)}
    >
      <main className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">core-app API test page</h1>
          <p className="text-sm opacity-70">
            Fetches <code>GET /api/p/{TEST_SLUG}</code> from core-api and
            renders the raw response below.
          </p>
        </header>

        <section className="flex flex-col gap-3 rounded-2xl bg-surface p-6 text-on-surface shadow-sm">
          <h2 className="font-medium">Palette proof</h2>
          <p className="text-sm opacity-80">
            This card uses <code>bg-surface</code>/<code>text-on-surface</code>,
            and the button below uses <code>bg-accent</code>/
            <code>text-on-accent</code>. Both read the <code>--palette-*</code>{" "}
            CSS variables set on this page from the fetched theme (or the
            defaults in <code>globals.css</code> if the fetch failed). Edit a{" "}
            <code>--palette-*</code> value in devtools to see it recolor live.
          </p>
          <button
            type="button"
            className="w-fit rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent"
          >
            Accent button
          </button>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-medium">
            {error ? `Error response (status ${error.status})` : "Raw response"}
          </h2>
          <pre className="overflow-x-auto rounded-xl bg-surface p-4 text-xs text-on-surface">
            {JSON.stringify(error ? error.body : page, null, 2)}
          </pre>
        </section>
      </main>
    </div>
  );
}
