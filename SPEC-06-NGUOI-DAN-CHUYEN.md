# SPEC 06 — NGƯỜI DẪN CHUYỆN & KỂ CHUYỆN GIỌNG BẮC (v2.3)

Bổ sung cho SPEC-01…05. Nếu mâu thuẫn, **SPEC-06 ưu tiên** ở phần kể chuyện, lời thoại nhân vật, nút "Nghe kể chuyện". Giữ nguyên ràng buộc `IMPLEMENTATION_PLAN.md`: chạy local, $0, vanilla, không cài package, không push Git remote.
Dữ liệu: `content/stories.json` (10 truyện, 75 dòng thoại).

---

## 1. Mục tiêu
Bé gái 3–4 tuổi thích cổ tích (vương miện, nàng công chúa băng tuyết, bạn thú lấp lánh). Một nút bấm → có người **kể chuyện bằng giọng Bắc** ấm áp, có tranh, âm thanh, và để bé **nghe – chạm – nói theo**, từ đó muốn học. **Không bắt buộc, không tính sao**, bé bỏ qua lúc nào cũng được.

## 2. Người dẫn chuyện và nhân vật nói
| Id | Nhân vật | Vai | Giọng (Web Speech) |
|---|---|---|---|
| `co` | **Cô Sao Băng** | Người dẫn chuyện chính: vừa kể vừa nói trực tiếp với bé | `rate 0.88`, `pitch 1.0` (ấm, chậm rãi) |
| `lumi` | **Lumi** (linh thú tuyết) | Bạn nhỏ chen vào, gợi nhắc, reo vui | `rate 1.05`, `pitch 1.45` (trong, tinh nghịch) |

- **Bé chính là Bé Mây.** Cô và Lumi gọi thẳng "Bé Mây ơi" (tên lưu trong `{ten}`). Góc phụ huynh cho **đổi tên bé** (mặc định "Bé Mây"); tên lạ có thể bị TTS đọc chưa chuẩn → có nút nghe thử tên.
- Chế độ `mood: "calm"` (truyện ru ngủ): `rate ×0.9`, `pitch −0.05`, nhạc nền nhỏ hơn.

## 3. Nút "Nghe kể chuyện" ở đâu
Nút lớn (≥ 96 px) có biểu tượng SVG gốc quyển truyện + Cô Sao Băng (không emoji), đặt ở:
1. **Màn chính:** lần đầu mở app tự đề xuất truyện `story-prologue` (vẫn phải chạm "Bắt đầu phiêu lưu", mở khóa âm thanh Safari).
2. **Bản đồ:** mỗi vùng có nút kể chuyện riêng (Rừng Chữ, Thung Lũng, Cầu Vồng, Lâu Đài, Đỉnh Cực Quang).
3. **Đầu mỗi bài học:** nút "Nghe Cô kể" (không tự phát). Bài có truyện riêng (vd. Từ vựng Ngày 1 → `story-lumi-lost`) hiện truyện đó; các ngày khác dùng **mẫu giới thiệu ngày** (§6).
4. **Màn Hoàn thành:** `story-star-ceremony` (Lễ nhận sao, lời đổi theo 1/2/3 sao).
5. **Thư viện truyện** (từ màn chính): xem tất cả truyện, nghe lại bất cứ lúc nào, gồm truyện ru ngủ.
6. **Mốc thưởng 30 sao:** tự gợi ý `story-crown`.

## 4. Luồng phát một truyện
1. Bé chạm nút → mở **Trình phát truyện** (toàn màn hình).
2. Mỗi **cảnh**: hiện tranh (`art`), phát SFX (`sfx`), đọc lần lượt các dòng thoại; chữ phụ đề hiện kèm, **tô sáng từng từ** theo giọng đọc (bé chưa biết chữ vẫn thấy chữ chạy, tạo thói quen nhìn chữ).
3. **Tương tác (một số cảnh):** `tap-sparkle` (chạm vào vật phát sáng); Lumi nhắc, đợi `pause_ms` rồi tự khen. Chỗ `pause_ms` lớn là lúc "nói theo": **không dùng micro, không chấm đọc**.
4. Hết truyện: nút CTA (vd. "Bắt đầu phiêu lưu") dẫn vào học, hoặc "Nghe lại".
5. Tự chuyển cảnh (bật mặc định, tắt được). Tạm dừng/tiếp tục/lặp cảnh/sang cảnh kế bất cứ lúc nào.

### Bố cục (ngang)
```text
┌───────────────────────────────────────────────┐
│ ✕                 ●●●○○○ (các cảnh)              │
│        TRANH CẢNH LỚN (≥ 60% chiều cao)          │
│   + Cô Sao Băng / Lumi đứng bên khi họ nói        │
├───────────────────────────────────────────────┤
│  [bong bóng thoại, màu theo người nói, chữ to]   │
│  ⟲ lặp cảnh     ❚❚/▶      ⏭ cảnh kế   (≥72px)    │
└───────────────────────────────────────────────┘
```
Bong bóng: Cô = tím cực quang, Lumi = xanh băng (không chỉ dựa vào màu: có tên/biểu tượng nhỏ). Dọc: tranh trên, thoại dưới. Tôn trọng `prefers-reduced-motion`.

## 5. Viết lời & giọng Bắc
- **Từ Bắc:** ơi, nhé, nào, thế, ạ, mẹ, bà, thìa, bát, cốc… Tránh nè, nghen, hen, nha, dzậy. Từ gọi bố: theo quyết định đã chốt (giữ "ba" trong từ vựng); lời truyện ưu tiên "mẹ", "bà" để tránh vùng miền.
- **Câu ngắn ≤ 18 từ** (≤ 12 từ nếu được), mỗi dòng một ý, để TTS ngắt nhịp tự nhiên. Có thán từ vui (oa, ơ kìa), tiếng gõ, âm lặp.
- **Nội dung an toàn:** không ma/quái, không đe dọa, tình huống buồn (lạc) kết ấm áp trong cùng truyện; ≤ 100 giây/truyện.
- **iPad/Safari chỉ có thể có 1 giọng `vi-VN`** (thường *Linh*): khác biệt Cô/Lumi dựa vào `rate`/`pitch` + màu/biểu tượng + SFX nên cần bù bằng hình. Nếu giọng không hỗ trợ `pitch`, vẫn hiện bong bóng khác màu.
- `ttsOverrides.js` áp dụng cả cho truyện; trang **Kiểm tra giọng** thêm tab **Truyện**: nghe từng dòng, đánh dấu đọc sai, xuất danh sách cần chỉnh. Thêm nút **nghe thử tên bé**.

## 6. Mẫu giới thiệu ngày (sinh tự động, không cần viết tay)
Vì mỗi ngày học (9 từ vựng + 14 đánh vần + 29 chữ cái) không thể có truyện riêng, app tạo lời dẫn 2–3 dòng từ dữ liệu ngày:
- **Từ vựng/đánh vần:** Cô: "Chào {ten}! Hôm nay mình đến {vùng}." / Lumi: "Có tám viên pha lê đang ngủ: {từ1}, {từ2}, {từ3}… Mình đánh thức nhé!" (đọc tối đa 4 từ đầu rồi "và nhiều bạn nữa").
- **Đánh vần có vần mới (Ngày 12–14…):** Lumi: "Hôm nay có vần mới: {vần}!" rồi đọc ghép `u – a – ua` (dùng `rime_intro` của SPEC-04).
- **Chữ cái:** Cô: "Hôm nay mình gặp chữ {chữ}. {chữ} bắt đầu từ {từ ví dụ}."
Tên vùng theo SPEC-02 §4.

## 7. Âm thanh (Web Audio, $0)
SFX tổng hợp bằng `OscillatorNode`/noise, không file ngoài: `wind-soft`, `sparkle`, `chime`, `door`, `steps`, `mist`, `lullaby` (vài nốt chậm). Khi đang kể: **hạ nhạc nền còn ~30%** (ducking), SFX nhỏ hơn giọng. Tốc độ đọc người dùng chỉnh được (0.8×–1.1×) trong Góc phụ huynh.

## 8. Dữ liệu (`content/stories.json` → `src/data/stories.js`)
```ts
Story { id, title, trigger: string[], link?: {module, days?}, mood: 'normal'|'calm',
  cta?: string, scenes: Scene[], est_seconds }
Scene { id, art: string, sfx?: string, lines: Line[], variants?: {'1'|'2'|'3': Line[]},
  interact?: {type:'tap-sparkle', prompt: string} }
Line { who: 'co'|'lumi', text: string /* có {ten} */, pause_ms?: number }
StoryProgress { storyId, listenedAt, completedAt, plays }
```
`storyService.js`: `play(storyId, {stars?})` xếp hàng từng dòng qua `audioService.speak(text,{rate,pitch})`, chờ `onend`, đồng bộ phụ đề, hủy khi bé đóng; xử lý `speechSynthesis.cancel()` khi chuyển cảnh/thoát.
**v2.4:** tranh cảnh dùng **emoji** theo `content/story-art-emoji.json` (SPEC-07 §6), không dựng SVG mới; đoạn sau chỉ để tham khảo.
Tranh cảnh (`art`): dựng bằng `tools/make-scenes.js` với `kit.js` + motif có sẵn (`person`, `cloud`, `star5`…), lưu `assets/img/scene/<art>.svg`. Danh sách `art` cần có: ice-village, mist, lumi-appears, crown-star, crystal, ice-village-sunrise, forest-letters, glow-path, valley, castle, castle-door, rainbow-bridge, aurora-peak, snow-forest, home-light, crown-room, crown-glow, bedroom-night, ceremony. Thiếu cảnh nào: dùng nền băng tuyết của `kit.js` + hình Cô Sao Băng (không để trống).

## 9. Danh sách truyện v2.3
| Id | Tên | Hiện khi | ~Giây |
|---|---|---|---|
| story-prologue | Sương Mù Quên Chữ | mở app lần đầu / nút Màn chính | 76 |
| story-letters | Rừng Chữ Lung Linh | vùng Chữ cái | 41 |
| story-vocab | Thung Lũng Từ Ngắn | vùng Từ vựng | 31 |
| story-spell | Lâu Đài Đánh Vần | vùng Đánh vần | 28 |
| story-rainbow | Cầu Vồng Tuyết | vùng Từ vựng ngày 6–9 | 33 |
| story-aurora | Đỉnh Cực Quang | vùng Ôn tập / hoàn tất | 31 |
| story-lumi-lost | Lumi đi lạc | Từ vựng Ngày 1 / Thư viện | 47 |
| story-crown | Vương miện sao sáu cánh | mốc 30 sao / Thư viện | 46 |
| story-bedtime | Bông tuyết ru ngủ | Thư viện (giờ ngủ) | 56 |
| story-star-ceremony | Lễ nhận sao | Màn Hoàn thành | 16 |
Mở rộng sau: thêm truyện vào `stories.json` (không cần sửa code).

## 10. Thưởng & phụ huynh
- Nghe **hết một truyện lần đầu**: +1 bông tuyết và 1 sticker thuộc bộ mới **"Truyện Cô Sao Băng"** (bộ thứ 4, SPEC-04 §5.3). **Không tính vào số sao**, không phạt nếu bỏ qua.
- Góc phụ huynh: bật/tắt kể chuyện, đổi tên bé, tốc độ đọc, bật/tắt phụ đề, xem truyện đã nghe, **Kiểm tra giọng** (tab Truyện).

## 11. Nghiệm thu
1. Nút kể chuyện có ở Màn chính, bản đồ, đầu bài học, Màn hoàn thành, Thư viện.
2. Phát đủ 10 truyện, không lỗi khi nhấn đóng giữa chừng (không còn tiếng đọc dang dở).
3. Phụ đề tô từng từ theo giọng; tạm dừng/lặp/cảnh kế hoạt động.
4. Cô và Lumi khác nhau (giọng hoặc màu/biểu tượng) kể cả khi máy chỉ có 1 giọng.
5. `{ten}` thay đúng; đổi tên bé có hiệu lực ngay.
6. Test dữ liệu: mọi truyện có ≥ 1 cảnh, dòng ≤ 18 từ, `art` có hình, `est_seconds` ≤ 100.
7. Không dùng nhân vật/lời thoại/nhạc có bản quyền (Disney/Frozen).
8. Chạy mượt trên iPad Safari 6 kích thước (SPEC-05 §1.1).
