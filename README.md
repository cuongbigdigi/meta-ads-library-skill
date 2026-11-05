# Meta Ads Library Skill

**Skill cho Claude Code và Codex: soi quảng cáo đối thủ trên Meta Ads Library, xếp hạng ad thắng, phân tích hook, offer, CTA.**

Phiên bản 1.2.0, cập nhật 05/11/2026.

Bộ này giúp AI agent (Claude Code, Codex) tự lấy quảng cáo đối thủ trên thư viện quảng cáo của Meta, xếp hạng ad đang ra tiền và phân tích hook, offer, format, CTA. Không cần đăng nhập Facebook, không cần token.

👉 **Tham gia nhóm Zalo Ads AI lo - Tự động hóa quảng cáo: [zalo.me/g/37yoic8thaeho75yicnb](https://zalo.me/g/37yoic8thaeho75yicnb)** để hỏi đáp khi cài đặt, nhận bản cập nhật khi Facebook đổi cấu trúc và học thêm cách dùng AI chạy quảng cáo.

> *English: An agent skill for Claude Code and Codex that collects competitor ads from the Meta Ad Library via a headless browser (no login, no API token), ranks likely winners by run time and variant count, and analyzes hooks, offers and CTAs. The official Ad Library API only returns political ads outside the EU, so this works for commercial ads in any country. Docs are in Vietnamese.*

## Cần có
> ⚠️ **Skill chỉ chạy trên máy tính (Windows/Mac), với Claude Code hoặc Codex.** Không dùng được trên claude.ai, ChatGPT bản web hay app điện thoại, vì skill cần mở trình duyệt và chạy code trên máy của bạn.

1. **Claude Code hoặc Codex cài trên máy tính.** Chưa cài thì xem video hướng dẫn (video của các bạn khác, mình sẽ quay bản riêng sau):
   - Cài Codex trên máy tính: [xem video](https://www.facebook.com/reel/1051710833986249)
   - Cài Claude Code: [xem video](https://www.youtube.com/watch?v=ON6H2YbnoVg)
2. **Node.js 18 trở lên.** Mở terminal gõ `node -v`, nếu chưa có thì tải ở nodejs.org (bản LTS).

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

### Cài dùng chung cho mọi dự án (Codex hoặc Claude Code)
Không muốn mở đúng thư mục này mỗi lần? Dán link repo cho agent và nhờ cài:

> https://github.com/cuongbigdigi/meta-ads-library-skill đọc nội dung và cài cho tôi

Agent sẽ chép skill vào thư mục skill chung (`~/.codex/skills/` với Codex, `~/.claude/skills/` với Claude Code), clone toàn bộ repo vào thư mục `runtime/` cạnh skill, cài thư viện và chạy thử. Sau đó mở agent ở dự án nào cũng gọi được skill.

![Cài skill bằng Codex](docs/codex-cai-dat.jpg)

Hỏi thử ngay sau khi cài: "tìm các quảng cáo phụ kiện xe VF3":

![Kết quả soi quảng cáo phụ kiện VF3](docs/codex-ket-qua.jpg)

## Cách dùng
Chỉ cần nói với agent bằng tiếng Việt, ví dụ:

- "Soi đối thủ ngành nến thơm, cho anh top 10 ad thắng và phân tích."
- "Đối thủ đang chạy ads gì cho sản phẩm máy lọc nước? Đề xuất 3 góc test cho em."
- "Quét toàn bộ quảng cáo của page có ID 123456789, kể cả ad đã tắt."
- "So sánh offer của 5 đối thủ đứng đầu ngành mỹ phẩm thuần chay."

Agent sẽ tự chạy tool, đọc kết quả và trả về bảng phân tích. File dữ liệu gốc nằm trong thư mục `output/`.

### Ví dụ: soi ngách sâm Hàn Quốc với Claude Code (Opus 5.5)
Claude quét 9 từ khóa và 14 page shop sâm (853 ad), lọc ra ad chạy lâu nhất, gom các kiểu hook đang dùng và đề xuất 3 góc test, rồi trình bày thành trang báo cáo:

![Ad chạy lâu nhất ngách sâm Hàn Quốc](docs/claude-sam-tong-quan.webp)

![7 kiểu hook đang dùng trong ngách sâm](docs/claude-sam-hook.png)

![3 góc nên test cho ngách sâm](docs/claude-sam-goc-test.png)

Mẹo: ngách nào có nhiều cách gọi thì bảo agent quét vài từ khóa rồi gộp lại, ví dụ "quét cả phụ kiện VF3 và độ xe VF3 rồi xếp hạng chung". Ngách mới mà toàn ad vài ngày tuổi thì agent sẽ báo là ngách đang test thay vì gọi là ad thắng.

## Theo dõi ngành hàng và đối thủ định kỳ
Muốn máy tự quét mỗi sáng và báo khi đối thủ ra ad mới? Nói với agent:

> Theo dõi ngành nến thơm và 5 page đối thủ chạy nhiều ad nhất, quét mỗi ngày lúc 8h sáng, gửi báo cáo về Discord webhook này: [dán link]

Agent sẽ tạo file `watchlist.json` (danh sách từ khóa + page đối thủ), chạy thử rồi hẹn giờ trên máy (Task Scheduler với Windows, cron với Mac). Mỗi lần quét, tool so với lần trước và báo:
- **Ad mới** đối thủ vừa lên.
- **Ad vừa sống qua mốc 7/14/30 ngày**: ứng viên ad thắng, nên xem kỹ.
- **Ad đối thủ đã tắt**: thường là ad không hiệu quả.

Báo cáo nằm ở `output/watch/latest.md`, gửi Discord nếu có webhook. Hỏi agent "đối thủ có gì mới?" là nó đọc báo cáo và phân tích.

Tự chạy tay: copy `watchlist.example.json` thành `watchlist.json`, sửa từ khóa/page, rồi gõ `npm run watch`.

Lưu ý: máy tính phải đang bật lúc đến giờ quét. Nên theo dõi dưới khoảng 20 mục, quét 1-2 lần mỗi ngày là đủ, quét dồn dập dễ bị Facebook chặn.

## Trong bộ này có gì
| File | Dùng để |
|---|---|
| `tools/ad-library/scrape.js` | Mở thư viện quảng cáo, lấy dữ liệu ad |
| `tools/ad-library/rank.js` | Xếp hạng ad thắng (chạy lâu, nhiều biến thể) |
| `tools/ad-library/watch.js` | Theo dõi định kỳ: so với lần quét trước, báo ad mới / qua mốc ngày / đã tắt |
| `watchlist.example.json` | Mẫu danh sách từ khóa + page đối thủ cần theo dõi |
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

Nhờ agent mà vẫn chưa xong? Hỏi trực tiếp trong [nhóm Zalo Ads AI lo](https://zalo.me/g/37yoic8thaeho75yicnb).

## Lưu ý
- Thư viện quảng cáo **không cho biết chi tiêu hay doanh thu**. "Chạy lâu, nhiều biến thể" chỉ là tín hiệu gián tiếp cho thấy ad đang hiệu quả.
- **Không sao chép nguyên văn** quảng cáo của người khác. Hãy lấy cấu trúc và góc tiếp cận, rồi viết lại theo sản phẩm của bạn.
- Đây là công cụ nghiên cứu. Việc tự động lấy dữ liệu có thể không phù hợp với điều khoản sử dụng của Meta. Hãy dùng vừa phải, không chạy dồn dập. Người dùng tự chịu trách nhiệm khi sử dụng.
- Facebook thỉnh thoảng đổi cấu trúc trang. Khi tool hỏng, làm theo mục "Khi gặp lỗi", hoặc chờ bản cập nhật mới.

## Nhóm Zalo
Skill này được chia sẻ miễn phí từ nhóm **Ads AI lo - Tự động hóa quảng cáo**. Vào nhóm để:
- Hỏi đáp khi cài đặt hoặc gặp lỗi
- Nhận thông báo khi có bản cập nhật
- Chia sẻ kết quả soi đối thủ và cách dùng AI agent chạy quảng cáo

👉 [zalo.me/g/37yoic8thaeho75yicnb](https://zalo.me/g/37yoic8thaeho75yicnb)

## Thay đổi
- **1.2.0 (05/11/2026)**: thêm `watch.js` theo dõi ngành hàng + đối thủ định kỳ (ad mới, ad qua mốc 7/14/30 ngày, ad đã tắt), hẹn giờ trên máy, gửi Discord.
- **1.1.0 (05/11/2026)**: skill tự tìm thư mục chạy khi cài dùng chung (Codex/Claude Code); `rank.js` gộp được nhiều file từ khóa, thêm `--test-variants` và hướng dẫn xử lý ngách mới toàn ad đang test.
- **1.0.0 (04/11/2026)**: bản đầu tiên.

## Giấy phép
MIT. Dùng, sửa, chia sẻ tự do. Xem file `LICENSE`.
