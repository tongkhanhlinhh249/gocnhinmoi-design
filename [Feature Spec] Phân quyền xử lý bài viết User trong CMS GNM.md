# \[Feature Spec\] Phân quyền xử lý bài viết User trong CMS GNM

## Mục tiêu

Khi user GNM gửi bài từ giao diện ngoài vào hệ thống, bài viết sẽ đi vào CMS với trạng thái mặc định:

**`Gửi biên tập`**

Từ đây bài viết được xử lý theo 2 cấp:

**BTV → Thư ký biên tập**

Trong đó:

- **BTV** có quyền xem, sửa, từ chối và chuyển bài sang trạng thái chờ xuất bản\.

- **Thư ký biên tập** có quyền xem, sửa, từ chối, xuất bản và gỡ bài\.

User không có quyền can thiệp vào quá trình xử lý trong CMS\.

# Workflow tổng thể

```Plain Text
User gửi bài
    ↓
GỬI BIÊN TẬP
    ↓
────────────────
BTV xử lý
────────────────
    ↓
 ┌───────────────┐
 ↓               ↓
Từ chối       Chờ xuất bản
                  ↓
          ─────────────────
          Thư ký biên tập
          ─────────────────
                  ↓
        ┌─────────┼─────────┐
        ↓         ↓         ↓
     Từ chối    Sửa      Xuất bản
                              ↓
                          Đã xuất bản
                              ↓
                            Gỡ bài
```

# Role trong CMS

## Role 01 — BTV

BTV là cấp xử lý đầu tiên đối với bài user gửi về\.

BTV có quyền:

- Xem bài

- Sửa bài

- Từ chối bài

- Chuyển bài sang **Chờ xuất bản**

BTV không có quyền:

- Xuất bản

- Gỡ bài đã xuất bản

## Role 02 — Thư ký biên tập

Thư ký biên tập là cấp duyệt và xuất bản cuối cùng\.

Có quyền:

- Xem bài

- Sửa bài

- Từ chối bài

- Xuất bản

- Gỡ bài đã xuất bản

# Trạng thái bài viết

Tôi đề xuất dùng các trạng thái chính sau:

# Ma trận phân quyền

Điểm quan trọng:

**BTV không được thấy hoặc không được sử dụng CTA “Xuất bản”\.**

# Rule theo trạng thái

## Trạng thái: Gửi biên tập

### BTV

Có thể:

`Xem`
`Sửa`
`Từ chối`
`Chờ xuất bản`

### Thư ký biên tập

Có thể:

`Xem`
`Sửa`
`Từ chối`

Có thể cho phép Thư ký xử lý trực tiếp nếu cần, nhưng tôi khuyên workflow mặc định vẫn đi qua BTV\.

# BTV xử lý bài

Khi BTV mở bài ở trạng thái:

> **Gửi biên tập**
> 
> 

BTV có thể chỉnh:

- Tiêu đề

- Sapo

- Nội dung

- Ảnh

- Caption

- Danh mục

- Tag

- SEO

- Các field bài viết hiện CMS hỗ trợ

Sau khi xử lý, có 2 hướng chính:

### Từ chối

CTA:

> **Từ chối bài**
> 
> 

Tự động gửi nội dung có sẵn thông báo cho user và lưu audit log

Ví dụ:

- Nội dung không phù hợp

- Nội dung nhạy cảm

- Thiếu nguồn

- Vi phạm tiêu chuẩn

- Trùng lặp

- Khác

Sau khi xác nhận:

`SUBMITTED → REJECTED`

### Chờ xuất bản

CTA:

> **Chuyển chờ xuất bản**
> 
> 

Sau khi xác nhận:

`SUBMITTED → READY_TO_PUBLISH`

Từ thời điểm này bài chờ Thư ký biên tập xử lý\.

# Thư ký biên tập xử lý bài

Khi bài ở:

> **Chờ xuất bản**
> 
> 

Thư ký có thể:

### Xem

Kiểm tra toàn bộ nội dung\.

### Sửa

Có thể chỉnh lại bài lần cuối trước khi publish\.

### Từ chối

Nếu bài vẫn chưa đạt yêu cầu:

`READY_TO_PUBLISH → REJECTED`

### Xuất bản

CTA:

> **Xuất bản**
> 
> 

Sau khi xác nhận:

`READY_TO_PUBLISH → PUBLISHED`

Bài xuất hiện trên GNM\.

# Gỡ bài

Chỉ Thư ký biên tập được thực hiện\.

Điều kiện:

`status = PUBLISHED`

CTA:

> **Gỡ bài**
> 
> 

Nên có confirm modal:

### Gỡ bài khỏi Góc Nhìn Mới?

> Bài viết sẽ không còn hiển thị công khai trên Góc Nhìn Mới sau khi gỡ\.
> 
> 

Có thể yêu cầu nhập lý do\.

CTA:

`Hủy`
**Gỡ bài**

Sau khi gỡ:

`PUBLISHED → UNPUBLISHED`

# Rule quyền theo trạng thái

Tôi khuyên khi bài đã chuyển sang **Chờ xuất bản**, BTV chỉ nên được **Xem**, tránh việc BTV sửa nội dung trong lúc Thư ký đang duyệt\.

# Business Rules

### BR\-01 — Bài user gửi vào CMS

Mọi bài user gửi từ frontend phải được tạo với:

```Plain Text
source_type = USER_SUBMISSION
status = SUBMITTED
```

CMS hiển thị label:

> **Gửi biên tập**
> 
> 

---

### BR\-02 — BTV không được publish

BTV không được:

```Plain Text
publish_article
unpublish_article
```

Kể cả thông qua API trực tiếp\.

Phải enforce ở backend, không chỉ hide button\.

---

### BR\-03 — BTV hoàn tất xử lý

Sau khi BTV chọn:

> Chuyển chờ xuất bản
> 
> 

Status đổi:

```Plain Text
SUBMITTED → READY_TO_PUBLISH
```

---

### BR\-04 — Thư ký là cấp xuất bản

Chỉ user có role:

```Plain Text
EDITORIAL_SECRETARY
```

hoặc permission tương đương mới được:

```Plain Text
publish
unpublish
```

---

### BR\-05 — Từ chối

Cả BTV và Thư ký đều có quyền từ chối bài\.

Khi từ chối:

```Plain Text
status = REJECTED
```

Nên lưu:

```Plain Text
rejected_by
rejected_at
rejection_reason
```

---

### BR\-06 — Gỡ bài

Chỉ Thư ký biên tập được gỡ bài đã publish\.

```Plain Text
PUBLISHED → UNPUBLISHED
```

# CTA theo Role

## BTV

Ở bài `Gửi biên tập`:

**Lưu chỉnh sửa**

`Từ chối`

**Chuyển chờ xuất bản**

---

## Thư ký biên tập

Ở bài `Chờ xuất bản`:

**Lưu chỉnh sửa**

`Từ chối`

**Xuất bản**

Ở bài `Đã xuất bản`:

`Xem`

**Gỡ bài**

# Acceptance Criteria

### AC01 — Bài mới

**Given** user gửi bài từ GNM
**Then** CMS tạo bài với trạng thái **Gửi biên tập**\.

### AC02 — BTV xử lý

**Given** BTV mở bài Gửi biên tập
**Then** BTV có quyền xem, sửa, từ chối hoặc chuyển Chờ xuất bản\.

### AC03 — BTV không publish

**Given** user có role BTV
**Then** hệ thống không cho phép xuất bản hoặc gỡ bài\.

### AC04 — Chờ xuất bản

**When** BTV chọn Chuyển chờ xuất bản
**Then** status đổi sang `READY_TO_PUBLISH`\.

### AC05 — Thư ký xử lý

**Given** Thư ký mở bài Chờ xuất bản
**Then** có quyền xem, sửa, từ chối hoặc xuất bản\.

### AC06 — Xuất bản

**When** Thư ký chọn Xuất bản
**Then** bài chuyển sang `PUBLISHED` và hiển thị trên GNM\.

### AC07 — Gỡ bài

**Given** bài đã xuất bản
**When** Thư ký chọn Gỡ bài
**Then** bài không còn hiển thị công khai và status chuyển `UNPUBLISHED`\.

### AC08 — Từ chối

**When** BTV hoặc Thư ký từ chối bài
**Then** hệ thống chuyển bài về `REJECTED` và lưu người thực hiện

# Logic cho Dev

```Plain Text
USER
 │
 │ Gửi bài
 ▼
SUBMITTED
"Gửi biên tập"
 │
 │ BTV
 ├──────────────► REJECTED
 │                 "Từ chối"
 │
 │ Chuyển chờ xuất bản
 ▼
READY_TO_PUBLISH
"Chờ xuất bản"
 │
 │ Thư ký biên tập
 ├──────────────► REJECTED
 │
 │ Xuất bản
 ▼
PUBLISHED
"Đã xuất bản"
 │
 │ Thư ký: Gỡ bài
 ▼
UNPUBLISHED
"Đã gỡ"
```



