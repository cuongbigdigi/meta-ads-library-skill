# Meta Ads Library Skill

**Skill cho Claude Code và Codex: soi quảng cáo đối thủ trên Meta Ads Library, xếp hạng ad thắng, phân tích hook, offer, CTA.**

Phiên bản 1.0.0, cập nhật 04/11/2026.

Bộ này giúp AI agent (Claude Code, Codex) tự lấy quảng cáo đối thủ trên thư viện quảng cáo của Meta, xếp hạng ad đang ra tiền và phân tích hook, offer, format, CTA. Không cần đăng nhập Facebook, không cần token.

👉 **Tham gia cộng đồng Ads AI trên Whop: [whop.com/ads-ai-lo](https://whop.com/ads-ai-lo/)** để hỏi đáp khi cài đặt, nhận bản cập nhật khi Facebook đổi cấu trúc và học thêm cách dùng AI chạy quảng cáo.

> *English: An agent skill for Claude Code and Codex that collects competitor ads from the Meta Ad Library via a headless browser (no login, no API token), ranks likely winners by run time and variant count, and analyzes hooks, offers and CTAs. The official Ad Library API only returns political ads outside the EU, so this works for commercial ads in any country. Docs are in Vietnamese.*

## Cần có
1. **Node.js 18 trở lên.** Mở terminal gõ `node -v`, nếu chưa có thì tải ở nodejs.org (bản LTS).
2. **Một AI agent** chạy trong terminal: Claude Code hoặc Codex.

## Cài đặt (khoảng 5 phút)
1. Tải bộ này về: bấm nút xanh **Code > Download ZIP** rồi giải nén, hoặc dùng git:
   ```bash
   git clone https://github.com/cuongbigdigi/meta-ads-library-skill.git
   ```
2. Mở terminal tại thư mục vừa tải.
3. Khởi động agent (`claude` hoặc `codex`), rồi gõ:

   > Cài đặt dự án này: chạy npm install rồi chạy thử skill meta-ads-library với từ khóa "kem chống nắng", lấy 20 ad.

   Agent sẽ cài thư viện, tải trình duyệt Chromium (khoảng 150 MB, chỉ tải lần đầu) và chạy thử.
4. Thấy báo `OK 20 ads` là xong.

Muốn tự cài không qua agent: gõ `npm install` trong thư mục này.

## Cách dùng
Chỉ cần nói với agent bằng tiếng Việt, ví dụ:

- "Soi đối thủ ngành nến thơm, cho anh top 10 ad thắng và phân tích."
- "Đối thủ đang chạy ads gì cho sản phẩm máy lọc nước? Đề xuất 3 góc test cho em."
- "Quét toàn bộ quảng cáo của page có ID 123456789, kể cả ad đã tắt."
- "So sánh offer của 5 đối thủ đứng đầu ngành mỹ phẩm thuần chay."

Agent sẽ tự chạy tool, đọc kết quả và trả về bảng phân tích. File dữ liệu gốc nằm trong thư mục `output/`.

## Trong bộ này có gì
| File | Dùng để |
|---|---|
| `tools/ad-library/scrape.js` | Mở thư viện quảng cáo, lấy dữ liệu ad |
| `tools/ad-library/rank.js` | Xếp hạng ad thắng (chạy lâu, nhiều biến thể) |
| `.claude/skills/meta-ads-library/SKILL.md` | Skill cho Claude Code: khi nào dùng, quy trình, cách phân tích |
| `AGENTS.md` | Để Codex biết skill này |
| `package.json` | Danh sách thư viện cần cài |

Thư mục `.claude` có thể bị ẩn trên Windows/Mac. Không sao, agent vẫn thấy.

## Khi gặp lỗi
Mô tả lỗi cho agent và nhờ nó sửa. Một số câu mẫu:

- **Ra 0 ad:** "Tool ra 0 ad. Chạy lại với --headed xem trang có hiện quảng cáo không. Nếu có thì bắt lại dữ liệu mạng /api/graphql, xem cấu trúc đổi thế nào rồi sửa scrape.js."
- **Kết quả lẫn ad không liên quan:** "Xếp hạng lại, chỉ giữ ad liên quan đến [ngành của bạn]."
- **Cần lưu ảnh/video quảng cáo:** "Tải ảnh và video của top 10 ad về thư mục creative/." Link ảnh/video sẽ hết hạn sau vài ngày nên cần tải ngay.
- **Lỗi khi cài:** "npm install bị lỗi này: [dán lỗi]. Sửa giúp tôi."

Nhờ agent mà vẫn chưa xong? Hỏi trực tiếp trong [cộng đồng trên Whop](https://whop.com/ads-ai-lo/).

## Lưu ý
- Thư viện quảng cáo **không cho biết chi tiêu hay doanh thu**. "Chạy lâu, nhiều biến thể" chỉ là tín hiệu gián tiếp cho thấy ad đang hiệu quả.
- **Không sao chép nguyên văn** quảng cáo của người khác. Hãy lấy cấu trúc và góc tiếp cận, rồi viết lại theo sản phẩm của bạn.
- Đây là công cụ nghiên cứu. Việc tự động lấy dữ liệu có thể không phù hợp với điều khoản sử dụng của Meta. Hãy dùng vừa phải, không chạy dồn dập. Người dùng tự chịu trách nhiệm khi sử dụng.
- Facebook thỉnh thoảng đổi cấu trúc trang. Khi tool hỏng, làm theo mục "Khi gặp lỗi", hoặc chờ bản cập nhật mới.

## Cộng đồng
Skill này được chia sẻ miễn phí từ cộng đồng **Ads AI**. Vào cộng đồng để:
- Hỏi đáp khi cài đặt hoặc gặp lỗi
- Nhận thông báo khi có bản cập nhật
- Chia sẻ kết quả soi đối thủ và cách dùng AI agent chạy quảng cáo

👉 [whop.com/ads-ai-lo](https://whop.com/ads-ai-lo/)

## Giấy phép
MIT. Dùng, sửa, chia sẻ tự do. Xem file `LICENSE`.
