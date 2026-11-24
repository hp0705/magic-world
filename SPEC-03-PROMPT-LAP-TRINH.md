# SPEC 03 — PROMPT GIAO CHO AI LẬP TRÌNH

Bạn là senior full-stack engineer kiêm product-minded game developer. Hãy xây dựng ứng dụng web giáo dục **"Bé Mây — Vương quốc Băng Lam"** trong repository `magic-world` hiện tại.

## 0. Việc đầu tiên: kiểm tra repository
- Đọc toàn bộ cấu trúc và mã nguồn hiện có trước khi thay đổi.
- Đọc kỹ `SPEC-01-NOI-DUNG-HOC.md`, `SPEC-02-COT-TRUYEN-GAME.md` và `SPEC-04-GIAO-DIEN-VA-THUONG.md`, `content/spelling-days.json` và `content/lesson-samples.json` (v2.1). **SPEC-04 ưu tiên hơn** về kiểu đánh vần, điểm thưởng, không khóa ngày; **SPEC-05 ưu tiên hơn cả** về iPad, tập viết, trắc nghiệm, hình ảnh. Đọc thêm `SPEC-05-IPAD-TAP-VIET-TRAC-NGHIEM-HINH-ANH.md` và `IMPLEMENTATION_PLAN.md` (kế hoạch chạy local, vanilla, không cài package: nếu mâu thuẫn mục 4 Stack thì theo kế hoạch đó).
- Nếu repo trống, khởi tạo dự án bằng Vite + React + TypeScript.
- Tạo `IMPLEMENTATION_PLAN.md` liệt kê từng phase, file sẽ tạo, tiêu chí nghiệm thu. Sau đó tiến hành code từng phase.

## 1. Mục tiêu sản phẩm
Web app chạy mượt trên Chrome, Edge, Safari (ưu tiên tablet & mobile, responsive tốt trên desktop), dễ deploy lên GitHub Pages từ repo `https://github.com/hp0705/magic-world.git`.
Người dùng chính là trẻ 3–4 tuổi chưa biết chữ; giao diện phải là một game phiêu lưu cổ tích băng tuyết sống động, nút bấm cực lớn, ít chữ thừa.

## 2. Ràng buộc nội dung (v2.0)
- Giọng đọc tiếng Việt **miền Bắc** (dùng Web Speech API `vi-VN`, có xử lý lỗi nếu trình duyệt không hỗ trợ; có trang Kiểm tra giọng + `ttsOverrides`; không thu âm ở MVP).
- **Module 1 (Chữ cái):** Đủ 29 chữ cái (in hoa & in thường), mỗi chữ có 3 nút bắt buộc: **Đọc chữ cái**, **Đọc ví dụ**, **Tập viết chữ cái**.
- **Module 2 (Từ vựng):** Chia đúng **8 từ/ngày**, sắp xếp theo **số chữ cái** (Ngày 1–2: 2 chữ cái; Ngày 3–5: 3 chữ cái; Ngày 6–7: 4 chữ cái; Ngày 8–9: 5–6 chữ cái & từ ghép).
- **Module 3 (Tập đánh vần):** Chia đúng **8 từ/ngày**, nhóm theo **âm cuối** (14 ngày từ SPEC-01 v2.1), đánh vần 3 nhóm theo SPEC-04 §2 (vd. sáp = `sờ a pờ ap | sờ ap sap | sắc sáp`), có màn "Làm quen vần", tách màu `âm đầu + vần + thanh`, nút đọc đánh vần và đọc trơn.
- **Nguyên tắc qua bài:** Mỗi từ chỉ cần trẻ nghe mẫu và bấm xác nhận đọc/nhận diện **1 lần** là tính hoàn thành; luôn có nút nghe lại, không bắt lặp vô hạn.
- **Phản hồi đúng/sai:** Triển khai chính xác kho câu khen (*"Bé Mây giỏi quá!"*, *"Bé Mây trả lời hay quá!"*, *"Bé Mây xinh đẹp thật tuyệt vời!"*, *"Bé Mây đáng yêu quá!"*...) và âm thanh *"bừ bư"* + kho câu báo sai kết hợp cả trực tiếp (*"Sai rồi"*, *"Nhầm rồi"*, *"Không đúng rồi, Bé Mây cố lên nhé!"*) lẫn nhẹ nhàng (*"Chưa đúng rồi"*, *"Nhầm một chút thôi"*) theo SPEC-02.
- Tách hoàn toàn dữ liệu nội dung vào `src/data/` để dễ hiệu đính và mở rộng.

## 3. Ràng buộc bản quyền
- Dùng thế giới nguyên bản **Vương quốc Băng Lam** (Bé Mây, Lumi, Cô Sao Băng).
- Tuyệt đối không dùng tên, hình ảnh, nhạc, logo của Disney/Frozen (Elsa, Anna, Olaf).
- Tạo SVG/illustration gốc hoặc placeholder đẹp, thân thiện cho trẻ nhỏ.

## 4. Stack kỹ thuật
- **Vite + React + TypeScript**
- **Tailwind CSS** (hoặc CSS Modules — chọn 1 và dùng nhất quán)
- **React Router** (dùng `HashRouter` hoặc cấu hình `base: '/magic-world/'` để deploy GitHub Pages không lỗi 404)
- **State & Persistence:** LocalStorage (tạo lớp abstraction `progressService` để dễ nâng cấp backend sau này)
- **Audio:** Web Audio API cho hiệu ứng *"bừ bư"* và chuông pha lê (không phụ thuộc file ngoài ở MVP), kết hợp audio player + fallback Web Speech API cho giọng đọc.

## 5. Các màn hình MVP bắt buộc
1. **Home / World Map:** Bản đồ Vương quốc Băng Lam với Bé Mây, Lumi và 3 khu vực chính: *Rừng Chữ Cái*, *Thung Lũng Từ Vựng (8 từ/ngày)*, *Lâu Đài Đánh Vần (8 từ/ngày)*.
2. **Lesson Intro:** Cảnh truyện ngắn 1 màn hình với nút "Bắt đầu" thật to.
3. **Letter Lesson (Học chữ cái):** Hiển thị chữ Hoa & Thường to rõ, tranh minh họa, 3 nút: `Đọc chữ cái`, `Đọc ví dụ`, `Tập viết chữ cái`.
4. **Vocabulary Lesson (Từ vựng 8 từ/ngày):** Thanh tiến độ 8 viên pha lê; mỗi từ có tranh lớn, chữ to, nút đọc từ, câu ví dụ Bé Mây, nút "Con đã đọc / Tiếp theo".
5. **Spelling Lesson (Tập đánh vần 8 từ/ngày):** Thanh tiến độ 8 viên pha lê; hiển thị thẻ ghép `Âm đầu` + `Vần` + `Thanh` tách màu rõ, nút đọc đánh vần chậm, nút đọc trơn, câu ví dụ Bé Mây.
6. **Mini-game:** Chọn tranh theo tiếng đọc, ghép chữ hoa–thường, ghép âm đầu + vần tạo tiếng. Tích hợp âm thanh *"bừ bư"* + lời khen/động viên Bé Mây.
7. **Handwriting Canvas (Tập viết):** Canvas tô nét chữ cái cỡ lớn có đường dẫn mờ, hiệu ứng tuyết lấp lánh theo nét vẽ, nút xóa và nút bỏ qua.
8. **Completion Screen:** Cảnh vùng đất tan băng phát sáng + lời khen Bé Mây.
9. **Parent Area:** Bật/tắt nhạc nền, giọng đọc, hiệu ứng; chọn ngày học; xem tiến độ các từ đã qua; reset dữ liệu.

## 6. Kiến trúc thư mục gợi ý
```text
src/
  components/
    Character/
    GameButton/
    CrystalProgress/
    AudioControls/
  features/
    world-map/
    letters/
    vocabulary/
    spelling/
    mini-games/
    handwriting/
    parent/
  data/
    alphabet.ts
    vocabulary.ts
    spelling.ts
    feedback.ts
    lessons.ts
  services/
    audioService.ts
    progressService.ts
  types/
    curriculum.ts
```

## 7. Kiểu dữ liệu cốt lõi (`src/types/curriculum.ts`)
- `LetterItem`: `id`, `lowercase`, `uppercase`, `audioText`, `exampleWord`, `exampleSentence`, `imagePrompt`
- `VocabItem`: `id`, `text`, `letterCount`, `dayNumber`, `topic`, `audioText`, `exampleSentence`, `imagePrompt`
- `SpellingItem`: `id`, `text`, `dayNumber`, `endingGroup`, `initial`, `rime`, `tone`, `spellingRead`, `audioText`, `exampleSentence`, `imagePrompt`
- `FeedbackBank`: `correctPhrases: string[]`, `wrongPhrases: string[]`
- `ItemProgress`: `itemId`, `seenAt`, `heardAt`, `completedAt`, `attempts`

## 8. Phase triển khai & Kiểm thử
- **Phase 1:** Khởi tạo Vite + React + TS, cấu hình GitHub Pages, design tokens băng tuyết, data types, `audioService` (kèm âm *"bừ bư"* và chuông pha lê), `progressService`.
- **Phase 2:** Nạp toàn bộ dữ liệu từ SPEC-01 (29 chữ cái, 9 ngày từ vựng, 14 ngày đánh vần, kho lời khen/báo sai).
- **Phase 3:** Dựng 3 luồng học chính (Chữ cái + Tập viết, Từ vựng 8 từ, Đánh vần 8 từ).
- **Phase 4:** Dựng Mini-games, Bản đồ Vương quốc Băng Lam, Màn hoàn thành và Góc phụ huynh.
- **Phase 5:** Unit test cho dữ liệu (đảm bảo mỗi ngày từ vựng & đánh vần đủ 8 từ), test `progressService`, kiểm tra responsive, `npm run build` thành công và cập nhật `README.md` hướng dẫn deploy GitHub Pages.

## 9. Bổ sung v2.1
- Điểm thưởng sau mỗi lượt (1–3 sao, bông tuyết, sticker), 3 chế độ chọn tự do, không khóa ngày: xem SPEC-04 §1, §5.
- `SpellingItem` thêm: `spellingSteps: {text, say, role, group}[]`; `SpellingDay` thêm `rimeIntro`.

## 10. Bổ sung v2.2 (chi tiết ở SPEC-05)
- **iPad là thiết bị chính:** bố cục ngang/dọc, `100dvh`, vùng an toàn, Pointer Events cho Apple Pencil, mở khóa âm thanh bằng nút "Bắt đầu phiêu lưu", server LAN cho iPad.
- **Tập viết:** thay font bằng `StrokeGuide` (chữ viết tay mẫu, thứ tự nét, 4 ô li, chạy mẫu); `src/data/strokes.js`.
- **Trắc nghiệm ôn tập trong ngày:** `buildDailyQuiz()` tạo 8 câu từ đúng 8 từ của ngày, 2 kiểu A/B luân phiên, đảo ngẫu nhiên; khen mỗi câu đúng; "bừ bư" khi sai.
- **Hình ảnh:** `tools/make-images.js` sinh SVG sinh động cho 100% từ + `content/image-manifest.json`, `imageService`, trang `tools/preview.html`; tùy chọn nạp ảnh `webp/png` từ `content/image-prompts.csv`.
- **Nhân vật hero nguyên bản** Cô Sao Băng; **tuyệt đối không dùng Elsa/Anna/Olaf** (kể cả trong prompt tạo ảnh).
- Kiểu dữ liệu thêm: `StrokeGuide`, `QuizQuestion`, `ImageAsset {id, file, source:'webp'|'svg'|'fallback'}`.
- Phase thêm: xem `IMPLEMENTATION_PLAN.md` (giai đoạn 8–10).

## 11. Bổ sung v2.3 (chi tiết ở SPEC-06)
- **Người dẫn chuyện:** `src/services/storyService.js` (`play(storyId,{stars})`, hàng đợi TTS qua `audioService`, hủy khi thoát), `src/data/stories.js` nạp từ `content/stories.json`.
- **Màn:** Trình phát truyện (tranh, phụ đề tô từng từ, nút ≥72px, tạm dừng/lặp/cảnh kế) và Thư viện truyện; nút "Nghe kể chuyện" ở Màn chính, bản đồ, đầu bài, Màn hoàn thành.
- **Kiểu dữ liệu thêm:** `StoryScript {id,title,trigger,mood,scenes,est_seconds}`, `StoryProgress {storyId,listenedAt,completedAt,plays}`.
- Giọng Cô/Lumi khác nhau bằng `rate/pitch` + màu bong bóng; Kiểm tra giọng thêm tab Truyện và nghe thử tên bé.
- Phase thêm: `IMPLEMENTATION_PLAN.md` giai đoạn 11.

## 12. Bổ sung v2.4 (chi tiết ở SPEC-07, ưu tiên hơn SPEC-05 §3–4)
- **Game Chốt buổi học 10 câu** cuối mỗi buổi: `buildFinalGame()`, 3 kiểu câu (chữ→hình, nghe→hình, nghe→chữ), nút Gợi ý âm thanh, "Từ tiếp theo", "Đúng: x/10".
- **Hình = emoji:** `emojiService` đọc `content/emoji-map.json`; **không** tạo `tools/make-images.js`, `tools/motifs/`, `image-manifest.json`; cảnh truyện từ `content/story-art-emoji.json`.
- Sao 3: đúng lần đầu ≥ 8/10. `SessionResult.miniGameTotal = 10`.
