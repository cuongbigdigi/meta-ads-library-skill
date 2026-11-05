#!/usr/bin/env node
/**
 * Kiểm tra máy đã sẵn sàng chưa: Node, thư viện, trình duyệt, kết nối thư viện quảng cáo.
 *   npm run doctor
 * Gặp lỗi: chụp màn hình kết quả gửi cho agent hoặc nhóm Zalo.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..', '..');
let ok = true;
const pass = m => console.log('✅ ' + m);
const fail = (m, fix) => { ok = false; console.log('❌ ' + m + (fix ? '\n   Cách sửa: ' + fix : '')); };

console.log(`Kiểm tra Meta Ads Library skill (${root})\n`);

const major = parseInt(process.versions.node, 10);
major >= 18 ? pass(`Node.js ${process.versions.node}`) : fail(`Node.js ${process.versions.node} quá cũ (cần 18 trở lên)`, 'nhờ agent "cài Node.js bản LTS mới nhất giúp tôi", hoặc tải ở nodejs.org');

let chromium;
try { ({ chromium } = require(path.join(root, 'node_modules', 'playwright'))); pass('Thư viện playwright đã cài'); }
catch { fail('Chưa cài thư viện', `mở terminal tại ${root} rồi gõ: npm install`); }

if (chromium) {
  let exe = '';
  try { exe = chromium.executablePath(); } catch { /* bỏ */ }
  exe && fs.existsSync(exe) ? pass('Trình duyệt Chromium đã tải') : fail('Chưa tải trình duyệt Chromium', 'gõ: npx playwright install chromium');
}

if (ok) {
  console.log('\nQuét thử 3 ad với từ khóa "kem chống nắng" (khoảng 30 giây)...');
  const out = path.join(root, 'output', 'doctor-test.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const r = spawnSync(process.execPath, [path.join(__dirname, 'scrape.js'), '--q', 'kem chống nắng', '--max', '3', '--out', out], { cwd: root, encoding: 'utf8', timeout: 180000 });
  const n = fs.existsSync(out) ? (JSON.parse(fs.readFileSync(out, 'utf8')).total || 0) : 0;
  if (r.status === 0 && n > 0) pass(`Lấy được ${n} ad từ thư viện quảng cáo`);
  else if (r.status === 0) fail('Mở được trang nhưng ra 0 ad', 'có thể Facebook đổi cấu trúc trang hoặc mạng đang bị chặn. Thử lại sau ít phút; vẫn lỗi thì báo vào nhóm Zalo để chờ bản cập nhật');
  else fail('Không mở được thư viện quảng cáo: ' + ((r.stderr || '').trim().split('\n').pop() || 'quá thời gian'), 'kiểm tra mạng (VPN, wifi công ty có chặn Facebook không) rồi chạy lại');
  try { fs.unlinkSync(out); } catch { /* bỏ */ }
}

console.log(ok ? '\nMọi thứ đã sẵn sàng. Hãy hỏi agent: "Soi đối thủ ngành <ngành của bạn>"' : '\nCòn lỗi bên trên. Sửa theo hướng dẫn rồi chạy lại: npm run doctor');
process.exit(ok ? 0 : 1);
