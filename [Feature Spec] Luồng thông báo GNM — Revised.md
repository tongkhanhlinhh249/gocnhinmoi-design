# \[Feature Spec\] Luồng thông báo GNM — Revised

## Mục tiêu

Xây dựng hệ thống thông báo cho Góc Nhìn Mới nhằm giúp user theo dõi:

- trạng thái bài viết của mình;

- các tương tác xã hội;

- các hoạt động liên quan đến tài khoản;

- các cập nhật quan trọng cần user thực hiện\.

Đồng thời phía CMS cần có thông báo phù hợp để BTV và Thư ký biên tập không bỏ sót bài user gửi và các yêu cầu cần xử lý\.

Nguyên tắc UX phía user:

> GNM vẫn phải tạo cảm giác như một nền tảng nội dung/mạng xã hội, không expose các bước xử lý nội bộ của CMS\.
> 
> 

Tuy nhiên không cần cố giấu hoàn toàn việc bài viết được GNM xem xét và biên tập trước khi đăng\. User cần hiểu rõ nội dung không được publish trực tiếp\. Spec cũ cũng xác định mục tiêu phía user là thông báo trạng thái bài viết, tương tác, nội dung và tài khoản; phía CMS là phục vụ hàng đợi và vận hành nội bộ\. 

# Phạm vi

## 2\.1 In Scope — MVP

### Phía User

- Notification Center\.

- Thông báo liên quan đến bài viết user\.

- Thông báo tương tác cơ bản\.

- Thông báo liên quan đến tài khoản\.

- Trạng thái đã đọc/chưa đọc\.

- Deep link từ notification tới nội dung tương ứng\.

- Cài đặt một số nhóm thông báo\.

### Phía CMS

- Bài user mới gửi\.

- Bài chuyển sang Chờ xuất bản\.

- Yêu cầu gỡ bài đã đăng\.

- Cảnh báo bài tồn đọng nếu có rule vận hành tương ứng\.

# Kênh thông báo

## MVP

### In\-app

Là kênh thông báo chính\.

Mọi notification phía user đều phải có bản ghi In\-app\.

### Email

Chỉ sử dụng cho các trường hợp quan trọng:

- bài không phù hợp;

- bài đã đăng;

- bài bị gỡ;

- tài khoản hoặc bảo mật\.

### Push

Chỉ implement khi GNM có app hoặc hạ tầng web push được Product duyệt\.

Không đưa Push thành dependency của MVP\.

# Nhóm thông báo

# Quy tắc UX Writing phía User

## BR\-N01 — Không expose workflow CMS

Không sử dụng các thuật ngữ nội bộ như:

- Gửi biên tập

- Chờ BTV duyệt

- Thư ký biên tập

- Chờ xuất bản

- Workflow

- Queue CMS

Không bắt buộc cấm hoàn toàn các từ như:

- GNM

- Đội ngũ GNM

- Ban Biên tập

Các từ này được sử dụng khi cần minh bạch trách nhiệm xử lý nội dung\.

## BR\-N02 — Trạng thái user\-facing

Không hiển thị technical status\.

Điểm quan trọng:

`IN_REVIEW` và `READY_TO_PUBLISH` đều hiển thị cho user là:

> **Đang xem xét**
> 
> 

Không cho user biết bài đang nằm ở BTV hay Thư ký\.

# Không thông báo trạng thái nội bộ

Các chuyển trạng thái sau không tạo notification:

```Plain Text
SUBMITTED → IN_REVIEW
IN_REVIEW → READY_TO_PUBLISH
```

User chỉ cần thấy trạng thái cập nhật trong:

> **Bài viết của tôi**
> 
> 

Không cần push thêm notification\.

Điều này giữ được nguyên tắc ban đầu của spec là không làm user phải theo dõi các bước xử lý nội bộ\.

# Catalog Notification — Bài viết của User

## NT\-A01 — Gửi bài thành công

**Trigger**

```Plain Text
DRAFT → SUBMITTED
```

**Kênh**

In\-app\.

Có thể thêm Push khi hạ tầng hỗ trợ\.

**Title**

> **Bài viết của bạn đã được gửi**
> 
> 

**Content**

> GNM sẽ thông báo cho bạn khi bài viết có cập nhật\.
> 
> 

## NT\-A02 — Bài chưa phù hợp

**Trigger**

```Plain Text
→ REJECTED
```

**Kênh**

In\-app \+ Email\.

**Title**

> **Bài viết cần được điều chỉnh**
> 
> 

**Content**

> Bài viết hiện chưa phù hợp để đăng trên GNM\. Xem phản hồi để chỉnh sửa và gửi lại\.
> 
> 

Nếu có phản hồi cụ thể:

> **\{Phản hồi từ GNM\}**
> 
> 

**Deep link**

Màn chỉnh sửa bài \+ khu vực phản hồi\.

### Sau trạng thái này user được:

- chỉnh sửa;

- xóa;

- gửi lại\.

## NT\-A03 — Bài đã đăng

**Trigger**

```Plain Text
→ PUBLISHED
```

**Kênh**

In\-app \+ Email\.

**Title**

> **Bài viết của bạn đã được đăng 🎉**
> 
> 

**Content**

> “\{Tên bài\}” hiện đã xuất hiện trên Góc Nhìn Mới\.
> 
> 

**CTA**

> **Xem bài**
> 
> 

Có thể thêm:

> **Chia sẻ**
> 
> 

**Trigger**

```Plain Text
PUBLISHED → UNPUBLISHED
```

do phía GNM chủ động gỡ\.

**Kênh**

In\-app \+ Email\.

**Title**

> **Bài viết đã được gỡ khỏi GNM**
> 
> 

**Content**

> “\{Tên bài\}” hiện không còn hiển thị công khai trên Góc Nhìn Mới\.
> 
> 

Nếu có lý do phù hợp để user xem:

> **Lý do: \{reason\}**
> 
> 

**Deep link**

Chi tiết bài trong Trang cá nhân\.

# Yêu cầu gỡ bài của User

User **không có quyền tự gỡ bài đã đăng**\.

User chỉ có thể:

> **Yêu cầu gỡ bài**
> 
> 

## NT\-A06 — Yêu cầu gỡ được chấp thuận

**Trigger**

BBT chấp thuận yêu cầu\.

**Title**

> **Bài viết đã được gỡ khỏi GNM**
> 
> 

**Content**

> Bài viết không còn hiển thị công khai trên Góc Nhìn Mới\.
> 
> 

**Kênh**

In\-app \+ Email\.

## NT\-A07 — Yêu cầu gỡ không được chấp thuận

**Trigger**

BBT không chấp thuận\.

**Title**

> **Yêu cầu gỡ bài chưa được chấp thuận**
> 
> 

**Content**

> Xem phản hồi từ GNM để biết thêm thông tin\.
> 
> 

**Deep link**

Chi tiết yêu cầu / chi tiết bài\.

# Notification tương tác — MVP

## NT\-B01 — Bình luận mới

**Trigger**

Có người bình luận bài của user\.

**Copy**

> **\{Tên\} đã bình luận bài viết của bạn**
> 
> 

Nếu nhiều người:

> **\{Tên\} và \{N\} người khác đã bình luận bài viết của bạn**
> 
> 

### Aggregation

Gộp trong 30 phút theo bài\.

## NT\-B02 — Trả lời bình luận

> **\{Tên\} đã trả lời bình luận của bạn**
> 
> 

Gộp theo thread trong 30 phút\.

---

## NT\-B03 — Like milestone

Không notify mỗi lượt Like\.

Notify theo milestone:

> `10 → 50 → 100 → 500 → 1K → 5K...`
> 
> 

Copy:

> **Bài viết của bạn đã nhận 100 lượt thích 🎉**
> 
> 

Điều này kế thừa tư duy aggregation từ spec gốc nhưng giảm notification noise\. Spec cũ cũng đã xác định không nên gửi thông báo cho từng lượt like\. 

---

## NT\-B04 — View milestone

Milestone:

> `100 → 1K → 10K → 100K`
> 
> 

Copy:

> **“\{Tên bài\}” đã đạt 1\.000 lượt xem 🎉**
> 
> 

---

## NT\-B05 — Người theo dõi mới

Không gửi từng user nếu số lượng lớn\.

Copy dạng gộp:

> **\{N\} người mới đã theo dõi bạn**
> 
> 

# Notification tài khoản

MVP chỉ nên ưu tiên:

### Đăng nhập thiết bị mới

> **Có phiên đăng nhập mới vào tài khoản của bạn**
> 
> 

### Tài khoản bị hạn chế

> **Tài khoản của bạn đang bị hạn chế**
> 
> 

### Yêu cầu thay đổi thông tin

Ví dụ:

> **Cần cập nhật bút danh của bạn**
> 
> 

Không đưa:

- lên cấp tài khoản;

- tụt cấp tài khoản

vào MVP nếu Product chưa duyệt hệ thống level\.

# Notification phía CMS

## NT\-E01 — Có bài user mới

**Trigger**

User submit bài\.

**Người nhận**

BTV\.

**UI**

Không notify popup cho từng bài nếu volume lớn\.

Dùng:

> Badge số bài `Gửi biên tập`
> 
> 

Ví dụ:

> **Gửi biên tập \(12\)**
> 
> 

## NT\-E02 — Bài chuyển Chờ xuất bản

**Trigger**

```Plain Text
SUBMITTED / IN_REVIEW
→ READY_TO_PUBLISH
```

**Người nhận**

Thư ký biên tập\.

**UI**

Badge:

> **Chờ xuất bản \(5\)**
> 
> 

## NT\-E03 — Yêu cầu gỡ bài

**Trigger**

User gửi yêu cầu gỡ\.

**Điều kiện**

```Plain Text
royalty_status = UNPAID
```

**Người nhận**

Thư ký biên tập / role Product quy định\.

**Priority**

Cao\.

Hiển thị:

> **Yêu cầu gỡ bài**
> 
> 

Thông tin:

- tên bài;

- tác giả;

- thời gian gửi;

- trạng thái nhuận bút;

- bài có đang nổi bật hay không;

- lý do user cung cấp nếu có\.

# Business Rule — Aggregation

Các notification tương tác cần được gộp\.

Ví dụ:

```Plain Text
aggregation_key =
user_id
+ event_type
+ article_id
```

Trong cùng khoảng thời gian:

- không tạo notification mới cho từng lượt;

- cập nhật notification hiện tại\.

Nếu notification cũ đã được user đọc thì có thể tạo notification mới khi có activity mới đáng kể\.

Spec gốc cũng đã định nghĩa aggregation dựa trên user, event và object\. 

# Business Rule — Không tự notify

Nếu user:

- tự like bài mình;

- tự comment bài mình;

không phát sinh notification\.

```Plain Text
actor_id == receiver_id
→ no notification
```

# Business Rule — Dedup

Mỗi event phải có unique/idempotency key\.

Mục tiêu:

- retry không tạo notification trùng;

- tránh user nhận nhiều notification cho cùng một event\.

Spec cũ đã xác định đây là requirement bắt buộc khi notification queue có cơ chế retry\.

# Business Rule — Deep link

Mọi notification phải dẫn tới một màn cụ thể\.

Ví dụ:

Không có notification “chết”\.

# Notification Center

## Header

Icon:

> 🔔
> 
> 

Badge:

> số notification chưa đọc\.
> 
> 

# Notification item

Mỗi item gồm:

- Avatar hoặc thumbnail\.

- Title/copy\.

- Thời gian\.

- Trạng thái chưa đọc\.

- Deep link\.

Ví dụ:

> **Bài viết của bạn đã được đăng 🎉**
> “Vì sao người trẻ Việt ngày càng chọn lối sống chậm?” hiện đã xuất hiện trên GNM\.
> `10 phút trước`
> 
> 

# Trạng thái đọc

Mỗi notification có:

```Plain Text
is_read
read_at
```

Badge chỉ tính notification:

```Plain Text
is_read = false
```

User có thể:

> **Đánh dấu tất cả đã đọc**
> 
> 

Mở Notification Center **không tự mark tất cả notification là đã đọc**\. Quy tắc này giữ nguyên từ spec cũ\.

# Empty State

> **Chưa có thông báo nào**
> 
> Khi bài viết hoặc hoạt động của bạn có cập nhật, bạn sẽ thấy ở đây\.
> 
> 

# Acceptance Criteria

### AC\-N01 — Gửi bài

**Given** user gửi bài thành công
**Then** hệ thống tạo notification “Bài viết của bạn đã được gửi”\.

---

### AC\-N02 — Không notify workflow nội bộ

**Given**

```Plain Text
SUBMITTED → IN_REVIEW
```

hoặc:

```Plain Text
IN_REVIEW → READY_TO_PUBLISH
```

**Then** không tạo notification phía user\.

---

### AC\-N03 — Chưa phù hợp

**When** bài chuyển `REJECTED`
**Then** user nhận notification và có thể chỉnh sửa/xóa/gửi lại bài\.

---

### AC\-N04 — Đã đăng

**When** bài chuyển `PUBLISHED`
**Then** user nhận notification có deep link tới bài public\.

---

### AC\-N05 — Không được tự gỡ

**Given** bài = `PUBLISHED`
**Then** user không có Edit/Delete/Unpublish\.

Chỉ có:

> **Yêu cầu gỡ bài**
> 
> 

nếu đủ điều kiện\.

---

### AC\-N08 — Gỡ được chấp thuận

**When** GNM chấp thuận yêu cầu
**Then** bài được unpublish và user nhận notification\.

---

### AC\-N09 — Gỡ không được chấp thuận

**When** GNM không chấp thuận
**Then** user nhận notification kèm phản hồi\.

---

### AC\-N11 — Aggregation

Nhiều interaction giống nhau trong một khoảng thời gian không tạo notification riêng lẻ\.

---

### AC\-N12 — Không tự notify

User tương tác với nội dung của chính mình không tạo notification\.

---

### AC\-N13 — Deep link

Mỗi notification phải mở đúng object hoặc màn trạng thái tương ứng\.

# Cần chốt trước khi Dev Estimate

Chỉ còn một số quyết định Product/Technical cần chốt:

- GNM MVP hiện chỉ dùng **In\-app **, hay đã có Web Push/App Push?

- Cần SLA xử lý bài nội bộ cho CMS

- Thư ký biên tập nhận **Yêu cầu gỡ bài**

- Có bắt buộc user nhập **lý do yêu cầu gỡ**

- Mốc Like/View cần config

- Notification lưu 30 ngày



