# The TAK Syndicate website

Astro static site for www.thetaksyndicate.org. AJ (takwerx) owns it.

## What the site is

An **advocacy** site for the Team Awareness Kit. Nothing is for sale.

- No marketing copy, slogans, sales-style calls to action, or fake "live" product demos.
- Present tools (infra-TAK, plugins) as free and open source.
- Voice: practitioners sharing what works, across all hazards (wildfire, hazmat, active threat, SAR, water, law enforcement).
- Look: tactical-ops blended with clean civic. Discipline colors are the `--d-*` tokens in `src/styles/global.css`.

## Deploy

- Hosting: Cloudflare **Worker** `taksyndicate-site` (not Pages), serving `dist/` as static assets. Custom domains are in `wrangler.jsonc`.
- Cloudflare account: takwerx@gmail.com. DNS is on Cloudflare; the registrar is GoDaddy. Keep the Brevo DKIM/DMARC records as DNS only.
- `.github/workflows/deploy.yml` deploys on every push to `main` and every 6 hours (to refresh the plugin catalog).
- **Pushing to `main` publishes the live site.** Commit freely, but ask AJ before each push.
- After a push, watch the run with `gh run list --branch main --limit 1`, then check the live page with curl.

## Build

- `npm run build` runs `prebuild` (`scripts/sync-plugins.mjs`) first. That script pulls plugin repos into `.cache/plugins/` and needs `typst`. If it fails locally (for example a `git pull` in `.cache/plugins/<repo>`), run `npx astro build` to build without the sync. CI runs the full build.
- To check a page visually: serve `dist/` (`python3 -m http.server -d dist`) and screenshot it with headless Chrome at the widths that matter.

## Pages

| File | Page |
|---|---|
| `src/pages/index.astro` | Home |
| `src/pages/faq.md` | FAQ (sidebar comes from `###` headings) |
| `src/pages/who-is-using-tak.astro` | Organizations using TAK |
| `src/pages/takwerx.astro` | TAKwerx hub |
| `src/pages/infra-tak.md` | infra-TAK install guide |
| `src/pages/plugins/` | Plugin catalog, built from `src/data/plugins.json` (generated; extra fields in `plugin-meta.json`) |
| `src/pages/links.astro` | Links: logo cards |
| `src/pages/community.astro` | GitHub TAK (Community TAK Projects), built from private repo takwerx/community-tak-projects via `scripts/sync-community.mjs` (needs `COMMUNITY_TOKEN`) |
| `src/pages/shields.astro` | Shields |
| `src/pages/atak-terminal.astro` | ATAK Terminal |

Top menu items: `src/components/Nav.astro`. Shared layout and the site notice bar: `src/layouts/Base.astro`.
The menu collapses to the hamburger at 960px wide. The full header needs about 960px; if you add a menu item, measure again.

## Links page (`src/pages/links.astro`)

Each card is one entry: `[logo, name, label, url]`, with an optional 5th value `'cover'` to let a photo-style logo fill the tile.

- Write labels from the company's own site. Do not invent claims.
- Labels use this vocabulary first: TAK as a service, Training, Development, Hardware, Comms, Map data, Integration, Community, Official, Drones. Then add a short specific detail, and a country if not US (e.g. `TAK as a service · Clevertouch dealer · UK`).
- Put a new card next to similar ones (same main label), not at the end.
- Logos go in `public/images/links/<slug>.svg` or `.webp`, taken from the company's own site. Tiles are white with logos up to 76px high:
  - crop away empty space around the logo;
  - make an opaque background transparent;
  - recolor a white logo to `#0d1722` (the plate navy) so it shows on white.
- YouTube channels go in the `channels` array on the same page.

## Writing

Write replies to AJ in ASD-STE100 Simplified Technical English (about 80%). Site copy keeps the site's own voice.
For Cloudflare or GitHub UI steps, give AJ one short step at a time.
