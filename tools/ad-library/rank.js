#!/usr/bin/env node
/**
 * Xếp hạng ad thắng từ file của scrape.js: chạy lâu + nhiều biến thể = đang được đầu tư tiền.
 *   node tools/ad-library/rank.js output/<file>.json [file2.json ...] [--top 15] [--min-days 7] [--match "chống nắng|spf"]
 * Truyền nhiều file (nhiều từ khóa cùng ngách) để gộp chung, ad trùng chỉ tính 1 lần.
 */
const fs = require('fs');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const files = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
const top = parseInt(opt('top', '15'), 10);
const minDays = parseInt(opt('min-days', '7'), 10);           // ad mới < N ngày chưa đủ tín hiệu thắng
const testVariants = parseInt(opt('test-variants', '3'), 10); // ad mới có từ N biến thể = đang test
const match = opt('match') && new RegExp(opt('match'), 'i');  // lọc theo tên page / tiêu đề / nội dung
if (!files.length) { console.error('Thiếu file json, vd: node tools/ad-library/rank.js output/<file>.json'); process.exit(1); }
const byId = new Map();
for (const f of files) for (const a of JSON.parse(fs.readFileSync(f, 'utf8')).ads || []) byId.set(a.ad_id, a);
const all = [...byId.values()];
const ads = match ? all.filter(a => match.test(`${a.page_name} ${a.title} ${a.body}`)) : all;

// gộp theo collation (cùng creative nhân bản) để không đếm trùng
const groups = new Map();
for (const a of ads) {
  const k = a.collation_id || a.ad_id;
  const g = groups.get(k);
  if (!g || (a.days_running || 0) > (g.days_running || 0)) groups.set(k, { ...a, variants: Math.max(a.variants || 1, g ? g.variants : 1) });
}
const score = a => (a.days_running || 0) + Math.min(a.variants || 1, 30) * 2;
const list = [...groups.values()];
const ranked = list.filter(a => (a.days_running || 0) >= minDays).sort((a, b) => score(b) - score(a)).slice(0, top);
// ad mới nhân bản nhiều = đối thủ đang test, chưa phải ad thắng
const testing = list.filter(a => (a.days_running || 0) < minDays && (a.variants || 1) >= testVariants).sort((a, b) => b.variants - a.variants).slice(0, 10);

console.log(`Đã đọc ${files.length} file, ${all.length} ad, ${ads.length} ad sau lọc, ${list.length} creative khác nhau.
`);
console.log(`# Top ad (điểm = ngày chạy + 2×biến thể, từ ${minDays} ngày trở lên)\n`);
if (!ranked.length) console.log('(Chưa có ad nào đủ ngày chạy, ngách đang test nhiều. Xem mục "Đang test" bên dưới, hoặc thử --min-days 3 / --status all.)');
ranked.forEach((a, i) => {
  console.log(`${i + 1}. [${a.page_name}] ${a.format} | ${a.days_running}d | ${a.variants} biến thể | CTA: ${a.cta || '-'}`);
  console.log(`   Hook: ${(a.body || '').replace(/\s+/g, ' ').slice(0, 160)}`);
  console.log(`   ${a.library_url}`);
});
if (testing.length) {
  console.log('\n# Đang test (mới < ' + minDays + ' ngày, nhiều biến thể)');
  testing.forEach(a => console.log(`- [${a.page_name}] ${a.format} | ${a.days_running}d | ${a.variants} biến thể | ${(a.body || '').replace(/\s+/g, ' ').slice(0, 100)}\n  ${a.library_url}`));
}
const fmt = {}; ads.forEach(a => fmt[a.format] = (fmt[a.format] || 0) + 1);
const cta = {}; ads.forEach(a => a.cta && (cta[a.cta] = (cta[a.cta] || 0) + 1));
console.log('\nFormat:', JSON.stringify(fmt), '\nCTA:', JSON.stringify(cta));
