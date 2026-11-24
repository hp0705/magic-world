# SPEC 04 — GIAO DIỆN, CHỌN CHẾ ĐỘ HỌC, ĐÁNH VẦN & PHẦN THƯỞNG

**Phiên bản:** 2.2 (bổ sung cho SPEC-01/02/03; **SPEC-05 ưu tiên hơn** ở iPad, tập viết, trắc nghiệm, hình ảnh). Quyết định đã chốt: giữ "ba"; không thu âm (dùng TTS); thêm Ngày 12–14; thưởng 1–3 sao. Nếu mâu thuẫn, **SPEC-04 được ưu tiên** ở các mục: kiểu đánh vần, khóa/mở khóa, điểm thưởng, màu sắc.

---

## 1. Ba chế độ học — chọn tự do

Màn hình chính có **3 thẻ lớn** (không khóa, bé/phụ huynh chọn thẻ nào cũng được):

| Thẻ | Tên hiển thị | Nội dung | Chọn tiếp |
|---|---|---|---|
| 1 | **Học chữ cái** | 29 chữ, mỗi chữ 3 nút: Đọc chữ cái / Đọc ví dụ / Tập viết | Chọn chữ (lưới 29 ô) hoặc "Học tiếp" |
| 2 | **Học từ vựng** | 9 ngày × 8 từ | Chọn ngày 1–9 |
| 3 | **Tập đánh vần** | 14 ngày × 8 từ | Chọn ngày 1–14 |

- Mỗi thẻ có nút to **"Học tiếp"** (nhảy tới bài chưa xong gần nhất) và nút nhỏ **"Chọn ngày khác"**.
- **Các chặng (1 Làm quen & Chữ cái, 2 Từ vựng, 3 Đánh vần, 4 Câu ngắn & Kể chuyện) không khóa nhau**: chọn qua lại tự do, tiến độ lưu riêng từng chặng; chuyển chặng không mất tiến độ. Chặng 4 hiển thị là thẻ phụ "Kể chuyện" (làm sau MVP).
- **Bỏ khóa cứng** (thay cho "mở khóa vùng đất mới" ở SPEC-02): mọi ngày đều chọn được. Ngày chưa học hiển thị băng phủ mờ; ngày đã học sáng lên. Chỉ là hiệu ứng thị giác, không chặn bé.
- Tab/phím tắt chuyển 3 chế độ luôn hiện ở thanh dưới (3 biểu tượng lớn, ≥ 72 px).

---

## 2. Quy tắc ĐÁNH VẦN (chỉ áp dụng ở chế độ "Tập đánh vần")

Mỗi tiếng đánh vần theo **3 nhóm**, đánh **từng chữ cái** của vần:
1. **Đánh vần vần:** từng chữ cái + vần — `a – pờ – ap`; `u – ô – i – uôi`; `u – a – ua`.
2. **Ghép âm đầu:** `sờ – ap – sap`.
3. **Thêm thanh:** `sắc – sáp`.

Ví dụ **sáp**: `sờ a pờ ap | sờ ap sap | sắc sáp`. Ví dụ **pin**: `i – nờ – in | pờ – in – pin`.

Quy tắc đã chốt:
- Thanh **ngang** → bỏ nhóm 3. Không có âm đầu (áo, ếch) → bỏ nhóm 2. Vần 1 chữ cái (a, e, ô…) → bỏ nhóm 1.
- Vần đôi/ba tách từng chữ: uôi = u – ô – i; ươi = ư – ơ – i; iêu = i – ê – u; ương = ư – ơ – ngờ; uyên = u – y – ê – nờ.
- **y**: hiển thị chữ **y**, đọc /i/ (a – y – ay đọc "a – i – ay"). `ă` đọc "á", `â` đọc "ớ".
- Tên phụ âm: bờ, cờ, chờ, dờ, đờ, gờ (gh = gờ), giờ, hờ, **ca** (k), khờ, lờ, mờ, nờ, ngờ (ngh = ngờ), nhờ, pờ, phờ, quờ, rờ, sờ, tờ, thờ, trờ, vờ, xờ.
- Vần kết thúc `c, ch, p, t` chỉ có thanh sắc/nặng (nên Ngày 8–11 không có hỏi/ngã) — đây là quy tắc chính tả, không phải thiếu sót.
- Dữ liệu sinh sẵn 112 từ: `content/spelling-days.json` (`spelling_steps`, `rime_intro`).

### Màn "Làm quen vần" (trước 8 từ mỗi ngày)
- Hiện lần lượt từng vần của ngày (vd. Ngày 12: u, ia, ua, ưa), mỗi vần 1 thẻ lớn: chữ vần + tranh gợi ý + nút nghe; đọc ghép `u – a – ua` rồi đọc trơn `ua`.
- Bấm "Con đã nghe" là qua; không tính vào 8 viên pha lê, không chấm điểm.

### Hiển thị (thay cho 9 chip xám giống nhau trong ảnh)
- Một hàng chip, chia **3 cụm cách nhau bằng khoảng trống + mũi tên nhỏ** để bé thấy 3 bước.
- Tô màu theo **vai trò** (và có gạch chân khác kiểu, không chỉ dựa vào màu):
  | Vai trò | Màu chữ | Gạch chân |
  |---|---|---|
  | Âm đầu | `#0A6FC2` xanh băng đậm | nét liền |
  | Vần / nguyên âm / âm cuối | `#D62839` đỏ | nét đứt |
  | Thanh | `#7A3FD1` tím | chấm |
  | Tiếng/từ hoàn chỉnh | `#1B2B4B` đậm, cỡ to hơn, nền vàng nhạt |
- Khi bấm **"Cách đánh vần"**, chip **sáng lên lần lượt** đúng lúc giọng đọc đến token đó (karaoke), kết thúc bằng tiếng/từ nhảy to + chuông pha lê.
- Bấm riêng 1 chip → nghe đúng token đó.
- Bỏ ô lặp "a – pờ – ap" ở khung Vần phía trên (đã nằm trong hàng chip nhóm 1); khung Vần chỉ giữ chữ **ap** to + nút nghe.

---

## 3. Màn hình học — nguyên tắc cho trẻ 3–4 tuổi

- **Một màn hình, không cuộn**, **ưu tiên iPad**: kiểm thử 1024×768, 768×1024, 1180×820, 820×1180, 1366×1024, 1024×1366 (và phụ 360×640, 1366×768). Chi tiết ở SPEC-05 §1. Hiện trạng ảnh: nút dưới bị cắt.
- **Tranh là nhân vật chính:** vùng tranh ≥ 45% chiều cao màn hình trên iPad (≥ 35% trên màn nhỏ) (ảnh hiện: icon nhỏ ~120 px).
- Bỏ câu **định nghĩa trừu tượng** ("chất mềm dùng để làm bút màu") khỏi màn trẻ; chuyển sang Góc phụ huynh. Thay bằng tranh + câu ví dụ Bé Mây.
- Nhãn trên cùng (chủ đề, "Vần -ap (Âm cuối -p)", "Bảng vần") là thông tin cho **phụ huynh** → thu nhỏ/ẩn vào nút "ⓘ".
- Nút chính: **"Con đã đọc ✓"** (to nhất, hiện sau khi bé nghe ít nhất 1 lần) + mũi tên Trước/Sau chỉ biểu tượng (≥ 72 px). Hiện trạng ảnh thiếu nút này.
- **Thanh 8 viên pha lê** cố định phía trên; viên sáng khi bấm "Con đã đọc".
- Bé Mây + Lumi xuất hiện ở góc (Lumi nhấp nháy gợi ý khi bé im 8 giây). Ảnh hiện chưa có nhân vật/chủ đề Băng Lam.
- Viết hoa chuẩn tiếng Việt: "Đồ dùng", không "Đồ Dùng".
- Thay emoji bằng SVG gốc đồng bộ phong cách (emoji khác nhau giữa iOS/Android/Windows).
- Màu nút nghe nhất quán: **xanh = nghe từ**, **xanh lá = đánh vần**, **vàng = câu ví dụ**; biểu tượng loa **màu trắng** (ảnh hiện loa xám trên nền xanh, khó nhìn).

---

## 4. Design tokens

```json
{
  "color": {
    "ice": "#4CC9F0", "snow": "#F8FDFF", "aurora": "#B8A1FF", "gold": "#FFD166",
    "ink": "#1B2B4B", "onset": "#0A6FC2", "rime": "#D62839", "tone": "#7A3FD1",
    "btnListen": "#0A6FC2", "btnSpell": "#12803F", "btnExample": "#8A5A00",
    "correct": "#12803F", "tryAgain": "#B45309"
  },
  "radius": {"card": 28, "button": 999},
  "touch": {"min": 72, "primary": 96},
  "font": {"display": "Baloo 2", "reading": "Andika", "fallback": "system-ui"},
  "size": {"letterHero": "clamp(120px, 28vw, 220px)", "word": "clamp(56px, 11vw, 104px)", "chip": "clamp(28px, 5vw, 44px)"}
}
```

Kiểm tra tương phản (WCAG, tính bằng công thức, chữ trên nền trắng): onset 5.17, rime 4.97, tone 6.07, ink 14.06 → đều ≥ 4.5.
**Lưu ý:** `#4CC9F0` và `#FFD166` chỉ dùng làm **nền/trang trí** — chữ trắng trên `#4CC9F0` chỉ đạt 1.92 (không đọc được), nên nút dùng nền `#0A6FC2` + chữ/biểu tượng trắng (5.17).
Font: kiểm tra hiển thị dấu chồng (ầ, ẫ, ử, ệ, ỡ…) trước khi chốt; chữ cái ở màn đọc dùng Andika; **màn Tập viết dùng chữ viết tay mẫu bằng nét vẽ, không dùng font** (SPEC-05 §2).

---

## 5. Phản hồi & Phần thưởng (bổ sung mới)

Nguyên tắc: **chỉ cộng, không bao giờ trừ**; không bảng xếp hạng; không tiền ảo; không quảng cáo.

### 5.1 Trong lúc chơi
- **Trả lời đúng:** chuông pha lê + lời khen (SPEC-02 §7) + **+1 bông tuyết ❄** bay lên bộ đếm.
- **Trả lời sai:** "bừ bư" + câu báo sai (SPEC-02 §7); **không trừ gì**; bấm nghe lại ngay; sai 2 lần → Lumi gợi ý.
- **Bấm "Con đã đọc":** 1 viên pha lê sáng + chuông nhẹ.

### 5.2 Cuối MỖI lượt học (màn Hoàn thành — bắt buộc)
Hiện đúng **1–3 ngôi sao** (luôn ≥ 1):

| Sao | Điều kiện |
|---|---|
| ⭐ | Sáng đủ 8 viên pha lê |
| ⭐⭐ | + hoàn thành **game Chốt buổi học 10 câu** (SPEC-07) |
| ⭐⭐⭐ | + trả lời đúng ngay lần đầu ≥ 8/10 câu (không tính gợi ý của Lumi và gợi ý âm thanh) |

Kèm: tổng **bông tuyết** lượt này, **1 sticker ngẫu nhiên** vào album (chưa có thì thêm, trùng thì thành "bụi sao"), vùng đất **tan băng** theo số sao, và lời Bé Mây: "Bé Mây được X ngôi sao rồi, giỏi quá!". Sao 3 luôn có cách đạt lại: chơi lại ngày đó không giới hạn, lấy kết quả **tốt nhất**.

### 5.3 Phần thưởng tích lũy
- **Tổng sao** làm sáng dần Vương quốc (mốc 10 / 30 / 60 / 100 / 150 sao: cầu vồng tuyết, lâu đài sáng đèn, cực quang…).
- **Album sticker:** 4 bộ (Rừng chữ, Thung lũng từ, Lâu đài vần, **Truyện Cô Sao Băng**), mỗi ngày học xong cho 1 sticker; nghe hết mỗi truyện lần đầu = 1 sticker + 1 bông tuyết (không tính vào sao, SPEC-06 §10).
- **Chuỗi ngày học (tùy chọn):** "đèn lồng" sáng thêm mỗi ngày học; nghỉ ngày không mất, chỉ ngừng sáng thêm.

### 5.4 Dữ liệu lưu (`progressService`)
```ts
SessionResult { id, module: 'letters'|'vocab'|'spelling', dayNumber?, letterId?,
  startedAt, completedAt, crystals: 0-8, snowflakes: number,
  miniGameCorrectFirstTry: number, miniGameTotal: number, stars: 1|2|3 }
RewardState { totalStars, totalSnowflakes, stickers: string[], stardust: number, streakDays: number }
```
Góc phụ huynh hiển thị: sao theo ngày, từ nào bé hay nhầm (để ôn), nút reset.

---

## 6. Âm thanh & giọng đọc (yêu cầu kỹ thuật)

- **Dùng TTS `vi-VN`, không thu âm** (quyết định của người dùng). Ưu tiên giọng nữ Bắc nếu trình duyệt có; cho phụ huynh chọn giọng trong Góc phụ huynh.
- **Rủi ro:** TTS hay đọc sai token lẻ (`pờ`, `ap`, `uôi`, `ăm`). Giảm rủi ro: (1) phát **từng token riêng**, ngắt ~350 ms, dùng trường `say`; (2) bảng `ttsOverrides.json` để đổi chữ gửi cho TTS khi một token đọc sai; (3) **trang "Kiểm tra giọng"** trong Góc phụ huynh: liệt kê mọi token, bấm nghe, bấm "đọc sai" để lưu → xuất danh sách cần chỉnh.
- Nếu sau này muốn thu âm, cùng cấu trúc tên file dưới đây vẫn dùng được (audioService ưu tiên file, thiếu mới dùng TTS).
- Quy ước tên file: `audio/spell/onset/sờ.mp3`, `audio/spell/rime/ap.mp3`, `audio/spell/syllable/sap.mp3`, `audio/spell/tone/sắc.mp3`, `audio/word/sáp.mp3`, `audio/sentence/<id>.mp3`.
- Mỗi chữ cái có **2 bản ghi**: `sound` (bờ) và `name` (bê). Mặc định phát **sound**.
- Cho phép tốc độ đọc "chậm" (0.8×) cho đánh vần.

---

## 7. Tiêu chí nghiệm thu giao diện
1. Mọi màn học vừa 1 màn hình ở 4 kích thước nêu trên, không cuộn.
2. Nút chạm ≥ 72 px; khoảng cách giữa 2 nút ≥ 16 px.
3. Hàng đánh vần của từ "sáp" hiển thị đúng 9 token: `sờ a pờ ap | sờ ap sap | sắc sáp`, tô màu đúng vai trò, sáng lần lượt khi phát.
4. Cuối mỗi lượt có màn sao/bông tuyết/sticker.
5. 3 chế độ chọn được ngay từ màn chính, không khóa.
6. Màn "Làm quen vần" có trước mỗi ngày đánh vần.
7. Test dữ liệu: 14 ngày đánh vần, mỗi ngày đúng 8 từ, không trùng id; `spelling_steps` khớp bảng `content/spelling-days.json`.

8. (v2.2) Chạy mượt trên iPad Safari ở 6 kích thước/hướng (SPEC-05 §1.1).
9. (v2.2) Tập viết dùng chữ viết tay mẫu, có thứ tự nét, chấm đặt bút, mũi tên (SPEC-05 §2).
10. (v2.2) Trắc nghiệm ôn tập chỉ dùng từ trong ngày, đảo ngẫu nhiên, câu đúng nào cũng có lời khen (SPEC-05 §3).
11. (v2.2) Mọi từ đều có hình sinh động; `node tools/make-images.js` báo 0 thiếu (SPEC-05 §4).
