#!/usr/bin/env node
/**
 * Soi landing page (trang đích) của các ad chạy về website: tiêu đề, giá, ưu đãi, cách chốt đơn.
 *   node tools/ad-library/lp.js output/<file>.json [file2.json ...] [--top 10] [--match "regex"]
 *   node tools/ad-library/lp.js --url https://... [--url https://...]
 * Chỉ áp dụng cho ad có link_url (ad chạy tin nhắn không có trang đích).
 * Lưu kết quả ở output/lp-<ngày>.json, agent đọc file này để phân tích phễu.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { parseArgs, loadAds, collapse, score, outDir } = require('./lib');
const argv = process.argv.slice(2);
const { opt, files } = parseArgs();

// Bỏ link không đọc được trang bán (Messenger, Zalo, Facebook, sàn TMĐT, form, link mở app)
const skip = u => /facebook\.com|fb\.com|fb\.me|m\.me|messenger\.com|zalo\.me|wa\.me|instagram\.com|shopee\.|shp\.ee|lazada\.|tiktok\.com|onelink\.me|docs\.google\.com|forms\.gle/i.test(u);
const urls = new Map(); // url sạch -> ad đầu tiên trỏ tới
argv.forEach((a, i) => { if (a === '--url' && argv[i + 1]) urls.set(argv[i + 1], null); });
if (files.length) {
  const { ads } = loadAds(files, opt('match'));
  const withLink = collapse(ads).filter(a => a.link_url && !skip(a.link_url)).sort((a, b) => score(b) - score(a));
  for (const a of withLink) {
    let u; try { const x = new URL(a.link_url); u = x.origin + x.pathname; } catch { continue; }
    if (!urls.has(u)) urls.set(u, a);
    if (urls.size >= parseInt(opt('top', '10'), 10)) break;
  }
}
if (!urls.size) { console.error('Không có ad nào chạy về website (toàn ad tin nhắn), hoặc thiếu file json / --url.'); process.exit(1); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ locale: 'vi-VN', viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  const results = [];
  let i = 0;
  for (const [u, ad] of urls) {
    i++;
    const page = await ctx.newPage();
    const row = { url: u, ad: ad ? { page_name: ad.page_name, days_running: ad.days_running, variants: ad.variants, library_url: ad.library_url } : null };
    try {
      await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(3000);
      Object.assign(row, await page.evaluate(() => {
        const txt = s => (s || '').replace(/\s+/g, ' ').trim();
        const body = txt(document.body.innerText);
        const uniq = a => [...new Set(a)];
        return {
          final_url: location.href,
          title: document.title,
          description: (document.querySelector('meta[name="description"],meta[property="og:description"]') || {}).content || '',
          headings: uniq([...document.querySelectorAll('h1,h2,h3')].map(h => txt(h.innerText)).filter(t => t && t.length < 150)).slice(0, 20),
          prices: uniq(body.match(/\d{1,3}(?:[.,]\d{3})+\s?(?:đ|₫|vnđ|vnd)|\d+\s?k\b/gi) || []).slice(0, 15),
          offers: uniq(body.split(/(?<=[.!?\n])\s+/).filter(s => /tặng|freeship|miễn phí|giảm|combo|mua \d|ưu đãi|bảo hành|hoàn tiền|đổi trả|chỉ còn|flash|sale/i.test(s)).map(s => s.slice(0, 160))).slice(0, 15),
          has_form: !!document.querySelector('form input[type="tel"],form input[name*="phone" i],form input[name*="sdt" i]'),
          buttons: uniq([...document.querySelectorAll('button,a[class*="btn" i],input[type="submit"]')].map(b => txt(b.innerText || b.value)).filter(t => t && t.length < 40)).slice(0, 15),
          contact: uniq((document.documentElement.innerHTML.match(/zalo\.me\/[\w]+|m\.me\/[\w.]+|tel:[\d+ ]+/g) || [])).slice(0, 5),
          text_sample: body.slice(0, 1500),
        };
      }));
    } catch (e) { row.error = e.message.split('\n')[0]; }
    await page.close();
    results.push(row);
    console.error(`[${i}/${urls.size}] ${row.error ? 'LỖI ' : ''}${u}`);
  }
  await browser.close();
  const file = path.join(outDir(), `lp-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(file, JSON.stringify({ scraped_at: new Date().toISOString(), total: results.length, pages: results }, null, 2));
  console.log(`OK ${results.filter(r => !r.error).length}/${results.length} trang -> ${file}`);
})().catch(e => { console.error('LỖI:', e.message); process.exit(1); });
