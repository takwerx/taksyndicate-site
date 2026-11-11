// Fetches the approved accounts for /community/ from the private repo takwerx/community-tak-projects.
//
//   COMMUNITY_TOKEN=... node scripts/sync-community.mjs
//
// Token: fine-grained, Contents: Read on that one repo. Locally, falls back to `gh auth token`.
// Output (not in git): src/data/community.json and public/community-avatars/<account>.webp.
// If the fetch fails, the previous file stays and the build goes on.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const URL_ = 'https://api.github.com/repos/takwerx/community-tak-projects/contents/accounts.json';
const OUT_JSON = path.join(ROOT, 'src/data/community.json');
const AVATARS = path.join(ROOT, 'public/community-avatars');

function token() {
  if (process.env.COMMUNITY_TOKEN) return process.env.COMMUNITY_TOKEN;
  try { return execFileSync('gh', ['auth', 'token'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; }
}

function keepOld(why) {
  console.warn(`  ! community sync: ${why}`);
  if (!fs.existsSync(OUT_JSON)) {
    fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
    fs.writeFileSync(OUT_JSON, JSON.stringify({ synced: null, accounts: [] }, null, 2) + '\n');
  }
  process.exit(0);
}

const t = token();
if (!t) keepOld('no COMMUNITY_TOKEN (and no gh login); keeping the previous list');

let accounts;
try {
  const res = await fetch(URL_, { headers: { Authorization: `Bearer ${t}`, Accept: 'application/vnd.github.raw+json', 'User-Agent': 'taksyndicate-site-build' } });
  if (!res.ok) keepOld(`accounts.json ${res.status}`);
  accounts = await res.json();
  if (!Array.isArray(accounts)) keepOld('accounts.json is not an array');
} catch (e) { keepOld(String(e.message || e)); }

// Our own account is always listed, even if it is not in accounts.json.
if (!accounts.some((a) => a.account?.toLowerCase() === 'takwerx')) {
  accounts.push({ account: 'takwerx', name: 'TAKwerx', category: 'TAK infrastructure and ATAK plugins', url: 'https://github.com/takwerx', avatar: 'https://avatars.githubusercontent.com/u/256680328' });
}

// iTAK has no plugins, so drop it from the plugin category.
const cleanCategory = (c) => (c || '').replace('ATAK, WinTAK and iTAK plugins', 'ATAK and WinTAK plugins');

fs.mkdirSync(AVATARS, { recursive: true });
const out = [];
for (const a of accounts) {
  if (!/^[\w-]+$/.test(a.account || '') || !/^https:\/\/github\.com\//.test(a.url || '')) continue;
  let avatar = null;
  try {
    if (/^https:\/\/avatars\.githubusercontent\.com\//.test(a.avatar || '')) {
      const r = await fetch(a.avatar + (a.avatar.includes('?') ? '&' : '?') + 's=200');
      if (r.ok) {
        await sharp(Buffer.from(await r.arrayBuffer())).resize(160, 160).webp({ quality: 85 }).toFile(path.join(AVATARS, `${a.account}.webp`));
        avatar = `/community-avatars/${a.account}.webp`;
      }
    }
  } catch (e) { console.warn(`  ! avatar failed for ${a.account}`); }
  out.push({ account: a.account, name: (a.name || '').trim() || a.account, category: cleanCategory(a.category), url: a.url, avatar });
}
out.sort((x, y) => x.name.localeCompare(y.name, 'en', { sensitivity: 'base' }));

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify({ synced: new Date().toISOString(), accounts: out }, null, 2) + '\n');
console.log(`${out.length} community accounts -> ${path.relative(ROOT, OUT_JSON)}`);
