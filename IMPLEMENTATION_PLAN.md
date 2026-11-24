# KẾ HOẠCH TRIỂN KHAI — BÉ MÂY: VƯƠNG QUỐC BĂNG LAM (LOCAL STANDALONE)

## 1. Ràng buộc quan trọng từ người dùng
- **Chỉ code ở chế độ local trên máy**: Tuyệt đối KHÔNG push hoặc tương tác với Git remote `https://github.com/hp0705/magic-world.git`.
- **Dùng công nghệ rẻ tiền nhất ($0 chi phí)**: Sử dụng thuần Web Standards (HTML5, CSS3 hiện đại, Vanilla JavaScript ES6+, Web Speech API, Web Audio API, Canvas API, LocalStorage). Không tốn chi phí server, không tốn API key, không tốn phí dịch vụ đám mây.
- **Không cài thêm bất cứ thứ gì**: Không chạy `npm install`, không kéo thêm package/thư viện bên thứ 3 nào. Toàn bộ mã nguồn chạy độc lập, tự chứa 100%.

## 2. Kiến trúc giải pháp
- **Giao diện & Trải nghiệm (UI/UX)**:
  - Thiết kế theo chủ đề *Vương quốc Băng Lam*: Bé Mây, Lumi, Cô Sao Băng, hiệu ứng tuyết rơi lấp lánh bằng CSS và Canvas.
  - Chuẩn kích thước nút bấm ≥ 72px (chuẩn cho trẻ 3–4 tuổi), không cuộn màn hình ở các kích thước chuẩn (360x640, 768x1024, 1024x768, 1366x768).
  - Màu sắc đạt chuẩn tương phản WCAG theo đúng Design Tokens trong SPEC-04.
- **Dữ liệu giáo dục**:
  - Module 1: 29 chữ cái tiếng Việt (Hoa/Thường, Đọc âm, Ví dụ Bé Mây, Tập viết).
  - Module 2: 9 ngày từ vựng (8 từ/ngày theo độ dài 2 -> 3 -> 4 -> 5-6 chữ cái & từ ghép).
  - Module 3: 14 ngày đánh vần (8 từ/ngày theo nhóm âm cuối, đánh vần 3 nhóm karaoke, màn Làm quen vần).
- **Âm thanh & Giọng đọc**:
  - Hiệu ứng âm thanh ("chuông pha lê", âm báo sai vui nhộn "bừ bư") được tổng hợp trực tiếp bằng Web Audio API (`AudioContext`, `OscillatorNode`), không cần phụ thuộc file âm thanh ngoài.
  - Giọng đọc tiếng Việt (giọng Bắc) sử dụng Web Speech API (`SpeechSynthesisUtterance`, `vi-VN`) với bảng thay thế phiên âm (`ttsOverrides.js`) để đọc chuẩn từng token đánh vần.
- **Tập viết (Handwriting Canvas)**:
  - Canvas cảm ứng/chuột theo dõi nét tô chữ cái, sinh hạt tuyết phát sáng theo đường vẽ.
- **Phần thưởng & Lưu trữ**:
  - Thanh 8 viên pha lê phát sáng khi ấn "Con đã đọc".
  - Màn hoàn thành: 1–3 sao, bông tuyết, sticker ngẫu nhiên, tan băng vùng đất.
  - LocalStorage lưu trữ toàn bộ tiến độ, sticker, cài đặt phụ huynh.
- **iPad (v2.2)**: giao diện responsive ưu tiên iPad (ngang/dọc), `100dvh`, Pointer Events cho Apple Pencil, mở khóa âm thanh bằng nút bắt đầu; `server.js` lắng nghe `0.0.0.0` và in địa chỉ LAN để mở bằng Safari trên iPad (xem SPEC-05 §1).
- **Tập viết (v2.2)**: dùng chữ viết tay mẫu bằng nét vẽ `strokes.js` (thứ tự nét, chấm đặt bút, chạy mẫu), không dùng font chữ in (SPEC-05 §2).
- **Trắc nghiệm ôn tập (v2.2)**: 8 câu/ngày, chỉ dùng 8 từ/hình của ngày, đảo ngẫu nhiên, khen mỗi câu đúng (SPEC-05 §3).
- **Hình ảnh (v2.2)**: script `tools/make-images.js` (Node có sẵn, $0) sinh SVG nhiều lớp cho mọi từ; tùy chọn nạp ảnh ngoài (SPEC-05 §4). Không dùng nhân vật Disney/Frozen; dùng hero nguyên bản Cô Sao Băng (SPEC-05 §6).
- **Bộ chạy Local**:
  - Chạy trực tiếp qua file `index.html` hoặc chạy máy chủ mini không cần cài gì qua `node server.js` (dùng thư viện có sẵn `http`, `fs` của Node.js).
  - File `run_game.bat` để click đúp mở game ngay trên Windows.

## 3. Các giai đoạn triển khai
- **Giai đoạn 1**: Lập kế hoạch & trích xuất đầy đủ dữ liệu học thuật (29 chữ cái, 9 ngày từ vựng, 14 ngày đánh vần, kho lời khen/báo sai).
- **Giai đoạn 2**: Triển khai `audioService.js` (Web Audio + Web Speech API) và `progressService.js` (LocalStorage + phần thưởng).
- **Giai đoạn 3**: Thiết kế đồ họa SVG nguyên bản (Bé Mây, Lumi, bông tuyết, bản đồ, pha lê, các con vật/đồ vật minh họa) & CSS Design Tokens.
- **Giai đoạn 4**: Xây dựng 3 Module học chính (Chữ cái + Tập viết, Từ vựng 8 từ, Đánh vần 8 từ karaoke 3 nhóm).
- **Giai đoạn 5**: Xây dựng Mini-games (Tìm tranh trong tuyết, Ghép đôi chữ cái, Xây cầu vần) & Màn hoàn thành thưởng sao/sticker.
- **Giai đoạn 6**: Xây dựng Bản đồ thế giới và Góc phụ huynh (chọn ngày học, kiểm tra giọng đọc TTS, chỉnh âm lượng, xem tiến độ).
- **Giai đoạn 7**: Tạo `server.js` (in IP LAN), `run_game.bat`, kiểm thử toàn diện trên trình duyệt.
- **Giai đoạn 8 (v2.2) — Hình ảnh**: tạo `content/image-manifest.json`, `tools/motifs/`, `tools/make-images.js`, `tools/make-scenes.js` (Cô Sao Băng, lâu đài, cảnh tan băng), `tools/preview.html`, `imageService.js`. Nghiệm thu: báo "0 thiếu".
- **Giai đoạn 9 (v2.2) — Tập viết chuẩn**: `src/data/strokes.js` (29 chữ thường), canvas 4 ô li, chạy mẫu, chấm nét khoan dung, Pointer Events.
- **Giai đoạn 10 (v2.2) — Trắc nghiệm ôn tập**: `buildDailyQuiz()`, màn kiểu A/B, khen từng câu đúng, tích hợp tính sao; test dữ liệu (8 câu, đáp án trong 8 từ của ngày) và kiểm thử iPad 6 kích thước.
- **Giai đoạn 11 (v2.3) — Người dẫn chuyện**: `src/data/stories.js` (từ `content/stories.json`), `storyService.js`, màn Trình phát truyện + Thư viện truyện, nút kể chuyện ở các màn, SFX Web Audio (`wind-soft, sparkle, chime, door, steps, mist, lullaby`) với ducking nhạc nền, cảnh tranh trong `tools/make-scenes.js`, `StoryProgress` trong `progressService`, thưởng nghe truyện. Nghiệm thu: SPEC-06 §11; test dữ liệu (dòng ≤ 18 từ, `art` có hình, ≤ 100 giây). Vẫn chỉ chạy local, không push Git remote.
- **Giai đoạn 12 (v2.4) — Game cuối buổi & emoji**: `emojiService.js` (nạp `emoji-map.json`, kiểm tra emoji hiển thị bằng canvas), `buildFinalGame()` (10 câu, 3 kiểu), màn Chốt buổi học theo SPEC-07 §2, cập nhật tính sao (≥ 8/10), tab "Hình" trong Kiểm tra giọng. **Thay thế giai đoạn 8 và 10**: bỏ `tools/make-images.js`, `tools/motifs/`, `image-manifest.json`; `make-scenes.js` chỉ giữ nếu đã có. Nghiệm thu: SPEC-07 §8. Vẫn chỉ chạy local, không push Git remote.
