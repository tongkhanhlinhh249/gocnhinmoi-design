# Góc Nhìn Mới — bản thiết kế mobile

Bản dựng giao diện 16 màn hình của mạng xã hội Góc Nhìn Mới, viết bằng
**HTML + Tailwind**. Không build step, không phụ thuộc — mở file là chạy, deploy
tĩnh là xong.

## Chạy thử

```bash
python3 serve.py 3000 .
```

Mở `http://localhost:3000` — xem ở khung 375–390px cho đúng thiết kế.

## Cấu trúc

| | |
|---|---|
| `*.html` | 16 màn hình, dùng utility Tailwind |
| `assets/css/tailwind.css` | CSS tĩnh đã biên dịch, chạy không cần Node |
| `tailwind.config.js` | cấu hình khớp site thật, dán thẳng vào Next.js được |
| `tw/` | bộ công cụ sinh CSS từ bản đồ class |
| `design-css-goc/` | bản CSS viết tay trước khi chuyển — giữ để đối chiếu |

## 16 màn hình

**Tab chính** — Trang chủ · Nghe & Xem · Khám phá · Cá nhân

**Trang nội dung** — Chi tiết bài viết · Chi tiết địa điểm · Khám phá địa điểm ·
Photo · Bảng xếp hạng

**Chuyên mục** — Mới nhất · Hot hôm nay · Trà đàm · Góc mở · Quan điểm ·
Spotlight · Luận cổ suy kim

## Hệ thiết kế

Token lấy từ site production `cdn.gocnhinmoi.com`, không đặt lại:

| | |
|---|---|
| Màu thương hiệu | `primary-800` = **#B80001** |
| Thang màu | `primary-50` … `primary-950` |
| Font | Noto Sans (`var(--font-notosans)`) |
| Khung nội dung | `max-w-shell` = 480px |

### Bo góc — cố ý ghi đè mặc định Tailwind

Nếu để mặc định thì mọi thẻ lệch 2–4px so với thiết kế:

| lớp | Tailwind mặc định | ở đây |
|---|---|---|
| `rounded-card` | — | 4px |
| `rounded-md` | 6px | **8px** |
| `rounded-lg` | 8px | **12px** |
| `rounded-full` | 9999px | 999px |

## Khi port sang Next.js

1. Bỏ `assets/css/tailwind.css` đi, dùng Tailwind thật.
2. Copy `tailwind.config.js` vào dự án.
3. Markup giữ nguyên — **không phải sửa**.

Riêng phần `@layer components` trong `tailwind.css` (189 khối) thì mang theo:
đó là những thứ utility không diễn đạt được — `::before` có `content`,
`@keyframes`, selector ngữ cảnh như `.card--video .card__body`,
`env(safe-area-inset-*)`, `scroll-snap-type`, `::-webkit-scrollbar`.

## Lưu ý khi sửa markup

Markup giữ lại một số tên class cũ bên cạnh utility. **Đừng xoá**:

- **48 class JavaScript bám vào** — `card`, `chip`, `ptab`, `post-row`,
  `drawer__link`, `is-open`, `is-active`…
- **187 class được CSS tầng components dùng làm ngữ cảnh**

Xoá đi thì hoặc tương tác chết, hoặc bố cục vỡ mà không rõ nguyên nhân.

## Sinh lại CSS sau khi sửa

Sửa thiết kế ở `design-css-goc/`, rồi:

```bash
cd tw && python3 apply.py map.json ../design-css-goc ..
```

Công cụ sẽ dịch lại class sang utility và sinh lại `assets/css/tailwind.css`.
Gặp class không dịch được thì nó dừng và báo, không ghi file nửa vời.

## Đối chiếu với bản CSS gốc

So từng thuộc tính computed style trên **7.477 phần tử / 16 trang**:

| | |
|---|---|
| Tổng điểm lệch | 859 |
| Do đổi font (bề rộng chữ, vị trí căn giữa, đơn vị `ch`) | 807 |
| **Còn lại** | **52** |

52 điểm còn lại đều là quy ước Tailwind, không phải sai thiết kế:

- 44 — preflight bỏ đệm mặc định của `button`/`input`
- 3 — `repeat(2, 1fr)` viết thành `repeat(2, minmax(0,1fr))`
- 2 — `aspect-ratio: 400/400` viết thành `1/1`
- 2 — `align-items: end` viết thành `flex-end`
- 1 — `max-w-[30ch]` co lại vì `ch` phụ thuộc font

CSS: **97.808 → 47.147 ký tự**.
