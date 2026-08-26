# -*- coding: utf-8 -*-
"""Áp bản đồ class → utility vào HTML, rồi sinh file CSS Tailwind tĩnh.

Chạy: python3 apply.py <duong-dan-map.json>

Ba việc:
1. Thay class component trong HTML bằng chuỗi utility.
2. Giữ lại class nào JavaScript còn bám vào, hoặc còn CSS trong "keep".
3. Sinh assets/css/tailwind.css = preflight + base + components + utilities.

Class nào không dịch được thì DỪNG và báo, không ghi file nửa vời.
"""
import json, re, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import twc

TW = pathlib.Path(__file__).parent
# cho phép chỉ định thư mục nguồn/đích qua tham số dòng lệnh
GOC = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else TW.parent / "gnm"
DICH = pathlib.Path(sys.argv[3]) if len(sys.argv) > 3 else TW.parent / "gnm-tw"

MOC_JS = set(json.loads((TW / "moc-js.json").read_text(encoding="utf-8")))


def moc_trong_keep(bando):
    """Class nào bị nhắc trong CSS giữ lại thì phải còn trong markup.

    Nhiều luật giữ lại có dạng `.card--video .card__body{...}` — nếu gỡ
    `card--video` khỏi HTML vì nó "không còn style riêng" thì luật đó chết,
    và thẻ video mất bố cục mà không ai thấy lỗi ở đâu.
    """
    ra = set()
    for v in bando.values():
        k = v.get("keep") or ""
        for m in re.finditer(r"\.([a-zA-Z][\w-]*)", k):
            ra.add(m.group(1))
    return ra

# ---------------------------------------------------------------- preflight
PREFLIGHT = """\
*,::before,::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}
::before,::after{--tw-content:''}
html{line-height:1.5;-webkit-text-size-adjust:100%;tab-size:4;font-family:var(--font-notosans),'Noto Sans',ui-sans-serif,system-ui,sans-serif}
body{margin:0;line-height:inherit}
hr{height:0;color:inherit;border-top-width:1px}
abbr:where([title]){text-decoration:underline dotted}
h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit;margin:0}
a{color:inherit;text-decoration:inherit}
b,strong{font-weight:bolder}
code,kbd,samp,pre{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:1em}
small{font-size:80%}
table{text-indent:0;border-color:inherit;border-collapse:collapse}
button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;color:inherit;margin:0;padding:0}
button,select{text-transform:none}
button,[type='button'],[type='reset'],[type='submit']{-webkit-appearance:button;background-color:transparent;background-image:none}
:-moz-focusring{outline:auto}
progress{vertical-align:baseline}
summary{display:list-item}
blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre{margin:0}
fieldset{margin:0;padding:0}
legend{padding:0}
ol,ul,menu{list-style:none;margin:0;padding:0}
dialog{padding:0}
textarea{resize:vertical}
input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}
button,[role="button"]{cursor:pointer}
:disabled{cursor:default}
img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle}
img,video{max-width:100%;height:auto}
[hidden]{display:none!important}
"""

# Nền tảng riêng của sản phẩm: thứ preflight không lo, mà cũng không nên
# biến thành utility vì nó áp cho cả trang.
BASE = """\
:root{
 --font-notosans:'Noto Sans';
 --gnm-red:#B80001;--ink:#1A1A1A;--ink-strong:#101828;--text-action:#4F4F55;
 --text-muted:#8E8E93;--text-muted-2:#99A1AF;--text-placeholder:rgba(55,65,81,.5);
 --icon-muted:#B7B7BC;--icon-dark:#4B5563;--icon-grey:#9CA3AF;
 --bg:#FAFAFA;--surface:#FFFFFF;--surface-dark:#101828;--fill-soft:#F3F4F6;
 --line:#ECECEC;--line-2:#E7E7E8;--line-3:#E5E7EB;
 --ok:#0F7B45;--ok-soft:#E6F4EC;--warn:#8A5A00;--warn-soft:#FDF1DC;
 --info:#1554B8;--info-soft:#E8F0FD;--danger:#B42318;--danger-soft:#FDECEC;
 --gold:#D4AF37;--silver:#A8A9AD;--bronze:#CD7F32;--rank:#6B7280;--star:#FBBF24;
 --r-card:4px;--r-md:8px;--r-lg:12px;--r-pill:999px;
 --sh-card:0 1px 2px 0 rgba(16,24,40,.06),0 6px 12px -4px rgba(16,24,40,.12);
 --sh-panel:0 1px 1px rgba(16,24,40,.06),0 4px 4px rgba(16,24,40,.12);
 --sh-header:0 1px 1.5px rgba(0,0,0,.06);
 --sh-badge:0 1px 1.5px rgba(0,0,0,.1),0 1px 1px rgba(0,0,0,.1);
 --gutter:16px;--shell:480px;--header-h:64px;
 --ease:cubic-bezier(.22,.61,.36,1);
 --stick-top:calc(var(--header-h) + env(safe-area-inset-top));
 /* bí danh kiểu Tailwind cho cùng các giá trị trên */
 --color-primary-800:#B80001;--color-ink:#1A1A1A;--color-ink-strong:#101828;
 --color-ink-action:#4F4F55;--color-ink-muted:#8E8E93;--color-ink-faint:#99A1AF;
 --color-surface:#FFFFFF;--color-surface-soft:#FAFAFA;--color-surface-fill:#F3F4F6;
 --color-surface-dark:#101828;--color-line:#ECECEC;--color-line-2:#E7E7E8;
 --color-line-3:#E5E7EB;--color-icon:#B7B7BC;--color-icon-dark:#4B5563;
 --color-icon-grey:#9CA3AF;--color-star:#FBBF24;--color-gold:#D4AF37;
 --color-silver:#A8A9AD;--color-bronze:#CD7F32;
 --color-ok:#0F7B45;--color-warn:#8A5A00;--color-info:#1554B8;--color-danger:#B42318;
}
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{background:#FAFAFA;color:#1A1A1A;font-size:15px;line-height:1.4;overflow-x:hidden}
html{-webkit-text-size-adjust:100%}
/* border:0 đặt luôn border-style:none, mà style none thì width tính ra 0 dù
   .border có khai báo 1px — mọi nút sẽ mất viền. Giữ style solid, chỉ đưa
   độ dày về 0. */
button{background:none;border:0 solid;font:inherit;color:inherit}
a{-webkit-tap-highlight-color:transparent}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}
/* Ba luật dưới đây không gắn vào class nào nên bản đồ class→utility không nhặt
   được. Thiếu chúng thì: thanh chip hở 64px khi header ẩn, bàn phím mất vòng
   focus, và hàng cuối khối đỏ thừa một đường kẻ. */
body.is-header-hidden{--stick-top:env(safe-area-inset-top)}
:focus-visible{outline:2px solid var(--gnm-red);outline-offset:2px;border-radius:4px}
.redlist__list>.redrow:last-child{padding-bottom:0;border-bottom:0}
"""


def nap_map(duong):
    d = json.loads(pathlib.Path(duong).read_text(encoding="utf-8"))
    return d if "map" not in d else d["map"]


def thay_class(html, bando):
    """Đổi class component thành utility, giữ class nào còn cần."""
    thieu = set()

    def doi(m):
        ra = []
        for c in m.group(1).split():
            if c not in bando:
                ra.append(c)                       # class lạ: giữ nguyên, báo sau
                if c not in MOC_JS and not c.startswith("is-"):
                    thieu.add(c)
                continue
            v = bando[c]
            giu = bool(v.get("keep")) or c in MOC_JS or c.startswith("is-")
            if giu:
                ra.append(c)
            for u in v.get("tw", "").split():
                if u not in ra:
                    ra.append(u)
        return 'class="%s"' % " ".join(ra)

    return re.sub(r'class="([^"]*)"', doi, html), thieu


def main():
    if len(sys.argv) < 2:
        print("cần đường dẫn map.json"); return 1
    bando = nap_map(sys.argv[1])
    global MOC_JS
    them = moc_trong_keep(bando)
    MOC_JS = MOC_JS | them
    print("bản đồ: %d class | giữ thêm %d class vì bị CSS giữ lại nhắc tới"
          % (len(bando), len(them - set(json.loads((TW / 'moc-js.json').read_text(encoding='utf-8'))))))

    # ---- 1. sửa HTML ----
    tat_ca_class, thieu_tong = set(), set()
    trang = [p for p in sorted(GOC.glob("*.html")) if not p.stem.startswith("_")]
    for p in trang:
        t = p.read_text(encoding="utf-8")
        t, thieu = thay_class(t, bando)
        thieu_tong |= thieu
        t = t.replace('<link rel="stylesheet" href="assets/css/styles.css">',
                      '<link rel="stylesheet" href="assets/css/tailwind.css">')
        (DICH / p.name).write_text(t, encoding="utf-8")
        tat_ca_class |= twc.quet_class(t)

    # ---- 2. biên dịch utility ----
    ung_vien = {c for c in tat_ca_class
                if c not in bando and c not in MOC_JS and not c.startswith("is-")}
    css_util, loi = twc.compile_classes(ung_vien, strict=False)

    # class không dịch được mà cũng không phải móc JS → đây là lỗi thật
    that_su_loi = [c for c in loi if c not in bando and c not in MOC_JS
                   and not c.startswith("is-")]

    # ---- 3. tầng component: phần "keep" ----
    giu = []
    for c, v in sorted(bando.items()):
        k = (v.get("keep") or "").strip()
        if k:
            giu.append(k)

    ra = ("/* Góc Nhìn Mới — Tailwind build tĩnh\n"
          "   Sinh bằng tw/apply.py, không sửa tay. Cấu hình: tailwind.config.js */\n\n"
          "/* ---------- preflight ---------- */\n" + PREFLIGHT +
          "\n/* ---------- base ---------- */\n" + BASE +
          "\n/* ---------- components (phần utility không diễn đạt được) ---------- */\n" +
          "\n".join(giu) +
          "\n\n/* ---------- utilities ---------- */\n" + css_util + "\n")
    (DICH / "assets/css/tailwind.css").write_text(ra, encoding="utf-8")

    # JS và ảnh không qua bước chuyển đổi nào, nhưng vẫn phải đồng bộ — thiếu
    # bước này thì sửa JS ở nguồn xong bản đích vẫn chạy bản cũ.
    import shutil
    js_goc = GOC / "assets/js/app.js"
    if js_goc.exists():
        shutil.copy2(js_goc, DICH / "assets/js/app.js")
        print("đồng bộ app.js từ nguồn")

    print("HTML: %d trang" % len(trang))
    print("utility dùng: %d class" % len(ung_vien))
    print("components giữ lại: %d khối" % len(giu))
    print("CSS xuất ra: %d ký tự" % len(ra))
    if thieu_tong:
        print("\nCLASS CHƯA CÓ TRONG BẢN ĐỒ (%d):" % len(thieu_tong))
        print("  " + ", ".join(sorted(thieu_tong)[:60]))
    if that_su_loi:
        print("\nUTILITY KHÔNG DỊCH ĐƯỢC (%d):" % len(that_su_loi))
        print("  " + ", ".join(sorted(that_su_loi)[:60]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
