# Chuyển CSS viết tay sang Tailwind — hướng dẫn chung

Bạn nhận **một gói** gồm nhiều mục CSS. Việc của bạn: với mỗi class component,
trả về chuỗi utility Tailwind tương đương, cộng phần CSS còn lại không diễn đạt
được bằng utility.

## Nguyên tắc

1. **Trung thành trước, đẹp sau.** Thiết kế này dùng nhiều giá trị lẻ (13px,
   20.625px, 306px). Dùng giá trị tuỳ ý `text-[13px]`, `leading-[20.625px]`,
   `w-[306px]` — đừng làm tròn về thang mặc định. Sai một pixel là lệch bản đo.
2. **Màu phải dùng token**, không viết hex: `text-primary-800` chứ không
   `text-[#B80001]`. Bảng token ở dưới. Màu nào không có trong bảng thì mới
   dùng `[#hex]`.
3. **Chỉ dùng utility có trong danh sách được hỗ trợ.** Trình biên dịch sẽ ném
   lỗi nếu gặp class lạ, nên đừng bịa.
4. **Không đổi cấu trúc HTML.** Chỉ ánh xạ class → utility.

## Cái gì cho vào `keep`

Utility không diễn đạt được thì để nguyên CSS trong `keep`:

- `::before` / `::after` có `content`
- `@keyframes`, `animation`
- selector phức tạp: `.a + .b`, `.a > * + *`, `:not()`, `[hidden]`
- thuộc tính hiếm: `scroll-snap-type`, `-webkit-overflow-scrolling`,
  `backdrop-filter` phức tạp, `env(safe-area-inset-*)`, `aspect-ratio` lồng nhau
- gradient nhiều điểm dừng
- `scrollbar-width`, `::-webkit-scrollbar`

Phần `keep` sẽ được giữ trong `@layer components`, vẫn dùng chính tên class đó.

## Token màu

| token | hex | |
|---|---|---|
| `primary-50` | #FFEFEF | `primary-500` #FF1F20 |
| `primary-100` | #FFDCDC | `primary-600` #FF0001 |
| `primary-200` | #FFBFBF | `primary-700` #DB0001 |
| `primary-300` | #FF9293 | **`primary-800` #B80001 ← màu thương hiệu** |
| `primary-400` | #FF5455 | `primary-900` #940809 · `primary-950` #520000 |

Màu cũ `--gnm-red: #d92b3a` **đổi thành `primary-800`**.

| token | hex | dùng cho |
|---|---|---|
| `ink` | #1A1A1A | chữ chính (cũ `--ink: #1c1c1e`) |
| `ink-strong` | #101828 | tiêu đề đậm |
| `ink-muted` | #8E8E93 | chữ mờ |
| `ink-action` | #4F4F55 | chữ phụ |
| `ink-faint` | #99A1AF | chữ rất mờ |
| `surface` | #FFFFFF | nền thẻ |
| `surface-soft` | #FAFAFA | nền trang |
| `surface-fill` | #F3F4F6 | nền nhạt |
| `surface-dark` | #101828 | nền tối |
| `line` | #ECECEC | `line-2` #E7E7E8 · `line-3` #E5E7EB |
| `icon` | #B7B7BC | `icon-dark` #4B5563 · `icon-grey` #9CA3AF |
| `gold` `silver` `bronze` `star` | | huy hiệu |
| `ok` `ok-soft` `warn` `warn-soft` `info` `info-soft` `danger` `danger-soft` | | trạng thái |

## Utility được hỗ trợ

**Bố cục** `block inline-block inline flex inline-flex grid inline-grid contents hidden list-item table table-cell`
**Vị trí** `static relative absolute fixed sticky` · `inset-0 inset-x-0 inset-y-0 top-* right-* bottom-* left-*` (nhận `-` âm và `[..]`)
**Flex** `flex-row flex-col flex-wrap flex-nowrap flex-1 flex-auto flex-initial flex-none grow grow-0 shrink shrink-0`
**Canh** `items-{start,end,center,baseline,stretch}` `justify-{start,end,center,between,around,evenly}` `self-{start,end,center,stretch,auto}` `place-items-center`
**Lưới** `grid-cols-N` `gap-* gap-x-* gap-y-*`
**Khoảng cách** `p px py pt pr pb pl` + `m mx my mt mr mb ml` (âm: `-mt-2`), giá trị: số (`4`→1rem), `px`, `auto`, `[14px]`
**Kích thước** `w-* h-* size-* min-w-* min-h-* max-w-* max-h-*` — `full screen min max fit` `1/2` `[306px]` · `max-w-shell` = 480px
**Chữ** `text-{xs,sm,base,lg,xl,2xl,3xl,4xl}` `text-[13px]` `font-{normal,medium,semibold,bold,extrabold}` `leading-{none,tight,snug,normal,relaxed}` `leading-[20px]` `tracking-{tight,normal,wide}` `tracking-[-.015em]` `text-{left,center,right}` `uppercase lowercase capitalize italic underline no-underline truncate tabular-nums antialiased whitespace-nowrap whitespace-normal break-words line-clamp-N`
**Màu** `text-{token}` `bg-{token}` `border-{token}` `fill-{token}` `stroke-{token}`
**Nền** `bg-gradient-to-{t,b,l,r,tr,br,tl,bl}` `from-{token}` `to-{token}` `bg-cover bg-center bg-no-repeat`
**Viền** `border border-0 border-{t,r,b,l} border-2 border-[3px] border-solid border-none`
**Bo góc** `rounded rounded-{none,sm,md,lg,xl,2xl,3xl,full,card}` `rounded-{t,b,l,r}-*` `rounded-[6px]` — **`rounded-card` = 4px**, dùng cho thẻ
**Bóng** `shadow-{sm,DEFAULT,md,lg,none,card,panel,header,badge}` — `shadow-card` là bóng thẻ chuẩn của hệ
**Hiệu ứng** `opacity-N` `backdrop-blur-[4px]`
**Ảnh** `object-cover object-contain object-center` `aspect-square aspect-video aspect-[370/208]`
**Tràn** `overflow-{hidden,visible,auto}` `overflow-x-auto overflow-y-auto overflow-x-hidden`
**Chuyển động** `transition transition-colors transition-transform transition-opacity transition-none duration-[180] ease-out ease-in-out`
**Biến hình** `translate-x-* translate-y-*` (nhận âm và `[..]`)
**Khác** `z-* cursor-pointer select-none pointer-events-none appearance-none resize-none list-none sr-only isolate scroll-smooth snap-x snap-proximity snap-start scrollbar-none`

**Biến thể** `hover: active: focus: focus-visible: first: last: disabled: before: after: group-hover: group-active: aria-selected: aria-pressed: aria-current: motion-reduce:` và breakpoint `xs: sm: md: lg: xl:` (xs = 480px)

## Định dạng trả về

Chỉ trả JSON, không kèm lời dẫn:

```json
{
  "map": {
    "card": { "tw": "relative bg-surface rounded-card shadow-card overflow-hidden", "keep": "" },
    "hscroll": { "tw": "flex gap-3 overflow-x-auto", "keep": ".hscroll{scrollbar-width:none;scroll-snap-type:x proximity}.hscroll::-webkit-scrollbar{display:none}" }
  },
  "ghi_chu": "điều gì cần người sau biết"
}
```

- Khoá `map` phải là **đúng tên class** trong CSS (không có dấu chấm).
- `tw` là chuỗi utility cách nhau bằng dấu cách.
- `keep` là CSS nguyên văn, giữ nguyên selector gốc; rỗng nếu không cần.
- Class nào chỉ là móc cho JS (không có style) thì `tw: ""`, `keep: ""`.
