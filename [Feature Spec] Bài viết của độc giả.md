# \[Feature Spec\] Bài viết của độc giả

## TỔNG QUAN TÍNH NĂNG

### 1\.1 Mô tả ngắn

Trong CMS của sản phẩm Góc Nhìn Mới, hiện đã có menu "Quản lý bài viết" dùng để quản lý bài viết do tòa soạn tạo\. Tính năng này bổ sung thêm một menu riêng để biên tập viên quản lý các bài viết do **độc giả** đăng tải \(tính năng độc giả submit bài đã có sẵn\), tách biệt khỏi bài viết nội bộ nhằm dễ theo dõi và xử lý\. Menu hiện tại sẽ được đổi tên thành "Bài viết tòa soạn" để phân biệt rõ với menu mới "Bài viết độc giả"\.

### 1\.2 Mục tiêu kinh doanh \(Why\)

- Tách bạch nội dung do tòa soạn tạo và nội dung do độc giả đóng góp \(UGC\), giúp biên tập viên quản lý và duyệt bài độc giả hiệu quả hơn, không bị lẫn với luồng biên tập nội bộ\.

- Tận dụng lại toàn bộ data model, trạng thái và hành động đã có sẵn cho menu hiện tại → giảm effort phát triển, đảm bảo tính nhất quán trải nghiệm cho biên tập viên\.

### 1\.3 Người dùng mục tiêu \(Who\)

### 1\.4 Phạm vi \(Scope\)

**In Scope \(CMS — có trong sprint này\):**

- Đổi tên menu hiện tại "Quản lý bài viết" → **"Bài viết tòa soạn"**

- Thêm menu mới **"Bài viết độc giả"**, đặt ngay cạnh/dưới menu "Bài viết tòa soạn" trong nhóm "Bài viết, tin tức"

- Đổi tên của 2 breadcrumbs theo tên menu tương ứng

- 4 tab trạng thái: **Tất cả / Gửi biên tập / Chờ xuất bản / Đã xuất bản / Gỡ bài** \(không có tab "Nháp" vì độc giả không có luồng nháp trong CMS\)

- Giữ nguyên cấu trúc cột dữ liệu như menu hiện tại: Hình ảnh, Tên, Trạng thái, Tạo bởi, Thời gian tạo

- Cột "Tên": bổ sung hiển thị **SĐT độc giả** ở dòng phụ dưới tên bài \(giống cách hiển thị "Mục: \#Tag" hiện tại\)

- Giữ nguyên các hành động thao tác \(sửa, menu 3 chấm\) như menu hiện tại

- BTV được sửa nội dung bài viết độc giả khi bài ở trạng thái tương tự **Bài viết toà soạn**

- Đề xuất icon riêng cho menu mới \(bộ Lucide\) — xem mục 5\.3

- **Trang chi tiết bài viết \(detail/edit\)** của bài viết độc giả:

    - Thanh trạng thái \(stepper\) chỉ còn 3 bước: Gửi biên tập → Chờ xuất bản → Đã xuất bản \(bỏ bước "Lưu nháp"\)

    - Thay nút "Trả bài phóng viên" \(dành cho bài tòa soạn\) bằng **cả 2 nút**: "Trả bài" và **"Từ chối"**

    - Nút "Từ chối" mở popup xác nhận, hiển thị sẵn 1 lý do từ chối cố định \(BTV không sửa được nội dung lý do\), sau khi xác nhận nội dung này được gửi trả cho độc giả

    - Bài bị từ chối chuyển sang trạng thái **"Từ chối"** — trạng thái này **không hiển thị trong CMS** \(không có tab/badge tương ứng\), chỉ hiển thị cho độc giả xem trong trang cá nhân của họ \(thuộc phạm vi GNM front\-end, không phải CMS\)

    - Field "Tài khoản" \+ "Bút danh" \(như menu bài tòa soạn\) được thay bằng **"Độc giả"** và **"Người biên tập"**

    - Các field còn lại \(Danh mục, Loại, Giờ xuất bản, Cài chủ đề, Nguồn, Tags, Slug, SEO\.\.\.\) giữ nguyên logic hiện có; field nào hệ thống tự sinh được thì tiếp tục tự sinh

    - Panel "Ant Assistant" giữ nguyên, áp dụng cho cả 2 loại bài viết

**Out of Scope \(không có trong sprint này\):**

- Nút "Tạo mới bài viết" — không có trong menu "Bài viết độc giả" vì độc giả tạo bài từ app/web riêng, không qua CMS

- Luồng độc giả submit bài \(form đăng bài\) — đã có sẵn, không thuộc phạm vi tài liệu này

- Phân quyền chi tiết ai được xem menu — đã có ticket riêng

- Phần hiển thị/tương tác phía GNM \(frontend độc giả\) — đã có

### 1\.5 Synergy với các trụ khác

## USER STORIES \& ACCEPTANCE CRITERIA

> Các story dưới đây được soạn dựa trên phần trao đổi scope — cần PO rà lại priority/điểm trước khi chuyển Tech Lead estimate\.
> 
> 

## ĐẶC TẢ CHỨC NĂNG

### 3\.1 User Flow / Luồng nghiệp vụ

### 3\.2 Business Rules

### 3\.3 Xử lý lỗi \& Edge Cases



