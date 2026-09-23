# [Feature Spec] Luồng thông báo GNM

## Mục tiêu

Định nghĩa toàn bộ hệ thống thông báo của Góc Nhìn Mới cho cả hai phía:

- **Phía user (mặt tiền MXH)** — thông báo trạng thái bài viết, tương tác xã hội, nội dung và tài khoản
- **Phía CMS (hậu trường toà soạn)** — thông báo hàng đợi, SLA, yêu cầu từ tác giả, sự cố

Hai mục tiêu nghiệp vụ chính:

1. **Không rò hậu trường.** Người dùng phải cảm nhận đang dùng một MXH, không phải gửi bài cho toà soạn. Mọi copy thông báo phải tuân thủ quy tắc từ vựng ở mục 3.1.
2. **Không im lặng.** Mỗi lần trạng thái bài thay đổi mà user không được thông báo là một lần user mất niềm tin. Đây là nguyên nhân trực tiếp khiến người viết không quay lại.

---

## 1. PHẠM VI

**In Scope**

- Catalog sự kiện thông báo phía user (nhóm A–D)
- Catalog sự kiện thông báo phía CMS (nhóm E)
- Ma trận kênh gửi (In-app / Push / Email / SMS)
- Business rule: gộp, trần số lượng, giờ im lặng, dedup, idempotency
- UX writing chuẩn cho từng sự kiện
- Màn hình Trung tâm thông báo và Cài đặt thông báo
- Edge case và xử lý xung đột
- Acceptance Criteria

**Out of Scope**

- OTP đăng nhập / xác minh số điện thoại (thuộc luồng auth, không đi qua hệ notification)
- Nội dung email marketing, newsletter thương mại
- Thông báo hệ thống bảo trì (thuộc vận hành hạ tầng)
- Tin nhắn riêng giữa user với user (chưa có trong sản phẩm)

---

## 2. KIẾN TRÚC THÔNG BÁO

### 2.1 Bốn kênh

| Kênh | Dùng cho | Ghi chú |
|---|---|---|
| **In-app** | Mọi sự kiện | Kênh gốc. Luôn ghi nhận, kể cả khi user tắt push |
| **Push** | Sự kiện cần kéo user về | Chỉ khi có app. Chịu trần số lượng và giờ im lặng |
| **Email** | Sự kiện quan trọng, cần lưu vết | Chỉ nhóm A, D và digest |
| **SMS** | Chỉ sự cố bảo mật tài khoản | Tốn phí, không dùng cho nghiệp vụ nội dung |

**Nguyên tắc:** In-app là nguồn sự thật. Push/Email chỉ là kênh phân phối lại. Không được có sự kiện nào chỉ tồn tại ở push mà không có bản ghi in-app.

### 2.2 Năm nhóm thông báo

| Nhóm | Tên | Bản chất | User tắt được? |
|---|---|---|---|
| **A** | Trạng thái bài viết | Transactional | Tắt được push/email, **không tắt được in-app** |
| **B** | Tương tác xã hội | Engagement | Tắt được toàn bộ |
| **C** | Nội dung & đề xuất | Discovery | Tắt được toàn bộ |
| **D** | Tài khoản & an toàn | Bắt buộc | **Không tắt được** |
| **E** | Vận hành CMS | Nội bộ | Cấu hình theo role |

---

## 3. QUY TẮC NỘI DUNG

### 3.1 BR-N01 — Từ vựng cấm ở mọi copy phía user

Các từ sau **không được xuất hiện** trong bất kỳ thông báo, email hay màn hình nào phía user:

> Ban biên tập · Biên tập viên · BTV · Thư ký biên tập · Toà soạn · Duyệt bài · Gửi biên tập · Từ chối · Trả bài · Tiêu chí của GNM

Bảng thay thế:

| Không dùng | Dùng |
|---|---|
| Đã gửi Ban biên tập | Đã gửi · thường lên sóng trong 24 giờ |
| Bài đang được xem xét / duyệt | Đang chờ lên sóng |
| Bài viết bị từ chối | Bài viết cần bổ sung trước khi lên sóng |
| Chưa phù hợp với tiêu chí của GNM | Cần bổ sung theo tiêu chuẩn cộng đồng |
| Bài đã được duyệt | *(không thông báo — xem BR-N02)* |
| Đội ngũ GNM sẽ điều chỉnh nội dung | Bài viết sẽ được rà soát để đảm bảo tiêu chuẩn cộng đồng |

### 3.2 BR-N02 — Không thông báo trạng thái trung gian

**Không gửi thông báo** cho các chuyển trạng thái nội bộ sau:

- `SUBMITTED → IN_REVIEW`
- `IN_REVIEW → READY_TO_PUBLISH`

Lý do: đây là các bước trong bộ máy biên tập. Thông báo chúng vừa rò hậu trường, vừa tạo cảm giác quy trình dài, vừa làm loãng thông báo quan trọng thật (bài lên sóng).

> **Lưu ý so với Doc 2:** Doc 2 hiện có notification *"Bài viết đang được xem xét — Đội ngũ GNM đang xem nội dung bạn đã gửi"* và *"Bài viết của bạn đã được duyệt 🎉"*. **Cả hai phải bỏ.** Notification "đã được duyệt" đặc biệt có hại: user nhận tin vui rồi phải chờ tiếp đến lúc thật sự lên sóng, tạo hai lần kỳ vọng cho một kết quả.

### 3.3 BR-N03 — Thay trạng thái bằng thời gian

Mọi thông báo về việc chờ đợi phải kèm **mốc thời gian dự kiến**, không chỉ nêu trạng thái.

- Sai: "Bài viết đang được xem xét."
- Đúng: "Bài thường lên sóng trong vòng 24 giờ."

Giá trị SLA lấy từ config `publishing_sla_hours`, mặc định `24`.

### 3.4 BR-N04 — Không lộ nội dung nhạy cảm ở lock screen

Push của nhóm D (cảnh báo vi phạm, hạn chế tài khoản) chỉ hiện tiêu đề trung tính, chi tiết nằm trong app.

- Push: "Bạn có một thông báo quan trọng về tài khoản"
- Trong app: nội dung đầy đủ

### 3.5 BR-N05 — Mọi thông báo phải có deep link

Không tồn tại thông báo chết. Mỗi sự kiện phải khai báo đích đến cụ thể (bài viết, tab trong Bài viết của tôi, cài đặt, trang hỗ trợ). Nếu đối tượng đích đã bị xoá/ẩn, dẫn tới màn trạng thái tương ứng — xem mục 7.

---

## 4. CATALOG SỰ KIỆN — PHÍA USER

### 4.1 Nhóm A — Trạng thái bài viết

| Mã | Trigger | Kênh | Tiêu đề | Nội dung | Deep link |
|---|---|---|---|---|---|
| **NT-A01** | `DRAFT → SUBMITTED` | In-app, Push | Bài viết của bạn đã được gửi | Bài thường lên sóng trong vòng 24 giờ. Chúng tôi sẽ thông báo ngay khi có cập nhật. | Chi tiết bài trong *Bài viết của tôi* |
| **NT-A02** | `→ PUBLISHED` | In-app, Push, Email | Góc nhìn của bạn đã lên sóng 🎉 | *{Tiêu đề bài}* đã xuất hiện trên Góc Nhìn Mới. | Bài đã đăng (kèm CTA Chia sẻ) |
| **NT-A03** | `→ REJECTED` | In-app, Push, Email | Bài viết cần bổ sung trước khi lên sóng | *{Lý do cụ thể}*. Bạn có thể chỉnh sửa và gửi lại. | Màn chỉnh sửa bài, panel phản hồi mở sẵn |
| **NT-A04** | Quá `publishing_sla_hours` mà chưa có kết quả | In-app, Push | Bài của bạn cần thêm thời gian rà soát | Chúng tôi đang xem kỹ hơn nội dung này. Bạn sẽ nhận thông báo trong vòng 24 giờ tới. | Chi tiết bài |
| **NT-A05** | `PUBLISHED → UNPUBLISHED` (GNM gỡ) | In-app, Push, Email | Bài viết đã được ẩn khỏi Góc Nhìn Mới | *{Lý do}*. Nếu bạn cho rằng đây là nhầm lẫn, hãy liên hệ với chúng tôi. | Chi tiết bài + CTA Liên hệ hỗ trợ |
| **NT-A06** | Bài được đăng sau khi BTV sửa vượt ngưỡng | In-app | Bài viết đã được rà soát và chỉnh sửa | Nội dung được điều chỉnh để đảm bảo tiêu chuẩn cộng đồng. Bạn có thể xem lại bản bạn đã gửi. | So sánh bản gốc ↔ bản đã đăng |
| **NT-A07** | Thu hồi thành công | In-app | Bài viết đã được thu hồi | Bài đã quay về Bản nháp. Bạn có thể chỉnh sửa và gửi lại bất cứ lúc nào. | Bản nháp |
| **NT-A08** | Yêu cầu thu hồi được chấp nhận | In-app, Push | Yêu cầu thu hồi đã được xử lý | Bài đã quay về Bản nháp của bạn. | Bản nháp |
| **NT-A09** | Yêu cầu thu hồi bị từ chối | In-app, Push, Email | Chưa thể thu hồi bài viết này | *{Lý do}*. Bạn có thể liên hệ với chúng tôi để được hỗ trợ. | Chi tiết bài + CTA Liên hệ |
| **NT-A10** | Race: publish thắng withdrawal | In-app, Push, Email | Bài viết đã lên sóng trước khi yêu cầu được xử lý | Nếu bạn vẫn muốn ẩn bài, hãy gửi yêu cầu gỡ bài. | Bài đã đăng + CTA Yêu cầu gỡ bài |
| **NT-A11** | Yêu cầu gỡ bài đã đăng được xử lý | In-app, Push | Bài viết đã được ẩn theo yêu cầu của bạn | Bài không còn hiển thị công khai trên Góc Nhìn Mới. | *Bài viết của tôi* |
| **NT-A12** | Bản nháp không hoạt động 3 ngày | In-app | Bạn có một bản nháp đang chờ | *{Tiêu đề}* — cập nhật lần cuối {ngày}. | Màn viết bài |

**NT-A12** thuộc nhóm A về nội dung nhưng chịu rule tắt của nhóm C (nurture, không phải transactional).

**Không gửi push cho:** NT-A06, NT-A07, NT-A12 — đây là thông tin bổ trợ, user sẽ thấy khi mở app.

### 4.2 Nhóm B — Tương tác xã hội

| Mã | Trigger | Kênh | Copy | Rule gộp |
|---|---|---|---|---|
| **NT-B01** | Bình luận mới trên bài của bạn | In-app, Push | *{Tên}* đã bình luận bài *{Tiêu đề}* → gộp: *{Tên} và N người khác đã bình luận…* | Cửa sổ 30 phút, gộp theo bài |
| **NT-B02** | Trả lời bình luận của bạn | In-app, Push | *{Tên}* đã trả lời bình luận của bạn | Cửa sổ 30 phút, gộp theo luồng |
| **NT-B03** | Lượt thích bài viết | In-app, Push | *{Tên} và N người khác đã thích bài {Tiêu đề}* | **Không thông báo lượt thích đơn lẻ.** Ngưỡng: 5, 25, 100, 500, 1K, 5K, 10K |
| **NT-B04** | Người theo dõi mới | In-app, Push | *N người đã theo dõi bạn hôm nay* | Gộp theo ngày, gửi 1 lần/ngày |
| **NT-B05** | Được @mention | In-app, Push | *{Tên}* đã nhắc đến bạn trong *{Tiêu đề}* | Không gộp |
| **NT-B06** | Bài đạt mốc lượt xem | In-app, Push | Bài *{Tiêu đề}* đã đạt {N} lượt xem 🎉 | Mốc: 100, 1K, 10K, 100K |
| **NT-B07** | Vào Tác giả nổi bật trong tuần | In-app, Push, Email | Bạn có tên trong Tác giả nổi bật tuần này | 1 lần/tuần |

**NT-B06 và NT-B07 là hai thông báo có giá trị giữ người viết cao nhất.** Chúng đóng vòng lặp "viết → được đọc → được ghi nhận" mà mô hình tiền kiểm đang làm yếu. Không nên cắt để tiết kiệm effort.

### 4.3 Nhóm C — Nội dung & đề xuất

| Mã | Trigger | Kênh | Copy | Rule |
|---|---|---|---|---|
| **NT-C01** | Người đang theo dõi có bài mới | In-app, Push | *{Tên}* vừa đăng *{Tiêu đề}* | Tối đa **1 lần/ngày/tác giả**, trần 3 lần/ngày toàn bộ |
| **NT-C02** | Bài mới trong chủ đề đang theo dõi | In-app | N bài mới trong *{Chủ đề}* | 1 lần/ngày |
| **NT-C03** | Bản tin tổng hợp | Email | Góc nhìn nổi bật tuần này | 1 lần/tuần, giờ cố định |
| **NT-C04** | Không hoạt động 7 ngày | Push | Có {N} góc nhìn mới bạn chưa đọc | Tối đa 1 lần/tuần, dừng sau 3 lần không phản hồi |

### 4.4 Nhóm D — Tài khoản & an toàn

| Mã | Trigger | Kênh | Copy | Tắt được |
|---|---|---|---|---|
| **NT-D01** | Đăng nhập thiết bị mới | In-app, Push, Email | Có phiên đăng nhập mới từ {thiết bị, khu vực} | Không |
| **NT-D02** | Cảnh báo vi phạm lần 1/2 | In-app, Push, Email | Nội dung của bạn chưa tuân thủ tiêu chuẩn cộng đồng | Không |
| **NT-D03** | Lên cấp tài khoản | In-app, Push | Bài viết của bạn giờ lên sóng nhanh hơn | Không |
| **NT-D04** | Tụt cấp tài khoản | In-app, Email | Có thay đổi về quyền đăng bài của bạn | Không |
| **NT-D05** | Tài khoản bị hạn chế/khoá | In-app, Email, SMS | Tài khoản của bạn đã bị tạm hạn chế | Không |
| **NT-D06** | Bút danh bị yêu cầu đổi | In-app, Push, Email | Cần cập nhật bút danh của bạn | Không |

**NT-D03** là đòn động lực quan trọng: khi user lên cấp và bài được lên nhanh hơn, phải nói cho họ biết. Nếu không, họ không nhận ra mình đã được tin cậy.

---

## 5. CATALOG SỰ KIỆN — PHÍA CMS (Nhóm E)

Thông báo CMS gửi tới role tương ứng, hiển thị dạng badge + danh sách trong CMS, tuỳ chọn email cho sự kiện ưu tiên cao.

| Mã | Trigger | Người nhận | Ưu tiên | Rule |
|---|---|---|---|---|
| **NT-E01** | Bài mới vào hàng đợi | BTV | Thường | **Không thông báo từng bài.** Dùng badge số lượng. Email tổng hợp đầu mỗi ca làm việc |
| **NT-E02** | Bài tồn > 8 giờ | BTV phụ trách | Cao | Nhắc lại mỗi 4 giờ |
| **NT-E03** | Bài tồn > `publishing_sla_hours` | Thư ký + Trưởng nhóm | Rất cao | Escalate, kèm trigger NT-A04 phía user |
| **NT-E04** | `→ READY_TO_PUBLISH` | Thư ký biên tập | Thường | Badge |
| **NT-E05** | Yêu cầu thu hồi từ tác giả | Thư ký biên tập | **Rất cao** | Đồng thời khoá nút Xuất bản của bài. SLA 4 giờ |
| **NT-E06** | Yêu cầu gỡ bài đã đăng | Thư ký biên tập | Cao | SLA 24 giờ |
| **NT-E07** | Bài bị lọc tự động gắn cờ rủi ro cao | BTV + Thư ký | **Rất cao** | Không cho lên sóng dưới mọi hình thức trước khi có người xử lý |
| **NT-E08** | Bài bị report vượt ngưỡng | Thư ký biên tập | **Rất cao** | Tự động ẩn tạm, đẩy đầu hàng đợi |
| **NT-E09** | Tác giả gửi lại bài sau chỉnh sửa | BTV đã xử lý lần trước | Thường | Kèm badge "Gửi lại lần thứ N" |
| **NT-E10** | Một tài khoản bị gắn cờ nhiều lần trong 24h | Thư ký + Admin | Cao | Ngưỡng: 3 lần |

**NT-E07 và NT-E08 là hai sự kiện không được phép trượt.** Đây là cơ chế phòng vệ nội dung — nếu chúng chỉ hiện dưới dạng badge như bài thường, chúng sẽ bị bỏ sót vào giờ cao điểm.

---

## 6. BUSINESS RULES

### BR-N06 — Gộp thông báo (aggregation)

Nhóm B và C bắt buộc gộp. Không được gửi một thông báo cho mỗi lượt thích/bình luận.

```
Khoá gộp = (user_id, event_type, object_id)
Cửa sổ   = 30 phút (B01, B02) | 24 giờ (B04, C01, C02)
```

Trong cửa sổ, thông báo cũ được **cập nhật tại chỗ**, không tạo bản ghi mới. Nếu user đã đọc thông báo cũ thì sự kiện mới tạo bản ghi mới.

### BR-N07 — Trần số lượng push

```
Nhóm B + C: tối đa 5 push/ngày/user
Nhóm A + D: không chịu trần
```

Khi vượt trần, sự kiện vẫn được ghi in-app, chỉ không gửi push.

### BR-N08 — Giờ im lặng

```
Quiet hours = 22:00 – 07:00 (Asia/Ho_Chi_Minh)
Nhóm B, C     → hoãn đến 07:00
Nhóm A        → hoãn đến 07:00, TRỪ NT-A02 (lên sóng) vẫn hoãn để tránh mất giá trị lúc đêm
Nhóm D        → gửi ngay, không hoãn
```

### BR-N09 — Không tự thông báo cho chính mình

Không gửi thông báo khi actor và người nhận là cùng một `user_id` (tự thích bài mình, tự bình luận bài mình).

### BR-N10 — Dedup & idempotency

Mỗi sự kiện có `idempotency_key = hash(event_type, object_id, actor_id, bucket_time)`. Retry với cùng key không tạo thông báo mới. Bắt buộc, vì hệ thống queue sẽ retry khi push provider timeout.

### BR-N11 — Fan-out không đồng bộ

Tác giả có nhiều người theo dõi thì NT-C01 phải đưa vào queue, xử lý nền theo batch. Không gửi đồng bộ trong request tạo bài.

### BR-N12 — Chặn và hạn chế

- User A chặn user B → không gửi thông báo về hành động của B cho A và ngược lại
- Tài khoản bị khoá → dừng toàn bộ nhóm B, C; vẫn nhận nhóm A, D

### BR-N13 — Lưu trữ

- Thông báo in-app lưu **90 ngày**, sau đó xoá tự động
- Log gửi (kênh, thời điểm, trạng thái gửi) lưu theo nghĩa vụ lưu trữ của giấy phép MXH — **thời hạn do pháp chế xác định**, không xoá theo rule 90 ngày ở trên

### BR-N14 — Trạng thái đọc

- Mỗi thông báo có `is_read`
- Mở Trung tâm thông báo không tự đánh dấu đã đọc toàn bộ; chỉ đánh dấu khi user chạm vào từng thông báo hoặc bấm "Đánh dấu đã đọc tất cả"
- Badge số lượng chỉ đếm chưa đọc

### BR-N15 — Cài đặt mặc định

Người dùng mới: **bật toàn bộ nhóm A, B, D**; nhóm C bật in-app, tắt email. Digest (NT-C03) tắt mặc định — phải opt-in.

---

## 7. EDGE CASES

| Ca | Xử lý |
|---|---|
| Bình luận bị xoá sau khi thông báo đã gửi | Thông báo vẫn tồn tại nhưng deep link dẫn tới màn "Bình luận này không còn". Không xoá thông báo (user đã thấy badge, xoá gây bối rối) |
| Bài bị gỡ sau khi thông báo NT-A02 đã gửi | Thông báo cũ giữ nguyên, thêm NT-A05. Deep link của NT-A02 dẫn tới bài ở trạng thái đã ẩn, chỉ tác giả xem được |
| Bài bị thu hồi nhưng còn thông báo tương tác cũ | Giữ thông báo, deep link dẫn tới bản nháp |
| User đăng nhập trên nhiều thiết bị | Push gửi tới mọi thiết bị đang hoạt động; đọc trên một thiết bị thì badge đồng bộ trên tất cả |
| Push token hết hạn | Ghi nhận thất bại, không retry vô hạn; sau 3 lần lỗi thì vô hiệu token |
| User đổi số điện thoại | Thông báo SMS chuyển sang số mới ngay sau khi xác minh OTP thành công |
| Tác giả bị khoá giữa lúc bài đang chờ | Bài dừng ở trạng thái hiện tại, không xuất bản. Gửi NT-D05, không gửi NT-A02 |
| Nhiều BTV cùng xử lý một bài | Chỉ gửi thông báo phía user một lần theo kết quả cuối, không gửi theo từng hành động nội bộ |
| Bài lên sóng đúng giờ im lặng | Hoãn NT-A02 đến 07:00 nhưng **timestamp trong nội dung vẫn là giờ xuất bản thật**, không phải giờ gửi thông báo |
| Race: publish và withdrawal cùng lúc | Bên nào commit trước thắng (optimistic locking). Người thua nhận NT-A10 hoặc thông báo CMS tương ứng. **Không được để cả hai thành công** |

---

## 8. MÀN HÌNH

### 8.1 Trung tâm thông báo

- Vị trí: icon chuông ở header, badge số chưa đọc
- Tab: `Tất cả` · `Bài viết của tôi` (nhóm A) · `Tương tác` (nhóm B)
- Mỗi item: avatar/thumbnail, nội dung, thời gian tương đối, dấu chưa đọc
- CTA đầu danh sách: `Đánh dấu đã đọc tất cả`
- Empty state: *"Chưa có thông báo nào. Khi bài viết của bạn có cập nhật, bạn sẽ thấy ở đây."*
- Phân trang: 20 item/lần, infinite scroll

### 8.2 Cài đặt thông báo

Bảng nhóm × kênh, toggle riêng từng ô:

| Nhóm | In-app | Push | Email |
|---|---|---|---|
| Trạng thái bài viết của tôi | 🔒 luôn bật | ☑ | ☑ |
| Bình luận và trả lời | ☑ | ☑ | ☐ |
| Lượt thích và người theo dõi | ☑ | ☑ | ☐ |
| Cột mốc bài viết | ☑ | ☑ | ☐ |
| Bài mới từ người tôi theo dõi | ☑ | ☑ | ☐ |
| Bản tin tổng hợp | — | — | ☐ |
| Tài khoản & bảo mật | 🔒 luôn bật | 🔒 luôn bật | 🔒 luôn bật |

---

## 9. ACCEPTANCE CRITERIA

### AC-N01 — Gửi bài
**Given** user gửi bài thành công
**Then** hệ thống gửi NT-A01 qua in-app và push, nội dung có nêu mốc thời gian dự kiến.

### AC-N02 — Không thông báo trạng thái trung gian
**Given** bài chuyển `SUBMITTED → IN_REVIEW` hoặc `IN_REVIEW → READY_TO_PUBLISH`
**Then** hệ thống **không** gửi bất kỳ thông báo nào tới user.

### AC-N03 — Lên sóng
**When** bài chuyển sang `PUBLISHED`
**Then** gửi NT-A02 qua in-app, push và email, kèm deep link tới bài và CTA chia sẻ.

### AC-N04 — Cần bổ sung
**When** bài chuyển sang `REJECTED`
**Then** gửi NT-A03 có nêu **lý do cụ thể**, deep link mở màn chỉnh sửa với panel phản hồi mở sẵn, và copy không chứa từ "từ chối".

### AC-N05 — Quá SLA
**Given** bài tồn quá `publishing_sla_hours` chưa có kết quả
**Then** gửi NT-A04 tới user và NT-E03 tới Thư ký + Trưởng nhóm.

### AC-N06 — Gỡ bài
**When** bài đã đăng bị chuyển sang `UNPUBLISHED`
**Then** gửi NT-A05 có nêu lý do và CTA liên hệ hỗ trợ. Không được gỡ bài mà không thông báo.

### AC-N07 — Gộp
**Given** một bài nhận nhiều bình luận trong vòng 30 phút
**Then** hệ thống cập nhật một thông báo duy nhất theo dạng gộp, không tạo nhiều bản ghi.

### AC-N08 — Không thông báo lượt thích đơn lẻ
**Given** bài nhận lượt thích thứ 1, 2, 3, 4
**Then** không gửi thông báo. **When** đạt lượt thích thứ 5 **Then** gửi NT-B03 dạng gộp.

### AC-N09 — Trần push
**Given** user đã nhận 5 push nhóm B/C trong ngày
**When** phát sinh sự kiện nhóm B/C mới
**Then** ghi nhận in-app nhưng không gửi push.

### AC-N10 — Giờ im lặng
**Given** sự kiện nhóm B/C phát sinh lúc 23:30
**Then** push được hoãn tới 07:00; in-app ghi nhận ngay với timestamp thật.

### AC-N11 — Nhóm D không tắt được
**Given** user vào Cài đặt thông báo
**Then** các toggle của nhóm "Tài khoản & bảo mật" và in-app của "Trạng thái bài viết" ở trạng thái bật và không thao tác được.

### AC-N12 — Yêu cầu thu hồi khoá xuất bản
**When** user gửi yêu cầu thu hồi bài ở `READY_TO_PUBLISH`
**Then** gửi NT-E05 tới Thư ký, **và** nút Xuất bản của bài bị vô hiệu hoá cho tới khi yêu cầu được xử lý.

### AC-N13 — Race condition
**Given** yêu cầu thu hồi và hành động xuất bản xảy ra đồng thời
**Then** chỉ một hành động thành công; bên thua nhận thông báo lỗi rõ ràng (NT-A10 hoặc thông báo CMS), và không có trạng thái nào bị ghi trùng.

### AC-N14 — Không tự thông báo
**Given** user thích hoặc bình luận bài của chính mình
**Then** không phát sinh thông báo nào.

### AC-N15 — Dedup
**Given** hệ thống retry gửi cùng một sự kiện do lỗi mạng
**Then** không tạo thông báo trùng nhờ `idempotency_key`.

### AC-N16 — Từ vựng
**Given** bất kỳ thông báo nào phía user
**Then** nội dung không chứa các từ trong danh sách cấm ở BR-N01.

---

## 10. CẦN CHỐT TRƯỚC KHI ESTIMATE

| # | Câu hỏi | Ảnh hưởng |
|---|---|---|
| 1 | `publishing_sla_hours` = bao nhiêu? Có công bố cho user không? | Quyết định copy NT-A01 và toàn bộ luồng NT-A04, NT-E02, NT-E03 |
| 2 | Có app mobile ở phase này không? | Nếu chưa có thì bỏ toàn bộ kênh Push, chỉ còn in-app + email |
| 3 | Bình luận đã có trong sản phẩm chưa? | Doc 2 ghi *"nếu GNM hiện tại hỗ trợ"* nhưng prototype đang hiển thị số bình luận. Nếu chưa có thì cả nhóm B01, B02 chưa làm được |
| 4 | Ngưỡng "sửa vượt mức" cho NT-A06 là gì? | Ví dụ: thay đổi > 30% ký tự nội dung, hoặc đổi tiêu đề. Cần định lượng để dev implement |
| 5 | Thời hạn lưu log gửi thông báo theo nghĩa vụ giấy phép MXH | BR-N13 — cần pháp chế NetSpace xác nhận |
| 6 | Cơ chế cấp độ tài khoản có được duyệt không? | Quyết định NT-D03, NT-D04 có tồn tại hay không |
