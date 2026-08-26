# Góc Nhìn Mới — bản thiết kế mobile

Bản dựng giao diện 16 màn hình của mạng xã hội Góc Nhìn Mới. HTML + CSS + JS
thuần, không build step, không phụ thuộc — mở file là chạy.

Repo có **hai bản của cùng một sản phẩm**:

| thư mục | dùng khi nào |
|---|---|
| [`design/`](design) | CSS viết tay. Là nguồn để chỉnh sửa thiết kế. |
| [`tailwind/`](tailwind) | Cùng giao diện, viết bằng utility Tailwind. Dùng khi port sang Next.js. |

Sửa thiết kế thì sửa ở `design/`, rồi sinh lại `tailwind/` bằng công cụ trong
[`tailwind/tw/`](tailwind/tw) — đừng sửa tay hai nơi.

## Chạy thử

```bash
cd design && python3 serve.py 3000 .
```

Mở `http://localhost:3000` — xem ở khung 375–390px cho đúng thiết kế.

## 16 màn hình

**Tab chính** — Trang chủ · Nghe & Xem · Khám phá · Cá nhân

**Trang nội dung** — Chi tiết bài viết · Chi tiết địa điểm · Khám phá địa điểm ·
Photo · Bảng xếp hạng

**Chuyên mục** — Mới nhất · Hot hôm nay · Trà đàm · Góc mở · Quan điểm ·
Spotlight · Luận cổ suy kim

## Hệ thiết kế

Token lấy từ site production `cdn.gocnhinmoi.com`:

| | |
|---|---|
| Màu thương hiệu | `primary-800` = **#B80001** |
| Thang màu | `primary-50` … `primary-950` |
| Font | Noto Sans (`var(--font-notosans)`) |
| Bo góc | thẻ 4px · vừa 8px · lớn 12px · tròn 999px |
| Khung nội dung | tối đa 480px |

Bản `design/` hiện dùng màu cũ #d92b3a và font Be Vietnam Pro; bản `tailwind/`
đã đổi sang token production ở trên.

## Có gì trong `tailwind/`

- `assets/css/tailwind.css` — CSS tĩnh đã biên dịch, chạy không cần Node
- `tailwind.config.js` — cấu hình khớp site thật, dán thẳng vào Next.js được
- `tw/` — bộ công cụ sinh CSS từ bản đồ class

Chi tiết ở [`tailwind/README.md`](tailwind/README.md).

## Lưu ý khi sửa markup

Markup bản Tailwind giữ lại một số tên class cũ bên cạnh utility. **Đừng xoá**:

- 48 class JavaScript bám vào (`card`, `chip`, `ptab`, `post-row`, `is-open`…)
- 187 class được CSS tầng components dùng làm ngữ cảnh
  (ví dụ luật `.card--video .card__body`)

Xoá đi thì hoặc tương tác chết, hoặc bố cục vỡ mà không rõ nguyên nhân.
