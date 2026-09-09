# -*- coding: utf-8 -*-
"""Đồng bộ khối CSS trang Thông báo từ styles.css vào keep của map.json.
Khối này chứa CSS cho các class do JS sinh lúc chạy, apply.py không tự thấy
nên phải nạp tay. Chạy lại sau mỗi lần sửa CSS trang Thông báo."""
import re, json, pathlib, sys
GOC = pathlib.Path(__file__).resolve().parent
css = (GOC / '../design-css-goc/assets/css/styles.css').read_text(encoding='utf-8')
i = css.find('/* ================= Trang Thông báo ================= */')
if i < 0: sys.exit('không thấy khối CSS trang Thông báo')
g = re.sub(r'/\*[\s\S]*?\*/', '', css[i:])
g = re.sub(r'\s*([{}:;,>])\s*', r'\1', g)
g = re.sub(r';}', '}', g)
g = re.sub(r'\s+', ' ', g).strip()
p = GOC / 'map.json'
mp = json.loads(p.read_text(encoding='utf-8'))
mp['thong-bao'] = {"tw": "", "keep": g}
p.write_text(json.dumps(mp, ensure_ascii=False, indent=1), encoding='utf-8')
print("đồng bộ CSS trang Thông báo: %d ký tự" % len(g))
