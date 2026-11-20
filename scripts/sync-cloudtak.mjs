// Builds the list for /plugins/cloudtak/ (community CloudTAK plugins).
//
//   node scripts/sync-cloudtak.mjs
//
// Source: the TAK Portal CloudTAK Marketplace catalog, plus the hand-edited
// src/data/cloudtak-meta.json (tags, descriptions, extra repos, skips).
// Each repo's license, last push, latest release and owner come from the GitHub API.
// Token (optional, raises the rate limit): GH_API_TOKEN or GITHUB_TOKEN; locally, `gh auth token`.
// Output (not in git): src/data/cloudtak.json.
// If the catalog can't be read, the previous file stays and the build goes on.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const META = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/cloudtak-meta.json'), 'utf8'));
const OUT_JSON = path.join(ROOT, 'src/data/cloudtak.json');
const API = 'https://api.github.com';

function token() {
  const env = process.env.GH_API_TOKEN || process.env.GITHUB_TOKEN;
  if (env) return env;
  try { return execFileSync('gh', ['auth', 'token'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; }
}
const t = token();
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'taksyndicate-site-build', ...(t && { Authorization: `Bearer ${t}` }) };

function keepOld(why) {
  console.warn(`  ! cloudtak sync: ${why}`);
  if (!fs.existsSync(OUT_JSON)) {
    fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
    fs.writeFileSync(OUT_JSON, JSON.stringify({ synced: null, plugins: [] }, null, 2) + '\n');
  }
  process.exit(0);
}

async function gh(p, accept) {
  const res = await fetch(API + p, { headers: accept ? { ...headers, Accept: accept } : headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${p} ${res.status}`);
  return accept?.includes('raw') ? res.text() : res.json();
}

// "https://github.com/Owner/Repo.git" or "Owner/Repo" -> "Owner/Repo"
const repoName = (s) => String(s || '').replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '');
const key = (r) => r.toLowerCase();
const metaFor = Object.fromEntries(Object.entries(META.plugins || {}).map(([r, m]) => [key(r), m]));
const skip = new Set((META.skip || []).map(key));
const skipOwners = new Set((META.skipOwners || []).map((o) => o.toLowerCase()));

// 1. The marketplace catalog.
const [cOwner, cRepo, ...cPath] = META.catalog.split('/');
let catalog;
try {
  const text = await gh(`/repos/${cOwner}/${cRepo}/contents/${cPath.join('/')}`, 'application/vnd.github.raw+json');
  if (!text) keepOld('catalog not found');
  catalog = JSON.parse(text);
  if (!Array.isArray(catalog.plugins)) keepOld('catalog has no plugins array');
} catch (e) { keepOld(String(e.message || e)); }

const entries = [];
for (const p of catalog.plugins) {
  if (p.hidden) continue;
  const repo = repoName(p.repo);
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) continue;
  entries.push({
    repo, name: p.name, description: p.description, marketplace: true,
    // A server half (API routes, a sidecar or its own Docker service) means more for the admin to run.
    server: Boolean(p.routes || p.sidecars?.length || p.composeFile),
  });
}
for (const x of META.extra || []) {
  if (entries.some((e) => key(e.repo) === key(x.repo))) continue;
  entries.push({ repo: x.repo, name: x.name, description: x.description, marketplace: false, server: false, extra: x });
}

// 2. GitHub facts for each repo.
const owners = new Map();
const out = [];
for (const e of entries) {
  if (skip.has(key(e.repo)) || skipOwners.has(e.repo.split('/')[0].toLowerCase())) continue;
  const m = { ...(e.extra || {}), ...(metaFor[key(e.repo)] || {}) };
  let info, release;
  try {
    info = await gh(`/repos/${e.repo}`);
    if (!info) { console.warn(`  ! ${e.repo}: not found, left out`); continue; }
    if (info.archived) { console.warn(`  ! ${e.repo}: archived, left out`); continue; }
    release = await gh(`/repos/${e.repo}/releases/latest`);
  } catch (err) {
    console.warn(`  ! ${e.repo}: ${err.message}; listed without GitHub details`);
  }
  const login = info?.owner?.login || e.repo.split('/')[0];
  if (!owners.has(login)) {
    let name = login;
    try { const u = await gh(`/users/${login}`); if (u?.name?.trim()) name = u.name.trim(); }
    catch { console.warn(`  ! ${login}: profile failed`); }
    owners.set(login, name);
  }
  out.push({
    name: m.name || e.name || e.repo.split('/')[1],
    repo: info?.full_name || e.repo,
    description: m.description || e.description || info?.description || '',
    tags: m.tags?.length ? m.tags : ['all'],
    region: m.region || null,
    owner: login,
    ownerName: owners.get(login),
    marketplace: e.marketplace,
    server: e.server,
    license: info?.license?.spdx_id && info.license.spdx_id !== 'NOASSERTION' ? info.license.spdx_id : null,
    release: release?.tag_name || null,
    updated: info?.pushed_at || null,
  });
}
out.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify({ synced: new Date().toISOString(), plugins: out }, null, 2) + '\n');
console.log(`${out.length} community CloudTAK plugins -> ${path.relative(ROOT, OUT_JSON)}`);
