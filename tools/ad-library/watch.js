#!/usr/bin/env node
/**
 * Theo dõi ngành hàng + đối thủ định kỳ: quét danh sách trong watchlist.json,
 * so với lần quét trước và báo ad mới, ad vừa sống qua mốc 7/14/30 ngày, ad đối thủ đã tắt.
 *
 *   node tools/ad-library/watch.js                      (dùng watchlist.json ở thư mục gốc)
 *   node tools/ad-library/watch.js --list my-list.json  (danh sách khác)
 *   node tools/ad-library/watch.js --dry-run            (chỉ in sẽ quét gì)
 *
 * Kết quả: output/watch/report-<ngày-giờ>.md (+ latest.md), trạng thái ở output/watch/state.json.
 * Hẹn giờ chạy tự động: xem mục "Theo dõi định kỳ" trong README.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const root = path.resolve(__dirname, '..', '..');
const listFile = path.resolve(arg('list', path.join(root, 'watchlist.json')));
if (!fs.existsSync(listFile)) {
  console.error(`Chưa có ${listFile}. Copy watchlist.example.json thành watchlist.json rồi sửa từ khóa / page đối thủ.`);
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(listFile, 'utf8'));
const country = cfg.country || 'VN';
const maxKw = cfg.max_per_keyword || 60, maxPage = cfg.max_per_page || 100;
const MILESTONES = [7, 14, 30];

const dir = path.join(root, 'output', 'watch');
const d0 = new Date(), pad = n => String(n).padStart(2, '0');
const stamp = `${d0.getFullYear()}-${pad(d0.getMonth() + 1)}-${pad(d0.getDate())}-${pad(d0.getHours())}${pad(d0.getMinutes())}${pad(d0.getSeconds())}`; // giờ máy
fs.mkdirSync(path.join(dir, 'raw'), { recursive: true });
const stateFile = path.join(dir, 'state.json');
const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : { runs: 0, targets: {} };
const firstRun = !state.runs;

const slug = s => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
const targets = [
  ...(cfg.keywords || []).map(k => typeof k === 'string' ? { q: k } : k).map(k => ({
    key: 'kw:' + slug(k.q), label: `Từ khóa "${k.q}"`, args: ['--q', k.q, '--max', String(k.max || maxKw), '--sort', k.sort || 'new'], match: k.match, isPage: false })),
  ...(cfg.pages || []).map(p => typeof p === 'string' ? { id: p } : p).map(p => ({
    key: 'page:' + p.id, label: `Page ${p.name || p.id}`, args: ['--page-id', String(p.id), '--max', String(p.max || maxPage)], isPage: true })),
];
if (!targets.length) { console.error('watchlist trống: thêm "keywords" hoặc "pages".'); process.exit(1); }
if (argv.includes('--dry-run')) { targets.forEach(t => console.log(t.label, t.args.join(' '))); process.exit(0); }

const short = s => (s || '').replace(/\s+/g, ' ').slice(0, 120);
const line = a => `- [${a.page_name}] ${a.format || '?'} | ${a.days_running}d | ${a.variants} biến thể | ${short(a.body)}\n  ${a.library_url}`;
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const sections = [];
const summary = { new: 0, milestone: 0, stopped: 0, failed: 0 };
targets.forEach((t, i) => {
  if (i) sleep(15000 + Math.random() * 15000); // nghỉ giữa các lượt để không bị chặn
  const out = path.join(dir, 'raw', `${t.key.replace(':', '-')}-${stamp}.json`);
  console.error(`[${i + 1}/${targets.length}] ${t.label}`);
  const r = spawnSync(process.execPath, [path.join(__dirname, 'scrape.js'), ...t.args, '--country', country, '--out', out],
    { cwd: root, stdio: ['ignore', 'inherit', 'inherit'], timeout: 5 * 60 * 1000 });
  if (r.status !== 0 || !fs.existsSync(out)) { summary.failed++; sections.push(`## ${t.label}\nLỖI: quét không thành công, lần sau sẽ thử lại.\n`); return; }

  let ads = JSON.parse(fs.readFileSync(out, 'utf8')).ads || [];
  if (t.match) { const re = new RegExp(t.match, 'i'); ads = ads.filter(a => re.test(`${a.page_name} ${a.title} ${a.body}`)); }
  const prev = state.targets[t.key] || null;
  const prevAds = prev ? prev.ads : {};
  const now = {};
  ads.forEach(a => { now[a.ad_id] = { page_name: a.page_name, days: a.days_running || 0, variants: a.variants || 1, body: short(a.body), url: a.library_url, first_seen: (prevAds[a.ad_id] || {}).first_seen || stamp }; });

  // quét từ khóa mỗi lần trả một tập hơi khác nhau: chỉ coi là mới nếu ad bắt đầu chạy sau lần quét trước
  const gapDays = prev ? Math.ceil((Date.now() - prev.last_run_ms) / 86400000) + 1 : 0;
  const fresh = prev ? ads.filter(a => !prevAds[a.ad_id] && (t.isPage || (a.days_running || 0) <= gapDays)) : [];
  const crossed = prev ? ads.filter(a => { const p = prevAds[a.ad_id]; return p && MILESTONES.some(m => p.days < m && (a.days_running || 0) >= m); }) : [];
  // ad tắt chỉ tin được khi quét theo page (quét từ khóa bị giới hạn số lượng nên ad biến mất chưa chắc đã tắt)
  const stopped = prev && t.isPage ? Object.entries(prevAds).filter(([id]) => !now[id]).map(([, p]) => p) : [];
  summary.new += fresh.length; summary.milestone += crossed.length; summary.stopped += stopped.length;

  // Xu hướng: số ad đang chạy qua các lần quét gần nhất (đối thủ tăng ad = đang đẩy mạnh)
  const history = [...((prev && prev.history) || []), { at: stamp.slice(0, 10), ads: ads.length, new: fresh.length }].slice(-30);
  const trend = history.length > 1 ? `
Xu hướng ${history.length} lần quét gần nhất: ${history.slice(-8).map(h => h.ads).join(' → ')} ad` +
    (history.length >= 3 && ads.length >= history[Math.max(0, history.length - 8)].ads * 1.5 && ads.length - history[Math.max(0, history.length - 8)].ads >= 3 ? ' (tăng mạnh, đang đẩy ngân sách)' : '') : '';
  const parts = [`## ${t.label}`, `Đang thấy ${ads.length} ad${prev ? `, lần trước ${Object.keys(prevAds).length}` : ' (lần đầu, lấy làm mốc so sánh)'}.${trend}`];
  if (crossed.length) parts.push(`\n### Vừa sống qua mốc ${MILESTONES.join('/')} ngày (ứng viên ad thắng)`, ...crossed.sort((a, b) => b.days_running - a.days_running).map(line));
  if (fresh.length) parts.push(`\n### Ad mới (${fresh.length})`, ...fresh.sort((a, b) => b.variants - a.variants).slice(0, 15).map(line), fresh.length > 15 ? `- ... và ${fresh.length - 15} ad khác` : '');
  if (stopped.length) parts.push(`\n### Đã tắt (${stopped.length})`, ...stopped.slice(0, 10).map(p => `- [${p.page_name}] chạy ${p.days} ngày | ${p.body}\n  ${p.url}`));
  if (prev && !fresh.length && !crossed.length && !stopped.length) parts.push('Không có thay đổi đáng chú ý.');
  sections.push(parts.filter(Boolean).join('\n') + '\n');
  state.targets[t.key] = { label: t.label, last_run: stamp, last_run_ms: Date.now(), ads: now, history };
});

state.runs++;
state.last_run = stamp;
fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));

const head = firstRun
  ? `Lần quét đầu tiên: đã lưu mốc cho ${targets.length} mục. Từ lần sau sẽ báo ad mới, ad sống qua mốc ngày và ad đối thủ đã tắt.`
  : `${summary.new} ad mới, ${summary.milestone} ad vừa qua mốc ngày, ${summary.stopped} ad đã tắt${summary.failed ? `, ${summary.failed} mục quét lỗi` : ''}.`;
const report = `# Theo dõi Ads Library ${stamp}\n\n${head}\n\n${sections.join('\n')}`;
const reportFile = path.join(dir, `report-${stamp}.md`);
fs.writeFileSync(reportFile, report);
fs.writeFileSync(path.join(dir, 'latest.md'), report);
console.log(`OK ${head}\nBáo cáo: ${reportFile}`);

// Gửi báo cáo qua Discord webhook / Telegram bot nếu có cấu hình
const chunks = (txt, n) => { const out = []; for (let i = 0; i < txt.length; i += n) out.push(txt.slice(i, i + n)); return out; };
const post = (url, body, name) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  .then(r => console.log(r.ok ? `Đã gửi ${name}` : `Gửi ${name} lỗi ${r.status}`)).catch(e => console.error(`Gửi ${name} lỗi:`, e.message));
(async () => {
  const hook = cfg.discord_webhook;
  if (hook && /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\//.test(hook)) for (const c of chunks(report, 1900).slice(0, 5)) await post(hook, { content: c }, 'Discord');
  const tg = cfg.telegram || {};
  if (tg.bot_token && tg.chat_id) for (const c of chunks(report, 3900).slice(0, 5)) await post(`https://api.telegram.org/bot${tg.bot_token}/sendMessage`, { chat_id: tg.chat_id, text: c, disable_web_page_preview: true }, 'Telegram');
})();
