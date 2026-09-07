# \[Feature Spec\] User viết bài và gửi về GNM

## Mục tiêu

Cho phép **user đã có tài khoản Góc Nhìn Mới** tự viết bài và gửi bài về hệ thống GNM\.

Bài viết của user **không được publish trực tiếp** như một bài social thông thường mà sẽ được chuyển về CMS hiện tại để đội ngũ Biên tập viên kiểm tra, biên tập và quyết định xuất bản\.

Mục tiêu UX phía ngoài vẫn phải giữ cảm giác **mạng xã hội**, tránh để user cảm thấy đang thao tác với một hệ thống CMS/tòa soạn\.

# Phạm vi

- User viết bài trên GNM\.

- User xem trước bài trước khi gửi\.

- Hiển thị alert về quyền biên tập của GNM\.

- User xác nhận và gửi bài\.

- Bài được chuyển về CMS hiện tại\.

- User theo dõi trạng thái bài trên GNM\.

- Quản lý quyền sửa/xóa bài theo từng trạng thái\.

- Bài đã xuất bản hiển thị trên GNM theo workflow hiện tại\.

# User Flow

Flow phía user được rút gọn còn:

**`Viết bài`**** → ****`Xem trước`**** → ****`Alert biên tập`**** → ****`Gửi bài`**** → ****`Đã gửi`**

# Màn 01 — Viết bài

## Điều kiện truy cập

User phải:

- Đã đăng nhập GNM và xác minh mã OTP\.

- Nếu chưa đăng nhập → redirect/login modal theo flow hiện tại\.

- Nếu chưa xác minh mã OTP → xác minh mã OTP\.

## Nội dung màn

**Page title**

> Chia sẻ góc nhìn
> 
> 

**Subtitle**

> Viết điều bạn muốn chia sẻ với cộng đồng Góc Nhìn Mới\.
> 
> 

### Field

**Tiêu đề**\*
Placeholder:

> Đặt tiêu đề cho bài viết\.\.\.
> 
> 

**Ảnh đại diện**\*
CTA:

> Thêm ảnh
> 
> 

**Nội dung**\*
Placeholder:

> Bắt đầu câu chuyện của bạn\.\.\.
> 
> 

**Chủ đề / Danh mục**\*
User chọn từ danh sách GNM cung cấp\.

Có thể bổ sung nếu hệ thống hiện tại hỗ trợ:

- Tag

- Caption ảnh

## CTA

Primary:

> **Xem trước**
> 
> 

Secondary:

> **Lưu nháp**
> 
> 

# Màn 02 — Xem trước

Hiển thị bài theo layout gần nhất với bài thật khi publish:

- Thumbnail

- Tiêu đề

- Tên user

- Avatar

- Nội dung

- Hình ảnh

- Chủ đề

### CTA

Secondary:

> **Quay lại chỉnh sửa**
> 
> 

Primary:

> **Gửi bài**
> 
> 

User bấm **Gửi bài** → mở Alert xác nhận\.

# Alert trước khi gửi

## Title

> **Bài viết có thể được biên tập trước khi đăng**
> 
> 

## Nội dung

> Đội ngũ Góc Nhìn Mới có thể điều chỉnh nội dung để đảm bảo phù hợp với tiêu chuẩn cộng đồng, hạn chế nội dung nhạy cảm và tôn trọng quyền lợi của tác giả\.
> 
> **Sau khi gửi, bạn sẽ không thể chỉnh sửa hoặc xóa bài, trừ trường hợp bài không được duyệt\. Bài đã xuất bản cũng không thể tự gỡ khỏi Góc Nhìn Mới\.**
> 
> 

## CTA

Secondary:

> Quay lại
> 
> 

Primary:

> **Đồng ý \& Gửi bài**
> 
> 

### Rule

Chỉ khi user bấm **Đồng ý \& Gửi bài** hệ thống mới submit bài\.

Nếu user đóng modal hoặc chọn Quay lại:

- Không submit\.

- Không đổi trạng thái bài\.

- User vẫn có quyền chỉnh sửa\.

# Màn 03 — Gửi thành công

Sau khi submit thành công:

### Title

> **Góc nhìn của bạn đã được gửi\!**
> 
> 

### Description

> Bài viết sẽ được Góc Nhìn Mới xem xét trước khi đăng\. Chúng tôi sẽ thông báo cho bạn khi có cập nhật\.
> 
> 

### CTA

Primary:

> **Xem bài của tôi**
> 
> 

Secondary:

> Về trang chủ
> 
> 

# Trạng thái bài viết phía user

Không hiển thị các technical status từ backend\.

# Rule quyền chỉnh sửa / xóa

Đây là business rule bắt buộc Dev cần tuân thủ\.

# UI phía Trang cá nhân

Trong Trang cá nhân của chính user bổ sung khu vực:

### Bài viết của tôi

Filter:

`Tất cả` · `Bản nháp` · `Đã gửi`  · `Đã đăng` · `Chưa phù hợp để đăng`

Mỗi card có:

- Thumbnail

- Title

- Ngày tạo/gửi

- Status

- CTA tương ứng

# CTA theo trạng thái

### Bản nháp

> **Tiếp tục viết**
> 
> 

Menu:

`Chỉnh sửa`
`Xóa`

---

### Đã gửi

> **Xem bài đã gửi**
> 
> 

Text phụ:

> Bài viết đang chờ Góc Nhìn Mới xem xét\.
> 
> 

Không hiển thị Edit/Delete\.

---

### Đã đăng

> **Xem bài đã đăng**
> 
> 

Có thể thêm:

- Share

- View count

- Like/comment nếu GNM hiện tại hỗ trợ\.

Không có:

- Edit

- Delete

- Gỡ bài

---

### Chưa phù hợp để đăng

> **Chỉnh sửa bài**
> 
> 

Secondary:

> Xem phản hồi
> 
> 

Menu:

`Chỉnh sửa`
`Xóa`

Sau chỉnh sửa:

> **Gửi lại**
> 
> 

# Empty State

Nếu user chưa từng viết bài:

### Chưa có bài viết nào

> Chia sẻ câu chuyện, trải nghiệm hoặc góc nhìn của bạn với cộng đồng GNM\.
> 
> 

CTA:

> **Viết bài đầu tiên**
> 
> 

# Notification phía user

Tối thiểu cần hỗ trợ các notification sau:

### Gửi thành công

> **Bài viết của bạn đã được gửi**
> GNM sẽ cập nhật khi bài có thay đổi\.
> 
> 

### Đang xử lý

> **Bài viết đang được xem xét**
> Đội ngũ GNM đang xem nội dung bạn đã gửi\.
> 
> 

### Đã duyệt

> **Bài viết của bạn đã được duyệt 🎉**
> 
> 

### Đã đăng

> **Góc nhìn của bạn đã lên sóng\! 🎉**
> 
> 

CTA:

> Xem bài
> 
> 

### Bị từ chối

Không nên ghi:

> Bài viết bị từ chối\.
> 
> 

Nên dùng:

> **Bài viết chưa phù hợp để đăng**
> Bạn có thể xem phản hồi, chỉnh sửa và gửi lại bài viết\.
> 
> 

# Mapping tác giả

Khi bài user được publish, cần giữ quan hệ với tài khoản user gốc\.

Tối thiểu cần lưu:

```Plain Text
user_id
số điện thoại
```

Mục đích:

- Hiển thị tác giả\.

- Link về Profile nếu Product muốn bật\.

- Phân biệt với Reporter/Editor của GNM\.

# Acceptance Criteria

### AC01 — Viết bài

**Given** user đã đăng nhập
**When** user chọn Viết bài
**Then** user có thể nhập và lưu nội dung bài viết\.

### AC02 — Xem trước

**Given** user nhập đủ field bắt buộc
**When** user bấm Xem trước
**Then** hệ thống hiển thị preview của bài\.

### AC03 — Alert bắt buộc

**Given** user đang ở Preview
**When** user chọn Gửi bài
**Then** hệ thống phải hiển thị Alert biên tập trước khi submit\.

### AC04 — Không đồng ý

**When** user đóng Alert hoặc chọn Quay lại
**Then** bài không được gửi và vẫn có thể chỉnh sửa\.

### AC05 — Gửi thành công

**When** user chọn Đồng ý \& Gửi bài
**Then** bài được submit về hệ thống và chuyển sang `SUBMITTED`\.

### AC06 — Khóa bài

**Given** bài đã submit
**Then** user không thể Edit/Delete\.

### AC07 — Từ chối

**Given** bài được chuyển sang `REJECTED`
**Then** user được phép Edit/Delete/Resubmit\.

### AC08 — Duyệt

**Given** bài = `APPROVED`
**Then** user không thể Edit/Delete\.

### AC09 — Publish

**Given** bài = `PUBLISHED`
**Then** user chỉ được xem bài và không có chức năng gỡ/xóa/chỉnh sửa\.

### AC10 — Trang cá nhân

**Given** user có bài viết
**Then** Trang cá nhân hiển thị đúng trạng thái và CTA tương ứng với từng bài\.

# Logic tổng thể cho Dev

```Plain Text
DRAFT
│
│ Xem trước
│
│ Đồng ý & Gửi bài
▼
SUBMITTED 🔒
│
▼
IN_REVIEW 🔒
│
├──────────────► REJECTED 🔓
│                    │
│                    ├─ Edit
│                    ├─ Delete
│                    └─ Resubmit
│                         │
│                         └────► SUBMITTED 🔒
│
▼
│
▼
PUBLISHED 🔒
```

`🔓 = User được sửa/xóa`
`🔒 = User không được sửa/xóa`

# Bổ sung: Giới hạn số bài user gửi trong ngày

### Mục tiêu

Giới hạn số lượng bài mà một user có thể **gửi tới GNM trong một ngày** để hạn chế spam, tránh tạo quá nhiều bài chờ biên tập và giảm tải cho BTV\.

Tôi khuyên **không giới hạn số Draft**, chỉ giới hạn số lần **Gửi bài**\.

## Business Rule

### BR\-08 — Giới hạn số bài gửi/ngày

Mỗi tài khoản GNM được gửi tối đa **5 bài/ngày**\. Giới hạn chỉ áp dụng với thao tác gửi bài, không áp dụng với việc tạo, lưu hoặc chỉnh sửa bản nháp\.

Có thể để giá trị này thành config:

```Plain Text
daily_submission_limit = 5
```

để sau này Admin/Product thay đổi mà không cần sửa logic\.

### Cách tính

Chỉ tính các bài mà user đã thực hiện action:

> **Đồng ý \& Gửi bài**
> 
> 

Không tính:

- Bản nháp

- Bài user đang viết

- Bài đã xóa khi còn Draft

Bài bị từ chối nếu user **Gửi lại** thì tôi khuyên vẫn tính là **1 lượt gửi mới**, vì vẫn tạo thêm workload cho BTV\.

## Rule reset

Quota reset theo ngày:

> **00:00 – 23:59 theo timezone hệ thống GNM**
> 
> 

Nếu GNM vận hành tại Việt Nam thì nên dùng:

```Plain Text
Asia/Ho_Chi_Minh
```

## UI phía user

Trong màn **Viết bài** hoặc gần CTA **Gửi bài**, hiển thị nhẹ:

> **Hôm nay bạn đã gửi 3/5 bài**
> 
> 

Hoặc ngắn hơn:

> **Bạn còn 1 lượt gửi bài hôm nay\.**
> 
> 

Không cần làm quá nổi nếu user vẫn còn quota\.

## Khi user đạt giới hạn

Nếu user đã gửi đủ:

> **5/5 bài**
> 
> 

CTA **Gửi bài** bị disable hoặc khi user bấm thì hiện alert\.

### UX Writing đề xuất

**Bạn đã đạt giới hạn gửi bài hôm nay**

> **Bạn đã đạt giới hạn gửi bài hôm nay**
> Bạn đã gửi tối đa 5 bài trong ngày\. Bạn vẫn có thể tiếp tục viết và lưu bản nháp để gửi vào ngày mai\.
> 
> 

CTA:

> **Đã hiểu**
> 
> 

Có thể thêm:

> Bài viết hiện tại vẫn được lưu trong **Bản nháp**\.
> 
> 

Điểm này quan trọng để user không sợ mất nội dung\.

## Rule khi đạt limit

```Plain Text
if submissions_today >= daily_submission_limit:
    allow_draft = true
    allow_edit_draft = true
    allow_preview = true
    allow_submit = false
```

Tức là user vẫn được:

- Viết bài

- Lưu nháp

- Sửa bài

- Xem trước

Chỉ không được:

- Gửi bài mới

## Trường hợp đặc biệt

Không** hoàn lại quota** khi bài bị từ chối hoặc gỡ, vì nếu hoàn quota thì user vẫn có thể spam bằng vòng lặp gửi → từ chối → gửi tiếp\.

## Acceptance Criteria

### AC11 — Kiểm tra quota

**Given** user chưa đạt giới hạn trong ngày
**When** user gửi bài
**Then** hệ thống cho phép submit và tăng bộ đếm thêm 1\.

### AC12 — Đạt giới hạn

**Given** user đã gửi đủ số bài tối đa trong ngày
**When** user muốn gửi thêm bài
**Then** hệ thống không cho submit và hiển thị thông báo giới hạn\.

### AC13 — Không ảnh hưởng Draft

**Given** user đã đạt giới hạn
**Then** user vẫn có thể tạo, lưu, chỉnh sửa và preview Draft\.

### AC14 — Reset quota

**Given** sang ngày mới
**Then** bộ đếm số lượt gửi trong ngày được reset\.

