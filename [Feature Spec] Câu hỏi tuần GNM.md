# [Feature Spec] Câu hỏi tuần

## Mục tiêu

Mỗi tuần GNM đăng một câu hỏi có tính tranh luận. Người dùng trả lời ngắn (200–800 ký tự) và câu trả lời **hiển thị ngay**. Cuối tuần, các câu trả lời đáng chú ý được ghép thành một bài tổng hợp cộng đồng có ghi tên người trả lời.

Ba mục tiêu nghiệp vụ:

1. **Tạo bậc thang chuyển đổi người đọc → người viết.** Khoảng cách từ "đọc bài" đến "viết một bài hoàn chỉnh và chờ duyệt" hiện quá lớn. Câu hỏi tuần là bậc trung gian: viết vài trăm chữ, thấy kết quả ngay, có tên mình trên GNM.
2. **Tạo nội dung tranh luận đều đặn mà không tăng tải biên tập.** Câu trả lời không đi qua hàng đợi bài viết, không chiếm thời gian BTV.
3. **Tạo nguồn cung cho tính năng Góc nhìn đối lập** (spec riêng). Người đã trả lời câu hỏi tuần là ứng viên tự nhiên để viết bài đầy đủ.

**North star của tính năng:** tỷ lệ người trả lời câu hỏi tuần sau đó gửi một bài viết đầy đủ.

---

## 1. ĐIỀU KIỆN TIÊN QUYẾT — CHẶN RELEASE

Tính năng này vận hành theo mô hình **hậu kiểm**: câu trả lời hiển thị công khai trước khi có người xem. Bốn hạng mục sau **phải hoàn thành trước khi ship**, không được đẩy sang phase sau.

| # | Hạng mục | Lý do |
|---|---|---|
| **PRE-01** | Lớp lọc tự động (mục 6) | Không có nó thì hậu kiểm = không kiểm |
| **PRE-02** | Nút báo cáo + ngưỡng tự ẩn | Nghĩa vụ của MXH có giấy phép; hiện prototype chưa có ở đâu |
| **PRE-03** | Công cụ trong CMS: ẩn câu trả lời, ẩn toàn bộ câu trả lời của một tài khoản, khoá tài khoản | Cần xử lý sự cố trong vài giây |
| **PRE-04** | Trang **Tiêu chuẩn cộng đồng** công bố công khai | Hiện là dead link. Không thể ẩn nội dung vì "vi phạm tiêu chuẩn" khi tiêu chuẩn chưa tồn tại |

**Ngoài ra cần xác nhận với pháp chế NetSpace:** mô hình hậu kiểm cho nội dung do người dùng đăng công khai, thời hạn lưu log, và thời hạn xử lý nội dung bị báo cáo.

---

## 2. PHẠM VI

**In Scope**

- Entity `Question` và `Answer` (tách khỏi `Article`)
- Màn hình Câu hỏi tuần, composer trả lời, danh sách câu trả lời
- Điểm vào (entry point) trên trang chủ và trang cá nhân
- Lọc tự động ba tầng cho câu trả lời
- Luồng báo cáo và hậu kiểm
- Menu CMS mới: quản lý câu hỏi + kiểm duyệt câu trả lời
- Lưu trữ câu hỏi các tuần trước
- Luồng mời phát triển câu trả lời thành bài đầy đủ
- Nhóm thông báo mới (NT-Q)

**Out of Scope**

- Bài tổng hợp cuối tuần **được tạo bằng luồng bài viết toà soạn hiện có**, không cần công cụ mới
- Threading / trả lời lồng nhau giữa các câu trả lời
- Ảnh, video, đính kèm trong câu trả lời
- Câu hỏi do người dùng đề xuất
- Nhiều câu hỏi cùng mở song song

---

## 3. KHÁI NIỆM & DATA MODEL

### 3.1 Nguyên tắc nền

> **Câu trả lời KHÔNG phải bài viết.**

Hệ quả bắt buộc:

- Không tạo record trong bảng `articles`
- **Không** vào menu CMS "Bài viết độc giả"
- **Không** tính vào `daily_submission_limit` (quota 5 bài/ngày ở Doc 2)
- Không có bút danh riêng — dùng đúng tên hiển thị của tài khoản
- Không có danh mục, tag, slug, SEO field

Đây là điều kiện để tính năng không làm nghẽn BTV.

### 3.2 Entity `Question`

| Field | Mô tả |
|---|---|
| `id` | |
| `title` | Câu hỏi, tối đa 120 ký tự |
| `context` | Đoạn dẫn nhập 2–4 câu, giải thích vì sao câu hỏi này đáng bàn |
| `cover_image` | Ảnh đại diện |
| `status` | `DRAFT` / `SCHEDULED` / `OPEN` / `CLOSED` / `SUMMARIZED` |
| `opens_at` / `closes_at` | Mốc mở và đóng |
| `created_by` | User CMS tạo câu hỏi |
| `summary_article_id` | Trỏ tới bài tổng hợp, null cho tới khi có |
| `answer_count` | Denormalized, chỉ đếm `VISIBLE` |

### 3.3 Entity `Answer`

| Field | Mô tả |
|---|---|
| `id`, `question_id`, `user_id` | |
| `content` | Text thuần, 200–800 ký tự |
| `status` | `VISIBLE` / `AUTO_HELD` / `HIDDEN_REPORTED` / `REMOVED` / `BLOCKED` |
| `agree_count` | Số lượt Đồng tình |
| `report_count` | |
| `is_pinned` | BTV ghim |
| `is_in_summary` | Được chọn vào bài tổng hợp |
| `filter_result` | Kết quả lọc tự động, lưu để audit |
| `edited_at` | Null nếu chưa sửa |
| `created_at`, `updated_at` | |

### 3.4 Vòng đời câu hỏi

```
DRAFT ──► SCHEDULED ──► OPEN (7 ngày) ──► CLOSED ──► SUMMARIZED
                                            │
                                            └─ vẫn đọc được, không trả lời được
```

### 3.5 Trạng thái câu trả lời

| Status | Ai thấy | Chuyển từ |
|---|---|---|
| `VISIBLE` | Công khai | Qua lọc tự động, hoặc BTV duyệt lại từ `AUTO_HELD` |
| `AUTO_HELD` | Chỉ tác giả + CMS | Lọc tự động gắn cờ |
| `HIDDEN_REPORTED` | Chỉ tác giả + CMS | Đạt ngưỡng báo cáo |
| `REMOVED` | Chỉ CMS | BTV/Thư ký ẩn |
| `BLOCKED` | Chỉ tác giả + CMS | Lọc tự động chặn cứng |

---

## 4. LỊCH VẬN HÀNH

Chu kỳ tuần cố định, timezone `Asia/Ho_Chi_Minh`:

| Thời điểm | Việc |
|---|---|
| Thứ Hai 07:00 | Câu hỏi mới `SCHEDULED → OPEN`. Gửi NT-Q01 |
| Chủ Nhật 20:00 | Gửi NT-Q06 nhắc câu hỏi sắp đóng (chỉ người chưa trả lời) |
| Chủ Nhật 23:59 | `OPEN → CLOSED` |
| Thứ Ba 09:00 tuần sau | Bài tổng hợp lên sóng. `CLOSED → SUMMARIZED`. Gửi NT-Q03 |

**BR-Q01 — Chỉ một câu hỏi `OPEN` tại một thời điểm.** Nếu vì lý do vận hành mà câu hỏi mới chưa sẵn sàng, câu hỏi cũ **được gia hạn**, không để trống. Trang trống là tín hiệu sản phẩm bị bỏ rơi.

**BR-Q02 — Ban biên tập chọn câu hỏi.** Cần guideline chọn câu hỏi, tối thiểu:

- Có ít nhất hai luồng ý kiến hợp lý — nếu câu trả lời chỉ có một hướng thì không phải câu hỏi tranh luận
- Liên quan trải nghiệm sống của người đọc, trả lời được không cần chuyên môn sâu
- **Không** chọn chủ đề chính trị nhạy cảm, tôn giáo, dân tộc, hoặc vấn đề đang trong quá trình tố tụng
- Không hỏi về cá nhân cụ thể

Ví dụ hợp: *"Bạn có cho con học thêm không? Vì sao?"* · *"Về nước làm việc sau khi học ở nước ngoài — bạn thấy đó là bước tiến hay bước lùi?"* · *"Bạn có tin giá nhà Hà Nội đã chạm đỉnh?"*

---

## 5. LUỒNG NGHIỆP VỤ

### 5.1 Người dùng trả lời

```
Xem câu hỏi
    │
    ├─ Chưa đăng nhập ──► Login/OTP theo flow hiện tại ──┐
    │                                                     │
    └─ Đã đăng nhập ◄─────────────────────────────────────┘
           │
           ▼
    Mở composer, nhập 200–800 ký tự
           │
           ▼
    Bấm "Gửi câu trả lời"
           │
           ▼
    LỌC TỰ ĐỘNG (mục 6) — mục tiêu < 3 giây
           │
     ┌─────┼─────────────────┐
     ▼     ▼                 ▼
 BLOCKED  AUTO_HELD       VISIBLE
     │     │                 │
     │     │                 └─► Hiện ngay trong danh sách
     │     └─► "Đang được rà soát, thường trong 2 giờ"
     └─► Thông báo lý do, cho sửa và gửi lại
```

### 5.2 Báo cáo và hậu kiểm

```
User bấm Báo cáo ──► report_count += 1
                          │
                    Đạt ngưỡng 3 báo cáo độc lập
                          │
                          ▼
                  VISIBLE → HIDDEN_REPORTED (tự động, ngay)
                          │
                    Vào hàng đợi CMS, ưu tiên cao, SLA 4 giờ
                          │
                    ┌─────┴─────┐
                    ▼           ▼
              Khôi phục     Giữ ẩn (REMOVED)
              → VISIBLE     → NT-Q02 tới tác giả
```

**BR-Q03 — Ẩn trước, xét sau.** Đạt ngưỡng báo cáo thì ẩn ngay, không chờ người xem. Đây là cái giá của mô hình hậu kiểm và là điều kiện để nó chấp nhận được về rủi ro.

**BR-Q04 — Chống lạm dụng báo cáo.** Chỉ tính báo cáo từ các tài khoản khác nhau, mỗi tài khoản 1 lần/câu trả lời. Tài khoản báo cáo sai nhiều lần bị giảm trọng số.

### 5.3 Mời phát triển thành bài đầy đủ

Đây là **điểm nối quan trọng nhất của tính năng**, đừng cắt để tiết kiệm effort.

Khi câu trả lời đạt điều kiện — được ghim, được chọn vào bài tổng hợp, hoặc `agree_count` vượt ngưỡng — hiển thị cho tác giả:

> **Bạn có muốn phát triển ý này thành một bài đầy đủ?**
> Góc nhìn của bạn đang được nhiều người đồng tình.
> `Để sau` · **Viết bài**

Bấm **Viết bài** → mở màn viết bài với `content` của câu trả lời đã điền sẵn vào phần nội dung, chủ đề gợi ý theo câu hỏi. Từ đây đi đúng luồng bài viết hiện tại, không cần cơ chế mới.

---

## 6. LỌC TỰ ĐỘNG BA TẦNG

**BR-Q05 — Mọi câu trả lời phải qua lọc trước khi hiển thị.** Không có đường tắt, kể cả cho tài khoản cấp cao.

### Tầng 1 — Chặn cứng → `BLOCKED`

Không hiển thị dưới bất kỳ hình thức nào, thông báo lý do cho tác giả:

- Từ khoá cấm: chính trị chống nhà nước, khiêu dâm, chất cấm, cờ bạc, vũ khí, đa cấp tài chính
- **Số điện thoại, email, link ngoài** — chặn cứng ở v1 để triệt quảng cáo trá hình
- Nội dung dưới 200 ký tự sau khi bỏ khoảng trắng
- Trùng lặp: giống ≥90% một câu trả lời đã có, hoặc giống câu trả lời của chính user ở câu hỏi khác

### Tầng 2 — Gắn cờ → `AUTO_HELD`, chờ người xem

Hiển thị cho tác giả trạng thái "đang rà soát", SLA 2 giờ:

- Phân loại AI cho điểm rủi ro ở mức trung bình
- Có yếu tố công kích cá nhân, ngôn từ thô
- Tài khoản tạo dưới 24 giờ (mọi câu trả lời đầu tiên đều qua tầng này)
- Tài khoản đang có cảnh báo vi phạm chưa hết hiệu lực
- Nhắc tên riêng của người thật cùng với đánh giá tiêu cực

### Tầng 3 — Cho qua → `VISIBLE`

Hiển thị ngay, vẫn nằm trong diện hậu kiểm và có thể bị báo cáo.

**BR-Q06 — Lọc lỗi thì giữ, không cho qua.** Nếu service lọc timeout hoặc lỗi, câu trả lời vào `AUTO_HELD`, không mặc định `VISIBLE`.

---

## 7. MÀN HÌNH & UI

### 7.1 Điểm vào

| Vị trí | Thể hiện |
|---|---|
| Trang chủ | Khối riêng đặt **trên** feed chính: câu hỏi + số người đã trả lời + CTA. Đây là vị trí quan trọng, không đặt xuống dưới |
| Header/nav | Không thêm mục nav mới — trang chủ đã quá tải 8 chuyên mục |
| Trang cá nhân | Tab mới "Câu trả lời của tôi" trong khu vực riêng tư |
| Thông báo | NT-Q01 mỗi Thứ Hai |
| Bài tổng hợp | Cuối bài có CTA về câu hỏi tuần hiện tại |

### 7.2 Màn Câu hỏi tuần

Khối câu hỏi:
- Nhãn `CÂU HỎI TUẦN NÀY`
- Tiêu đề câu hỏi
- Đoạn dẫn nhập
- `N người đã trả lời` · `Còn X ngày`
- CTA chính: **Viết câu trả lời của bạn**

Danh sách câu trả lời:
- Sắp xếp: `Mới nhất` (mặc định) · `Được đồng tình nhiều` · `Ban biên tập chọn`
- Câu trả lời được ghim hiện đầu tiên, có nhãn `Ban biên tập chọn`
- Mỗi card: avatar, tên hiển thị, dòng chuyên môn (nếu có), thời gian, nội dung, nút `Đồng tình` + số, menu `Báo cáo`
- Phân trang 20 item, tải thêm

**BR-Q07 — Không cho trả lời ẩn danh.** Câu trả lời luôn gắn tên hiển thị thật của tài khoản. Ẩn danh làm sụp định vị chất lượng và khiến hậu kiểm khó hơn nhiều.

**BR-Q08 — Không có threading ở v1.** Không trả lời lồng nhau giữa các câu trả lời. Nếu muốn tranh luận sâu thì viết bài đầy đủ — đó chính là bậc thang ta muốn đẩy người dùng lên.

### 7.3 Composer

- Textarea, đếm ký tự `240 / 800`, tối thiểu 200
- Nút gửi disabled dưới 200 ký tự
- Dòng nhắc dưới composer: *"Câu trả lời của bạn sẽ hiện công khai với tên {tên hiển thị}. Hãy viết bằng trải nghiệm của bạn."*
- Không có toolbar định dạng, không upload ảnh
- Tự lưu nháp local, không mất khi thoát giữa lúc viết

### 7.4 Sau khi gửi

| Kết quả | Hiển thị |
|---|---|
| `VISIBLE` | Cuộn tới câu trả lời của mình, highlight nhẹ. Toast: *"Câu trả lời của bạn đã hiện trên trang."* |
| `AUTO_HELD` | Card riêng ở đầu danh sách, chỉ mình thấy: *"Câu trả lời của bạn đang được rà soát, thường trong 2 giờ."* |
| `BLOCKED` | Giữ nội dung trong composer, hiện lý do cụ thể, cho sửa và gửi lại |

Copy khi `BLOCKED` phải nêu được lý do hành động, tuân thủ BR-N01 của spec thông báo (không dùng từ vựng hậu trường):

- Có link/số điện thoại: *"Câu trả lời không được chứa liên kết hoặc số điện thoại."*
- Quá ngắn: *"Câu trả lời cần ít nhất 200 ký tự để người khác hiểu được góc nhìn của bạn."*
- Từ khoá cấm: *"Câu trả lời chưa phù hợp với Tiêu chuẩn cộng đồng."* + link tiêu chuẩn

### 7.5 Empty state

Chưa có câu trả lời nào:
> **Chưa ai trả lời câu hỏi này**
> Hãy là người đầu tiên chia sẻ góc nhìn của bạn.
> **Viết câu trả lời**

### 7.6 Câu hỏi đã đóng

- Ẩn composer, hiện: *"Câu hỏi này đã đóng. Xem câu hỏi tuần này →"*
- Nếu đã có bài tổng hợp: khối nổi bật dẫn tới bài
- Trang lưu trữ `/cau-hoi-tuan` liệt kê các câu hỏi cũ

---

## 8. CMS

Thêm menu **"Câu hỏi tuần"** trong nhóm Bài viết, tin tức. Hai tab:

### 8.1 Tab Quản lý câu hỏi

- Danh sách theo trạng thái, CTA **Tạo câu hỏi mới**
- Form: tiêu đề, dẫn nhập, ảnh, `opens_at`, `closes_at`
- Hành động: Lưu nháp · Lên lịch · Gia hạn · Đóng sớm · Gắn bài tổng hợp

### 8.2 Tab Kiểm duyệt câu trả lời

- Filter: `Chờ xử lý` (AUTO_HELD + HIDDEN_REPORTED) · `Đang hiện` · `Đã ẩn`
- **Tab "Chờ xử lý" là mặc định**, có badge số lượng
- Sắp xếp mặc định: cũ nhất trước, để không bỏ sót
- Mỗi dòng: nội dung, tác giả (tên + SĐT ẩn một phần), thời gian, `filter_result`, số báo cáo
- Hành động đơn: `Cho hiện` · `Ẩn` · `Ghim` · `Chọn vào bài tổng hợp`
- Hành động hàng loạt: chọn nhiều → `Cho hiện` / `Ẩn`
- Hành động khẩn: **`Ẩn toàn bộ câu trả lời của tài khoản này`** và **`Khoá tài khoản`**

**BR-Q09 — Phân quyền.** BTV: xem, cho hiện, ẩn, ghim, chọn vào tổng hợp. Thư ký biên tập: thêm quyền khoá tài khoản và ẩn hàng loạt. Enforce ở backend, không chỉ ẩn nút — theo BR-02 của Doc 1.

**BR-Q10 — Audit log.** Mọi hành động ẩn/hiện lưu `actor_id`, `action`, `reason`, `timestamp`. Bắt buộc theo nghĩa vụ lưu trữ.

---

## 9. THÔNG BÁO — NHÓM MỚI NT-Q

Bổ sung vào `[Feature Spec] Luồng thông báo GNM`. Nhóm Q chịu rule tắt của nhóm C, trừ NT-Q02 thuộc nhóm A.

| Mã | Trigger | Kênh | Copy | Rule |
|---|---|---|---|---|
| **NT-Q01** | Câu hỏi mới mở | In-app, Push | Câu hỏi tuần này: *{Tiêu đề}* | 1 lần/tuần, tắt được |
| **NT-Q02** | Câu trả lời bị ẩn | In-app, Push | Câu trả lời của bạn đã được ẩn — *{lý do}* | Không tắt được |
| **NT-Q03** | Được chọn vào bài tổng hợp | In-app, Push, Email | Góc nhìn của bạn có trong bài tổng hợp tuần này 🎉 | Không gộp |
| **NT-Q04** | Được mời phát triển thành bài | In-app, Push | Bạn có muốn phát triển góc nhìn này thành một bài đầy đủ? | 1 lần/câu trả lời |
| **NT-Q05** | Có người đồng tình | In-app, Push | *{N} người đồng tình với câu trả lời của bạn* | Gộp, ngưỡng 5/25/100 |
| **NT-Q06** | Câu hỏi sắp đóng | Push | Còn 3 giờ để trả lời câu hỏi tuần này | Chỉ gửi cho người **chưa** trả lời, tắt được |

**NT-Q03 là thông báo có giá trị chuyển đổi cao nhất trong nhóm.** Nó là lần đầu người dùng thấy chữ của mình được GNM chọn — thời điểm tốt nhất để mời họ viết bài đầy đủ. Nên gửi NT-Q04 ngay sau NT-Q03.

---

## 10. BUSINESS RULES TỔNG HỢP

| Mã | Rule |
|---|---|
| **BR-Q11** | Mỗi user **1 câu trả lời/câu hỏi**. Không cho gửi thêm |
| **BR-Q12** | Được **sửa trong 30 phút** sau khi gửi. Mỗi lần sửa chạy lại lọc tự động. Sau 30 phút không sửa được |
| **BR-Q13** | Được **xoá câu trả lời của mình** bất cứ lúc nào. Xoá = ẩn khỏi công khai, bản ghi vẫn lưu theo nghĩa vụ log |
| **BR-Q14** | Câu trả lời **không tính** vào `daily_submission_limit` của bài viết |
| **BR-Q15** | Giới hạn riêng chống spam: tối đa **10 lần gửi câu trả lời/ngày/tài khoản** tính cả lần bị `BLOCKED` |
| **BR-Q16** | Không được `Đồng tình` với câu trả lời của chính mình |
| **BR-Q17** | Tài khoản bị khoá → toàn bộ câu trả lời chuyển `REMOVED` |
| **BR-Q18** | `answer_count` chỉ đếm `VISIBLE`. Không hiển thị số bao gồm câu trả lời đang ẩn |
| **BR-Q19** | Câu trả lời không index cho SEO ở v1 (giảm bề mặt rủi ro của mô hình hậu kiểm) |
| **BR-Q20** | Bài tổng hợp phải ghi rõ tên người trả lời và **không** được sửa nội dung câu trả lời quá mức làm sai ý. Nếu cần biên tập, phải xin xác nhận tác giả |

---

## 11. EDGE CASES

| Ca | Xử lý |
|---|---|
| User trả lời rồi câu hỏi đóng trước khi lọc xong | Vẫn xử lý bình thường, câu trả lời hiện sau khi đóng |
| Câu hỏi đóng lúc user đang viết | Hiện cảnh báo, cho gửi trong 5 phút grace, sau đó lưu nháp local và gợi ý câu hỏi kế tiếp |
| User xoá câu trả lời đã được chọn vào bài tổng hợp | Nếu bài tổng hợp **chưa** đăng: loại khỏi bài. Nếu **đã** đăng: giữ trong bài, thông báo cho Thư ký xử lý |
| Câu trả lời bị ẩn sau khi đã có nhiều Đồng tình | Ẩn bình thường, `agree_count` giữ nguyên để phục hồi được nếu khôi phục |
| Tài khoản mới tạo trả lời ngay | Vào `AUTO_HELD` theo tầng 2, SLA 2 giờ |
| Toàn bộ câu trả lời của một câu hỏi bị `BLOCKED` (câu hỏi chọn sai) | CMS cảnh báo khi tỷ lệ `BLOCKED` > 30%, đề xuất đóng sớm và đổi câu hỏi |
| Không có câu hỏi mới đúng Thứ Hai | Gia hạn câu hỏi cũ theo BR-Q01, không để trang trống |
| Lượng câu trả lời tăng bất thường trong thời gian ngắn | Cảnh báo CMS, có thể tạm chuyển toàn bộ về `AUTO_HELD` (kill switch) |
| User bị chặn bởi tác giả câu trả lời | Không áp dụng — đây là không gian công khai, không có quan hệ chặn ở phạm vi câu hỏi tuần |

**Kill switch (BR-Q21):** cần một cờ config cho phép Thư ký biên tập chuyển **toàn bộ câu trả lời mới sang `AUTO_HELD`** trong một hành động. Đây là phương án dự phòng khi có sự cố hoặc chủ đề bùng phát ngoài dự kiến. Với mô hình hậu kiểm, đây là hạng mục bắt buộc.

---

## 12. ACCEPTANCE CRITERIA

### AC-Q01 — Hiển thị câu hỏi
**Given** có câu hỏi ở trạng thái `OPEN`
**Then** trang chủ hiển thị khối câu hỏi tuần phía trên feed chính, kèm số người đã trả lời và số ngày còn lại.

### AC-Q02 — Yêu cầu đăng nhập
**Given** user chưa đăng nhập
**When** bấm Viết câu trả lời
**Then** hiện login/OTP theo flow hiện tại; sau khi xác minh thành công, quay lại đúng composer với nội dung đã nhập (nếu có).

### AC-Q03 — Giới hạn độ dài
**Given** user nhập dưới 200 ký tự
**Then** nút gửi ở trạng thái disabled và hiện số ký tự còn thiếu.

### AC-Q04 — Hiển thị ngay
**Given** câu trả lời qua lọc tầng 3
**When** user gửi
**Then** câu trả lời xuất hiện trong danh sách công khai trong vòng 3 giây, không cần người duyệt.

### AC-Q05 — Chặn cứng
**Given** câu trả lời chứa số điện thoại, email hoặc link ngoài
**Then** hệ thống không tạo record `VISIBLE`, giữ nội dung trong composer và hiện lý do cụ thể.

### AC-Q06 — Gắn cờ
**Given** tài khoản tạo dưới 24 giờ
**When** gửi câu trả lời
**Then** câu trả lời vào `AUTO_HELD`, chỉ tác giả thấy, kèm thông báo thời gian rà soát dự kiến.

### AC-Q07 — Lọc lỗi
**Given** service lọc tự động timeout
**Then** câu trả lời vào `AUTO_HELD`, **không** vào `VISIBLE`.

### AC-Q08 — Một câu trả lời mỗi người
**Given** user đã có câu trả lời cho câu hỏi này
**Then** composer không mở, hiện câu trả lời hiện tại kèm tuỳ chọn sửa (nếu còn trong 30 phút) hoặc xoá.

### AC-Q09 — Sửa chạy lại lọc
**Given** user sửa câu trả lời trong 30 phút
**Then** nội dung mới đi qua lọc tự động lại từ đầu.

### AC-Q10 — Báo cáo tự ẩn
**Given** một câu trả lời nhận báo cáo từ 3 tài khoản khác nhau
**Then** hệ thống chuyển ngay sang `HIDDEN_REPORTED` và đưa vào hàng đợi CMS ưu tiên cao, không chờ người xử lý.

### AC-Q11 — Không tính quota bài viết
**Given** user đã gửi 5 bài viết trong ngày (đạt `daily_submission_limit`)
**Then** user vẫn trả lời được câu hỏi tuần.

### AC-Q12 — Đóng câu hỏi
**Given** đã qua `closes_at`
**Then** composer bị ẩn, danh sách câu trả lời vẫn đọc được, và hiện link tới câu hỏi tuần hiện tại.

### AC-Q13 — Số đếm chính xác
**Given** có câu trả lời ở `AUTO_HELD`, `HIDDEN_REPORTED`, `REMOVED`
**Then** `answer_count` hiển thị công khai chỉ đếm `VISIBLE`.

### AC-Q14 — Khoá tài khoản
**When** Thư ký biên tập khoá một tài khoản
**Then** toàn bộ câu trả lời của tài khoản đó chuyển `REMOVED` trong cùng một hành động.

### AC-Q15 — Kill switch
**When** Thư ký biên tập bật cờ rà soát toàn bộ
**Then** mọi câu trả lời mới vào `AUTO_HELD` bất kể kết quả lọc tầng 3.

### AC-Q16 — Mời viết bài
**Given** câu trả lời được chọn vào bài tổng hợp
**Then** gửi NT-Q03 rồi NT-Q04, và CTA Viết bài mở màn viết bài với nội dung câu trả lời điền sẵn.

### AC-Q17 — Audit
**Given** BTV hoặc Thư ký thực hiện bất kỳ hành động ẩn/hiện
**Then** hệ thống lưu người thực hiện, hành động, lý do và thời điểm.

---

## 13. METRIC

**Chỉ số quyết định (đo hàng tuần):**

| Chỉ số | Ý nghĩa |
|---|---|
| Số người trả lời/tuần | Sức sống của tính năng |
| **Tỷ lệ người trả lời → gửi bài viết đầy đủ trong 30 ngày** | **North star.** Đo đúng lý do tính năng tồn tại |
| Tỷ lệ người đọc câu hỏi → trả lời | Hiệu quả của composer và copy |
| Tỷ lệ người trả lời tuần này cũng trả lời tuần trước | Tính năng có thành thói quen hay không |

**Chỉ số vận hành & an toàn:**

| Chỉ số | Ngưỡng cảnh báo |
|---|---|
| Tỷ lệ `BLOCKED` / tổng lượt gửi | > 15% → câu hỏi chọn sai hoặc lọc quá chặt |
| Tỷ lệ `AUTO_HELD` | > 25% → lọc quá chặt, đang tạo tải cho BTV |
| Thời gian xử lý `AUTO_HELD` | p90 > 2 giờ → không giữ được cam kết với user |
| Số câu trả lời bị ẩn sau khi đã hiện công khai | Đo trực tiếp rủi ro của mô hình hậu kiểm |
| Thời gian từ báo cáo đến khi xử lý | p90 > 4 giờ |

**Chỉ số cuối cùng quan trọng hơn tất cả những chỉ số tăng trưởng ở trên.** Nếu nó tăng, phải cân nhắc siết lọc hoặc chuyển một phần sang tiền kiểm.

---

## 14. CẦN CHỐT

| # | Câu hỏi | Ảnh hưởng |
|---|---|---|
| 1 | Pháp chế NetSpace xác nhận mô hình hậu kiểm và thời hạn xử lý nội dung bị báo cáo | Chặn release |
| 2 | Ai trực xử lý `AUTO_HELD` với SLA 2 giờ, kể cả cuối tuần? | Nếu không có người trực, SLA phải nới hoặc bỏ tầng 2 |
| 3 | Ai viết bài tổng hợp mỗi tuần và mất bao nhiêu công? | Đây là công việc mới đều đặn cho toà soạn |
| 4 | Dùng service lọc nội dung nào? Tự xây hay mua? | Quyết định effort và độ tin cậy của PRE-01 |
| 5 | Trang Tiêu chuẩn cộng đồng đã có nội dung chưa? | PRE-04, chặn release |
| 6 | Ngưỡng "sửa quá mức" ở BR-Q20 định lượng thế nào? | Ảnh hưởng luồng làm bài tổng hợp |
