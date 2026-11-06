#!/usr/bin/env node
/**
 * Tìm Page ID của đối thủ từ tên page hoặc link Facebook, để quét đúng page đó (scrape.js --page-id).
 * Dùng ô gợi ý "Tìm theo từ khóa hoặc nhà quảng cáo" của thư viện quảng cáo, không cần đăng nhập.
 *
 * Dùng:
 *   node tools/ad-library/find-page.js "Chalames"
 *   node tools/ad-library/find-page.js https://www.facebook.com/chalames.vn
 *   node tools/ad-library/find-page.js "Hồng sâm Sun Plaza" "TấmStore"     (nhiều page một lần)
 * Tham số: --top 5 (số page gợi ý in ra cho mỗi tên), --country VN, --headed
 * Kết quả: in bảng page_id + tên + alias + lượt thích, lưu output/find-page-<ngày>.json
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { parseArgs, slug } = require('./lib');

const { opt, flag, files: args } = parseArgs(['headed']);
const top = parseInt(opt('top', '5'), 10), country = opt('country', 'VN');
if (!args.length) { console.error('Thiếu tên page hoặc link. Ví dụ: node tools/ad-library/find-page.js "Chalames"'); process.exit(1); }

// Link Facebook -> { id } nếu link đã chứa số ID, hoặc { alias } (phần sau facebook.com/) để tra
function parseInput(s) {
  s = s.trim();
  if (/^\d{6,}$/.test(s)) return { raw: s, id: s };
  if (/^[\w.]+\.[\w.]+$/.test(s) && !/facebook\.com/i.test(s)) return { raw: s, alias: s }; // dạng "chalames.vn" = tên đường dẫn page
  if (!/facebook\.com|fb\.com|fb\.me|^https?:/i.test(s)) return { raw: s, name: s };
  let u; try { u = new URL(/^https?:/i.test(s) ? s : 'https://' + s); } catch { return { raw: s, name: s }; }
  const id = u.searchParams.get('view_all_page_id') || u.searchParams.get('id');
  if (id && /^\d+$/.test(id)) return { raw: s, id };
  const parts = u.pathname.split('/').filter(Boolean);
  if (parts[0] === 'people' && parts[2] && /^\d+$/.test(parts[2])) return { raw: s, id: parts[2] };
  if (parts[0] === 'pages' && parts.length >= 2) { const last = parts[parts.length - 1]; return /^\d+$/.test(last) ? { raw: s, id: last } : { raw: s, name: decodeURIComponent(parts[1]).replace(/-/g, ' ') }; }
  const alias = parts.find(p => !['pg', 'p', 'profile.php'].includes(p));
  if (alias) { const m = alias.match(/-(\d{8,})$/); return m ? { raw: s, id: m[1] } : { raw: s, alias: decodeURIComponent(alias) }; }
  return { raw: s, name: s };
}

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/[^\p{L}\p{N}]+/gu, '');

(async () => {
  const browser = await chromium.launch({ headless: !flag('headed'), args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ locale: 'vi-VN', viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const responses = []; // [{ query, pages }]
  page.on('response', async (r) => {
    try {
      if (!r.url().includes('/api/graphql')) return;
      const post = r.request().postData() || '';
      if (!post.includes('Typeahead')) return;
      const vars = JSON.parse(new URLSearchParams(post).get('variables') || '{}');
      const t = await r.text();
      const json = JSON.parse(t.split('\n')[0]);
      const pages = json?.data?.ad_library_main?.typeahead_suggestions?.page_results || [];
      responses.push({ query: vars.queryString || vars.query || JSON.stringify(vars), pages });
    } catch { /* bỏ */ }
  });

  // Trang kết quả có ô tìm kiếm đang bật (trang chủ thư viện bắt chọn hạng mục trước)
  await page.goto(`https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&media_type=all&search_type=keyword_unordered&q=a`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const box = page.locator('input[type=search]:visible').last();
  await box.waitFor({ timeout: 30000 });

  const results = [];
  for (const raw of args) {
    const inp = parseInput(raw);
    if (inp.id) { results.push({ input: raw, matched: { page_id: inp.id, name: '(lấy từ link)', exact: true }, candidates: [] }); continue; }
    const text = inp.alias || inp.name;
    responses.length = 0;
    await box.click();
    await box.fill('');
    await box.fill(text);
    await page.keyboard.press('End');
    // chờ gợi ý cho đúng chữ vừa nhập
    let got = null;
    for (let i = 0; i < 20 && !got; i++) {
      await page.waitForTimeout(500);
      got = [...responses].reverse().find(r => r.pages.length && (r.query.includes(text) || norm(r.query) === norm(text))) || null;
    }
    if (!got) got = responses.filter(r => r.pages.length).pop() || { pages: [] };
    const cands = got.pages.map(p => ({
      page_id: String(p.page_id), name: p.name, alias: p.page_alias || null, likes: p.likes || 0,
      category: p.category || null, verified: p.verification && p.verification !== 'NOT_VERIFIED',
      ig: p.ig_username || null, ig_followers: p.ig_followers || null,
      fb_url: 'https://www.facebook.com/' + (p.page_alias || p.page_id),
      ads_library_url: `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&view_all_page_id=${p.page_id}`,
    }));
    // Khớp chắc chắn: alias trùng link, hoặc tên trùng hẳn (bỏ dấu, bỏ khoảng trắng)
    // Gõ tên tay: chỉ coi là khớp khi đúng 1 page trùng hẳn tên, còn lại để người dùng chọn
    const sameName = cands.filter(c => norm(c.name) === norm(text));
    const exact = inp.alias
      ? cands.find(c => c.alias && c.alias.toLowerCase() === inp.alias.toLowerCase())
      : (sameName.length === 1 ? sameName[0] : null);
    results.push({ input: raw, matched: exact ? { ...exact, exact: true } : null, candidates: cands.slice(0, top) });
  }
  await browser.close();

  for (const r of results) {
    console.log(`\n=== ${r.input}`);
    if (r.matched) console.log(`KHỚP: ${r.matched.name} | page_id ${r.matched.page_id}${r.matched.alias ? ' | facebook.com/' + r.matched.alias : ''}`);
    else console.log(r.candidates.length ? 'Chưa chắc page nào đúng, chọn trong danh sách gợi ý:' : 'Không tìm thấy page nào. Thử tên khác, tên không dấu, hoặc dán link facebook.com/... của page.');
    r.candidates.forEach((c, i) => console.log(`  ${i + 1}. ${c.name} | page_id ${c.page_id} | ${c.alias ? 'facebook.com/' + c.alias : '-'} | ${c.likes.toLocaleString('vi-VN')} thích${c.verified ? ' | tích xanh' : ''}${c.category ? ' | ' + c.category : ''}`));
  }
  const dir = path.join(__dirname, '..', '..', 'output');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `find-page-${slug(args[0]).slice(0, 40)}-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(file, JSON.stringify(results, null, 2));
  console.log(`\nĐã lưu ${file}`);
  console.log('Bước tiếp: node tools/ad-library/scrape.js --page-id <page_id> --status all --max 100');
})().catch(e => { console.error('LỖI:', e.message); process.exit(1); });
