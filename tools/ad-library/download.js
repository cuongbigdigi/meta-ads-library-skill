#!/usr/bin/env node
/**
 * Tải ảnh và video của ad về máy (link Facebook chỉ sống vài ngày, cần lưu ngay).
 *   node tools/ad-library/download.js output/<file>.json [file2.json ...] [--top 10] [--min-days 7] [--match "regex"]
 *   node tools/ad-library/download.js output/<file>.json --ids 123,456     (tải đúng các ad này)
 * Lưu ở output/creative/<ngày>/<số thứ tự>-<page>-<ad_id>/ kèm file info.txt (nội dung ad, link thư viện).
 */
const fs = require('fs');
const path = require('path');
const { parseArgs, loadAds, rankAds, slug, outDir, download } = require('./lib');
const { opt, files } = parseArgs();
if (!files.length) { console.error('Thiếu file json, vd: node tools/ad-library/download.js output/<file>.json --top 10'); process.exit(1); }

const { all, ads } = loadAds(files, opt('match'));
let pick;
if (opt('ids')) { const ids = new Set(opt('ids').split(',').map(s => s.trim())); pick = all.filter(a => ids.has(a.ad_id)); }
else {
  const r = rankAds(ads, { top: parseInt(opt('top', '10'), 10), minDays: parseInt(opt('min-days', '7'), 10) });
  pick = r.winners.length ? r.winners : r.testing; // ngách mới chưa có ad thắng thì tải ad đang test
}
if (!pick.length) { console.error('Không có ad nào để tải. Thử --min-days nhỏ hơn hoặc bỏ --match.'); process.exit(1); }

(async () => {
  const base = outDir('creative', new Date().toISOString().slice(0, 10));
  let nFiles = 0, nFail = 0;
  for (const [i, a] of pick.entries()) {
    const d = path.join(base, `${String(i + 1).padStart(2, '0')}-${slug(a.page_name).slice(0, 30)}-${a.ad_id}`);
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'info.txt'), [
      `Page: ${a.page_name}`, `Format: ${a.format} | ${a.days_running} ngày | ${a.variants} biến thể | CTA: ${a.cta || '-'}`,
      `Bắt đầu: ${a.start_date}`, `Thư viện: ${a.library_url}`, a.link_url ? `Link đích: ${a.link_url}` : '', '', a.title || '', a.body || '',
    ].filter(x => x !== null).join('\n'));
    const urls = [...(a.videos || []).map((u, j) => [u, 'video-' + (j + 1)]), ...(a.images || []).map((u, j) => [u, 'anh-' + (j + 1)])];
    if (!urls.length && a.video_preview) urls.push([a.video_preview, 'anh-bia']);
    for (const [u, name] of urls) (await download(u, path.join(d, name))) ? nFiles++ : nFail++;
    console.error(`[${i + 1}/${pick.length}] ${a.page_name}: ${urls.length} file`);
  }
  console.log(`OK đã tải ${nFiles} file của ${pick.length} ad -> ${base}${nFail ? `\n${nFail} file lỗi (link đã hết hạn: quét lại rồi tải ngay)` : ''}`);
})();
