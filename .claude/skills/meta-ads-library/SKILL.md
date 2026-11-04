---
name: meta-ads-library
description: "Nghiên cứu quảng cáo đối thủ qua Meta Ads Library (thư viện quảng cáo Facebook): lấy ads đang chạy theo từ khóa hoặc Page ID, xếp hạng ad thắng (chạy lâu, nhiều biến thể), phân tích hook/offer/format/CTA và đề xuất góc test. Dùng khi người dùng nói: soi đối thủ, spy ads, ads library, thư viện quảng cáo, đối thủ đang chạy ads gì, tìm ad thắng, nghiên cứu creative đối thủ, competitor ads."
---

# Meta Ads Library: soi quảng cáo đối thủ

Các lệnh bên dưới chạy từ thư mục gốc dự án (nơi có `package.json`).
Nếu chưa có thư mục `node_modules`, chạy `npm install` trước.

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

### 2. Xếp hạng ad thắng
```bash
node tools/ad-library/rank.js output/<file>.json --top 15 --match "từ khóa 1|từ khóa 2"
```
- Điểm = số ngày chạy + 2 × số biến thể. Không ai đốt tiền nhiều ngày vào ad lỗ, nên ad chạy lâu và nhân bản nhiều thường là ad đang ra tiền.
- `--min-days 7` (mặc định): bỏ ad chạy chưa đủ 7 ngày.
- `--match`: chỉ giữ ad có tên page/tiêu đề/nội dung khớp, dùng để loại ad lạc đề. Nên luôn truyền các từ khóa liên quan đến ngành người dùng hỏi.
- Mục "Đang test": ad mới nhưng nhân bản nhiều, tức đối thủ đang thử nghiệm.

### 3. Phân tích (agent tự làm, đọc file JSON)
Với các ad top đầu, trình bày bảng:
| Cột | Nội dung |
|---|---|
| Hook | Câu mở đầu, kiểu gì (nỗi đau, con số, câu hỏi, bằng chứng xã hội) |
| Offer | Giá, quà tặng, freeship, combo, bảo hành |
| Format | VIDEO / IMAGE / MULTI_IMAGES (carousel) |
| CTA | Gửi tin nhắn, Mua ngay, Đăng ký... |
| Mục tiêu | CTA nhắn tin = chạy tin nhắn; có `link_url` = chạy về website |
| Thời gian | days_running, variants |

Sau đó tổng hợp: pattern lặp lại giữa các đối thủ, offer phổ biến, khoảng trống chưa ai khai thác, và đề xuất 3 góc test cho sản phẩm của người dùng.

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
