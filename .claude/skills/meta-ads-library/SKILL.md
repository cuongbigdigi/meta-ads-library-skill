---
name: meta-ads-library
description: "Nghiên cứu quảng cáo đối thủ qua Meta Ads Library (thư viện quảng cáo Facebook): lấy ads đang chạy theo từ khóa hoặc Page ID, xếp hạng ad thắng (chạy lâu, nhiều biến thể), xếp hạng đối thủ trong ngách, phân tích hook/offer/format/CTA, soi landing page, tải creative, xuất báo cáo HTML, viết hook/kịch bản từ insight và theo dõi định kỳ. Dùng khi người dùng nói: soi đối thủ, spy ads, ads library, thư viện quảng cáo, đối thủ đang chạy ads gì, tìm ad thắng, nghiên cứu creative đối thủ, competitor ads, theo dõi đối thủ định kỳ, quét ads hằng ngày, báo khi đối thủ ra ad mới, tải ảnh video ad đối thủ, xuất báo cáo đối thủ, hướng dẫn dùng skill meta ads library, cài xong dùng thế nào, nhập từ khóa ở đâu, skill này làm được gì."
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

Nếu thư mục gốc chưa có `node_modules`, chạy `npm install` ở đó trước (lần đầu tải thêm Chromium khoảng 150 MB). Nếu máy chưa có Node.js 18+, cài giúp người dùng (bản LTS) rồi tiếp tục.
Lỗi lạ khi chạy: chạy `npm run doctor`, nó kiểm Node, thư viện, trình duyệt, quét thử 3 ad và chỉ cách sửa.
Trên Windows, cài mãi không được (Node, npm, Chromium): bảo người dùng bấm đúp `cai-dat.bat` ở thư mục gốc, bộ cài tự xử lý và ghi `cai-dat.log`. Người dùng Mac cần hỗ trợ cài: hướng dẫn liên hệ nhóm Zalo https://zalo.me/g/37yoic8thaeho75yicnb.
Kết quả nằm trong `output/` của thư mục gốc đó, không phải thư mục dự án người dùng đang mở.

## Người dùng mới hỏi "dùng thế nào", "nhập từ khóa ở đâu", "làm được gì"
Trả lời ngắn, không chạy tool:
1. Họ đang ở đúng chỗ: cứ gõ yêu cầu bằng tiếng Việt vào ô chat này, không cần lệnh hay cú pháp. Từ khóa nằm luôn trong câu, ví dụ "Soi đối thủ ngành nến thơm".
2. Đưa 5 câu thử (mỗi câu 1 dòng, để họ copy):
   - Soi đối thủ ngành [nến thơm], cho anh top 10 ad thắng và phân tích hook, offer.
   - Ngách [máy lọc nước] có những page nào chạy ads mạnh nhất?
   - Tải ảnh và video của top 10 ad về máy.
   - Xuất báo cáo HTML có ảnh cho ngách [hồng sâm].
   - Theo dõi ngách [nến thơm] và 5 đối thủ mạnh nhất, quét mỗi sáng 8h.
3. Nhắc: khi được hỏi quyền chạy lệnh thì chọn cho phép; mỗi lần quét mất 1-3 phút.
4. Hướng dẫn đầy đủ có câu lệnh mẫu bấm Copy: file `huong-dan.html` ở thư mục gốc (Windows: biểu tượng "Huong dan Meta Ads Library" ngoài Desktop). Mở file đó cho họ nếu được.
Rồi hỏi họ muốn soi ngành nào để làm luôn.

## Bước 0. Hỏi nhanh trước khi làm
- **Chỉ muốn xem thị trường** ("đối thủ đang chạy gì", "soi ngách X"): làm luôn, không hỏi.
- **Muốn góc test, viết ads, hook, kịch bản**: hỏi gộp 1 lần (người dùng bỏ qua câu nào thì tự suy luận và nói rõ giả định):
  1. Sản phẩm của bạn là gì, giá bao nhiêu?
  2. Bán cho ai (giới tính, tuổi, khu vực, mua dùng hay mua biếu)?
  3. Chốt đơn qua đâu (tin nhắn, website, sàn)?
  4. Điểm mạnh khác đối thủ (nếu có)?
- Không rõ từ khóa: tự nghĩ 2-3 cách gọi phổ biến của ngách (cách người bán viết trong ad, không phải tên khoa học).

## Quy trình

### 1. Lấy dữ liệu
```bash
# Theo từ khóa ngành/sản phẩm
node tools/ad-library/scrape.js --q "kem chống nắng" --max 60
# Theo Page đối thủ (page_id có trong kết quả tìm từ khóa)
node tools/ad-library/scrape.js --page-id 123456789 --status all --max 100
```
Tham số:
- `--sort top` (mặc định): ad nhiều lượt hiển thị trước, là nơi có ad chạy lâu, ad thắng. `--sort new`: ad mới lên trước, dùng khi muốn xem đối thủ vừa tung gì.
- Từ khóa mặc định **khớp đúng cụm từ**. `--loose` khớp lỏng từng chữ: ra nhiều ad hơn nhưng lẫn rất nhiều ad lạc đề, chỉ dùng khi cụm từ ra quá ít.
- `--country VN` (mặc định), `--status active|inactive|all`, `--media all|image|video`, `--out file.json`, `--headed` (hiện trình duyệt để kiểm tra).

Kết quả lưu ở `output/<từ-khóa>-<country>-<ngày>.json`. Mất khoảng 30-90 giây.
Một từ khóa thường bỏ sót đối thủ. Nên quét 2-3 cách gọi khác nhau của cùng ngách (ví dụ "phụ kiện vf3", "độ xe vf3"), rồi gộp ở các bước sau (mọi tool đều nhận nhiều file).

### 2. Xếp hạng ad thắng và đối thủ
```bash
node tools/ad-library/rank.js output/<file1>.json output/<file2>.json --top 15 --match "từ khóa 1|từ khóa 2"
node tools/ad-library/pages.js output/<file1>.json output/<file2>.json --top 10 --match "từ khóa 1|từ khóa 2"
```
- `rank.js`: điểm = số ngày chạy + 2 × số biến thể. Không ai đốt tiền nhiều ngày vào ad lỗ, nên ad chạy lâu và nhân bản nhiều thường là ad đang ra tiền.
  - `--min-days 7` (mặc định): bỏ ad chạy chưa đủ 7 ngày.
  - Mục "Đang test": ad chưa đủ ngày nhưng có từ 3 biến thể (`--test-variants N`), tức đối thủ đang thử nghiệm.
- `pages.js`: xếp page theo số ad, số ad mới 7 ngày (đang đẩy mạnh), ad sống lâu nhất, format/CTA chính, website. `--watchlist` in sẵn đoạn JSON để đưa vào theo dõi.
- `--match`: chỉ giữ ad có tên page/tiêu đề/nội dung khớp. **Luôn truyền** các từ liên quan đến ngành.
- **Ngách mới, toàn ad vài ngày tuổi** (top ad trống): không kết luận "ad thắng". Báo người dùng đây là ngách đang test, phân tích từ mục "Đang test" và các page chạy nhiều ad gần giống nhau. Có thể thử `--min-days 3` hoặc quét lại với `--status all`.

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

Sau đó tổng hợp: pattern lặp lại giữa các đối thủ, offer phổ biến, khoảng trống chưa ai khai thác, và đề xuất 3 góc test cho sản phẩm của người dùng (dùng thông tin ở bước 0).

### 4. Đào sâu (làm khi người dùng cần, hoặc gợi ý ở cuối câu trả lời)
- **Soi landing page** của ad chạy về website: lấy tiêu đề, giá, ưu đãi, nút chốt, có form số điện thoại không.
  ```bash
  node tools/ad-library/lp.js output/<file>.json --top 10 --match "..."
  node tools/ad-library/lp.js --url https://trang-doi-thu.vn/san-pham
  ```
  Đọc `output/lp-<ngày>.json`, so sánh giá/combo giữa đối thủ và cách họ chốt đơn (form, Zalo, giỏ hàng). Ad tin nhắn không có trang đích, bỏ qua.
- **Tải ảnh/video** của top ad về máy (link Facebook chỉ sống vài ngày):
  ```bash
  node tools/ad-library/download.js output/<file>.json --top 10 --match "..."
  node tools/ad-library/download.js output/<file>.json --ids 123,456
  ```
  Lưu ở `output/creative/<ngày>/`, mỗi ad một thư mục kèm `info.txt`.
- **Xuất báo cáo HTML có ảnh** để người dùng mở bằng trình duyệt, gửi khách/sếp:
  1. Viết phần phân tích ở bước 3 ra file markdown, ví dụ `output/phan-tich-<ngách>.md` (dùng tiêu đề `##`, gạch đầu dòng, bảng).
  2. Chạy:
     ```bash
     node tools/ad-library/report.js output/<file1>.json output/<file2>.json --title "Ngách nến thơm" --match "..." --notes output/phan-tich-<ngách>.md
     ```
  3. Đưa người dùng đường dẫn `output/report-<tên>-<ngày>/index.html`. Gửi cho người khác thì nén cả thư mục (có thư mục `img/`).
- **Viết hook và kịch bản từ insight** (khi người dùng muốn làm ads luôn): dựa trên pattern của ad thắng và thông tin sản phẩm ở bước 0:
  - 10 hook chia theo kiểu (nỗi đau, con số, câu hỏi, kể chuyện, bằng chứng, so sánh, quà/mùa vụ), mỗi hook ghi rõ học từ ad nào.
  - 2 kịch bản video 15-30 giây: 3 giây đầu (hook + hình), thân (vấn đề → sản phẩm → bằng chứng), kết (offer + CTA).
  - 3 caption ngắn cho ad ảnh.
  - Viết lại theo sản phẩm người dùng, không chép nguyên văn đối thủ. Tránh hứa chữa bệnh, cam kết kết quả tuyệt đối, so sánh hạ thấp đối thủ (dễ bị Facebook từ chối).

### 5. Theo dõi định kỳ (khi người dùng muốn quét tự động hằng ngày/tuần)
1. Tạo `watchlist.json` ở thư mục gốc (copy từ `watchlist.example.json`):
   - `keywords`: từ khóa ngành, mỗi mục `{ "q": "...", "match": "regex lọc lạc đề" }`. Từ khóa mặc định quét `--sort new` để bắt ad mới.
   - `pages`: page đối thủ `{ "id": "page_id", "name": "tên dễ nhớ" }`. Chưa biết đối thủ: quét từ khóa rồi chạy `pages.js --watchlist` lấy 5-10 page đầu.
   - `discord_webhook` hoặc `telegram: { "bot_token": "...", "chat_id": "..." }` (không bắt buộc) để nhận báo cáo.
   Hỏi người dùng ngách và đối thủ cần theo dõi nếu chưa rõ.
2. Chạy thử: `node tools/ad-library/watch.js`. Lần đầu chỉ lưu mốc. Từ lần sau báo: ad mới, ad vừa sống qua mốc 7/14/30 ngày (ứng viên ad thắng), ad của page đối thủ đã tắt, xu hướng số ad qua các lần quét (đối thủ tăng ad mạnh = đang đẩy ngân sách). Báo cáo ở `output/watch/latest.md`.
3. Hẹn giờ trên máy người dùng (hỏi giờ chạy, mặc định 8h sáng mỗi ngày). Thay `<THU_MUC_GOC>` bằng đường dẫn đầy đủ:
   - Windows:
     ```bash
     schtasks /create /tn "AdsLibraryWatch" /sc daily /st 08:00 /f /tr "cmd /c cd /d \"<THU_MUC_GOC>\" && node tools\ad-library\watch.js >> output\watch.log 2>&1"
     ```
   - Mac/Linux (`crontab -e`): `0 8 * * * cd "<THU_MUC_GOC>" && node tools/ad-library/watch.js >> output/watch.log 2>&1`
   Chạy thử task ngay (`schtasks /run /tn "AdsLibraryWatch"`) và kiểm tra `output/watch.log`.
4. Khi người dùng hỏi "đối thủ có gì mới", đọc `output/watch/latest.md` (và các `report-*.md` cũ nếu cần so sánh) rồi phân tích như bước 3.

Lưu ý khi theo dõi: máy phải bật lúc đến giờ; mỗi mục nghỉ 15-30 giây để không bị chặn, nên giữ dưới khoảng 20 mục và chạy tối đa vài lần mỗi ngày. Ad "đã tắt" chỉ tính cho page đối thủ, vì quét từ khóa bị giới hạn số lượng.

## Cuối mỗi câu trả lời
Gợi ý 2-3 bước tiếp theo phù hợp, ví dụ: "Muốn em xuất báo cáo HTML có ảnh?", "Tải ảnh/video top 10 ad về máy?", "Soi landing page của các ad chạy web?", "Viết 10 hook cho sản phẩm của anh/chị?", "Theo dõi các page này mỗi sáng?". Người mới thường không biết tool làm được gì thêm.

## Lưu ý
- **Không có số chi tiêu**: thư viện không cho biết chi tiêu hay doanh thu của quảng cáo thương mại. "Chạy lâu" chỉ là tín hiệu gián tiếp, phải nói rõ điều này với người dùng.
- **Ít ad hơn `--max`**: cụm từ quá hẹp. Thử cách gọi khác, `--loose`, hoặc quét theo `--page-id`.
- **Kết quả lẫn ad không liên quan**: dùng `--match` hoặc lọc tay theo `page_name`/`body`.
- **Link ảnh/video có hạn sử dụng**: cần lưu creative thì chạy `download.js` ngay.
- **Ra 0 ad**: Facebook có thể đã đổi cấu trúc dữ liệu. Chạy lại với `--headed` xem trang có hiện quảng cáo không. Nếu có, bắt lại response mạng `/api/graphql` để xem object quảng cáo giờ có dạng gì, rồi sửa hàm `walk`/`addAd` trong `scrape.js` (hiện đang tìm object có `ad_archive_id` + `snapshot`).
- **Bị chặn hoặc bắt đăng nhập**: chờ một lúc rồi chạy lại, giảm `--max`, không chạy dồn dập.
- **Không sao chép nguyên văn** quảng cáo của đối thủ: lấy cấu trúc và góc tiếp cận, rồi viết lại theo offer của người dùng.

## Kiểm tra
- File JSON có `total > 0`, phần lớn ad có `body` và `start_date`, và phần lớn ad đúng ngách (nếu lạc đề nhiều: thêm `--match` hoặc đổi từ khóa).
- Mở thử 1-2 `library_url` để đối chiếu nội dung khớp.
