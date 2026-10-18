import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';

// Cloudflare Workers Builds 執行 `npx wrangler deploy`。沒有 wrangler 設定時，它把 repo 根目錄整個當成 assets 上傳，
// 連它自己裝的 node_modules/workerd（129 MiB）也算進去，超過單檔 25 MiB 上限而部署失敗（2026-10-18）。
const root = new URL('../', import.meta.url);

test('wrangler config uploads only the public directory', () => {
  const cfg = JSON.parse(readFileSync(new URL('wrangler.jsonc', root), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
  assert.equal(cfg.name, 'mopm-portal');
  assert.equal(cfg.assets?.directory, './public');
});

test('public directory holds only site files', () => {
  const walk = (dir, prefix = '') => readdirSync(dir).flatMap((f) => {
    const p = new URL(f, dir);
    return statSync(p).isDirectory() ? walk(new URL(f + '/', dir), prefix + f + '/') : [prefix + f];
  });
  const files = walk(new URL('public/', root)).sort();
  assert.deepEqual(files, [
    'index.html', 'robots.txt', 'sitemap.xml',
    'societies/tbsb.png', 'societies/tgmbs.png', 'societies/tpms.png',
    'societies/tps.png', 'societies/tsecb.png', 'societies/tsev.png',
    'style.css',
  ]);
});
