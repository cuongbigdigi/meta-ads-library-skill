---
name: meta-ads-library
description: "Nghiên cứu quảng cáo đối thủ qua Meta Ads Library (thư viện quảng cáo Facebook): lấy ads đang chạy theo từ khóa hoặc Page ID, xếp hạng ad thắng (chạy lâu, nhiều biến thể), xếp hạng đối thủ trong ngách, phân tích hook/offer/format/CTA, soi landing page, tải creative, xuất báo cáo HTML, viết hook/kịch bản từ insight và theo dõi định kỳ. Dùng khi người dùng nói: soi đối thủ, spy ads, ads library, thư viện quảng cáo, đối thủ đang chạy ads gì, tìm ad thắng, nghiên cứu creative đối thủ, competitor ads, theo dõi đối thủ định kỳ, quét ads hằng ngày, báo khi đối thủ ra ad mới, tải ảnh video ad đối thủ, xuất báo cáo đối thủ, hướng dẫn dùng skill meta ads library, cài xong dùng thế nào, nhập từ khóa ở đâu, skill này làm được gì, bắt đầu soi ads, khảo sát ngành hàng, khảo sát thị trường quảng cáo, khảo sát page đối thủ, soi page theo link, tìm page id, chưa biết từ khóa gì, đề xuất từ khóa theo mô tả sản phẩm, lấy uid page, tìm uid page facebook, lấy page id từ link, đổi link page ra id."
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

## Người dùng mới hỏi "dùng thế nào", "nhập từ khóa ở đâu", "làm được gì", hoặc chỉ gõ "bắt đầu"
Không chạy tool. Nói ngắn: họ đang ở đúng chỗ, cứ gõ tiếng Việt vào ô chat này, không cần lệnh hay cú pháp. Rồi đưa **menu 3 cách bắt đầu** ở mục dưới và hỏi họ chọn số mấy.
Nhắc thêm 1 dòng: khi agent hỏi quyền chạy lệnh thì chọn cho phép, mỗi lần quét mất 1-3 phút. Hướng dẫn có câu lệnh mẫu bấm Copy nằm ở `huong-dan.html` (Windows: biểu tượng "Huong dan Meta Ads Library" ngoài Desktop).

## Chọn cách bắt đầu (3 chế độ)
**Đọc yêu cầu trước khi hỏi:**
- Đã có từ khóa ngành rõ ràng ("soi ngách nến thơm") → vào thẳng **Chế độ 1**, không hiện menu.
- Đã có tên page hoặc link facebook.com/... → vào thẳng **Chế độ 2**.
- Chỉ mô tả sản phẩm, hoặc nói "chưa biết từ khóa", "không biết gõ gì" → **Chế độ 3**.
- Yêu cầu mơ hồ ("soi ads giúp em", "bắt đầu") → hiện menu này, chờ họ chọn:

> Bạn muốn bắt đầu theo cách nào? Gõ số:
> **1. Khảo sát ngành hàng**: bạn biết tên ngành/sản phẩm (ví dụ "nến thơm"). Mình tìm ad thắng, page mạnh nhất, hook và offer của cả ngành.
> **2. Khảo sát page chính xác**: bạn có tên page hoặc link Facebook của đối thủ. Mình soi toàn bộ quảng cáo của đúng page đó.
> **3. Chưa biết từ khóa**: bạn mô tả sản phẩm của mình, mình đề xuất từ khóa, quét thử xem từ nào nhiều ad đúng ngách rồi mới khảo sát.

**Cách dẫn từng bước (áp dụng cho cả 3 chế độ):**
- Mỗi bước nói 1 câu đang làm gì, trước khi chạy lệnh lâu báo "mất khoảng 1-2 phút".
- Xong mỗi bước: tóm tắt kết quả ngắn (vài con số chính + 3-5 ý), rồi đưa **"Bước tiếp theo"** là danh sách đánh số 2-4 lựa chọn để người dùng chỉ cần gõ số. Không đổ hết mọi thứ trong một lần.
- Người dùng rành (gõ sẵn từ khóa, tham số, yêu cầu cụ thể) thì làm luôn trọn quy trình, không hỏi từng bước.
- Gặp chỗ phải đoán (nhiều page trùng tên, từ khóa ra quá ít ad) thì hỏi, không tự chọn bừa.

### Chế độ 1. Khảo sát ngành hàng
1. Chốt từ khóa: lấy từ khóa người dùng đưa, tự thêm 1-2 cách gọi khác người bán hay viết trong ad. Báo danh sách sẽ quét (không cần chờ xác nhận trừ khi từ khóa mơ hồ).
2. Quét mỗi từ khóa (`scrape.js --q`, mục 1 Quy trình), rồi `rank.js` và `pages.js` gộp các file với `--match`.
3. Trả kết quả: số ad / số page, top 5 ad thắng (bảng mục 3), top 5 page mạnh nhất, 3 pattern chính.
4. Bước tiếp theo gợi ý: (1) Soi kỹ page mạnh nhất (sang Chế độ 2 với page_id có sẵn), (2) Soi landing page, (3) Xuất báo cáo HTML, (4) Viết hook/kịch bản cho sản phẩm của bạn (hỏi thông tin bước 0).

### Chế độ 2. Khảo sát page chính xác
Người dùng **chỉ cần dán link page** (facebook.com/ten.page, facebook.com/profile.php?id=..., link thư viện quảng cáo) hoặc gõ tên page. Không bao giờ bắt họ tự đi tìm UID/Page ID: tool tự đổi link ra đúng UID.
1. Quét thẳng bằng link, tool tự lấy UID rồi quét toàn bộ ad đang chạy của page:
   ```bash
   node tools/ad-library/scrape.js --page https://www.facebook.com/ten.page --max 150
   ```
   - Dòng `Page: <tên> | UID <số>` cho biết đã lấy đúng page nào. Báo tên page đó cho người dùng.
   - Gõ tên page mà nhiều page trùng tên: lệnh dừng và in danh sách page gần giống. Đưa người dùng bảng đánh số (tên, link facebook.com/..., lượt thích, ngành) và hỏi chọn số mấy, rồi chạy lại với `--page-id <page_id đã chọn>`. Không tự chọn dù page đầu nhiều lượt thích nhất.
   - Không ra page nào: xin link facebook.com/... của page (mở page trên Facebook, copy thanh địa chỉ), hoặc thử tên không dấu.
   - Đã có page_id (từ file quét từ khóa) thì dùng `--page-id <số>`.
   - Không tự lấy số trong link `profile.php?id=100...` làm page_id: page kiểu mới có mã hồ sơ khác mã page của thư viện quảng cáo. Cứ đưa nguyên link cho tool.
   - Nhiều page cùng lúc, hoặc người dùng chỉ hỏi **"lấy UID page này"**: dùng `find-page.js`, trả UID + link thư viện quảng cáo của page (không cần quét ad):
     ```bash
     node tools/ad-library/find-page.js https://www.facebook.com/page1 https://www.facebook.com/page2 "Tên page 3"
     ```
2. Xếp hạng ad của page (tên file đúng nằm ở dòng `OK ... ads -> ...` mà scrape.js in ra), kiểm `page_name` trong file đúng page người dùng muốn rồi mới phân tích:
   ```bash
   node tools/ad-library/rank.js output/page-<page_id>-VN-<ngày>.json --top 15 --min-days 1
   ```
3. Trả "hồ sơ quảng cáo" của page:
   - Số ad đang chạy, ad sống lâu nhất (ngày), số ad mới trong 7 và 30 ngày qua (đọc `start_date`) = nhịp ra ad.
   - Ad họ giữ lâu nhất (ad thắng của họ) và nhóm ad mới vài ngày, nhiều bản gần giống nhau (góc họ đang test).
   - Format, CTA chính, chạy tin nhắn hay website, offer/giá lặp lại.
   - Nhiều page: thêm bảng so sánh các page cạnh nhau theo các tiêu chí trên.
4. Bước tiếp theo gợi ý: (1) Soi landing page của page này, (2) Tải ảnh/video ad thắng của họ, (3) Theo dõi page này mỗi ngày (mục 5), (4) So với cả ngành (Chế độ 1).

### Chế độ 3. Chưa biết từ khóa: đề xuất từ mô tả
1. Nếu người dùng chưa mô tả, hỏi gộp 1 lần: bán sản phẩm gì, cho ai, giá khoảng bao nhiêu, đối thủ biết tên ai không (không bắt buộc).
2. Đề xuất 6-8 từ khóa, chia nhóm, giải thích ngắn vì sao:
   - Tên sản phẩm phổ biến (cách khách gọi, không phải tên khoa học): "nến thơm", "nến thơm phòng ngủ".
   - Công dụng / nỗi đau: "khử mùi phòng", "mất ngủ".
   - Đối tượng / dịp: "quà tặng bạn gái", "quà tân gia".
   - Từ người bán hay viết trong ad: "handmade", "tinh dầu thiên nhiên".
   Từ khóa 2-4 chữ là vừa: 1 chữ quá rộng (lẫn ngành khác), quá dài thì ra ít ad.
3. Quét thử nhanh 4-5 từ khóa tiềm năng nhất, mỗi từ `--max 20` (khoảng 30-40 giây mỗi từ):
   ```bash
   node tools/ad-library/scrape.js --q "từ khóa" --max 20 --out output/thu-<từ-khóa>.json
   ```
   Đọc từng file, lập bảng: từ khóa | số ad | bao nhiêu ad đúng ngách (đọc `body`, `page_name`) | page tiêu biểu. Từ nào gần 0 ad hoặc lạc đề nhiều thì loại.
4. Chọn 2-3 từ khóa tốt nhất, hỏi người dùng "khảo sát kỹ với các từ này nhé?" rồi sang **Chế độ 1** (quét lại `--max 60`). Nếu người dùng có tên đối thủ, chạy thêm Chế độ 2 cho các page đó.

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
# Theo Page đối thủ: dán link page (tự lấy UID), hoặc page_id có sẵn
node tools/ad-library/scrape.js --page https://www.facebook.com/ten.page --max 100
node tools/ad-library/scrape.js --page-id 123456789 --max 100
```
Tham số:
- `--sort top` (mặc định): ad nhiều lượt hiển thị trước, là nơi có ad chạy lâu, ad thắng. `--sort new`: ad mới lên trước, dùng khi muốn xem đối thủ vừa tung gì.
- Từ khóa mặc định **khớp đúng cụm từ**. `--loose` khớp lỏng từng chữ: ra nhiều ad hơn nhưng lẫn rất nhiều ad lạc đề, chỉ dùng khi cụm từ ra quá ít.
- `--country VN` (mặc định), `--status active` (mặc định; quảng cáo thương mại ở VN thư viện chỉ hiện ad đang chạy, `inactive|all` không ra thêm ad đã tắt), `--media all|image|video`, `--out file.json`, `--headed` (hiện trình duyệt để kiểm tra).

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
- **Ngách mới, toàn ad vài ngày tuổi** (top ad trống): không kết luận "ad thắng". Báo người dùng đây là ngách đang test, phân tích từ mục "Đang test" và các page chạy nhiều ad gần giống nhau. Có thể thử `--min-days 3`.

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
   - `pages`: page đối thủ `{ "url": "https://www.facebook.com/ten.page", "name": "tên dễ nhớ" }` (dán link là được, mỗi lần quét tự lấy UID) hoặc `{ "id": "page_id", ... }` nếu đã có ID (nhanh hơn). Chưa biết đối thủ: quét từ khóa rồi chạy `pages.js --watchlist` lấy 5-10 page đầu.
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
- **Không xem được ad đã tắt**: với quảng cáo thương mại ở VN, thư viện chỉ hiện ad đang chạy. Không hứa với người dùng "xem cả ad đã tắt". Muốn biết đối thủ tắt ad nào thì bật theo dõi định kỳ (mục 5): ad có ở lần quét trước mà lần này biến mất = đã tắt.
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
