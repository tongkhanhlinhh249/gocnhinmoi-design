# Góc Nhìn Mới — bản Tailwind

Bản prototype 16 màn hình, CSS viết tay đã được chuyển sang utility Tailwind
theo đúng cấu hình đang chạy ở `cdn.gocnhinmoi.com`.

## Chạy thử

```bash
python3 serve.py 3000 .
```

Không cần Node, không cần build — `assets/css/tailwind.css` là file tĩnh đã biên dịch sẵn.

## Vì sao CSS là file tĩnh chứ không dùng Tailwind CLI

Máy dựng bản này không có Node, và bản publish bị CSP chặn CDN Tailwind. Nên CSS
được sinh bằng một trình biên dịch nhỏ (`tw/twc.py`) chỉ xuất đúng những utility
mà markup dùng tới. Khi bạn đưa sang Next.js thì bỏ file này đi, dùng Tailwind
thật với `tailwind.config.js` kèm theo — markup giữ nguyên, không phải sửa.

## Token lấy từ site thật

Thang `primary` đọc trực tiếp từ CSS production, không đặt lại:

| token | hex | | token | hex |
|---|---|---|---|---|
| `primary-50` | #FFEFEF | | `primary-500` | #FF1F20 |
| `primary-100` | #FFDCDC | | `primary-600` | #FF0001 |
| `primary-200` | #FFBFBF | | `primary-700` | #DB0001 |
| `primary-300` | #FF9293 | | **`primary-800`** | **#B80001** ← thương hiệu |
| `primary-400` | #FF5455 | | `primary-900` · `primary-950` | #940809 · #520000 |

Hai thay đổi so với prototype cũ, đều là để khớp site thật:

- màu thương hiệu **#d92b3a → #B80001** (`primary-800`)
- font **Be Vietnam Pro → Noto Sans** (`var(--font-notosans)`)

## Thang bo góc

Cố ý **ghi đè** mặc định của Tailwind cho khớp token dự án — nếu để mặc định thì
mọi thẻ lệch 2–4px:

| lớp | Tailwind mặc định | ở đây |
|---|---|---|
| `rounded-card` | — | 4px (`--r-card`) |
| `rounded-md` | 6px | **8px** (`--r-md`) |
| `rounded-lg` | 8px | **12px** (`--r-lg`) |
| `rounded-full` | 9999px | 999px (`--r-pill`) |

## Cấu trúc CSS

`assets/css/tailwind.css` gồm bốn tầng, theo đúng thứ tự Tailwind:

1. **preflight** — reset chuẩn Tailwind v3
2. **base** — token dưới dạng biến CSS, nền trang, cỡ chữ gốc 15px
3. **components** — 189 khối CSS mà utility không diễn đạt được
4. **utilities** — 424 lớp utility, chỉ những lớp thực sự dùng

### Vì sao vẫn còn tầng components

Utility không viết được những thứ này, giữ CSS là đúng chứ không phải chưa làm xong:

- `::before` / `::after` có `content`
- `@keyframes`, `animation`
- selector ngữ cảnh: `.card--video .card__body`, `.rank-row + .rank-row`
- `env(safe-area-inset-*)`, `scroll-snap-type`, `-webkit-overflow-scrolling`
- `::-webkit-scrollbar`, `::placeholder`
- gradient nhiều điểm dừng

## Class được giữ lại trong markup

Ngoài utility, markup còn giữ tên class cũ ở hai trường hợp — **đừng xoá**:

- **48 class JavaScript bám vào** (`querySelector`, `classList`): `card`, `chip`,
  `ptab`, `post-row`, `drawer__link`, `is-open`, `is-active`…
- **187 class bị CSS tầng components nhắc tới** làm ngữ cảnh

Xoá chúng đi thì hoặc tương tác chết, hoặc bố cục vỡ mà không rõ vì sao.

## Đối chiếu với bản gốc

So từng thuộc tính computed style trên **7.477 phần tử / 16 trang**:

| | |
|---|---|
| Tổng điểm lệch | 921 |
| Lệch do đổi font (chiều rộng chữ, vị trí căn giữa, đơn vị `ch`) | 867 |
| **Lệch còn lại** | **54** |

54 điểm còn lại đều là quy ước Tailwind, không phải lỗi:

- 44 — preflight bỏ đệm mặc định của `button`/`input`
- 6 — `repeat(2, 1fr)` viết thành `repeat(2, minmax(0,1fr))`
- 2 — `aspect-ratio: 400/400` viết thành `1/1`
- 2 — `align-items: end` viết thành `flex-end`

Kiểm tương tác sau khi chuyển: đổi tab, lọc trạng thái bài viết, drawer, nút theo
dõi — chạy đủ, không lỗi JS.

## Dung lượng

| | trước | sau |
|---|---|---|
| CSS | 97.808 ký tự | **47.147** |
