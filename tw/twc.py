# -*- coding: utf-8 -*-
"""Trình biên dịch Tailwind tối giản, chạy bằng Python.

Vì sao tự viết thay vì dùng Tailwind CLI: máy này không có Node, mà CDN Tailwind
thì bị CSP của trang publish chặn. Cách này xuất ra một file CSS tĩnh, chạy
offline, không phụ thuộc mạng.

Nguyên tắc quan trọng: gặp class không dịch được thì NÉM LỖI, không bỏ qua.
Bỏ qua âm thầm nghĩa là một chỗ nào đó mất sạch style mà không ai biết.
"""
import re

# ---------------------------------------------------------------- theme
PRIMARY = {
    '50': '#FFEFEF', '100': '#FFDCDC', '200': '#FFBFBF', '300': '#FF9293',
    '400': '#FF5455', '500': '#FF1F20', '600': '#FF0001', '700': '#DB0001',
    '800': '#B80001', '900': '#940809', '950': '#520000',
}
COLORS = {
    'transparent': 'transparent', 'current': 'currentColor', 'inherit': 'inherit',
    'white': '#FFFFFF', 'black': '#000000',
    'ink': '#1A1A1A', 'ink-strong': '#101828', 'ink-muted': '#8E8E93',
    'ink-action': '#4F4F55', 'ink-faint': '#99A1AF',
    'surface': '#FFFFFF', 'surface-soft': '#FAFAFA', 'surface-fill': '#F3F4F6',
    'surface-dark': '#101828',
    'line': '#ECECEC', 'line-2': '#E7E7E8', 'line-3': '#E5E7EB',
    'icon': '#B7B7BC', 'icon-dark': '#4B5563', 'icon-grey': '#9CA3AF',
    'gold': '#D4AF37', 'silver': '#A8A9AD', 'bronze': '#CD7F32', 'star': '#FBBF24',
    'ok': '#0F7B45', 'ok-soft': '#E6F4EC',
    'warn': '#8A5A00', 'warn-soft': '#FDF1DC',
    'info': '#1554B8', 'info-soft': '#E8F0FD',
    'danger': '#B42318', 'danger-soft': '#FDECEC',
}
COLORS.update({'primary-' + k: v for k, v in PRIMARY.items()})
COLORS['primary'] = PRIMARY['800']

FONT_SIZE = {
    'xs': ('.75rem', '1rem'), 'sm': ('.875rem', '1.25rem'), 'base': ('1rem', '1.5rem'),
    'lg': ('1.125rem', '1.75rem'), 'xl': ('1.25rem', '1.75rem'), '2xl': ('1.5rem', '2rem'),
    '3xl': ('1.875rem', '2.25rem'), '4xl': ('2.25rem', '2.5rem'),
}
FONT_WEIGHT = {'thin': 100, 'light': 300, 'normal': 400, 'medium': 500,
               'semibold': 600, 'bold': 700, 'extrabold': 800, 'black': 900}
# Thang bo góc lấy theo token của dự án, KHÔNG theo mặc định Tailwind.
# Mặc định rounded-md = 6px và rounded-lg = 8px, trong khi --r-md = 8px và
# --r-lg = 12px. Giữ tên Tailwind mà đổi giá trị thì mọi component chuyển theo
# tên đều đúng ngay, khỏi phải sửa từng chỗ.
RADIUS = {'none': '0', 'sm': '.125rem', 'DEFAULT': '.25rem',
          'card': '4px',      # --r-card
          'md': '8px',        # --r-md
          'lg': '12px',       # --r-lg
          'xl': '.75rem', '2xl': '1rem', '3xl': '1.5rem',
          'full': '999px'}    # --r-pill
SHADOW = {
    'sm': '0 1px 2px 0 rgb(0 0 0/0.05)',
    'DEFAULT': '0 1px 3px 0 rgb(0 0 0/0.1), 0 1px 2px -1px rgb(0 0 0/0.1)',
    'md': '0 4px 6px -1px rgb(0 0 0/0.1), 0 2px 4px -2px rgb(0 0 0/0.1)',
    'lg': '0 10px 15px -3px rgb(0 0 0/0.1), 0 4px 6px -4px rgb(0 0 0/0.1)',
    'none': '0 0 #0000',
    'card':   '0 1px 2px 0 rgba(16,24,40,.06), 0 6px 12px -4px rgba(16,24,40,.12)',
    'panel':  '0 1px 1px rgba(16,24,40,.06), 0 4px 4px rgba(16,24,40,.12)',
    'header': '0 1px 1.5px rgba(0,0,0,.06)',
    'badge':  '0 1px 1.5px rgba(0,0,0,.1), 0 1px 1px rgba(0,0,0,.1)',
}
SCREENS = {'xs': '480px', 'sm': '640px', 'md': '768px', 'lg': '1024px',
           'xl': '1280px', '2xl': '1536px'}
MAXW = {'none': 'none', 'full': '100%', 'shell': '480px', 'prose': '65ch',
        'screen-sm': '640px', 'screen-md': '768px'}


def _sp(v):
    """Thang khoảng cách: số → rem, hoặc từ khoá, hoặc giá trị tuỳ ý [..]."""
    if v.startswith('[') and v.endswith(']'):
        return v[1:-1].replace('_', ' ')
    if v in ('px',): return '1px'
    if v in ('auto',): return 'auto'
    if v in ('full',): return '100%'
    if v in ('screen',): return '100vh'
    if v in ('min',): return 'min-content'
    if v in ('max',): return 'max-content'
    if v in ('fit',): return 'fit-content'
    if re.fullmatch(r'\d+/\d+', v):
        a, b = v.split('/'); return '%.6g%%' % (int(a) / int(b) * 100)
    if re.fullmatch(r'\d+(\.\d+)?', v):
        return '%.6grem' % (float(v) / 4)
    return None


def _hex_rgba(hexa, alpha):
    h = hexa.lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return 'rgba(%d,%d,%d,%s)' % (r, g, b, alpha)


def _color(v):
    # hậu tố /50 hoặc /[.42] là độ mờ, giống cú pháp Tailwind
    if '/' in v:
        ten, mo = v.rsplit('/', 1)
        goc = COLORS.get(ten)
        if goc and goc.startswith('#'):
            a = mo[1:-1] if mo.startswith('[') else ('%.6g' % (int(mo) / 100) if mo.isdigit() else None)
            if a is not None:
                return _hex_rgba(goc, a)
        return None
    if v.startswith('[') and v.endswith(']'):
        trong = v[1:-1].replace('_', ' ')
        # [13px] là ĐỘ DÀI, không phải màu. Nếu nhận bừa thì text-[13px] sinh ra
        # color:13px — trình duyệt bỏ qua, và cỡ chữ âm thầm sai suốt cả trang.
        if re.fullmatch(r'-?[\d.]+(px|rem|em|%|vh|vw|ch|pt)?', trong):
            return None
        return trong
    return COLORS.get(v)


# ---------------------------------------------------------------- utilities
def _sides(pre, prop):
    return {
        pre:        [prop],
        pre + 'x':  [prop + '-left', prop + '-right'],
        pre + 'y':  [prop + '-top', prop + '-bottom'],
        pre + 't':  [prop + '-top'],
        pre + 'r':  [prop + '-right'],
        pre + 'b':  [prop + '-bottom'],
        pre + 'l':  [prop + '-left'],
        pre + 's':  [prop + '-inline-start'],
        pre + 'e':  [prop + '-inline-end'],
    }

PAD = _sides('p', 'padding')
MAR = _sides('m', 'margin')

STATIC = {
    'block': 'display:block', 'inline-block': 'display:inline-block',
    'inline': 'display:inline', 'flex': 'display:flex',
    'inline-flex': 'display:inline-flex', 'grid': 'display:grid',
    'inline-grid': 'display:inline-grid', 'contents': 'display:contents',
    'hidden': 'display:none', 'list-item': 'display:list-item',
    'table': 'display:table', 'table-cell': 'display:table-cell',
    'static': 'position:static', 'relative': 'position:relative',
    'absolute': 'position:absolute', 'fixed': 'position:fixed',
    'sticky': 'position:sticky',
    'flex-row': 'flex-direction:row', 'flex-col': 'flex-direction:column',
    'flex-wrap': 'flex-wrap:wrap', 'flex-nowrap': 'flex-wrap:nowrap',
    'flex-1': 'flex:1 1 0%', 'flex-auto': 'flex:1 1 auto',
    'flex-initial': 'flex:0 1 auto', 'flex-none': 'flex:none',
    'grow': 'flex-grow:1', 'grow-0': 'flex-grow:0',
    'shrink': 'flex-shrink:1', 'shrink-0': 'flex-shrink:0',
    'items-start': 'align-items:flex-start', 'items-end': 'align-items:flex-end',
    'items-center': 'align-items:center', 'items-baseline': 'align-items:baseline',
    'items-stretch': 'align-items:stretch',
    'justify-start': 'justify-content:flex-start', 'justify-end': 'justify-content:flex-end',
    'justify-center': 'justify-content:center', 'justify-between': 'justify-content:space-between',
    'justify-around': 'justify-content:space-around', 'justify-evenly': 'justify-content:space-evenly',
    'self-start': 'align-self:flex-start', 'self-end': 'align-self:flex-end',
    'self-center': 'align-self:center', 'self-stretch': 'align-self:stretch',
    'self-auto': 'align-self:auto',
    'place-items-center': 'place-items:center',
    'text-left': 'text-align:left', 'text-center': 'text-align:center',
    'text-right': 'text-align:right',
    'uppercase': 'text-transform:uppercase', 'lowercase': 'text-transform:lowercase',
    'capitalize': 'text-transform:capitalize', 'normal-case': 'text-transform:none',
    'italic': 'font-style:italic', 'not-italic': 'font-style:normal',
    'underline': 'text-decoration-line:underline', 'no-underline': 'text-decoration-line:none',
    'tabular-nums': 'font-variant-numeric:tabular-nums',
    'antialiased': '-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale',
    'truncate': 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap',
    'whitespace-nowrap': 'white-space:nowrap', 'whitespace-normal': 'white-space:normal',
    'break-words': 'overflow-wrap:break-word',
    'overflow-hidden': 'overflow:hidden', 'overflow-visible': 'overflow:visible',
    'overflow-auto': 'overflow:auto',
    'overflow-x-auto': 'overflow-x:auto', 'overflow-y-auto': 'overflow-y:auto',
    'overflow-x-hidden': 'overflow-x:hidden', 'overflow-y-hidden': 'overflow-y:hidden',
    'object-cover': 'object-fit:cover', 'object-contain': 'object-fit:contain',
    'object-center': 'object-position:center',
    'bg-cover': 'background-size:cover', 'bg-center': 'background-position:center',
    'bg-no-repeat': 'background-repeat:no-repeat',
    'border': 'border-width:1px', 'border-0': 'border-width:0',
    'border-t': 'border-top-width:1px', 'border-r': 'border-right-width:1px',
    'border-b': 'border-bottom-width:1px', 'border-l': 'border-left-width:1px',
    'border-t-0': 'border-top-width:0', 'border-b-0': 'border-bottom-width:0',
    'border-solid': 'border-style:solid', 'border-none': 'border-style:none',
    'rounded': 'border-radius:.25rem',
    'cursor-pointer': 'cursor:pointer', 'cursor-default': 'cursor:default',
    'select-none': 'user-select:none',
    'pointer-events-none': 'pointer-events:none', 'pointer-events-auto': 'pointer-events:auto',
    'appearance-none': 'appearance:none', 'resize-none': 'resize:none',
    'list-none': 'list-style-type:none',
    'transition': ('transition-property:color,background-color,border-color,text-decoration-color,'
                   'fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;'
                   'transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:150ms'),
    'transition-colors': ('transition-property:color,background-color,border-color,fill,stroke;'
                          'transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:150ms'),
    'transition-transform': ('transition-property:transform;'
                             'transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:150ms'),
    'transition-opacity': ('transition-property:opacity;'
                           'transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:150ms'),
    'transition-none': 'transition-property:none',
    'ease-out': 'transition-timing-function:cubic-bezier(0,0,.2,1)',
    'ease-in-out': 'transition-timing-function:cubic-bezier(.4,0,.2,1)',
    'scroll-smooth': 'scroll-behavior:smooth',
    'snap-x': 'scroll-snap-type:x var(--tw-scroll-snap-strictness)',
    'snap-proximity': '--tw-scroll-snap-strictness:proximity',
    'snap-start': 'scroll-snap-align:start',
    'sr-only': ('position:absolute;width:1px;height:1px;padding:0;margin:-1px;'
                'overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0'),
    'isolate': 'isolation:isolate',
    'scrollbar-none': 'scrollbar-width:none;-ms-overflow-style:none',
}

INSET = {'inset': ['top', 'right', 'bottom', 'left'], 'inset-x': ['left', 'right'],
         'inset-y': ['top', 'bottom'], 'top': ['top'], 'right': ['right'],
         'bottom': ['bottom'], 'left': ['left']}


def decl(cls):
    """Trả về chuỗi khai báo CSS cho một class, hoặc None nếu không nhận ra."""
    if cls in STATIC:
        return STATIC[cls]

    m = re.fullmatch(r'(-?)([a-z]+)-(.+)', cls)
    if not m:
        return None
    neg, key, val = m.group(1), m.group(2), m.group(3)

    # khoảng cách
    for tbl in (PAD, MAR):
        if key in tbl:
            v = _sp(val)
            if v is None: return None
            if neg and not v.startswith('-'): v = '-' + v
            return ';'.join(p + ':' + v for p in tbl[key])

    # inset-x / inset-y có gạch trong tên key nên phải soi trước khi tách
    for k2 in ('inset-x', 'inset-y'):
        if cls.lstrip('-').startswith(k2 + '-'):
            v = _sp(cls.lstrip('-')[len(k2) + 1:])
            if v is None: return None
            if neg: v = '-' + v
            return ';'.join(p2 + ':' + v for p2 in INSET[k2])

    if key in INSET:
        v = _sp(val)
        if v is None: return None
        if neg: v = '-' + v
        return ';'.join(p + ':' + v for p in INSET[key])

    if key in ('w', 'h', 'size'):
        v = _sp(val)
        if v is None: return None
        if key == 'size': return 'width:%s;height:%s' % (v, v)
        return ('width:' if key == 'w' else 'height:') + v

    if key == 'gap':
        v = _sp(val)
        return None if v is None else 'gap:' + v
    if cls.startswith('gap-x-') or cls.startswith('gap-y-'):
        v = _sp(cls[6:])
        return None if v is None else ('column-gap:' if cls[4] == 'x' else 'row-gap:') + v

    if key == 'z':
        return 'z-index:' + (val[1:-1] if val.startswith('[') else val)
    if key == 'opacity':
        return 'opacity:%.6g' % (int(val) / 100) if val.isdigit() else None

    if key == 'text':
        if val in FONT_SIZE:
            fs, lh = FONT_SIZE[val]; return 'font-size:%s;line-height:%s' % (fs, lh)
        c = _color(val)
        if c: return 'color:' + c
        if val.startswith('['): return 'font-size:' + val[1:-1]
        return None
    if key == 'font':
        if val in FONT_WEIGHT: return 'font-weight:%d' % FONT_WEIGHT[val]
        if val == 'sans': return "font-family:var(--font-notosans),'Noto Sans',ui-sans-serif,system-ui,sans-serif"
        if val == 'display': return "font-family:'DFVN Mighty Wings',var(--font-notosans),sans-serif"
        return None
    if key == 'leading':
        if val == 'none': return 'line-height:1'
        if val == 'tight': return 'line-height:1.25'
        if val == 'snug': return 'line-height:1.375'
        if val == 'normal': return 'line-height:1.5'
        if val == 'relaxed': return 'line-height:1.625'
        v = _sp(val)
        return None if v is None else 'line-height:' + v
    if key == 'tracking':
        t = {'tighter': '-.05em', 'tight': '-.025em', 'normal': '0',
             'wide': '.025em', 'wider': '.05em'}
        if val in t: return 'letter-spacing:' + t[val]
        if val.startswith('['): return 'letter-spacing:' + val[1:-1]
        return None

    if key == 'bg':
        c = _color(val)
        if c: return 'background-color:' + c
        if val.startswith('gradient-to-'):
            d = {'t': 'top', 'b': 'bottom', 'l': 'left', 'r': 'right',
                 'tr': 'top right', 'br': 'bottom right',
                 'tl': 'top left', 'bl': 'bottom left'}.get(val[12:])
            if d: return ('background-image:linear-gradient(to %s,'
                          'var(--tw-gradient-from),var(--tw-gradient-to))' % d)
        return None
    if key in ('from', 'to'):
        c = _color(val)
        return None if c is None else '--tw-gradient-%s:%s' % (key, c)

    if key == 'border':
        c = _color(val)
        if c: return 'border-color:' + c
        if val.isdigit(): return 'border-width:%spx' % val
        if val.startswith('['): return 'border-width:' + val[1:-1]
        for s, p in (('t-', 'top'), ('r-', 'right'), ('b-', 'bottom'), ('l-', 'left')):
            if val.startswith(s):
                phan = val[2:]
                cc = _color(phan)
                if cc: return 'border-%s-color:%s' % (p, cc)
                if phan.isdigit(): return 'border-%s-width:%spx' % (p, phan)
                if phan.startswith('[') and phan.endswith(']'):
                    return 'border-%s-width:%s' % (p, phan[1:-1])
        return None

    if key == 'rounded':
        if val in RADIUS: return 'border-radius:' + RADIUS[val]
        if val.startswith('['): return 'border-radius:' + val[1:-1]
        for s, props in (('t-', ('top-left', 'top-right')), ('b-', ('bottom-left', 'bottom-right')),
                         ('l-', ('top-left', 'bottom-left')), ('r-', ('top-right', 'bottom-right'))):
            if val.startswith(s):
                r = RADIUS.get(val[2:]) or (val[2:][1:-1] if val[2:].startswith('[') else None)
                if r: return ';'.join('border-%s-radius:%s' % (p, r) for p in props)
        return None

    if key == 'shadow':
        if val in SHADOW: return 'box-shadow:' + SHADOW[val]
        if val.startswith('['): return 'box-shadow:' + val[1:-1].replace('_', ' ')
        return None

    if key == 'grid':
        m2 = re.fullmatch(r'cols-(\d+)', val)
        if m2: return 'grid-template-columns:repeat(%s,minmax(0,1fr))' % m2.group(1)
        return None
    if key == 'aspect':
        a = {'square': '1/1', 'video': '16/9', 'auto': 'auto'}
        if val in a: return 'aspect-ratio:' + a[val]
        if val.startswith('['): return 'aspect-ratio:' + val[1:-1].replace('_', ' ')
        return None

    if key == 'min' or key == 'max':
        m2 = re.fullmatch(r'([wh])-(.+)', val)
        if not m2: return None
        prop = 'width' if m2.group(1) == 'w' else 'height'
        if key == 'max' and prop == 'width' and m2.group(2) in MAXW:
            return 'max-width:' + MAXW[m2.group(2)]
        v = _sp(m2.group(2))
        return None if v is None else '%s-%s:%s' % (key, prop, v)

    if key == 'duration':
        return 'transition-duration:%sms' % (val[1:-1] if val.startswith('[') else val)
    if key == 'backdrop':
        m2 = re.fullmatch(r'blur-\[?([\w.]+)\]?', val)
        if m2:
            b = m2.group(1)
            return '-webkit-backdrop-filter:blur(%s);backdrop-filter:blur(%s)' % (b, b)
        return None
    if key == 'translate':
        m2 = re.fullmatch(r'([xy])-(.+)', val)
        if m2:
            v = _sp(m2.group(2))
            if v is None: return None
            if neg: v = '-' + v
            return 'transform:translate%s(%s)' % (m2.group(1).upper(), v)
        return None
    if key == 'fill':
        c = _color(val); return None if c is None else 'fill:' + c
    if key == 'stroke':
        c = _color(val); return None if c is None else 'stroke:' + c
    if key == 'line':
        m2 = re.fullmatch(r'clamp-(\d+)', val)
        if m2:
            return ('display:-webkit-box;-webkit-box-orient:vertical;'
                    '-webkit-line-clamp:%s;overflow:hidden' % m2.group(1))
        return None
    return None


# ---------------------------------------------------------------- variants
VARIANT = {
    'hover': lambda s: s + ':hover',
    'active': lambda s: s + ':active',
    'focus': lambda s: s + ':focus',
    'focus-visible': lambda s: s + ':focus-visible',
    'first': lambda s: s + ':first-child',
    'last': lambda s: s + ':last-child',
    'disabled': lambda s: s + ':disabled',
    'before': lambda s: s + '::before',
    'after': lambda s: s + '::after',
    'group-hover': lambda s: '.group:hover ' + s,
    'group-active': lambda s: '.group:active ' + s,
    'aria-selected': lambda s: s + '[aria-selected="true"]',
    'aria-pressed': lambda s: s + '[aria-pressed="true"]',
    'aria-current': lambda s: s + '[aria-current="page"]',
    'peer-checked': lambda s: '.peer:checked ~ ' + s,
    'motion-reduce': None,   # xử lý riêng: bọc media query
}
ESC = re.compile(r'([:.\[\]()/%!#,])')


def _esc(cls):
    return ESC.sub(r'\\\1', cls)


class KhongDich(Exception):
    pass


def compile_classes(classes, strict=True):
    """Nhận tập class → trả về CSS. strict=True thì class lạ sẽ ném lỗi."""
    def uu_tien(cls):
        d = decl(cls.split(':')[-1]) or ''
        if 'font-size' in d: return 0      # cỡ chữ đứng trước
        if 'line-height' in d: return 2    # chiều cao dòng đứng sau để ghi đè được
        return 1

    thuong, theo_mq, loi = [], {}, []
    for cls in sorted(classes, key=lambda c: (uu_tien(c), c)):
        phan = cls.split(':')
        goc, bien = phan[-1], phan[:-1]
        d = decl(goc)
        if d is None:
            loi.append(cls); continue
        sel = '.' + _esc(cls)
        mq = None
        for v in bien:
            if v in SCREENS:
                mq = '@media (min-width:%s)' % SCREENS[v]
            elif v == 'motion-reduce':
                mq = '@media (prefers-reduced-motion:reduce)'
            elif v in VARIANT and VARIANT[v]:
                sel = VARIANT[v](sel)
            else:
                loi.append(cls); sel = None; break
        if sel is None: continue
        rule = '%s{%s}' % (sel, d)
        (theo_mq.setdefault(mq, []) if mq else thuong).append(rule)
    if loi and strict:
        raise KhongDich('không dịch được %d class: %s' % (len(loi), ', '.join(sorted(set(loi))[:25])))
    ra = list(thuong)
    for mq in sorted(k for k in theo_mq if k):
        ra.append('%s{%s}' % (mq, ''.join(theo_mq[mq])))
    return '\n'.join(ra), sorted(set(loi))


def quet_class(html):
    """Rút class từ HTML."""
    ra = set()
    for m in re.finditer(r'class="([^"]*)"', html):
        for c in m.group(1).split():
            if c: ra.add(c)
    return ra
