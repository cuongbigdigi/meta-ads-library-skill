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

  // Gõ chữ vào ô tìm kiếm của thư viện, trả danh sách page gợi ý
  async function typeahead(text) {
    responses.length = 0;
    await box.click();
    await box.fill('');
    await box.fill(text);
    await page.keyboard.press('End');
    let got = null;
    for (let i = 0; i < 20 && !got; i++) {
      await page.waitForTimeout(500);
      got = [...responses].reverse().find(r => r.pages.length && (r.query.includes(text) || norm(r.query) === norm(text))) || null;
    }
    if (!got) got = responses.filter(r => r.pages.length).pop() || { pages: [] };
    return got.pages.map(p => ({
      page_id: String(p.page_id), name: p.name, alias: p.page_alias || null, likes: p.likes || 0,
      category: p.category || null, verified: p.verification && p.verification !== 'NOT_VERIFIED',
      ig: p.ig_username || null, ig_followers: p.ig_followers || null,
      fb_url: 'https://www.facebook.com/' + (p.page_alias || p.page_id),
      ads_library_url: `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&view_all_page_id=${p.page_id}`,
    }));
  }

  // Mở trang Facebook (không đăng nhập) để lấy mã page thư viện quảng cáo dùng.
  // Page kiểu mới có 2 mã: mã hồ sơ (100...) hiện trên link/profile.php và mã page (associated_page_id) mà thư viện dùng.
  async function fromFacebook(url) {
    const t = await ctx.newPage();
    try {
      await t.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await t.waitForTimeout(3000);
      const html = await t.content();
      const pick = (re) => (html.match(re) || [])[1] || null;
      const title = ((await t.title()) || '').split(' | ')[0].trim();
      return {
        page_id: pick(/"associated_page_id":"(\d+)"/) || pick(/"pageID":"(\d+)"/) || pick(/"delegate_page_id":"(\d+)"/),
        profile_id: pick(/"userID":"(\d+)"/) || pick(/fb:\/\/(?:profile|page)\/\??(?:id=)?(\d+)/),
        alias: (new URL(t.url()).pathname.split('/').filter(Boolean)[0] || '').replace(/^profile\.php$/, '') || null,
        name: /^(facebook|log in|đăng nhập)/i.test(title) ? null : title,
      };
    } catch { return {}; } finally { await t.close(); }
  }

  const results = [];
  for (const raw of args) {
    const inp = parseInput(raw);
    const fbUrl = inp.id ? 'https://www.facebook.com/profile.php?id=' + inp.id : inp.alias ? 'https://www.facebook.com/' + encodeURIComponent(inp.alias) : null;
    if (!fbUrl) {
      // Gõ tên tay: chỉ coi là khớp khi đúng 1 page trùng hẳn tên (bỏ dấu, bỏ khoảng trắng), còn lại để người dùng chọn
      const cands = await typeahead(inp.name);
      const sameName = cands.filter(c => norm(c.name) === norm(inp.name));
      results.push({ input: raw, matched: sameName.length === 1 ? { ...sameName[0], exact: true } : null, candidates: cands.slice(0, top) });
      continue;
    }
    // Có link/alias/số ID: tra alias trước, không ra thì mở trang Facebook lấy mã page và tên page rồi tra lại
    let cands = inp.alias ? await typeahead(inp.alias) : [];
    let exact = cands.find(c => c.alias && c.alias.toLowerCase() === inp.alias.toLowerCase());
    let fb = null;
    if (!exact) {
      fb = await fromFacebook(fbUrl);
      const ids = [fb.page_id, fb.profile_id, inp.id].filter(Boolean);
      const alias = inp.alias || fb.alias;
      if (fb.name) {
        const more = await typeahead(fb.name);
        cands = [...more, ...cands.filter(c => !more.some(m => m.page_id === c.page_id))];
      }
      exact = cands.find(c => ids.includes(c.page_id)) || cands.find(c => alias && c.alias && c.alias.toLowerCase() === alias.toLowerCase());
      if (!exact && fb.page_id) exact = { page_id: fb.page_id, name: fb.name || '(tên chưa rõ)', alias, source: 'trang Facebook',
        ads_library_url: `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&view_all_page_id=${fb.page_id}` };
    }
    results.push({ input: raw, matched: exact ? { ...exact, exact: true } : null, facebook: fb, candidates: cands.slice(0, top) });
  }
  await browser.close();

  for (const r of results) {
    console.log(`\n=== ${r.input}`);
    if (r.matched) console.log(`KHỚP: ${r.matched.name} | page_id ${r.matched.page_id}${r.matched.alias ? ' | facebook.com/' + r.matched.alias : ''}
  Thư viện quảng cáo: ${r.matched.ads_library_url}`);
    else console.log(r.candidates.length ? 'Chưa chắc page nào đúng, chọn trong danh sách gợi ý:' : 'Không tìm thấy page nào. Thử tên khác, tên không dấu, hoặc dán link facebook.com/... của page.');
    if (r.matched) continue;
    r.candidates.forEach((c, i) => console.log(`  ${i + 1}. ${c.name} | page_id ${c.page_id} | ${c.alias ? 'facebook.com/' + c.alias : '-'} | ${c.likes.toLocaleString('vi-VN')} thích${c.verified ? ' | tích xanh' : ''}${c.category ? ' | ' + c.category : ''}`));
  }
  const dir = path.join(__dirname, '..', '..', 'output');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `find-page-${slug(args[0]).slice(0, 40)}-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(file, JSON.stringify(results, null, 2));
  console.log(`\nĐã lưu ${file}`);
  console.log('Bước tiếp: node tools/ad-library/scrape.js --page-id <page_id> --status all --max 100');
})().catch(e => { console.error('LỖI:', e.message); process.exit(1); });
