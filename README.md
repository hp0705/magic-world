# MAGIC WORLD — Bé Mây: Vương quốc Băng Lam

Bộ tài liệu đặc tả đầy đủ (v2.5) cho ứng dụng web học tiếng Việt dành cho trẻ 3–4 tuổi.

## Định hướng đã thống nhất
- **Đối tượng chính:** trẻ 3–4 tuổi, chưa biết chữ, học từ đầu.
- **Ngôn ngữ & giọng đọc:** tiếng Việt, giọng miền Bắc.
- **Nền tảng:** web app chạy trên trình duyệt; mã nguồn quản lý trên GitHub (`https://github.com/hp0705/magic-world.git`).
- **Thế giới:** xứ sở băng tuyết phép thuật cảm hứng cổ tích nữ hoàng băng giá, thiết kế nhân vật (Bé Mây, Lumi, Cô Sao Băng), hình ảnh, nhạc và cốt truyện hoàn toàn nguyên bản.
- **Nền tảng học thuật:** kết hợp kiến thức chuẩn từ Chương trình GDPT 2018 môn Tiếng Việt lớp 1 (tham khảo cả 3 bộ sách Kết nối tri thức, Chân trời sáng tạo, Cánh Diều; biên soạn ví dụ mới, không sao chép tài sản độc quyền).
- **Lộ trình nội dung (v2.1):**
  - **Chữ cái:** 29 chữ cái (in hoa & in thường), ví dụ gần gũi, nút đọc chữ, đọc ví dụ và tập viết.
  - **Từ vựng:** **8 từ/ngày, 38 ngày (304 từ)**, chia lộ trình theo **số chữ cái** (2 chữ cái → 3 chữ cái → 4 chữ cái → 5 chữ cái → 6 chữ cái & từ ghép).
  - **Tập đánh vần:** **8 từ/ngày, 14 ngày**: vần mở, `-i`, `-y/-o`, `-u`, `-m`, `-n`, `-ng`, `-nh/-ch`, `-c`, `-t`, `-p` + 3 ngày vần mở ghép/âm đệm/mở rộng. Đánh vần 3 nhóm (sáp = `sờ a pờ ap | sờ ap sap | sắc sáp`).
  - **Nguyên tắc học nhẹ nhàng:** mỗi từ chỉ cần nghe mẫu, xem tranh và có 1 cơ hội đọc/nhận diện qua 1 lần là hoàn thành; có nút nghe lại, không bắt cày điểm.
- **Phản hồi giọng nói:**
  - **Khi đúng:** lời khen rõ ràng, rạng rỡ gọi tên Bé Mây (*"Bé Mây giỏi quá!"*, *"Bé Mây trả lời hay quá!"*, *"Bé Mây xinh đẹp thật tuyệt vời!"*, *"Bé Mây đáng yêu quá!"*...).
  - **Khi sai:** âm thanh *"bừ bư"* vui nhộn kèm luân phiên cả lời nhắc trực tiếp (*"Sai rồi!"*, *"Nhầm rồi!"*, *"Không đúng rồi, Bé Mây cố lên nhé!"*) lẫn lời khích lệ nhẹ nhàng (*"Chưa đúng rồi, Bé Mây thử lại nhé!"*, *"Nhầm một chút thôi, không sao cả!"*).

## Tệp trong bộ tài liệu
- `SPEC-01-NOI-DUNG-HOC.md`: khung chương trình, bảng 29 chữ cái, 38 ngày từ vựng (304 từ, 8 từ/ngày theo số chữ cái), 14 ngày tập đánh vần (8 từ/ngày theo âm cuối), quy tắc kiểm duyệt.
- `SPEC-02-COT-TRUYEN-GAME.md`: thế giới Vương quốc Băng Lam, nhân vật, bản đồ, gameplay, hệ thống lời khen/báo sai, phần thưởng.
- `SPEC-04-GIAO-DIEN-VA-THUONG.md`: giao diện, 3 chế độ chọn tự do, quy tắc đánh vần, điểm thưởng, TTS.
- `content/spelling-days.json`: 112 từ đánh vần đã tách sẵn từng bước.
- `REVIEW-NOI-DUNG-v2.1.md`: báo cáo rà soát.
- `SPEC-05-IPAD-TAP-VIET-TRAC-NGHIEM-HINH-ANH.md`: iPad, tập viết chữ viết tay mẫu, trắc nghiệm ôn tập trong ngày, kế hoạch hình ảnh và nhân vật hero nguyên bản (ưu tiên cao nhất khi mâu thuẫn).
- `SPEC-03-PROMPT-LAP-TRINH.md`: prompt giao cho AI coding agent (Claude Code / Antigravity / Cursor...).
- `content/lesson-samples.json`: dữ liệu mẫu có cấu trúc gồm đầy đủ bài âm thanh, chữ cái, từ vựng (8 từ/ngày) và tập đánh vần (8 từ/ngày).
- `SPEC-06-NGUOI-DAN-CHUYEN.md`: người dẫn chuyện Cô Sao Băng + Lumi, nút "Nghe kể chuyện" giọng Bắc, trình phát truyện, thưởng nghe truyện.
- `content/stories.json`: 10 truyện/lời thoại (75 dòng) có sẵn cảnh, âm thanh, tương tác.
- `SPEC-07-GAME-CUOI-BUOI-VA-EMOJI.md`: game Chốt buổi học 10 câu cuối mỗi buổi (theo giao diện mẫu) và quy tắc dùng emoji làm hình (ưu tiên hơn SPEC-04/05 ở các mục này).
- `content/emoji-map.json`, `content/story-art-emoji.json`: emoji cho 154 từ/chữ và cảnh truyện.
- `SOURCES.md`: căn cứ chương trình và lưu ý bản quyền.

## Điểm mới v2.2
- **iPad là thiết bị chính** (ngang/dọc, Apple Pencil, mở bằng Safari qua địa chỉ LAN).
- **Tập viết** dùng chữ viết tay mẫu có thứ tự nét (không phải chữ in trong sách).
- **Trắc nghiệm ôn tập trong ngày:** chỉ dùng hình/từ của ngày đó, đảo ngẫu nhiên, câu đúng nào cũng được khen.
- **Hình ảnh:** (v2.4) dùng **emoji có sẵn**, không tạo hình; xem SPEC-07.
- **Không dùng Elsa/Disney**; thay bằng nhân vật hero nguyên bản Cô Sao Băng.

## Điểm mới v2.3
- **Người dẫn chuyện giọng Bắc:** bấm nút → Cô Sao Băng và Lumi kể chuyện, gọi tên bé, có tranh, âm thanh, phụ đề tô từng từ.
- 10 truyện (mở đầu, 5 vùng, Lumi đi lạc, vương miện, ru ngủ, lễ nhận sao) + lời giới thiệu mỗi ngày sinh tự động.
- Nghe hết truyện lần đầu: 1 bông tuyết + sticker bộ "Truyện Cô Sao Băng" (không tính sao, không bắt buộc).

## Điểm mới v2.4
- **Game cuối mỗi buổi học (10 câu):** hiện chữ, bé tự đọc và chọn đúng hình emoji trong 3 lựa chọn; có nút Gợi ý âm thanh và "Từ tiếp theo".
- **Hình ảnh = emoji có sẵn**, không vẽ/tạo hình; từ không có emoji rõ nghĩa dùng kiểu "nghe, chọn chữ".
- Sao 3 khi đúng ngay lần đầu ≥ 8/10.

## Điểm mới v2.5
- **Mở rộng từ vựng:** từ 9 ngày (72 từ) lên **38 ngày (304 từ phổ biến)**, vẫn 8 từ/ngày, giữ nguyên cấu trúc và quy tắc.
- `content/vocab-days.json`: dữ liệu 304 từ (id, ngày, số chữ, chủ đề, câu ví dụ, emoji gợi ý cho 232 từ mới). Dùng để cập nhật `content/lesson-samples.json` và `content/emoji-map.json`.
- Các file khác (SPEC-02 đến SPEC-07, REVIEW, SOURCES) chưa chỉnh: nếu chúng có nhắc "9 ngày từ vựng" hoặc "72 từ" thì sửa thành 38 ngày / 304 từ.

## Quy trình sử dụng để code
1. Copy toàn bộ các file này vào thư mục gốc (hoặc `docs/`) của repo `magic-world`.
2. Giao `SPEC-03-PROMPT-LAP-TRINH.md` cho AI coding agent để lập `IMPLEMENTATION_PLAN.md` và triển khai từng phase.
3. Dùng `content/lesson-samples.json` làm dữ liệu hạt giống để dựng giao diện và test luồng học ngay ở Phase 1–2.

## Hướng dẫn truy cập ứng dụng trên iPad & Máy tính

### Cách 1: Truy cập online qua GitHub Pages (Dễ nhất cho iPad của bé)
- **Link truy cập trực tiếp:** [https://hp0705.github.io/magic-world/](https://hp0705.github.io/magic-world/)
- **Cách bật GitHub Pages trên repo (nếu chưa bật):**
  1. Vào repository: [https://github.com/hp0705/magic-world](https://github.com/hp0705/magic-world)
  2. Bấm vào **Settings** -> mục **Pages** (bên trái).
  3. Tại mục **Branch**, chọn nhánh `main` và thư mục `/(root)`, rồi nhấn **Save**.
  4. Đợi 1-2 phút là link `https://hp0705.github.io/magic-world/` có thể mở trực tiếp trên Safari của iPad!

### Cách 2: Truy cập qua mạng Wi-Fi nội bộ gia đình (Chạy server local)
- Bật file `run_game.bat` trên máy tính.
- Trên iPad của bé (cùng mạng Wi-Fi), mở trình duyệt Safari và gõ:
  ```
  http://192.168.0.12:3000
  ```
  *(Hoặc địa chỉ IP hiển thị trên cửa sổ console khi chạy `run_game.bat`)*.

### Cách 3: Chạy local trực tiếp trên máy tính
- **Click đúp vào file `run_game.bat`** (Windows).
- Hoặc mở trực tiếp file `index.html` trên trình duyệt Chrome/Edge/Firefox.


