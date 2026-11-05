#!/usr/bin/env node
/**
 * Xếp hạng page (đối thủ) trong ngách: ai chạy nhiều ad, ai ra ad mới đều, ai có ad sống lâu.
 *   node tools/ad-library/pages.js output/<file>.json [file2.json ...] [--top 15] [--match "regex"] [--watchlist]
 * --watchlist: in thêm đoạn JSON để dán vào watchlist.json theo dõi các page này.
 */
const { parseArgs, loadAds, rankPages } = require('./lib');
const { opt, flag, files } = parseArgs(['watchlist']);
if (!files.length) { console.error('Thiếu file json, vd: node tools/ad-library/pages.js output/<file>.json'); process.exit(1); }
const top = parseInt(opt('top', '15'), 10);
const { ads } = loadAds(files, opt('match'));
const pages = rankPages(ads).slice(0, top);

console.log(`# Top ${pages.length} page trong ${ads.length} ad\n`);
console.log('Ad = số ad đang thấy | Mới 7 ngày = ad mới lên trong 7 ngày (đang đẩy mạnh) | Lâu nhất = ad sống lâu nhất\n');
pages.forEach((p, i) => {
  console.log(`${i + 1}. ${p.page_name} (page_id ${p.page_id})`);
  console.log(`   ${p.ads} ad, ${p.creatives} creative khác nhau | mới 7 ngày: ${p.new_7d} | lâu nhất: ${p.max_days} ngày, trung bình ${p.avg_days} ngày | ${p.top_format} | CTA: ${p.top_cta}${p.sites.length ? ' | web: ' + p.sites.join(', ') : ''}`);
  console.log(`   ${p.library_url}`);
});
if (flag('watchlist')) {
  console.log('\n# Dán vào "pages" trong watchlist.json:');
  console.log(JSON.stringify(pages.map(p => ({ id: p.page_id, name: p.page_name })), null, 2));
}
