// HELIX-themed wrapper around the vendored nyyon-figures renderer (MIT,
// github.com/LevNyyon/nyyon-figures). Pure-SVG editorial charts rasterised to
// PNG via resvg-wasm — no image model, no network. Server-only (reads fonts +
// wasm from disk); never import this from a Client Component.
//
// Craft rules are enforced inside the renderers: bars start at zero, small
// multiples share a scale, bubbles scale by area. We only pick the template and
// feed it real numbers.

// The vendored files are plain ESM .js (allowJs infers their types loosely);
// the public surface below is fully typed.
import { FIGURE_TEMPLATES, FEATURED_TEMPLATE } from './templates.js';
import { renderPng } from './render.js';
import { setTheme } from './settings.js';

type Tpl = { width: number; height: number; build: (slots: Record<string, unknown>) => string };
const TEMPLATES = FIGURE_TEMPLATES as Record<string, Tpl>;
const COVER = FEATURED_TEMPLATE as Tpl;

export type FigureTemplate =
  | 'chart_line' | 'chart_column' | 'chart_bar' | 'chart_bar_grouped'
  | 'chart_bar_stacked' | 'chart_bar_split' | 'chart_pie' | 'chart_area'
  | 'chart_slope' | 'chart_heatmap' | 'chart_treemap' | 'chart_sankey'
  | 'chart_scatter' | 'chart_waffle' | 'funnel' | 'timeline' | 'contrast'
  // (not exhaustive — any name from list_templates works)
  | (string & {});

// HELIX brand look: emerald accent, slate ink on white paper. Applied once per
// server process; setTheme mutates module-level live bindings, so a single call
// governs every later render in that lambda.
let themed = false;
function ensureHelixTheme(): void {
  if (themed) return;
  setTheme({
    paper: '#FFFFFF',
    ink: '#0F172A',
    mute: '#64748B',
    line: '#E2E8F0',
    cardHigh: '#F1F5F9',
    accent: '#10B981',      // HELIX emerald
    accentWash: '#D1FAE5',
    brandName: 'HELIX',
    brandUrl: 'helix.co.il',
    // Keep IBM Plex for Latin/numerals, but append Rubik so resvg falls back to
    // it for Hebrew glyphs the Plex fonts lack (this is a Hebrew-first product).
    // Rubik shapes Hebrew RTL correctly; without it Hebrew renders as tofu.
    fontFiles: [
      'IBMPlexSans-Regular.ttf', 'IBMPlexSans-SemiBold.ttf', 'IBMPlexSans-Bold.ttf',
      'IBMPlexMono-Medium.ttf', 'IBMPlexMono-Bold.ttf',
      'Rubik.ttf',
    ],
  });
  themed = true;
}

/** Render one figure (template + slots) to a PNG Buffer, HELIX-themed. */
export async function renderFigurePng(
  template: FigureTemplate,
  slots: Record<string, unknown>,
): Promise<Buffer> {
  ensureHelixTheme();
  const tpl = TEMPLATES[template];
  if (!tpl) throw new Error(`nyyon: unknown template "${template}"`);
  const svg = tpl.build(slots || {});
  return renderPng(svg, tpl.width) as Promise<Buffer>;
}

/** Render the 1200×630 OG-ratio cover to a PNG Buffer. */
export async function renderCoverPng(cover: {
  title: string; kicker?: string; highlight?: string; sub?: string;
}): Promise<Buffer> {
  ensureHelixTheme();
  const svg = COVER.build(cover as unknown as Record<string, unknown>);
  return renderPng(svg, COVER.width) as Promise<Buffer>;
}
