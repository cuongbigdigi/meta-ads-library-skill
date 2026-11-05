---
name: meta-ads-library
description: "Nghiên cứu quảng cáo đối thủ qua Meta Ads Library (thư viện quảng cáo Facebook): lấy ads đang chạy theo từ khóa hoặc Page ID, xếp hạng ad thắng (chạy lâu, nhiều biến thể), phân tích hook/offer/format/CTA và đề xuất góc test. Dùng khi người dùng nói: soi đối thủ, spy ads, ads library, thư viện quảng cáo, đối thủ đang chạy ads gì, tìm ad thắng, nghiên cứu creative đối thủ, competitor ads, theo dõi đối thủ định kỳ, quét ads hằng ngày, báo khi đối thủ ra ad mới."
---

# Meta Ads Library: soi quảng cáo đối thủ

## Thư mục chạy (đọc trước khi chạy lệnh)
Mọi lệnh bên dưới chạy từ **thư mục gốc của bộ skill**: thư mục có `package.json` và `tools/ad-library/scrape.js`. Tìm theo thứ tự:
1. Thư mục dự án hiện tại (người dùng mở agent ngay trong thư mục đã tải về).
2. Thư mục `runtime/` nằm cạnh file SKILL.md này (khi skill được cài dùng chung cho mọi dự án, ví dụ `~/.codex/skills/meta-ads-library/runtime` hoặc `~/.claude/skills/meta-ads-library/runtime`).
3. Không thấy ở đâu: clone repo vào `runtime/` cạnh file SKILL.md này rồi dùng thư mục đó:
   ```bash
   git clone https://github.com/cuongbigdigi/meta-ads-library-skill.git runtime
   ```

Nếu thư mục gốc chưa có `node_modules`, chạy `npm install` ở đó trước (lần đầu tải thêm Chromium khoảng 150 MB).
Kết quả nằm trong `output/` của thư mục gốc đó, không phải thư mục dự án người dùng đang mở.

## Quy trình

### 1. Lấy dữ liệu
```bash
# Theo từ khóa ngành/sản phẩm
node tools/ad-library/scrape.js --q "kem chống nắng" --max 60
# Theo Page đối thủ (page_id có trong kết quả tìm từ khóa)
node tools/ad-library/scrape.js --page-id 123456789 --status all --max 100
```
Tham số: `--country VN` (mặc định), `--status active|inactive|all`, `--media all|image|video`, `--out file.json`, `--headed` (hiện trình duyệt để kiểm tra).
Kết quả lưu ở `output/<từ-khóa>-<country>-<ngày>.json`. Mất khoảng 30-90 giây.

Một từ khóa thường bỏ sót đối thủ. Nên quét 2-3 cách gọi khác nhau của cùng ngách (ví dụ "phụ kiện vf3", "độ xe vf3"), rồi xếp hạng gộp ở bước 2.

### 2. Xếp hạng ad thắng
```bash
node tools/ad-library/rank.js output/<file1>.json output/<file2>.json --top 15 --match "từ khóa 1|từ khóa 2"
```
- Truyền nhiều file để gộp nhiều từ khóa, ad trùng chỉ tính 1 lần.
- Điểm = số ngày chạy + 2 × số biến thể. Không ai đốt tiền nhiều ngày vào ad lỗ, nên ad chạy lâu và nhân bản nhiều thường là ad đang ra tiền.
- `--min-days 7` (mặc định): bỏ ad chạy chưa đủ 7 ngày.
- `--match`: chỉ giữ ad có tên page/tiêu đề/nội dung khớp, dùng để loại ad lạc đề. Nên luôn truyền các từ khóa liên quan đến ngành người dùng hỏi.
- Mục "Đang test": ad chưa đủ ngày nhưng có từ 3 biến thể (`--test-variants N`), tức đối thủ đang thử nghiệm.
- **Ngách mới, toàn ad vài ngày tuổi** (top ad trống): không kết luận "ad thắng". Báo người dùng đây là ngách đang test, phân tích từ mục "Đang test" và các page chạy nhiều ad gần giống nhau. Có thể thử `--min-days 3` hoặc quét lại với `--status all` để thấy cả ad đã tắt.

### 3. Phân tích (agent tự làm, đọc file JSON)
Với các ad top đầu, trình bày bảng:
| Cột | Nội dung |
|---|---|
| Hook | Câu mở đầu, kiểu gì (nỗi đau, con số, câu hỏi, bằng chứng xã hội) |
| Offer | Giá, quà tặng, freeship, combo, bảo hành |
| Format | VIDEO / IMAGE / MULTI_IMAGES, CAROUSEL (nhiều ảnh) / DCO (Facebook tự ghép biến thể) / DPA (catalog) |
| CTA | Gửi tin nhắn, Mua ngay, Đăng ký... |
| Mục tiêu | CTA nhắn tin = chạy tin nhắn; có `link_url` = chạy về website |
| Thời gian | days_running, variants |

Sau đó tổng hợp: pattern lặp lại giữa các đối thủ, offer phổ biến, khoảng trống chưa ai khai thác, và đề xuất 3 góc test cho sản phẩm của người dùng.

### 4. Theo dõi định kỳ (khi người dùng muốn quét tự động hằng ngày/tuần)
1. Tạo `watchlist.json` ở thư mục gốc (copy từ `watchlist.example.json`):
   - `keywords`: từ khóa ngành, mỗi mục `{ "q": "...", "match": "regex lọc lạc đề" }`.
   - `pages`: page đối thủ `{ "id": "page_id", "name": "tên dễ nhớ" }`. Lấy page_id từ kết quả quét từ khóa (trường `page_id`).
   - `discord_webhook` (không bắt buộc): link webhook Discord để nhận báo cáo.
   Hỏi người dùng ngách và đối thủ cần theo dõi nếu chưa rõ; có thể quét từ khóa trước rồi gợi ý 5-10 page chạy nhiều ad nhất.
2. Chạy thử: `node tools/ad-library/watch.js`. Lần đầu chỉ lưu mốc. Từ lần sau báo: ad mới, ad vừa sống qua mốc 7/14/30 ngày (ứng viên ad thắng), ad của page đối thủ đã tắt. Báo cáo ở `output/watch/latest.md`.
3. Hẹn giờ trên máy người dùng (hỏi giờ chạy, mặc định 8h sáng mỗi ngày). Thay `<THU_MUC_GOC>` bằng đường dẫn đầy đủ:
   - Windows:
     ```bash
     schtasks /create /tn "AdsLibraryWatch" /sc daily /st 08:00 /f /tr "cmd /c cd /d \"<THU_MUC_GOC>\" && node tools\ad-library\watch.js >> output\watch.log 2>&1"
     ```
   - Mac/Linux (`crontab -e`): `0 8 * * * cd "<THU_MUC_GOC>" && node tools/ad-library/watch.js >> output/watch.log 2>&1`
   Chạy thử task ngay (`schtasks /run /tn "AdsLibraryWatch"`) và kiểm tra `output/watch.log`.
4. Khi người dùng hỏi "đối thủ có gì mới", đọc `output/watch/latest.md` (và các `report-*.md` cũ nếu cần so sánh) rồi phân tích như bước 3.

Lưu ý khi theo dõi: máy phải bật lúc đến giờ; mỗi mục nghỉ 15-30 giây để không bị chặn, nên giữ dưới khoảng 20 mục và chạy tối đa vài lần mỗi ngày. Ad "đã tắt" chỉ tính cho page đối thủ, vì quét từ khóa bị giới hạn số lượng.

## Lưu ý
- **Không có số chi tiêu**: thư viện không cho biết chi tiêu hay doanh thu của quảng cáo thương mại. "Chạy lâu" chỉ là tín hiệu gián tiếp, phải nói rõ điều này với người dùng.
- **Ít ad hơn `--max`**: từ khóa quá hẹp hoặc Facebook giới hạn kết quả. Thử từ khóa rộng hơn hoặc quét theo `--page-id`.
- **Từ khóa khớp rộng**: kết quả có thể lẫn ad không liên quan. Dùng `--match` hoặc lọc tay theo `page_name`/`body`.
- **Link ảnh/video có hạn sử dụng**: nếu người dùng cần lưu creative thì tải về ngay.
- **Ra 0 ad**: Facebook có thể đã đổi cấu trúc dữ liệu. Chạy lại với `--headed` xem trang có hiện quảng cáo không. Nếu có, bắt lại response mạng `/api/graphql` để xem object quảng cáo giờ có dạng gì, rồi sửa hàm `walk`/`addAd` trong `scrape.js` (hiện đang tìm object có `ad_archive_id` + `snapshot`).
- **Bị chặn hoặc bắt đăng nhập**: chờ một lúc rồi chạy lại, giảm `--max`, không chạy dồn dập.
- **Không sao chép nguyên văn** quảng cáo của đối thủ: lấy cấu trúc và góc tiếp cận, rồi viết lại theo offer của người dùng.

## Kiểm tra
- File JSON có `total > 0`, phần lớn ad có `body` và `start_date`.
- Mở thử 1-2 `library_url` để đối chiếu nội dung khớp.
