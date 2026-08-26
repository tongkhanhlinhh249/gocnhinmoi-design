#!/usr/bin/env python3
"""Server tĩnh cho bản dev: tắt cache để trình duyệt luôn lấy bản mới nhất."""
import sys, functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

port = int(sys.argv[1])
root = sys.argv[2]
handler = functools.partial(NoCache, directory=root)
ThreadingHTTPServer(('127.0.0.1', port), handler).serve_forever()
