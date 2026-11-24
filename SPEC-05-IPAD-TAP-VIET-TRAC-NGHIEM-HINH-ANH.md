# SPEC 05 — iPAD, TẬP VIẾT CHUẨN, TRẮC NGHIỆM ÔN TẬP & HÌNH ẢNH

**Phiên bản:** 2.2 (bổ sung cho SPEC-01/02/03/04). Nếu mâu thuẫn, **SPEC-05 được ưu tiên** ở các mục: giao diện iPad, tập viết, mini-game trắc nghiệm, hình ảnh, nhân vật hero.
Ràng buộc từ `IMPLEMENTATION_PLAN.md` vẫn giữ: chạy local, $0, vanilla web standards, không `npm install`, không push Git remote. Nếu SPEC-03 (Vite/React) mâu thuẫn với kế hoạch này thì **theo IMPLEMENTATION_PLAN**.

---

## 1. Giao diện tối ưu cho iPad (thiết bị chính)

iPad là thiết bị mục tiêu số 1; điện thoại và desktop là phụ.

### 1.1 Kích thước kiểm thử bắt buộc (không cuộn, không cắt nút)
| Thiết bị | Ngang (landscape) | Dọc (portrait) |
|---|---|---|
| iPad 9.7" / 10.2" | 1024 × 768 | 768 × 1024 |
| iPad Air / 10.9" | 1180 × 820 | 820 × 1180 |
| iPad Pro 12.9" | 1366 × 1024 | 1024 × 1366 |
| (phụ) điện thoại, laptop | 360 × 640, 1366 × 768 | |

Cả hai hướng đều phải dùng được. **Bố cục ngang là mặc định**; xoay dọc thì xếp lại (tranh trên, nút dưới).

### 1.2 Bố cục màn học (ngang)
```text
┌────────────────────────────────────────────────────────┐
│ ⓘ   ◇◇◇◇◇◇◇◇ (8 pha lê)                 ❄ 12   ⚙(giữ 3s) │
├───────────────────────┬────────────────────────────────┤
│                       │   CHỮ / TỪ LỚN                 │
│   TRANH LỚN (≥ 45%    │   hàng chip đánh vần (3 cụm)   │
│   chiều cao)          │   [Nghe] [Đánh vần] [Ví dụ]    │
│   + Bé Mây & Lumi     │   câu ví dụ Bé Mây             │
├───────────────────────┴────────────────────────────────┤
│  ◀        [  CON ĐÃ ĐỌC ✓  ]        ▶    (thanh 3 chế độ) │
└────────────────────────────────────────────────────────┘
```
- Vùng tranh ≥ 45% chiều cao trên iPad (nâng từ 35% ở SPEC-04).
- Nút chạm ≥ 72 px (nút chính ≥ 96 px), khoảng cách ≥ 16 px; chừa vùng an toàn `env(safe-area-inset-*)` cho thanh Home.

### 1.3 Yêu cầu kỹ thuật riêng cho iPad / Safari
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">`; chiều cao dùng `100dvh` (không dùng `100vh` vì thanh địa chỉ Safari).
- Chặn zoom đúp, kéo-làm-mới, chọn chữ ngoài ý muốn: `touch-action: manipulation`, `user-select: none`, `-webkit-touch-callout: none`; riêng canvas tập viết dùng `touch-action: none`.
- **Mở khóa âm thanh:** Safari chỉ cho phát khi có thao tác chạm. Màn đầu có nút to **"Bắt đầu phiêu lưu"**: ở đó gọi `audioCtx.resume()` và phát một câu TTS rỗng để mở khóa `speechSynthesis`.
- **TTS trên iPad:** `getVoices()` có thể rỗng lúc đầu; nghe sự kiện `voiceschanged` rồi thử lại. Ưu tiên giọng `vi-VN` nữ (thường là *Linh*). Hướng dẫn phụ huynh tải giọng chất lượng cao: *Cài đặt → Trợ năng → Nội dung đã đọc → Giọng nói → Tiếng Việt*.
- **Apple Pencil và ngón tay:** dùng **Pointer Events** (`pointerdown/move/up`, `getCoalescedEvents`); khi đang có `pen` thì bỏ qua chạm của lòng bàn tay (`touch` có vùng tiếp xúc lớn bất thường).
- **Canvas sắc nét:** nhân kích thước theo `devicePixelRatio` (màn Retina).
- **Hiệu năng:** tuyết rơi bằng canvas giới hạn ≤ 60 hạt, tạm dừng khi tab ẩn (`visibilitychange`); tôn trọng `prefers-reduced-motion`.
- Không dùng hover làm cách tương tác duy nhất.
- **Thêm vào Màn hình chính:** `apple-mobile-web-app-capable`, `apple-touch-icon` (SVG gốc Bé Mây), `theme-color #4CC9F0`, để mở toàn màn hình như app.
- **Cách đưa lên iPad ($0, không cài gì):** chạy `node server.js` trên máy tính; server lắng nghe `0.0.0.0` và in địa chỉ LAN (vd. `http://192.168.1.x:3000`). Mở địa chỉ đó bằng Safari trên iPad (cùng Wi-Fi) rồi *Chia sẻ → Thêm vào MH chính*. (Mở file `index.html` trực tiếp chỉ dùng được trên máy tính, không áp dụng cho iPad.)

---

## 2. TẬP VIẾT chuẩn "chữ viết tay" (thay chữ in trong sách)

### 2.1 Vấn đề đã sửa
Màn Tập viết trước đây tô theo font (chữ **a in** như trong sách). Trẻ cần học **chữ viết thường kiểu tập viết lớp 1**: nét cong khép kín, nét móc liền mạch, có điểm đặt bút, thứ tự nét và mũi tên.

### 2.2 Nguyên tắc
- **Màn đọc** (Học chữ cái) giữ chữ in (Andika) vì trẻ sẽ gặp trong sách. Thêm một thẻ nhỏ **"Chữ viết"** cạnh chữ in để trẻ thấy hai kiểu của cùng một chữ.
- **Màn Tập viết** chỉ dùng **chữ viết tay mẫu**, không dùng font. Hình dáng đối chiếu theo mẫu chữ viết trong trường tiểu học của Bộ GD&ĐT (Quyết định 31/2002/QĐ-BGD&ĐT; cần đối chiếu bản gốc khi vẽ nét): chữ đứng, nét đều.
- Mẫu chữ **vẽ bằng đường nét (stroke path) tự biên soạn**, lưu trong `src/data/strokes.js`, không phải font. Đổi mẫu sau này không cần sửa giao diện.

### 2.3 Dữ liệu nét chữ
```ts
StrokeGuide {
  letterId: string,                // 'a', 'ă', 'â', 'b' ... đủ 29 chữ
  case: 'lower' | 'upper',        // chữ thường làm trước, chữ hoa làm sau
  viewBox: '0 0 100 160',         // khung 4 dòng kẻ
  strokes: [{
    order: 1,
    d: 'M ... C ...',              // đường tâm của nét (SVG path)
    start: {x, y},                 // chấm đặt bút
    dir: 'arrow',                  // mũi tên chiều viết
    width: 9                       // độ dày vùng tô cho phép
  }],
  extraMarks?: [{type:'hat'|'breve'|'horn'|'bar', d: '...'}]  // mũ â ê ô, trăng ă, râu ơ ư, ngang đ
}
```
Làm đủ **29 chữ thường** trước; **chữ hoa** làm ở bước kế tiếp (có thể sau MVP, cấu trúc dữ liệu đã chừa sẵn).

### 2.4 Giao diện canvas Tập viết
- Nền **dòng kẻ ô li** (dòng đáy rõ, thân chữ giữa hai dòng), màu nhạt.
- Hiện **chữ mẫu mờ** kèm **chấm xanh đặt bút**, **số thứ tự nét**, **mũi tên**. Bé tô theo từng nét; nét hoàn thành xong thì chấm bắt đầu của nét sau mới sáng.
- Nút **"Xem Bé Mây viết"**: một tia sáng chạy dọc từng nét theo đúng thứ tự (animation `stroke-dashoffset`) để bé xem mẫu trước.
- Hiệu ứng: bông tuyết lấp lánh bám theo đầu bút, vệt màu băng lam phát sáng.
- **Chấm nét khoan dung:** nét hoàn thành khi bút đi qua ≥ 80% các điểm mốc dọc đường tâm theo đúng chiều, dung sai ≈ 1,5 × `width`. Đi lệch **không bị phạt**, không báo lỗi; chỉ là mốc chưa sáng. Không bắt làm lại vô hạn: nút **"Bỏ qua"** luôn hiện.
- Hoàn thành chữ: chuông pha lê + lời khen Bé Mây.
- Nút: **Xóa**, **Xem mẫu**, **Bỏ qua**, **Chữ kế**.

### 2.5 Nghiệm thu tập viết
1. Chữ **a** ở màn Tập viết là **chữ viết tay**, không phải kiểu in như sách đọc.
2. Có số thứ tự nét, chấm đặt bút, mũi tên, chạy mẫu được.
3. Đủ 29 chữ thường có `StrokeGuide`; test dữ liệu kiểm tra mỗi chữ có ≥ 1 nét và mỗi nét có `start`.
4. Tô trên iPad bằng ngón tay và bằng Apple Pencil đều mượt.

---

> **v2.4:** mục 3 được thay bằng game Chốt buổi học **10 câu** và mục 4 (hình ảnh) được thay bằng **emoji có sẵn**: xem `SPEC-07-GAME-CUOI-BUOI-VA-EMOJI.md` (ưu tiên hơn). Nội dung dưới đây giữ để tham khảo quy tắc khen/báo sai.

## 3. TRẮC NGHIỆM CHỌN TỪ — ÔN TẬP TRONG NGÀY (mini-game bắt buộc)

### 3.1 Mục đích
Sau khi sáng đủ 8 viên pha lê, bé **ôn lại đúng những từ vừa học hôm nay** qua trắc nghiệm hình. Đây là mini-game chính để tính sao thứ 2 và thứ 3 (SPEC-04 §5.2).

### 3.2 Phạm vi dữ liệu (quan trọng)
- **Chỉ lấy hình và từ có trong ngày học đó**: 8 từ của Ngày N (từ vựng hoặc đánh vần). Đáp án đúng và đáp án nhiễu **đều nằm trong 8 từ đó**, không lấy từ ngày khác.
- Chữ cái: nhóm ôn gồm chữ vừa học và tối đa 3 chữ học gần nhất (dùng hình ví dụ của từng chữ). Nếu chưa đủ 4 chữ thì giảm số lựa chọn xuống 3.

### 3.3 Hai kiểu câu, luân phiên
| Kiểu | Đề | Đáp án |
|---|---|---|
| **A. Nghe, chọn tranh** | Giọng đọc "Bé Mây tìm tranh **con mèo**" (+ nút nghe lại) | 4 tranh lớn |
| **B. Nhìn tranh, chọn từ** | 1 tranh lớn ở giữa, giọng hỏi "Đây là gì?" | 3–4 thẻ chữ lớn bên dưới |

Với đánh vần, kiểu B: khi chọn đúng, thẻ chữ **tô màu theo vai trò** (âm đầu / vần / thanh) và sáng lần lượt theo karaoke rồi đọc trơn, để củng cố cấu tạo tiếng.

### 3.4 Quy tắc sinh câu hỏi
```ts
buildDailyQuiz(dayItems: Item[8], seed?): QuizQuestion[8]
QuizQuestion { id, type: 'listen-pick-image' | 'image-pick-word',
  targetId, optionIds: string[3|4], correctIndex }
```
1. Mỗi từ trong ngày làm đáp án đúng **đúng 1 lần** → **8 câu**.
2. **Đảo ngẫu nhiên** (Fisher–Yates) thứ tự 8 câu mỗi lần chơi; không để cùng kiểu A/B quá 2 câu liên tiếp; từ vừa hỏi không làm câu kế tiếp.
3. Đáp án nhiễu lấy ngẫu nhiên từ 7 từ còn lại của ngày; lượt đầu ưu tiên nhiễu **khác âm đầu** với đáp án (dễ hơn), chơi lại thì không ưu tiên nữa.
4. Vị trí đáp án đúng ngẫu nhiên, đảo lại mỗi lần chơi.
5. Chơi lại không giới hạn, lấy kết quả **tốt nhất** (SPEC-04 §5.2).

### 3.5 Phản hồi mỗi câu
- **Đúng:** chuông pha lê + một **lời khen** ngẫu nhiên từ kho SPEC-02 §7 (không lặp liên tiếp hai câu giống nhau), +1 bông tuyết bay lên, tranh nhảy/phát sáng, đọc lại từ đúng một lần rồi sang câu kế. **Bắt buộc có phản hồi sau MỖI câu đúng.**
- **Sai:** "bừ bư" + câu báo sai (SPEC-02 §7); không trừ gì; ô sai mờ đi, cho chọn lại ngay; nút nghe lại luôn hiện.
- **Sai 2 lần liên tiếp ở một câu:** Lumi làm mờ 1 đáp án nhiễu hoặc nhấp nháy gợi ý đáp án đúng. Câu đó **không** tính "đúng ngay lần đầu".
- Hết 8 câu: màn Hoàn thành (SPEC-04 §5.2): sao, bông tuyết, sticker, tan băng.
- Thanh tiến độ 8 chấm nhỏ ở trên, không đồng hồ đếm ngược.

### 3.6 Điểm lưu
`SessionResult.miniGameCorrectFirstTry` = số câu đúng ngay lần đầu (không tính gợi ý Lumi), `miniGameTotal = 8`. Góc phụ huynh hiển thị **từ nào bé hay chọn nhầm** để gợi ý ôn lại.

### 3.7 Nghiệm thu trắc nghiệm
1. Test: mỗi lượt có đúng 8 câu, mỗi từ trong ngày làm đáp án đúng đúng 1 lần.
2. Test: mọi `optionIds` thuộc 8 từ của ngày; không trùng nhau trong một câu; `correctIndex` hợp lệ.
3. Chơi lại 2 lần: thứ tự câu và vị trí đáp án khác nhau.
4. Câu đúng nào cũng có lời khen và chuông; câu sai nào cũng có "bừ bư".

---

## 4. HÌNH ẢNH SINH ĐỘNG (bắt buộc cho mọi từ)

### 4.1 Yêu cầu
- **Mỗi từ có 1 tranh riêng**, đúng nghĩa, nhìn là nhận ra: 9 ngày × 8 từ vựng + 14 ngày × 8 từ đánh vần + 29 hình ví dụ chữ cái. Từ trùng giữa các module dùng chung một hình.
- Không dùng emoji (SPEC-04 §3). Phong cách thống nhất: **minh họa phẳng có chiều sâu**: nét bo tròn, màu rực rỡ, đổ bóng mềm, điểm sáng (highlight), nền băng tuyết lung linh (đốm sáng, bông tuyết, gradient `#F8FDFF → #CFEFFF`), mắt tròn thân thiện cho con vật.
- Mỗi tranh viewBox `0 0 400 400`, vector nên nét ở mọi cỡ, kể cả vùng tranh ≥ 45% chiều cao iPad.
- Tên file = `id` của từ: `assets/img/word/<id>.svg` (hoặc `.webp/.png` nếu dùng ảnh làm bằng công cụ khác).

### 4.2 Hai đường làm hình (làm song song được)
**Đường A, script tạo SVG ($0, không cài gì): `tools/make-images.js`**
- Chạy bằng Node có sẵn: `node tools/make-images.js` (chỉ dùng `fs`, `path`).
- Đầu vào: `content/image-manifest.json` (mỗi mục: `id`, `text`, `motif`, `palette`, `props`), sinh từ `lesson-samples.json` + `spelling-days.json`.
- Thư viện **motif** viết sẵn trong `tools/motifs/*.js`: động vật (mèo, chó, gà, cá, voi, thỏ…), đồ vật (bát, cốc, bút, bàn…), thiên nhiên (mây, mưa, cây, hoa…), cơ thể (tay, mắt, miệng…), hành động. Mỗi motif là hàm trả về SVG nhiều lớp (thân, bóng, highlight, chi tiết).
- Pipeline: `manifest → chọn motif + bảng màu → ghép lớp → thêm nền băng tuyết + bóng + lấp lánh → ghi file SVG`; cuối cùng in **báo cáo thiếu** (từ chưa có motif) để bổ sung.
- Sinh `assets/img/index.json` ánh xạ `id → file`. `imageService` ưu tiên ảnh `webp/png` làm thủ công, thiếu mới dùng SVG sinh sẵn, thiếu cả hai thì dùng thẻ chữ lớn có màu (không để ô trống).
- Sinh trang xem trước `tools/preview.html` (lưới mọi hình, lọc theo ngày) để duyệt nhanh.

**Đường B, ảnh minh họa chất lượng cao (tùy chọn; dịch vụ tạo ảnh bên ngoài có thể tốn phí)**
- Xuất `content/image-prompts.csv` (id, từ, prompt) để người dùng tự đưa vào công cụ tạo ảnh họ chọn; app không tự gọi API. Thả ảnh vào `assets/img/word/<id>.webp` là app tự dùng, ưu tiên hơn SVG.
- **Prompt mẫu thống nhất phong cách:** `"cute 3D-like cartoon illustration of <từ>, rounded shapes, soft shading, bright colors, ice and snow fairy-tale background with soft aurora glow, centered, child-friendly, no text, no logo, original design"`.
- Không đưa tên nhân vật/thương hiệu có bản quyền vào prompt.

### 4.3 Hình nhân vật & cảnh
- Bé Mây, Lumi, Cô Sao Băng, bản đồ, lâu đài, cảnh tan băng: vẽ SVG gốc nhiều lớp (xem §6), lưu `assets/img/scene/`.
- Cảnh "tan băng" dựng bằng nhiều lớp SVG (băng phủ → tan → sáng) để chuyển động mượt khi nhận sao.

### 4.4 Nghiệm thu hình ảnh
1. `node tools/make-images.js` ra đủ file cho **100%** từ trong `lesson-samples.json` + `spelling-days.json` (script in "0 thiếu").
2. Trang xem trước mở được, mọi hình nét ở cỡ lớn.
3. Test dữ liệu: mỗi `id` có đường dẫn hình hợp lệ.
4. Mọi hình đã duyệt: đúng nghĩa, không gây sợ, không chứa chữ lẫn trong hình.

---

## 5. Tổng hợp thay đổi theo module
| Module | Phần học | Mini-game cuối lượt |
|---|---|---|
| Chữ cái | Đọc chữ, đọc ví dụ, **Tập viết chữ viết tay** | Trắc nghiệm chữ gần nhất (§3.2) |
| Từ vựng | Qua 8 từ | **Trắc nghiệm ôn tập 8 câu** (A/B luân phiên) |
| Đánh vần | Làm quen vần + qua 8 từ | **Trắc nghiệm ôn tập 8 câu**, thẻ chữ tô màu khi đúng |

Ghép đôi chữ hoa–thường và Xây cầu đánh vần (SPEC-02 §6) vẫn giữ làm trò chơi **phụ** trong góc chơi tự do.

---

## 6. Nhân vật hero (thay yêu cầu "hình Elsa")

**Không dùng hình, tên hoặc tạo hình Elsa/Anna/Olaf hay bất kỳ nhân vật Disney/Frozen nào**, kể cả trong app, ảnh minh họa và prompt tạo ảnh. Đây là nhân vật có bản quyền; hình sao chép từ phim có rủi ro pháp lý, nhất là khi app được chia sẻ. (Quy định này đã có ở SPEC-02 §2 và SPEC-03 §3, giữ nguyên.)

Để màn hình vẫn đẹp, lung linh như phim hoạt hình băng tuyết, thêm một **nhân vật hero nguyên bản**:

**Cô Sao Băng, Nữ hoàng Pha Lê Băng Lam** (hiện ở màn chính, màn hoàn thành, lễ mở mốc sao):
- Dáng thanh thoát, tóc **tím cực quang `#B8A1FF`** xõa dài gợn sóng điểm các vì sao; **vương miện pha lê hình ngôi sao sáu cánh**.
- Váy **xanh băng lam `#4CC9F0`** chuyển **trắng tuyết** ở tà, **áo choàng tím nhạt mỏng bay**, viền **vàng ấm `#FFD166`**.
- **Khác rõ với mọi nhân vật có bản quyền** để tránh nhái: không tóc bím một bên, không váy hoa văn bông tuyết đặc trưng, không tông tóc bạch kim; khuôn mặt và trang phục tự thiết kế.
- Hiệu ứng riêng: khi Cô giơ tay, **ánh sao** rải xuống; khi bé nhận sao, Cô gật đầu và vẫy tay.
- Vẽ bằng SVG nhiều lớp (tóc, mặt, váy, áo choàng, vương miện, hào quang) với lớp **glow** (blur + gradient) để lung linh; nền là **lâu đài pha lê, cực quang, núi tuyết** vẽ gốc.
- Sinh bằng `tools/make-scenes.js` (cùng pipeline §4.2); duyệt lại để chắc không giống nhân vật hãng nào.

---

## 7. Cập nhật tiêu chí nghiệm thu tổng
Thêm vào SPEC-04 §7:
8. Chạy mượt trên iPad Safari ở 6 kích thước/hướng trong §1.1.
9. Tập viết dùng chữ viết tay mẫu có thứ tự nét (§2).
10. Trắc nghiệm ôn tập trong ngày chỉ dùng từ trong ngày, đảo ngẫu nhiên, câu đúng nào cũng có lời khen (§3).
11. Mọi từ đều có hình sinh động, `make-images.js` báo "0 thiếu" (§4).
12. Có nhân vật hero nguyên bản, không có nhân vật Disney/Frozen (§6).
