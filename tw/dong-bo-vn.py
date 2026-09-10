# -*- coding: utf-8 -*-
"""Nạp khối CSS trang video ngắn từ styles.css vào keep của map.json."""
import re, json, pathlib, sys
GOC = pathlib.Path(__file__).resolve().parent
css = (GOC / '../design-css-goc/assets/css/styles.css').read_text(encoding='utf-8')
i = css.find('/* ================= Trang chi tiết video ngắn ================= */')
if i < 0: sys.exit('không thấy khối CSS trang video ngắn')
g = re.sub(r'/\*[\s\S]*?\*/', '', css[i:])
g = re.sub(r'\s*([{}:;,>])\s*', r'\1', g)
g = re.sub(r';}', '}', g)
g = re.sub(r'\s+', ' ', g).strip()
p = GOC / 'map.json'
mp = json.loads(p.read_text(encoding='utf-8'))
mp['video-ngan'] = {"tw": "", "keep": g}
p.write_text(json.dumps(mp, ensure_ascii=False, indent=1), encoding='utf-8')
print("đồng bộ CSS trang video ngắn: %d ký tự" % len(g))
