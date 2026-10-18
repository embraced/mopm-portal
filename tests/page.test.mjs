import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const SERIES = 'Multiomics and Precision Medicine Joint Conference (MOPM)';

const jsonLd = () => {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(blocks.length, 1, 'exactly one JSON-LD block');
  return JSON.parse(blocks[0][1]);
};
const hrefs = (s) => [...s.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
const row = (year) => {
  const m = html.match(new RegExp(`<li[^>]*data-year="${year}"[\\s\\S]*?</li>`));
  assert.ok(m, `row ${year} exists`);
  return m[0];
};
const current = () => {
  const m = html.match(/<section id="current" data-year="2026"[\s\S]*?<\/section>/);
  assert.ok(m, 'current section exists');
  return m[0];
};

test('json-ld parses as EventSeries', () => {
  const s = jsonLd();
  assert.equal(s['@type'], 'EventSeries');
  assert.equal(s['@id'], 'https://mopm.tw/#series');
  assert.equal(s.name, SERIES);
  assert.equal(s.url, 'https://mopm.tw/');
  assert.equal(s.subEvent.length, 8);
  assert.equal(s.organizer.length, 6);
});

test('subEvents cover 2019–2026 with spec dates', () => {
  const ev = jsonLd().subEvent;
  assert.deepEqual(ev.map((e) => e.startDate),
    ['2026-11-14', '2025-11-08', '2024-11-09', '2023-11-11', '2022-11-19', '2021-11-13', '2020-11-14', '2019-12-07']);
  assert.deepEqual(ev.map((e) => e.endDate),
    ['2026-11-15', '2025-11-09', '2024-11-10', '2023-11-12', '2022-11-20', '2021-11-14', '2020-11-15', '2019-12-08']);
  for (const e of ev) {
    assert.equal(e['@type'], 'Event');
    assert.ok(e.name.startsWith(SERIES), e.name);
    assert.ok(e.name.includes(e.startDate.slice(0, 4)), e.name);
    assert.ok(e.url.startsWith('http'), e.name);
    assert.ok(e.organizer?.name, e.name);
  }
});

test('2021 is an online event', () => {
  const e = jsonLd().subEvent.find((x) => x.startDate.startsWith('2021'));
  assert.equal(e.eventAttendanceMode, 'https://schema.org/OnlineEventAttendanceMode');
  assert.equal(e.location['@type'], 'VirtualLocation');
});

test('only 2026 is marked current', () => {
  const cur = current();
  assert.ok(hrefs(cur).includes('https://2026.mopm.tw/'));
  const total = html.split('本屆').length - 1;
  const inside = cur.split('本屆').length - 1;
  assert.ok(inside >= 1, '本屆 appears in current section');
  assert.equal(total, inside, '本屆 appears nowhere else');
});

test('every edition row shows a link type label', () => {
  for (const y of [2019, 2020, 2021, 2022, 2023, 2024, 2025]) {
    const r = row(y);
    assert.ok(['官網', '存檔', '議程 PDF', '學會頁'].some((l) => r.includes(l)), `row ${y} has a label`);
  }
});

test('links match spec', () => {
  const all = hrefs(html);
  const expected = [
    'https://2026.mopm.tw/',
    'https://www.mopmtaiwan.com/',
    'https://web.archive.org/web/20251106093822/https://www.mopmtaiwan.com/',
    'https://web.archive.org/web/20241015095543/https://www.mopmtaiwan.com/',
    'https://web.archive.org/web/20250525211105/https://tsev.org/2023mopm/',
    'https://web.archive.org/web/20231206113206/http://mopm2022.tsecb.org.tw/',
    'https://ceb.nycu.edu.tw/wp-content/uploads/2021/08/2021MOPM%E4%B8%AD%E6%96%87%E8%AD%B0%E7%A8%8B_%E7%B7%9A%E4%B8%8A%E7%A0%94%E8%A8%8E%E6%9C%83_20210810-1.pdf',
    'https://www.proteomics.org.tw/%e6%9c%83%e8%ad%b0-%e8%aa%b2%e7%a8%8b/2020-%e5%a4%9a%e9%ab%94%e5%ad%b8%e5%8f%8a%e7%b2%be%e6%ba%96%e9%86%ab%e5%ad%b8%e8%81%af%e5%90%88%e6%9c%83%e8%ad%b0/',
    'https://www.proteomics.org.tw/en/course-conference/2020-multiomics-and-precision-medicine-joint-conference/',
    'https://web.archive.org/web/20240811180954/https://www.binfo.ncku.edu.tw/MOPM2019/',
  ];
  for (const u of expected) assert.ok(all.includes(u), `missing ${u}`);
});

test('no forbidden links', () => {
  for (const h of hrefs(html)) {
    if (h.includes('tsev.org')) assert.ok(h.startsWith('https://web.archive.org/'), h);
  }
  for (const h of hrefs(row(2024))) assert.ok(!h.startsWith('https://www.mopmtaiwan.com'), h);
});

test('six society logos link to homepages', () => {
  const m = html.match(/<section id="societies"[\s\S]*?<\/section>/);
  assert.ok(m, 'societies section exists');
  assert.deepEqual(hrefs(m[0]), [
    'https://www.proteomics.org.tw/',
    'https://www.tbsb.org.tw/',
    'http://www.tgmbs.com/',
    'https://www.tsecb.org.tw/',
    'https://tpms.org.tw/',
    'https://www.facebook.com/groups/tsevtw/',
  ]);
  const imgs = [...m[0].matchAll(/<img[^>]*>/g)].map((x) => x[0]);
  assert.equal(imgs.length, 6);
  for (const i of imgs) assert.match(i, /alt="[^"]+"/);
});

test('head is correct', () => {
  assert.ok(html.includes('<html lang="zh-Hant">'));
  assert.ok(html.includes('<link rel="canonical" href="https://mopm.tw/">'));
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  assert.ok(title.includes('多體學與精準醫學聯合會議'), title);
  assert.ok(title.includes(SERIES), title);
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.ok(html.includes('<meta name="viewport"'));
});

test('external links open in new tab safely', () => {
  for (const m of html.matchAll(/<a [^>]*href="https?:[^"]*"[^>]*>/g)) {
    assert.ok(m[0].includes('target="_blank"') && m[0].includes('rel="noopener"'), m[0]);
  }
});

test('robots and sitemap point to mopm.tw', () => {
  const robots = readFileSync(new URL('../robots.txt', import.meta.url), 'utf8');
  const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
  assert.ok(robots.includes('Sitemap: https://mopm.tw/sitemap.xml'));
  assert.ok(sitemap.includes('<loc>https://mopm.tw/</loc>'));
});
