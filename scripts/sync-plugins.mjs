// Builds the plugin catalog for /plugins/ from the TAKwerx Market's live catalog.
//
//   node scripts/sync-plugins.mjs            all plugins
//   node scripts/sync-plugins.mjs lces       just one (by repo name)
//
// For each takwerx plugin it:
//   - takes name, version, description, icon and per-ATAK APK links from the catalog
//   - sparse-clones the repo's README.md + docs/ into .cache/
//   - compiles docs/user_manual/usermanual.typ to public/manuals/<repo>.pdf (needs `typst`)
// Community plugins in the catalog are listed too, linking out to their own repos.
// Output: src/data/plugins.json (read by src/pages/plugins/*).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CATALOG = 'https://mapdepot.takwerx.org/depot/product.inf';
const CATALOG_BASE = 'https://mapdepot.takwerx.org/depot';
const OWNER = 'takwerx';
const CACHE = path.join(ROOT, '.cache/plugins');
const OUT_JSON = path.join(ROOT, 'src/data/plugins.json');
const only = process.argv[2];

const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/plugin-meta.json'), 'utf8'));
const prev = fs.existsSync(OUT_JSON) ? JSON.parse(fs.readFileSync(OUT_JSON, 'utf8')) : { plugins: [] };

const unescape = (s) => s.trim().replaceAll('\\u002c', ',').replaceAll('\\n', '\n');
const vkey = (v) => (v.match(/\d+(?:\.\d+)*/)?.[0] ?? '0').split('.').map(Number);
const vcmp = (a, b) => { const x = vkey(a), y = vkey(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] ?? 0) - (y[i] ?? 0); if (d) return d; } return 0; };
const APK = /^https:\/\/github\.com\/([\w-]+)\/([\w.-]+)\/releases\/download\/([^/]+)\/[^/]+\.apk$/;

function parseCatalog(text) {
  const rows = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const c = line.split(',');
    if (c.length < 13 || unescape(c[0]).toLowerCase() !== 'android' || unescape(c[1]) !== 'plugin') continue;
    const m = unescape(c[6]).match(APK);
    if (!m) continue;
    rows.push({
      pkg: unescape(c[2]), name: unescape(c[3]), version: unescape(c[4]).split(' ')[0],
      apk: unescape(c[6]), icon: unescape(c[7]), description: unescape(c[8]),
      atak: (unescape(c[11]).match(/@(\d+\.\d+)/) || [])[1], size: Number(unescape(c[12])) || null,
      owner: m[1], repo: m[2], tag: m[3],
    });
  }
  return rows;
}

// README: plain-text sections separated by a line of underscores and an ALL CAPS title.
function readmeSections(text) {
  const out = {};
  const parts = text.split(/\n_{20,}\n/);
  for (const p of parts.slice(1)) {
    const [title, ...body] = p.split('\n');
    out[title.trim()] = body.join('\n').trim();
  }
  return out;
}

function sparseClone(repo) {
  const dir = path.join(CACHE, repo);
  if (fs.existsSync(path.join(dir, '.git'))) {
    execFileSync('git', ['-C', dir, 'pull', '-q', '--depth', '1'], { stdio: 'inherit' });
  } else {
    fs.mkdirSync(CACHE, { recursive: true });
    execFileSync('git', ['clone', '-q', '--depth', '1', '--filter=blob:none', '--sparse', `https://github.com/${OWNER}/${repo}.git`, dir], { stdio: 'inherit' });
    execFileSync('git', ['-C', dir, 'sparse-checkout', 'set', '--no-cone', '/docs/', '/README.md'], { stdio: 'inherit' });
  }
  return dir;
}

async function buildManual(dir, repo) {
  const src = path.join(dir, 'docs/user_manual');
  if (!fs.existsSync(path.join(src, 'usermanual.typ'))) { console.warn(`  ! no docs/user_manual/usermanual.typ for ${repo}`); return null; }
  const outDir = path.join(ROOT, 'public/manuals');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `${repo}.pdf`);
  const args = ['compile', 'usermanual.typ', out];
  if (fs.existsSync(path.join(src, 'fonts'))) args.splice(1, 0, '--font-path', 'fonts');
  try {
    execFileSync('typst', args, { cwd: src, stdio: ['ignore', 'ignore', 'pipe'] });
    // Page count and a cover image (page 1) so the site can show the manual without loading the PDF.
    let pages = null, cover = null;
    try {
      const tmp = path.join(CACHE, `${repo}-p{0p}.png`);
      const pngArgs = ['compile', '--format', 'png', '--ppi', '110', 'usermanual.typ', tmp];
      if (args.includes('--font-path')) pngArgs.splice(1, 0, '--font-path', 'fonts');
      for (const f of fs.readdirSync(CACHE)) if (f.startsWith(`${repo}-p`)) fs.rmSync(path.join(CACHE, f));
      execFileSync('typst', pngArgs, { cwd: src, stdio: ['ignore', 'ignore', 'pipe'] });
      const pngs = fs.readdirSync(CACHE).filter((f) => f.startsWith(`${repo}-p`)).sort();
      pages = pngs.length;
      const coverDir = path.join(ROOT, 'public/plugin-assets', repo);
      fs.mkdirSync(coverDir, { recursive: true });
      await sharp(path.join(CACHE, pngs[0])).resize({ width: 640 }).webp({ quality: 82 }).toFile(path.join(coverDir, 'manual-cover.webp'));
      cover = `/plugin-assets/${repo}/manual-cover.webp`;
      for (const f of pngs) fs.rmSync(path.join(CACHE, f));
    } catch (e) {
      console.warn(`  ! manual cover failed for ${repo}: ${String(e.stderr || e).split('\n')[0]}`);
    }
    return { href: `/manuals/${repo}.pdf`, bytes: fs.statSync(out).size, pages, cover };
  } catch (e) {
    if (e.code === 'ENOENT') { console.warn('  ! typst is not installed: skipping manuals'); return null; }
    console.warn(`  ! manual failed for ${repo}: ${String(e.stderr || e).split('\n')[0]}`);
    return null;
  }
}

async function saveIcon(iconPath, repo) {
  if (!/^icons\/[\w.-]+\.png$/.test(iconPath)) return null;
  const res = await fetch(`${CATALOG_BASE}/${iconPath}`);
  if (!res.ok) return null;
  const outDir = path.join(ROOT, 'public/plugin-assets', repo);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'icon.png'), Buffer.from(await res.arrayBuffer()));
  return `/plugin-assets/${repo}/icon.png`;
}

const res = await fetch(CATALOG);
if (!res.ok) throw new Error(`catalog ${res.status}`);
const rows = parseCatalog(await res.text());

const byPkg = new Map();
for (const r of rows) byPkg.set(r.pkg, [...(byPkg.get(r.pkg) || []), r]);

const order = Object.keys(meta.plugins);
const plugins = [];
const community = [];

for (const [pkg, rs] of byPkg) {
  const newest = rs.reduce((a, b) => (vcmp(b.version, a.version) > 0 ? b : a));
  const builds = rs.filter((r) => r.version === newest.version && r.atak)
    .sort((a, b) => vcmp(b.atak, a.atak))
    .map((r) => ({ atak: r.atak, href: r.apk, size: r.size }));
  const base = {
    name: newest.name, pkg, version: newest.version, description: newest.description,
    repo: `${newest.owner}/${newest.repo}`, developer: newest.owner,
    release: `https://github.com/${newest.owner}/${newest.repo}/releases/tag/${newest.tag}`, builds,
  };

  if (newest.owner.toLowerCase() !== OWNER) {
    community.push({ ...base, icon: /^icons\//.test(newest.icon) ? `${CATALOG_BASE}/${newest.icon}` : null });
    continue;
  }

  const slug = newest.repo;
  if (only && only !== slug) {
    const kept = prev.plugins.find((p) => p.slug === slug);
    if (kept) { plugins.push({ ...kept, ...base, slug, builds }); continue; }
  }
  console.log(`- ${slug} ${newest.version}`);
  const dir = sparseClone(slug);
  const readme = fs.existsSync(path.join(dir, 'README.md')) ? readmeSections(fs.readFileSync(path.join(dir, 'README.md'), 'utf8')) : {};
  plugins.push({
    ...base, slug,
    tags: meta.plugins[slug]?.tags ?? ['all'],
    icon: await saveIcon(newest.icon, slug),
    manual: await buildManual(dir, slug),
    guide: fs.existsSync(path.join(dir, 'docs/USER_GUIDE.md')) ? `https://github.com/${OWNER}/${slug}/blob/main/docs/USER_GUIDE.md` : null,
    sections: {
      purpose: readme['PURPOSE AND CAPABILITIES'] || '',
      status: readme['STATUS'] || '',
      requires: readme['EQUIPMENT REQUIRED'] || '',
      supports: readme['EQUIPMENT SUPPORTED'] || '',
      ports: readme['PORTS REQUIRED'] || '',
    },
  });
}

const rank = (s) => { const i = order.indexOf(s); return i < 0 ? 999 : i; };
plugins.sort((a, b) => rank(a.slug) - rank(b.slug) || a.name.localeCompare(b.name));
community.sort((a, b) => a.name.localeCompare(b.name));

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify({ synced: new Date().toISOString(), featured: meta.featured, plugins, community }, null, 2) + '\n');
console.log(`\n${plugins.length} takwerx plugins, ${community.length} community -> ${path.relative(ROOT, OUT_JSON)}`);
