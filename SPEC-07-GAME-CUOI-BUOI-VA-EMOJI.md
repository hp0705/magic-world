# SPEC 07 — GAME CUỐI BUỔI HỌC (10 CÂU) & HÌNH ẢNH BẰNG EMOJI (v2.4)

Bổ sung/ghi đè SPEC-04 §5.2 và SPEC-05 §3, §4. **Nếu mâu thuẫn, SPEC-07 ưu tiên** ở: game cuối buổi, số câu, cách tính sao, nguồn hình ảnh. Dữ liệu: `content/emoji-map.json`, `content/story-art-emoji.json`. Vẫn: local, $0, vanilla, không cài package, không push Git remote.

---

## 1. Quyết định mới
1. **Mỗi buổi học (chữ cái, từ vựng, đánh vần) kết thúc bằng game "Chốt buổi học" 10 câu** theo mẫu giao diện đã duyệt (§2). Đây là mini-game bắt buộc của SPEC-05 §3, nay thay 8 câu bằng **10 câu**.
2. **Không vẽ/tạo hình nữa. Mọi hình dùng emoji có sẵn** của thiết bị (Apple Color Emoji trên iPad). **Bỏ**: `tools/make-images.js`, `tools/motifs/`, `image-manifest.json`, `image-prompts.csv`, `imageService` ưu tiên webp/svg. Còn lại duy nhất `emojiService` (§5). Hình Cô Sao Băng, Lumi, Bé Mây, bản đồ, lâu đài có thể giữ SVG đã có hoặc dùng emoji (§6); **không tạo thêm hình mới.**

## 2. Giao diện câu hỏi (theo ảnh mẫu)
```text
┌──────────────────────────────────────────────┐
│ [✕ Về trạm học]     [Câu 1/10]     ⭐ Đúng: 0/10 │
│   Bé Mây hãy tự đọc chữ và chọn đúng hình nhé:    │
│              ┌ ─ ─ ─ ─ ─ ┐                       │
│              │    sáp    │  (chữ rất lớn, viền nét đứt)│
│              └ ─ ─ ─ ─ ─ ┘                       │
│            [🔊 Gợi ý âm thanh]                    │
│   ┌────────┐  ┌────────┐  ┌────────┐             │
│   │   🥣   │  │   🤸   │  │   🖍️   │  (3 thẻ emoji lớn)│
│   └────────┘  └────────┘  └────────┘             │
│          [  Từ tiếp theo ▶  ]                    │
└──────────────────────────────────────────────┘
```
- **Đề:** hiện **chữ**, bé **tự đọc** (giọng **không** tự đọc lúc vào câu). Nút **Gợi ý âm thanh** đọc từ (đánh vần cả 3 nhóm nếu là bài đánh vần); dùng gợi ý **không bị trừ gì**, chỉ ghi nhận để phụ huynh biết.
- **3 thẻ emoji** ≥ 160×140 pt, cách nhau ≥ 16 pt; emoji cỡ ≥ 88 pt. Có 3 lựa chọn (4 nếu bé muốn khó hơn ở Góc phụ huynh).
- **Nút "Từ tiếp theo ▶"** (≥ 72 px): chỉ **bấm được khi đã trả lời đúng**, hoặc khi bé muốn **bỏ qua** (xem giải thích dưới). Sau câu đúng, màn tự chờ ~2 giây rồi chuyển; bé bấm sớm cũng được.
- **Bỏ qua:** nút xuất hiện mờ trước khi trả lời; bấm sẽ đưa câu đó **xuống cuối lượt** (chỉ một lần), không trừ gì, không tính "đúng lần đầu".
- "Đúng: x/10" chỉ **tăng**, không bao giờ hiện số sai.
- "✕ Về trạm học" thoát về bản đồ; giữ tiến độ lượt, lần sau hỏi "Chơi tiếp hay chơi lại?".

## 3. Ba kiểu câu
| Kiểu | Đề | Đáp án | Dùng khi |
|---|---|---|---|
| **A. Chữ → hình** *(mẫu ảnh)* | từ hiện trên màn | 3 thẻ emoji | từ có `quiz: true` trong `emoji-map.json` |
| **B. Nghe → hình** | giọng đọc từ + nút nghe lại | 3 thẻ emoji | xen kẽ với A cho từ có emoji |
| **C. Nghe → chữ** | giọng đọc từ + nút nghe lại | 3 thẻ **chữ** lớn | từ **không có emoji rõ nghĩa** (`quiz: false`), ví dụ "chia", "khuấy", "ngoan", "chuyện" |

- Đánh vần, kiểu A/C: khi đúng, thẻ chữ **tô màu `âm đầu + vần + thanh`** và sáng lần lượt theo karaoke rồi đọc trơn (SPEC-05 §3.3).
- Kiểu **A là chủ đạo (~60%)**, B ~20%, C chỉ dành cho từ không có emoji; không để cùng kiểu quá 3 câu liên tiếp.
- **Chữ cái:** đề là chữ thường (và hoa xen kẽ); 3 emoji là hình của từ ví dụ các chữ vừa học (ví dụ `b` → 👨 "ba"). Nếu chữ ví dụ không có emoji thì dùng kiểu C với chữ cái.

## 4. Sinh 10 câu — `buildFinalGame(sessionItems, history, seed?)`
1. **Mục tiêu 10 câu.** Lấy tối đa 8 từ của buổi, mỗi từ làm đáp án đúng **1 lần**; từ nào `quiz:false` thành câu kiểu C.
2. **2 câu còn lại là ôn:** ưu tiên từ **bé hay chọn nhầm** (lưu trong `progressService`), sau đó từ của ngày học gần nhất; nếu là buổi đầu tiên thì lặp lại 2 từ hôm nay với kiểu câu khác.
3. **Đáp án nhiễu:** lấy từ chính nhóm từ của buổi + từ ôn, **không trùng emoji** với đáp án đúng, không trùng nhau; ưu tiên khác âm đầu và khác chủ đề (lượt đầu), chơi lại không ưu tiên nữa.
4. Đảo ngẫu nhiên thứ tự và vị trí đáp án (Fisher–Yates), từ vừa hỏi không làm câu kế tiếp.
5. Chơi lại không giới hạn, lưu kết quả **tốt nhất**.
```ts
FinalQuestion { id, type: 'word-pick-emoji'|'listen-pick-emoji'|'listen-pick-word',
  targetText, optionTexts: string[3|4], correctIndex, isReview: boolean }
```

## 5. Hình bằng emoji — `emojiService`
- **Nguồn:** `content/emoji-map.json`: `words[<từ>] = { emoji, quiz }` cho 154 từ/chữ ví dụ (123 có `quiz:true`, 31 là từ trừu tượng nên chỉ dùng kiểu C). Bổ sung từ mới = thêm một dòng.
- **Hiển thị:** thẻ `<span role="img" aria-label="từ">` cỡ lớn, nền băng tuyết CSS (gradient + bóng), **không dùng file ảnh**. Có thể ghép thêm `✨` lấp lánh bằng CSS.
- **Chọn emoji:** một emoji/từ, không ghép phức tạp, trừ vài trường hợp đã chốt (xoăn 👩‍🦱, y tá 🧑‍⚕️). Tránh emoji mới (Unicode > 14): đã loại 🪭, 🫖.
- **Kiểm tra máy:** lúc khởi động vẽ thử từng emoji lên canvas; emoji nào không hiển thị đúng (ô vuông/trống) thì từ đó tự chuyển `quiz:false`.
- **Giới hạn cần biết:** emoji mỗi hệ điều hành vẽ khác nhau; một số từ chỉ gần đúng (cốc 🥛, bát 🥣, bánh 🍪, bình 🏺, trời 🌤️, bay 🕊️, cún 🐕 vs chó 🐶). Hai từ **không bao giờ xuất hiện cùng một câu** nếu cùng emoji. Ngày có nhiều từ `quiz:false` sẽ có nhiều câu kiểu C: Ngày 12–14 đánh vần chủ yếu là kiểu C.
- Trang **Kiểm tra giọng** thêm tab **Hình**: xem toàn bộ từ + emoji, đánh dấu emoji chưa hợp để sửa.

## 6. Cảnh truyện (SPEC-06) và nhân vật
- `content/story-art-emoji.json`: mỗi `art` của truyện là một cụm emoji lớn (ví dụ `castle` → 🏰✨, `rainbow-bridge` → 🌈🌉) trên nền gradient băng tuyết bằng CSS.
- Nhân vật nói: Cô Sao Băng 🌠, Lumi 🦄, Bé Mây 👧 (đặt cạnh bong bóng thoại). Nếu đã có SVG của nhân vật thì giữ, không vẽ thêm.

## 7. Điểm thưởng (thay SPEC-04 §5.2)
| Sao | Điều kiện |
|---|---|
| ⭐ | Sáng đủ viên pha lê của buổi học |
| ⭐⭐ | + **hoàn thành game Chốt buổi học 10 câu** |
| ⭐⭐⭐ | + đúng ngay lần đầu **≥ 8/10** câu (không tính gợi ý âm thanh và Lumi) |

Phản hồi mỗi câu như SPEC-05 §3.5: đúng → chuông + lời khen khác nhau + ❄ +1 + emoji nhảy; sai → "bừ bư" + câu báo sai, ô sai mờ, chọn lại; sai 2 lần → Lumi mờ bớt 1 đáp án nhiễu. Hết 10 câu → màn Hoàn thành (sao, bông tuyết, sticker, tan băng) và gợi ý `story-star-ceremony`.
`SessionResult.miniGameCorrectFirstTry`, `miniGameTotal = 10`, thêm `hintsUsed`, `skipped`.

## 8. Nghiệm thu
1. Mỗi buổi học kết thúc bằng game 10 câu; "Câu n/10", "Đúng: x/10" đúng.
2. Giao diện khớp ảnh mẫu trên iPad 6 kích thước (SPEC-05 §1.1), thẻ emoji không bị cắt.
3. Test dữ liệu: mọi từ trong `lesson-samples.json`, `spelling-days.json` và SPEC-01 có trong `emoji-map.json`; mọi từ `quiz:true` có emoji; không có hai từ cùng emoji trong cùng một buổi.
4. Test: đủ 10 câu, đáp án đúng nằm trong 3 lựa chọn, không trùng emoji, không trùng nhau; chơi lại 2 lần thì thứ tự khác nhau.
5. Từ `quiz:false` chỉ xuất hiện ở kiểu C.
6. Gợi ý âm thanh không bị trừ gì; "Từ tiếp theo" bỏ qua đưa câu xuống cuối một lần.
7. Câu đúng nào cũng có lời khen và chuông; câu sai nào cũng có "bừ bư".
8. Không còn tham chiếu `make-images.js`/`imageService` trong mã.
