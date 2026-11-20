// Builds the data for /cloudtak/: community CloudTAK plugins and CloudTAK ETLs.
//
//   node scripts/sync-cloudtak.mjs
//
// Hand-edited input: src/data/cloudtak-meta.json (tags, categories, descriptions, extra repos, skips).
//
// Plugins: every entry in the TAK Portal CloudTAK Marketplace catalog (hidden ones lose the
// Marketplace mark), plus meta.extra.
// ETLs: every entry in the infra-TAK ETL catalog, every etl-* repo in meta.etl.orgs (forks and
// libraries left out), plus meta.etl.extra.
// Repos that are private, archived or gone are dropped. License, last push, release and owner
// come from the GitHub API; ETL logos are saved to public/cloudtak-etl-logos/.
//
// Token (optional, raises the rate limit): GH_API_TOKEN or GITHUB_TOKEN; locally, `gh auth token`.
// Output (not in git): src/data/cloudtak.json, public/cloudtak-etl-logos/.
// If a catalog can't be read, that list keeps its previous contents and the build goes on.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const META = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/cloudtak-meta.json'), 'utf8'));
const OUT_JSON = path.join(ROOT, 'src/data/cloudtak.json');
const LOGOS = path.join(ROOT, 'public/cloudtak-etl-logos');
const API = 'https://api.github.com';

function token() {
  const env = process.env.GH_API_TOKEN || process.env.GITHUB_TOKEN;
  if (env) return env;
  try { return execFileSync('gh', ['auth', 'token'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; }
}
const t = token();
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'taksyndicate-site-build', ...(t && { Authorization: `Bearer ${t}` }) };

const old = (() => { try { return JSON.parse(fs.readFileSync(OUT_JSON, 'utf8')); } catch { return {}; } })();

async function gh(p, accept) {
  const res = await fetch(API + p, { headers: accept ? { ...headers, Accept: accept } : headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${p} ${res.status}`);
  return accept?.includes('raw') ? res.text() : res.json();
}
async function ghRaw(repoPath) {
  const [o, r, ...p] = repoPath.split('/');
  return gh(`/repos/${o}/${r}/contents/${p.join('/')}`, 'application/vnd.github.raw+json');
}

// "https://github.com/Owner/Repo.git" or "Owner/Repo" -> "Owner/Repo"
const repoName = (s) => String(s || '').replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '');
const key = (r) => r.toLowerCase();
const byKey = (obj) => Object.fromEntries(Object.entries(obj || {}).map(([r, m]) => [key(r), m]));
const ownerNames = byKey(META.owners);
const license = (info) => (info?.license?.spdx_id && info.license.spdx_id !== 'NOASSERTION' ? info.license.spdx_id : null);

// GitHub repo info; null if the repo should not be listed.
async function repoInfo(repo) {
  const info = await gh(`/repos/${repo}`);
  if (!info) { console.warn(`  ! ${repo}: not found, left out`); return null; }
  if (info.private) { console.warn(`  ! ${repo}: private, left out`); return null; }
  if (info.archived) { console.warn(`  ! ${repo}: archived, left out`); return null; }
  return info;
}

const owners = new Map();
async function ownerName(login) {
  if (!owners.has(login)) {
    let name = ownerNames[key(login)] || login;
    if (!ownerNames[key(login)]) {
      try { const u = await gh(`/users/${login}`); if (u?.name?.trim()) name = u.name.trim(); }
      catch { console.warn(`  ! ${login}: profile failed`); }
    }
    owners.set(login, name);
  }
  return owners.get(login);
}

// ---------- plugins ----------
async function syncPlugins() {
  const meta = byKey(META.plugins);
  const skip = new Set((META.skip || []).map(key));
  const catalog = JSON.parse(await ghRaw(META.catalog) || 'null');
  if (!Array.isArray(catalog?.plugins)) throw new Error('plugin catalog has no plugins array');

  const entries = [];
  for (const p of catalog.plugins) {
    const repo = repoName(p.repo);
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) continue;
    entries.push({
      repo, name: p.name, description: p.description,
      // Hidden entries can't be installed from the Marketplace right now, but the repo is still public.
      marketplace: !p.hidden,
      // A server half (API routes, a sidecar or its own Docker service) means more for the admin to run.
      server: Boolean(p.routes || p.sidecars?.length || p.composeFile),
    });
  }
  for (const x of META.extra || []) {
    if (entries.some((e) => key(e.repo) === key(x.repo))) continue;
    entries.push({ repo: x.repo, name: x.name, description: x.description, marketplace: false, server: false, extra: x });
  }

  const out = [];
  for (const e of entries) {
    if (skip.has(key(e.repo))) continue;
    const m = { ...(e.extra || {}), ...(meta[key(e.repo)] || {}) };
    let info, release;
    try {
      info = await repoInfo(e.repo);
      if (!info) continue;
      if (!m.href && m.release !== false) release = await gh(`/repos/${e.repo}/releases/latest`);
    } catch (err) { console.warn(`  ! ${e.repo}: ${err.message}; listed without GitHub details`); }
    const login = info?.owner?.login || e.repo.split('/')[0];
    out.push({
      name: m.name || e.name || e.repo.split('/')[1],
      repo: info?.full_name || e.repo,
      description: m.description || e.description || info?.description || '',
      tags: m.tags?.length ? m.tags : ['all'],
      region: m.region || null,
      status: m.status || null,
      href: m.href || `https://github.com/${info?.full_name || e.repo}`,
      owner: login,
      ownerName: await ownerName(login),
      marketplace: e.marketplace,
      server: e.server,
      license: license(info),
      release: release?.tag_name || null,
      updated: info?.pushed_at || null,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
}

// ---------- ETLs ----------
// Save a logo (PNG/SVG/WebP URL) as a trimmed WebP; returns the public path or null.
async function saveLogo(url, slug) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': headers['User-Agent'] } });
    if (!r.ok || !/^image\//.test(r.headers.get('content-type') || '') && !/\.(png|svg|webp)$/i.test(url)) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    await sharp(buf, { density: 300 }).trim().resize(480, 120, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 88 }).toFile(path.join(LOGOS, `${slug}.webp`));
    return `/cloudtak-etl-logos/${slug}.webp`;
  } catch { return null; }
}

async function syncEtls() {
  const E = META.etl;
  const meta = byKey(E.entries);
  const skip = new Set((E.skip || []).map(key));
  const catalog = JSON.parse(await ghRaw(E.catalog) || 'null');
  const list = catalog?.entries || catalog?.etls || Object.values(catalog || {}).find(Array.isArray);
  if (!Array.isArray(list)) throw new Error('ETL catalog has no entry list');

  const entries = new Map();
  for (const c of list) {
    const repo = repoName(c.source || c.repo_url);
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) continue;
    entries.set(key(repo), {
      repo, name: c.name, description: c.description, version: c.version, logo: c.logo,
      // infra-TAK installs only reviewed, installable entries.
      infratak: Boolean(c.flags?.installable !== false && c.reviewed),
      modes: c.flags || null,
    });
  }
  for (const org of E.orgs || []) {
    for (let page = 1; page < 10; page++) {
      const repos = await gh(`/orgs/${org}/repos?per_page=100&page=${page}`);
      if (!repos?.length) break;
      for (const r of repos) {
        if (!/^etl-/i.test(r.name) || r.fork || r.archived || r.private || entries.has(key(r.full_name))) continue;
        entries.set(key(r.full_name), { repo: r.full_name, infratak: false });
      }
    }
  }
  for (const repo of E.extra || []) if (!entries.has(key(repo))) entries.set(key(repo), { repo, infratak: false });

  fs.mkdirSync(LOGOS, { recursive: true });
  const out = [];
  for (const e of entries.values()) {
    if (skip.has(key(e.repo))) continue;
    const m = meta[key(e.repo)] || {};
    let info, release, caps;
    try {
      info = await repoInfo(e.repo);
      if (!info) continue;
      // A fork found by org scan or listed as extra duplicates its parent; a fork in the catalog was listed on purpose.
      if (info.fork && !e.name) { console.warn(`  ! ${e.repo}: fork, left out`); continue; }
      if (!e.name) {
        // Not in the catalog: name and description from the ETL's own capabilities.json.
        try { caps = JSON.parse(await gh(`/repos/${e.repo}/contents/capabilities.json`, 'application/vnd.github.raw+json') || 'null'); } catch {}
        release = await gh(`/repos/${e.repo}/releases/latest`);
      }
    } catch (err) { console.warn(`  ! ${e.repo}: ${err.message}; listed without GitHub details`); }
    const repo = info?.full_name || e.repo;
    const slug = repo.split('/')[1].toLowerCase().replace(/^etl-|^cloudtak-etl-/, '') + (key(repo).startsWith('dfpc-coe/') ? '' : `-${repo.split('/')[0].toLowerCase()}`);
    const logoUrl = e.logo || `https://raw.githubusercontent.com/${repo}/HEAD/logo.png`;
    const login = info?.owner?.login || repo.split('/')[0];
    out.push({
      name: m.name || e.name || caps?.name || repo.split('/')[1],
      repo,
      href: `https://github.com/${repo}`,
      description: m.description || e.description || caps?.description || info?.description || '',
      cat: m.cat || 'data',
      region: m.region || null,
      owner: login,
      ownerName: await ownerName(login),
      infratak: e.infratak,
      modes: e.modes ? ['schedule', 'webhook', 'email', 'outgoing'].filter((k) => e.modes[k]) : [],
      version: e.version || release?.tag_name?.replace(/^v/, '') || null,
      license: license(info),
      updated: info?.pushed_at || null,
      logo: await saveLogo(logoUrl, slug),
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
}

async function attempt(label, fn, fallback) {
  try { return await fn(); }
  catch (e) { console.warn(`  ! cloudtak ${label}: ${e.message || e}; keeping the previous list`); return fallback || []; }
}

const plugins = await attempt('plugins', syncPlugins, old.plugins);
const etls = await attempt('ETLs', syncEtls, old.etls);
fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify({ synced: new Date().toISOString(), plugins, etls }, null, 2) + '\n');
console.log(`${plugins.length} CloudTAK plugins, ${etls.length} ETLs -> ${path.relative(ROOT, OUT_JSON)}`);
