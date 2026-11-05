#!/usr/bin/env node
/**
 * Xuất báo cáo HTML có ảnh: ad thắng, ad đang test, top page, format/CTA, kèm phần phân tích của agent.
 * Mở bằng trình duyệt bất kỳ, gửi được cho khách/sếp (nén cả thư mục).
 *   node tools/ad-library/report.js output/<file>.json [file2.json ...] --title "Ngách nến thơm" [--match "regex"] [--notes phan-tich.md] [--top 12]
 * --notes: file markdown phần phân tích (pattern hook, offer, khoảng trống, góc test) do agent viết.
 * Kết quả: output/report-<tên>-<ngày>/index.html (ảnh tải về thư mục img/ để không bị hết hạn).
 */
const fs = require('fs');
const path = require('path');
const { parseArgs, loadAds, rankAds, rankPages, count, short, slug, outDir, download } = require('./lib');
const { opt, files } = parseArgs();
if (!files.length) { console.error('Thiếu file json, vd: node tools/ad-library/report.js output/<file>.json --title "Ngách ..."'); process.exit(1); }

const title = opt('title', 'Báo cáo quảng cáo đối thủ');
const { ads } = loadAds(files, opt('match'));
const minDays = parseInt(opt('min-days', '7'), 10);
const { list, winners, testing } = rankAds(ads, { top: parseInt(opt('top', '12'), 10), minDays });
const pages = rankPages(ads).slice(0, 10);
const date = new Date().toISOString().slice(0, 10);
const dir = outDir(`report-${slug(title).slice(0, 40)}-${date}`);
fs.mkdirSync(path.join(dir, 'img'), { recursive: true });

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Markdown tối giản cho phần phân tích: tiêu đề, gạch đầu dòng, bảng, chữ đậm
function md(src) {
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');
  const out = []; let list = false, table = null;
  const flush = () => { if (list) { out.push('</ul>'); list = false; } if (table) { out.push('<div class="tbl"><table>' + table.map((r, i) => '<tr>' + r.map(c => i ? `<td>${inline(c)}</td>` : `<th>${inline(c)}</th>`).join('') + '</tr>').join('') + '</table></div>'); table = null; } };
  for (const raw of src.split(/\r?\n/)) {
    const l = raw.trim();
    if (/^\|.*\|$/.test(l)) { if (/^\|[\s:-]+(\|[\s:-]+)*\|$/.test(l)) continue; if (list) { out.push('</ul>'); list = false; } (table = table || []).push(l.slice(1, -1).split('|').map(c => c.trim())); continue; }
    if (table) flush();
    if (/^#{1,4}\s/.test(l)) { flush(); const n = Math.min(l.match(/^#+/)[0].length + 1, 4); out.push(`<h${n}>${inline(l.replace(/^#+\s/, ''))}</h${n}>`); }
    else if (/^[-*]\s/.test(l)) { if (!list) { out.push('<ul>'); list = true; } out.push(`<li>${inline(l.slice(2))}</li>`); }
    else if (!l) flush();
    else { flush(); out.push(`<p>${inline(l)}</p>`); }
  }
  flush();
  return out.join('\n');
}

const bar = (rows, total) => rows.slice(0, 5).map(([k, v]) => `<div class="bar"><span>${esc(k)}</span><i style="width:${Math.max(2, Math.round(v * 100 / total))}%"></i><em>${Math.round(v * 100 / total)}%</em></div>`).join('');

async function thumb(a) {
  const src = (a.images || [])[0] || a.video_preview;
  if (!src) return '';
  const f = await download(src, path.join(dir, 'img', a.ad_id));
  return f ? 'img/' + path.basename(f) : '';
}

async function card(a, tag) {
  const img = await thumb(a);
  return `<article class="card">
  ${img ? `<a href="${esc(a.library_url)}" target="_blank" rel="noopener"><img src="${img}" alt="" loading="lazy"></a>` : '<div class="noimg">Không có ảnh</div>'}
  <div class="meta"><b>${esc(a.page_name)}</b>
    <div class="chips"><span class="chip strong">${a.days_running} ngày</span><span class="chip">${a.variants} biến thể</span><span class="chip">${esc(a.format || '?')}</span>${a.cta ? `<span class="chip">${esc(a.cta)}</span>` : ''}${tag ? `<span class="chip warn">${tag}</span>` : ''}</div>
    <p>${esc(short(a.body, 260))}</p>
    <a class="link" href="${esc(a.library_url)}" target="_blank" rel="noopener">Xem ad trong thư viện</a>
  </div></article>`;
}

(async () => {
  const winCards = []; for (const a of winners) winCards.push(await card(a));
  const testCards = []; for (const a of testing) testCards.push(await card(a, 'đang test'));
  const notes = opt('notes') && fs.existsSync(opt('notes')) ? md(fs.readFileSync(opt('notes'), 'utf8')) : '';
  const fmt = count(ads, 'format'), cta = count(ads, 'cta');

  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
:root{--bg:#f6f4f1;--card:#fff;--ink:#1d1b19;--mute:#6b665f;--line:#e6e1da;--accent:#9b2335;--soft:#f5e6e8;--warn:#a86b00;--warnbg:#fbf0d9}
@media (prefers-color-scheme:dark){:root{--bg:#161514;--card:#211f1d;--ink:#f1ede8;--mute:#a49d94;--line:#34302c;--accent:#e0687a;--soft:#3a2328;--warn:#f0b34a;--warnbg:#3a2e17}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:1100px;margin:0 auto;padding:32px 16px 64px}h1{font-size:30px;margin:0 0 4px}h2{font-size:21px;margin:40px 0 4px}h3,h4{margin:22px 0 6px}
.sub{color:var(--mute);margin:0 0 16px}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:20px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px}.stat b{display:block;font-size:26px;color:var(--accent)}.stat span{color:var(--mute);font-size:13px}
.notes{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:8px 20px 16px;margin-top:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;margin-top:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.card img{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:var(--line)}.noimg{aspect-ratio:1;display:grid;place-items:center;color:var(--mute);background:var(--line)}
.meta{padding:12px 14px 14px;display:flex;flex-direction:column;gap:8px;flex:1}.meta p{margin:0;color:var(--mute);font-size:14px;flex:1}
.chips{display:flex;flex-wrap:wrap;gap:6px}.chip{font-size:12px;padding:2px 8px;border-radius:99px;background:var(--bg);border:1px solid var(--line)}
.chip.strong{background:var(--soft);color:var(--accent);border-color:transparent;font-weight:600}.chip.warn{background:var(--warnbg);color:var(--warn);border-color:transparent}
.link{color:var(--accent);font-size:13px}.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:700px){.two{grid-template-columns:1fr}}
.box{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
.bar{display:grid;grid-template-columns:120px 1fr 44px;align-items:center;gap:8px;font-size:13px;margin:6px 0}.bar i{height:8px;border-radius:4px;background:var(--accent)}.bar em{font-style:normal;color:var(--mute);text-align:right}
.tbl{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--mute);font-weight:600}
td a{color:var(--accent)}code{background:var(--bg);padding:1px 5px;border-radius:4px}footer{margin-top:40px;color:var(--mute);font-size:13px}
</style></head><body><main>
<h1>${esc(title)}</h1>
<p class="sub">Dữ liệu Meta Ads Library, quét ngày ${date}. Thư viện không có số tiền chi: "chạy lâu, nhiều biến thể" là tín hiệu gián tiếp cho ad đang hiệu quả.</p>
<div class="stats">
<div class="stat"><b>${ads.length}</b><span>quảng cáo</span></div>
<div class="stat"><b>${list.length}</b><span>creative khác nhau</span></div>
<div class="stat"><b>${rankPages(ads).length}</b><span>page đang chạy</span></div>
<div class="stat"><b>${ads.filter(a => (a.days_running || 0) >= minDays).length}</b><span>ad chạy từ ${minDays} ngày</span></div>
</div>
${notes ? `<h2>Phân tích</h2><div class="notes">${notes}</div>` : ''}
<h2>Ad thắng</h2><p class="sub">Xếp theo số ngày chạy + 2 × số biến thể. Bấm ảnh để mở ad gốc.</p>
${winCards.length ? `<div class="grid">${winCards.join('')}</div>` : `<p class="box">Chưa có ad nào chạy đủ ${minDays} ngày: ngách đang test nhiều, xem mục bên dưới.</p>`}
${testCards.length ? `<h2>Đang test</h2><p class="sub">Ad mới nhưng đã nhân bản nhiều biến thể: đối thủ đang thử nghiệm.</p><div class="grid">${testCards.join('')}</div>` : ''}
<h2>Đối thủ chạy nhiều nhất</h2>
<div class="tbl box"><table><tr><th>Page</th><th>Số ad</th><th>Mới 7 ngày</th><th>Lâu nhất</th><th>Format / CTA</th></tr>
${pages.map(p => `<tr><td><a href="${esc(p.library_url)}" target="_blank" rel="noopener">${esc(p.page_name)}</a></td><td>${p.ads}</td><td>${p.new_7d}</td><td>${p.max_days} ngày</td><td>${esc(p.top_format)} · ${esc(p.top_cta)}</td></tr>`).join('')}
</table></div>
<div class="two" style="margin-top:14px"><div class="box"><h3>Format</h3>${bar(fmt, ads.length)}</div><div class="box"><h3>Nút CTA</h3>${bar(cta, ads.length)}</div></div>
<footer>Tạo bởi meta-ads-library-skill · github.com/cuongbigdigi/meta-ads-library-skill</footer>
</main></body></html>`;
  const file = path.join(dir, 'index.html');
  fs.writeFileSync(file, html);
  console.log(`OK báo cáo -> ${file}`);
})();
