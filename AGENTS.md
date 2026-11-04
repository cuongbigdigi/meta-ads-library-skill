# Hướng dẫn cho AI agent (Codex và các agent đọc AGENTS.md)

## Skill: Meta Ads Library (soi quảng cáo đối thủ)

Khi người dùng nói "soi đối thủ", "spy ads", "đối thủ đang chạy ads gì", "tìm ad thắng", "thư viện quảng cáo", hãy đọc và làm theo đúng file:

`.claude/skills/meta-ads-library/SKILL.md`

File đó mô tả đủ quy trình: lấy dữ liệu bằng `tools/ad-library/scrape.js`, xếp hạng bằng `tools/ad-library/rank.js`, rồi phân tích hook, offer, format, CTA và đề xuất góc test.

Nếu chưa có thư mục `node_modules`, chạy `npm install` trước.
