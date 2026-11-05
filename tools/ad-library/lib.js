/**
 * Hàm dùng chung cho các tool đọc file kết quả của scrape.js.
 */
const fs = require('fs');
const path = require('path');

// Đọc tham số dòng lệnh: file json (không có --) và các cờ --ten gia-tri
// booleans: tên các cờ không đi kèm giá trị (vd ['watchlist'])
function parseArgs(booleans = [], argv = process.argv.slice(2)) {
  const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
  const flag = k => argv.includes('--' + k);
  const files = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && !booleans.includes(argv[i - 1].slice(2))));
  return { opt, flag, files };
}

// Gộp nhiều file, bỏ ad trùng, lọc theo regex nếu có
function loadAds(files, match) {
  const byId = new Map();
  for (const f of files) for (const a of JSON.parse(fs.readFileSync(f, 'utf8')).ads || []) byId.set(a.ad_id, a);
  const all = [...byId.values()];
  const re = match && new RegExp(match, 'i');
  return { all, ads: re ? all.filter(a => re.test(`${a.page_name} ${a.title} ${a.body}`)) : all };
}

// Gộp ad cùng creative (collation) để không đếm trùng
function collapse(ads) {
  const groups = new Map();
  for (const a of ads) {
    const k = a.collation_id || a.ad_id;
    const g = groups.get(k);
    if (!g || (a.days_running || 0) > (g.days_running || 0)) groups.set(k, { ...a, variants: Math.max(a.variants || 1, g ? g.variants : 1) });
  }
  return [...groups.values()];
}

const score = a => (a.days_running || 0) + Math.min(a.variants || 1, 30) * 2;

// Ad thắng (đủ ngày, xếp theo điểm) và ad đang test (mới nhưng nhiều biến thể)
function rankAds(ads, { top = 15, minDays = 7, testVariants = 3 } = {}) {
  const list = collapse(ads);
  return {
    list,
    winners: list.filter(a => (a.days_running || 0) >= minDays).sort((a, b) => score(b) - score(a)).slice(0, top),
    testing: list.filter(a => (a.days_running || 0) < minDays && (a.variants || 1) >= testVariants).sort((a, b) => b.variants - a.variants).slice(0, 10),
  };
}

// Xếp hạng page trong ngách
function rankPages(ads) {
  const pages = new Map();
  for (const a of ads) {
    const p = pages.get(a.page_id) || { page_id: a.page_id, page_name: a.page_name, ads: 0, creatives: new Set(), new7: 0, max_days: 0, sum_days: 0, formats: {}, ctas: {}, links: new Set() };
    p.ads++;
    p.creatives.add(a.collation_id || a.ad_id);
    if ((a.days_running || 0) <= 7) p.new7++;
    p.max_days = Math.max(p.max_days, a.days_running || 0);
    p.sum_days += a.days_running || 0;
    if (a.format) p.formats[a.format] = (p.formats[a.format] || 0) + 1;
    if (a.cta) p.ctas[a.cta] = (p.ctas[a.cta] || 0) + 1;
    if (a.link_url) { try { p.links.add(new URL(a.link_url).hostname); } catch { /* bỏ */ } }
    pages.set(a.page_id, p);
  }
  return [...pages.values()].map(p => ({
    page_id: p.page_id, page_name: p.page_name, ads: p.ads, creatives: p.creatives.size, new_7d: p.new7,
    max_days: p.max_days, avg_days: Math.round(p.sum_days / p.ads),
    top_format: Object.entries(p.formats).sort((a, b) => b[1] - a[1]).map(x => x[0])[0] || '-',
    top_cta: Object.entries(p.ctas).sort((a, b) => b[1] - a[1]).map(x => x[0])[0] || '-',
    sites: [...p.links],
    page_url: 'https://www.facebook.com/' + p.page_id,
    library_url: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=VN&view_all_page_id=' + p.page_id,
  })).sort((a, b) => b.ads - a.ads || b.max_days - a.max_days);
}

const count = (ads, key) => { const o = {}; ads.forEach(a => a[key] && (o[a[key]] = (o[a[key]] || 0) + 1)); return Object.entries(o).sort((a, b) => b[1] - a[1]); };
const short = (s, n = 160) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const slug = s => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
const outDir = (...p) => { const d = path.join(path.resolve(__dirname, '..', '..'), 'output', ...p); fs.mkdirSync(d, { recursive: true }); return d; };

// Tải 1 file về máy, trả về đường dẫn hoặc null nếu lỗi (link ảnh/video Facebook có hạn)
async function download(url, file) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') || '';
    const ext = ct.includes('video') ? '.mp4' : ct.includes('png') ? '.png' : ct.includes('webp') ? '.webp' : '.jpg';
    const f = file + ext;
    fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    return f;
  } catch { return null; }
}

module.exports = { parseArgs, loadAds, collapse, score, rankAds, rankPages, count, short, slug, outDir, download };
