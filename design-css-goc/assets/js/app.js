/* ==========================================================================
   Góc Nhìn Mới — tương tác cho bản mobile-first
   Vanilla JS, không phụ thuộc thư viện. Toàn bộ là progressive enhancement:
   trang vẫn đọc được đầy đủ khi tắt JavaScript.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Toast ---------- */
  var toastEl = $('#toast');
  var toastTimer;

  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 2200);
  }

  /* ---------- Xếp thẻ so le ở bố cục web ---------- */
  /* column-count cân chiều cao hai cột nên hay để lại một lỗ ở đáy cột ngắn.
     Cách chắc ăn: lưới có hàng cao 8px, mỗi thẻ chiếm số hàng đúng bằng chiều
     cao của nó, thế là thẻ rơi sát nhau mà thứ tự đọc vẫn trái sang phải.
     Ảnh tải chậm làm thẻ cao lên sau, nên theo dõi bằng ResizeObserver thay vì
     đo một lần lúc dựng trang. */
  var xepSoLe = (function () {
    // Bước 1px: bước càng lớn thì số hàng làm tròn lên càng dôi ra, khe dọc
    // phình hơn khe ngang. 1px cho khe dọc đúng bằng KHE.
    var BUOC = 1, KHE = 20;
    var feeds = $$('main .feed');
    if (!document.body.classList.contains('v-web') || !feeds.length) return function () {};

    var web = false;
    function doThe(c) {
      var f = c.parentElement;
      if (!web || getComputedStyle(f).display !== 'grid') { c.style.gridRowEnd = ''; return; }
      var h = c.getBoundingClientRect().height;
      if (!h) return;
      c.style.gridRowEnd = 'span ' + Math.ceil((h + KHE) / BUOC);
    }
    function xep() {
      web = window.matchMedia('(min-width: 800px)').matches;
      feeds.forEach(function (f) {
        Array.prototype.forEach.call(f.children, doThe);
      });
    }

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function (mucs) {
        mucs.forEach(function (m) { doThe(m.target); });
      });
      feeds.forEach(function (f) {
        Array.prototype.forEach.call(f.children, function (c) { ro.observe(c); });
      });
    }
    window.addEventListener('resize', xep);
    window.addEventListener('load', xep);
    xep();
    return xep;
  })();

  /* ---------- Danh sách dài: bày 12 thẻ rồi mới Xem thêm ---------- */
  /* Dùng cho tab Nghe & Xem. Nút Xem thêm ở đó dùng chung cho cả video lẫn
     podcast nên phải hỏi xem chế độ nào đang mở, thay vì gắn cứng vào một
     danh sách. */
  var danhSachDai = (function () {
    var BUOC = 4;
    var ds = $$('.feed[data-limit]');
    if (!ds.length) return function () {};

    /* Tab Nghe & Xem có một nút dùng chung cho nhiều chế độ; trang chuyên mục
       thì nút nằm sau danh sách. Tìm hộp .loadmore đứng sau danh sách trong
       cây DOM, không có thì lấy hộp mang data-view. */
    function hopCua(f) {
      var e = f;
      while (e) {
        if (e.classList && e.classList.contains('loadmore')) return e;
        e = e.nextElementSibling;
      }
      return $('.loadmore[data-view]');
    }
    var hop = hopCua(ds[0]);
    var nut = hop && $('button', hop);

    function dangMo() {
      for (var i = 0; i < ds.length; i++) if (!ds[i].hidden) return ds[i];
      return null;
    }
    function bay(f, n) {
      Array.prototype.forEach.call(f.children, function (c, i) { c.hidden = i >= n; });
      f.setAttribute('data-shown', String(n));
    }
    function veNut() {
      if (!hop) return;
      var f = dangMo();
      if (!f) { hop.hidden = true; return; }
      hop.hidden = (parseInt(f.getAttribute('data-shown'), 10) || 0) >= f.children.length;
    }

    ds.forEach(function (f) { bay(f, parseInt(f.getAttribute('data-limit'), 10) || 12); });

    if (nut) {
      nut.addEventListener('click', function () {
        var f = dangMo();
        if (!f) return;
        bay(f, (parseInt(f.getAttribute('data-shown'), 10) || 0) + BUOC);
        veNut();
        xepSoLe();
      });
    }
    // Bộ lọc chip đăng ký sau nên chạy sau; đợi hết vòng rồi mới đọc trạng thái.
    $$('#mediaChips .chip').forEach(function (c) {
      c.addEventListener('click', function () { setTimeout(veNut, 0); });
    });
    veNut();
    return veNut;
  })();

  /* ---------- Menu ba chấm trên thẻ tin ---------- */
  /* Đặt sớm, ngay sau toast: khối quản lý bài viết phía dưới chạy không có
     bảo vệ và ném lỗi trên mọi trang không phải Cá nhân, cắt đứt mọi đoạn
     đăng ký sau nó. Ở đây thì chắc chắn chạy trên cả 16 trang.
     Tra phần tử sheet lúc gọi, không giữ tham chiếu: trong file có hai biến
     cùng tên `sheet` nên biến sau ghi đè biến trước. */
  function moSheetMenu(tieuDe, items, xuLy) {
    var sh = document.getElementById('sheet');
    var body = document.getElementById('sheetBody');
    var tit = document.getElementById('sheetTitle');
    var meta = document.getElementById('sheetMeta');
    if (!sh || !body) return;
    tit.textContent = tieuDe;
    if (meta) { meta.textContent = ''; meta.hidden = true; }
    body.innerHTML = '<div class="sheet-menu">' + items.map(function (x) {
      return '<button type="button" data-card-act="' + x[1] + '"' + (x[2] ? ' data-danger' : '') + '>' +
        '<svg class="icon" aria-hidden="true"><use href="#i-' + x[0] + '"></use></svg>' + x[1] + '</button>';
    }).join('') + '</div>';
    sh.hidden = false;
    void sh.offsetWidth;
    sh.classList.add('is-open');
    var dau = sh.querySelector('button');
    if (dau) dau.focus();

    body.addEventListener('click', function handler(ev) {
      var b = ev.target.closest('[data-card-act]');
      if (!b) return;
      body.removeEventListener('click', handler);
      dongSheetMenu();
      xuLy(b.getAttribute('data-card-act'));
    });
  }
  function dongSheetMenu() {
    var sh = document.getElementById('sheet');
    if (!sh) return;
    sh.classList.remove('is-open');
    setTimeout(function () { sh.hidden = true; }, 260);
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-sheet-close]')) dongSheetMenu();
    var nut = e.target.closest && e.target.closest('[data-card-menu]');
    if (!nut) return;

    // Nhận diện thẻ nghe/xem bằng dấu hiệu có thật trong thẻ — nút phát hoặc
    // nhãn thời lượng — chứ không theo tên class, vì mỗi trang đặt tên một kiểu.
    var the = nut.closest('article, li');
    var laNgheXem = !!(the && the.querySelector(
      '.play-fab, .vcard__play, .prow__play, .btn-play, [data-play], .badge-time'));

    var items = [];
    if (laNgheXem) items.push(['nav-media', 'Thêm vào playlist']);
    items.push(['bookmark', 'Lưu để đọc sau']);
    items.push(['alert', 'Báo cáo', true]);

    moSheetMenu('Tuỳ chọn', items, function (act) {
      setTimeout(function () {
        toast(act === 'Báo cáo' ? 'Đã gửi báo cáo tới Ban biên tập' : act);
      }, 260);
    });
  });

  /* ---------- Định dạng số lượt tương tác ---------- */
  function formatCount(n) {
    if (n >= 1000) {
      var k = (n / 1000).toFixed(1).replace('.0', '');
      return k + 'k';
    }
    return String(n);
  }

  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  /* ---------- Ẩn header khi cuộn xuống ---------- */
  var header = $('#appHeader');
  var lastY = window.pageYOffset;
  var ticking = false;
  var headerLockUntil = 0;      // khoá tạm khi trang tự cuộn, tránh header bung ra

  function setHeaderHidden(hide) {
    if (!header) return;
    header.classList.toggle('is-hidden', hide);
    // Thanh chip dính theo mốc --stick-top, phải trượt lên cùng lúc với header
    document.body.classList.toggle('is-header-hidden', hide);
  }

  function onScroll() {
    var y = window.pageYOffset;
    if (header && Date.now() > headerLockUntil) setHeaderHidden(y > lastY && y > 160);
    lastY = y;
    ticking = false;
  }

  /* Vị trí của phần tử so với đầu tài liệu.
     Lưu ý: KHÔNG dùng offsetTop cho phần tử position:sticky — Chrome trả về vị trí
     đã bị dính, nên mốc tính ra sẽ bằng đúng chỗ đang đứng. Luôn đo từ phần tử
     không sticky rồi cộng scroll hiện tại. */
  function docTopOf(el) {
    return el.getBoundingClientRect().top + window.pageYOffset;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  /* ---------- Carousel tin nổi bật ---------- */
  var track = $('#heroTrack');
  var dotsWrap = $('#heroDots');

  if (track && dotsWrap) {
    var dots = $$('.hero__dot', dotsWrap);
    var slides = $$('.hero__slide', track);
    var syncing = false;

    function activeIndex() {
      return Math.round(track.scrollLeft / track.clientWidth);
    }

    function syncDots() {
      var i = Math.max(0, Math.min(dots.length - 1, activeIndex()));
      dots.forEach(function (dot, idx) {
        dot.classList.toggle('is-active', idx === i);
        dot.setAttribute('aria-selected', idx === i ? 'true' : 'false');
      });
      syncing = false;
    }

    track.addEventListener('scroll', function () {
      if (!syncing) {
        window.requestAnimationFrame(syncDots);
        syncing = true;
      }
    }, { passive: true });

    dots.forEach(function (dot, idx) {
      dot.addEventListener('click', function () {
        track.scrollTo({ left: idx * track.clientWidth, behavior: 'smooth' });
      });
    });

    // Điều hướng bằng bàn phím khi track được focus
    track.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var next = activeIndex() + (e.key === 'ArrowRight' ? 1 : -1);
      next = Math.max(0, Math.min(slides.length - 1, next));
      track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
    });

    window.addEventListener('resize', syncDots);
  }

  /* ---------- Sóng âm cho thẻ podcast ---------- */
  var WAVE_BARS = 48;

  $$('[data-wave]').forEach(function (wave) {
    var heights = [];
    for (var i = 0; i < WAVE_BARS; i++) {
      // Dãy chiều cao lặp lại, tái tạo đúng nhịp sóng trong thiết kế
      var pattern = [6, 9, 13, 16, 20, 14, 10, 17, 12, 15, 8, 18, 11, 14];
      heights.push(pattern[i % pattern.length]);
      var bar = document.createElement('span');
      bar.style.height = heights[i] + 'px';
      wave.appendChild(bar);
    }
    paintWave(wave, parseInt(wave.getAttribute('data-progress'), 10) || 0);
  });

  function paintWave(wave, percent) {
    var bars = wave.children;
    var on = Math.round((percent / 100) * bars.length);
    for (var i = 0; i < bars.length; i++) {
      bars[i].classList.toggle('is-on', i < on);
    }
  }

  /* ---------- Trình phát nền ---------- */
  /* Thanh nhỏ nổi trên thanh điều hướng, để nghe tiếp trong lúc xem mục khác.
     Đây là bản mô phỏng: rời trang là mất, vì bản dựng không có trạng thái
     chạy xuyên trang. */
  var mini = document.getElementById('mini');
  var miniTiepTuc = null, miniDung = null;

  function miniVe(elapsed, duration) {
    if (!mini) return;
    var f = mini.querySelector('[data-mini-fill]');
    var t = mini.querySelector('[data-mini-time]');
    if (f && duration) f.style.width = (elapsed / duration * 100) + '%';
    if (t) t.textContent = formatTime(elapsed) + ' / ' + formatTime(duration);
  }

  function miniBat(card, btn, layElapsed, duration, tiepTuc, dung) {
    if (!mini) return;
    var art = card && card.querySelector('img');
    var tit = card && card.querySelector('.card__title, .podcast__title, .prow__title');
    var a = mini.querySelector('[data-mini-art]');
    var h = mini.querySelector('[data-mini-title]');
    if (a && art) { a.src = art.getAttribute('src'); a.alt = ''; }
    if (h) h.textContent = tit ? tit.textContent.trim() : 'Đang phát';
    miniTiepTuc = tiepTuc;
    miniDung = dung;
    mini.hidden = false;
    void mini.offsetWidth;
    mini.classList.add('is-on', 'is-playing');
    miniVe(layElapsed(), duration);
  }

  function miniTat() {
    if (!mini) return;
    mini.classList.remove('is-playing');
  }

  if (mini) {
    mini.addEventListener('click', function (e) {
      if (e.target.closest('[data-mini-close]')) {
        if (mini.classList.contains('is-playing') && miniDung) miniDung();
        mini.classList.remove('is-on', 'is-playing');
        setTimeout(function () { mini.hidden = true; }, 200);
        return;
      }
      if (e.target.closest('[data-mini-toggle]')) {
        if (mini.classList.contains('is-playing')) { if (miniDung) miniDung(); }
        else if (miniTiepTuc) miniTiepTuc();
      }
    });
  }

  /* ---------- Trình phát podcast (mô phỏng) ---------- */
  var activePlayer = null;

  $$('[data-podcast]').forEach(function (btn) {
    var card = btn.closest('.card');
    var wave = $('[data-wave]', card);
    var timeEl = $('[data-time]', card);
    var label = $('.btn-play__label', btn);
    var duration = parseInt(btn.getAttribute('data-duration'), 10) || 0;
    var elapsed = parseInt(btn.getAttribute('data-elapsed'), 10) || 0;
    var timer = null;

    function render() {
      if (timeEl) timeEl.textContent = formatTime(elapsed) + ' / ' + formatTime(duration);
      if (wave) paintWave(wave, (elapsed / duration) * 100);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
      btn.classList.remove('is-playing');
      if (label) label.textContent = 'Phát ngay';
      if (activePlayer === stop) activePlayer = null;
      miniTat();
    }

    function batDau() {
      if (activePlayer) activePlayer();          // chỉ cho phép một tập phát cùng lúc
      activePlayer = stop;
      btn.classList.add('is-playing');
      if (label) label.textContent = 'Tạm dừng';
      miniBat(card, btn, function () { return elapsed; }, duration, batDau, stop);
      timer = setInterval(function () {
        elapsed += 1;
        if (elapsed >= duration) { elapsed = 0; stop(); return; }
        render();
        miniVe(elapsed, duration);
      }, 1000);
      miniVe(elapsed, duration);
    }

    btn.addEventListener('click', function () {
      if (timer) { stop(); return; }
      batDau();
    });

    render();
  });

  /* ---------- Nút phát video (mô phỏng) ---------- */
  $$('[data-play]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var playing = btn.classList.toggle('is-playing');
      btn.setAttribute('aria-label', playing ? 'Tạm dừng video' : 'Phát video');
      toast(playing ? 'Đang phát bản xem trước' : 'Đã tạm dừng');
    });
  });

  /* ---------- Thích / Lưu ---------- */
  document.addEventListener('click', function (e) {
    var likeBtn = e.target.closest('[data-like]');
    if (likeBtn) {
      var pressed = likeBtn.getAttribute('aria-pressed') === 'true';
      var base = parseInt(likeBtn.getAttribute('data-count'), 10) || 0;
      var next = pressed ? base : base + 1;

      likeBtn.setAttribute('aria-pressed', pressed ? 'false' : 'true');
      var numEl = $('.act__n', likeBtn);
      if (numEl) numEl.textContent = formatCount(next);

      likeBtn.classList.remove('is-popping');
      void likeBtn.offsetWidth;                  // ép trình duyệt chạy lại animation
      if (!pressed) likeBtn.classList.add('is-popping');
      return;
    }

    var saveBtn = e.target.closest('[data-save]');
    if (saveBtn) {
      var saved = saveBtn.getAttribute('aria-pressed') === 'true';
      saveBtn.setAttribute('aria-pressed', saved ? 'false' : 'true');
      toast(saved ? 'Đã bỏ khỏi mục đã lưu' : 'Đã lưu vào mục của bạn');
      return;
    }

    var addBtn = e.target.closest('[data-playlist-add]');
    if (addBtn) {
      var added = addBtn.getAttribute('aria-pressed') === 'true';
      addBtn.setAttribute('aria-pressed', added ? 'false' : 'true');
      addBtn.setAttribute('aria-label',
        added ? 'Thêm vào playlist của tôi' : 'Bỏ khỏi playlist của tôi');
      toast(added ? 'Đã bỏ khỏi playlist của bạn' : 'Đã thêm vào playlist của bạn');
      return;
    }

    var followBtn = e.target.closest('[data-follow]');
    if (followBtn) {
      var following = followBtn.getAttribute('aria-pressed') === 'true';
      followBtn.setAttribute('aria-pressed', following ? 'false' : 'true');
      followBtn.textContent = following ? '+ Theo dõi' : 'Đang theo dõi';
      return;
    }

    var shareBtn = e.target.closest('[data-share]');
    if (shareBtn) {
      var card = shareBtn.closest('.card');
      var titleEl = card ? $('.card__title, .podcast__title', card) : null;
      var title = titleEl ? titleEl.textContent.trim() : document.title;

      if (navigator.share) {
        navigator.share({ title: title, url: location.href }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(location.href).then(function () {
          toast('Đã sao chép liên kết bài viết');
        }, function () {
          toast('Không sao chép được liên kết');
        });
      } else {
        toast('Chia sẻ: ' + title);
      }
      return;
    }

    var toastBtn = e.target.closest('[data-toast]');
    if (toastBtn) toast(toastBtn.getAttribute('data-toast'));
  });

  /* ---------- Lọc theo chuyên mục + tìm kiếm ---------- */
  var chipsWrap = $('#chips');
  var chipsBar = $('.chips-bar');
  // Trang chỉ có một feed thì lọc thẳng trên feed đó, không cần feed phụ
  var feed = $('#feedSecondary') || $('#feedPrimary');
  /* Trang chủ tách dòng tin sau thanh chip thành mấy khối xen kẽ với khối khác.
     Bộ lọc phải chạy trên cả cụm, không chỉ khối đầu, nên gom lại theo dấu
     data-feed-loc; trang nào không đánh dấu thì vẫn lọc trên feed như cũ. */
  var feedParts = $$('[data-feed-loc]');
  if (!feedParts.length) feedParts = feed ? [feed] : [];
  var emptyEl = $('#feedEmpty');
  var loadWrap = $('.loadmore');
  var searchInputs = $$('[data-search]');
  var currentFilter = 'all';

  /* Đổi chuyên mục làm trang ngắn lại, trình duyệt sẽ kéo scroll lên và bị hiểu nhầm là
     "cuộn lên" khiến header bung ra, đồng thời màn hình dừng ở cuối danh sách mới.
     Vì vậy: tự canh về đầu danh sách và giữ header ẩn trong lúc cuộn. */
  /* Mốc cuộn để thanh chip dính sát mép trên và danh sách bắt đầu ngay dưới nó.
     Đo từ #feedSecondary (không sticky) trừ đi chiều cao thanh chip. */
  function feedStickTarget() {
    return Math.round(docTopOf(feed) - chipsBar.offsetHeight);
  }

  function timTuKhoa() {
    for (var i = 0; i < searchInputs.length; i++) {
      var v = searchInputs[i].value.trim();
      if (v) return v.toLowerCase();
    }
    return '';
  }

  function alignToFeed() {
    if (!chipsBar || !feed) return;
    if (window.pageYOffset < feedStickTarget() - 1) return;  // chưa cuộn tới thì giữ nguyên

    setHeaderHidden(true);
    headerLockUntil = Date.now() + 800;
    window.scrollTo({ top: feedStickTarget(), behavior: prefersReduced ? 'auto' : 'smooth' });

    setTimeout(function () {
      lastY = window.pageYOffset;
      // danh sách quá ngắn, không cuộn tới được thanh chip thì trả header về
      if (window.pageYOffset < feedStickTarget() - 1) setHeaderHidden(false);
    }, 820);
  }

  /* Dòng tin ở trang chủ chỉ bày 12 thẻ đầu — kể cả chip "Mới nhất"; muốn xem
     nữa thì sang trang riêng của chuyên mục đang chọn, thay vì kéo dài mãi một
     danh sách trộn lẫn mọi thứ. */
  var PAGE_SIZE = 12;
  var CAT_PAGES = {
    'all': 'moi-nhat.html',
    'hot': 'hot-hom-nay.html',
    'tra-dam': 'tra-dam.html',
    'goc-mo': 'goc-mo.html',
    'quan-diem': 'quan-diem.html',
    'spotlight': 'spotlight.html'
  };
  var CAT_NAMES = {
    'all': 'Mới nhất',
    'hot': 'Hot hôm nay',
    'tra-dam': 'Trà đàm',
    'goc-mo': 'Góc mở',
    'quan-diem': 'Quan điểm',
    'spotlight': 'Spotlight'
  };
  var catMore = $('#catMore');
  var loadMoreBtn = $('#loadMore');

  function applyFilters() {
    if (!feed) return;
    var q = timTuKhoa();
    var matched = 0;
    var shown = 0;

    var theCards = [];
    feedParts.forEach(function (part) {
      $$('.card', part).forEach(function (c) { theCards.push(c); });
    });

    theCards.forEach(function (card) {
      var cats = (card.getAttribute('data-cat') || '').split(/\s+/);
      var matchCat = currentFilter === 'all' || cats.indexOf(currentFilter) !== -1;
      var titleEl = $('.card__title, .podcast__title', card);
      var text = titleEl ? titleEl.textContent.toLowerCase() : '';
      var matchText = !q || text.indexOf(q) !== -1;

      var ok = matchCat && matchText;
      if (ok) matched++;

      var visible = ok && shown < PAGE_SIZE;
      if (visible) shown++;

      card.classList.toggle('is-filtered', !visible);
    });

    if (emptyEl) emptyEl.classList.toggle('is-visible', shown === 0);

    var page = CAT_PAGES[currentFilter];
    var overflow = !!page && matched > PAGE_SIZE;

    if (catMore) {
      catMore.hidden = !overflow;
      if (overflow) {
        catMore.setAttribute('href', page);
        catMore.setAttribute('aria-label', 'Xem thêm bài ' + CAT_NAMES[currentFilter]);
      }
    }

    // Trang chủ luôn dừng ở 12 thẻ rồi dẫn sang trang chuyên mục, nên nút nạp
    // thêm tại chỗ không còn việc gì; trang con không có #feedSecondary thì vẫn
    // giữ nút đó để bày tiếp danh sách.
    if (loadMoreBtn) loadMoreBtn.hidden = !!$('#feedSecondary') || q !== '';
    if (loadWrap) {
      loadWrap.hidden = (!loadMoreBtn || loadMoreBtn.hidden) && (!catMore || catMore.hidden);
    }
  }

  if (chipsWrap) {
    $$('.chip', chipsWrap).forEach(function (chip) {
      chip.addEventListener('click', function () {
        $$('.chip', chipsWrap).forEach(function (c) { c.setAttribute('aria-selected', 'false'); });
        chip.setAttribute('aria-selected', 'true');
        currentFilter = chip.getAttribute('data-filter');
        applyFilters();

        // Đưa chip đang chọn vào giữa hộp cuộn — tự tính scrollLeft thay vì dùng
        // scrollIntoView, vì hàm đó cuộn cả cửa sổ và huỷ mất cú cuộn của alignToFeed.
        chipsWrap.scrollTo({
          left: chip.offsetLeft - (chipsWrap.clientWidth - chip.offsetWidth) / 2,
          behavior: prefersReduced ? 'auto' : 'smooth'
        });

        alignToFeed();
      });
    });
  }

  /* ---------- Tìm kiếm nhanh trong feed ---------- */
  var searchTimer;
  searchInputs.forEach(function (o) {
    o.addEventListener('input', function () {
      // gõ ở ô nào thì ô kia phải theo, nếu không đổi bề ngang màn hình là mất từ khoá
      searchInputs.forEach(function (k) { if (k !== o) k.value = o.value; });
      clearTimeout(searchTimer);
      searchTimer = setTimeout(applyFilters, 180);
    });
  });

  /* ---------- Drawer chuyên mục ---------- */
  var drawer = $('#drawer');

  if (drawer) {
    var drawerOpener = null;

    var setDrawer = function (open) {
      drawer.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      $$('[data-drawer-open]').forEach(function (b) {
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      if (open) {
        drawerOpener = document.activeElement;
        var first = $('.drawer__link', drawer);
        if (first) first.focus();
      } else if (drawerOpener) {
        drawerOpener.focus();
        drawerOpener = null;
      }
    };

    $$('[data-drawer-open]').forEach(function (b) {
      b.addEventListener('click', function () { setDrawer(true); });
    });
    $$('[data-drawer-close]', drawer).forEach(function (b) {
      b.addEventListener('click', function () { setDrawer(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) setDrawer(false);
    });

    // Đánh dấu mục đang mở
    $$('.drawer__link', drawer).forEach(function (link) {
      var target = (link.getAttribute('href') || '').split('/').pop().toLowerCase();
      if (target === here) link.setAttribute('aria-current', 'page');
    });
  }

  /* ---------- Mở trang chủ kèm chuyên mục: index.html#quan-diem ---------- */
  /* Chip được chọn sẵn trong markup có thể không phải "all" (vd trang cá nhân mở ở
     mục Bài viết), nên phải đồng bộ bộ lọc ngay khi tải, không đợi người dùng bấm. */
  if (chipsWrap) {
    var initialChip = $('.chip[aria-selected="true"]', chipsWrap);
    if (initialChip) currentFilter = initialChip.getAttribute('data-filter');
    applyFilters();
  }

  if (location.hash.length > 1 && chipsWrap) {
    var wanted = $('.chip[data-filter="' + location.hash.slice(1) + '"]', chipsWrap);
    if (wanted) wanted.click();
  }

  /* ---------- Nút quay lại của trang con ---------- */
  $$('[data-back]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      if (history.length > 1) { e.preventDefault(); history.back(); }
      // không có lịch sử thì để thẻ <a> đưa về trang chủ
    });
  });

  /* ---------- Thanh điều hướng dưới ---------- */
  var navTabs = $$('.nav-tab');

  var hrefOf = function (tab) { return (tab.getAttribute('href') || '').split('/').pop().toLowerCase(); };
  // Trang con (Mới nhất, Hot hôm nay...) không ứng với tab nào — giữ nguyên tab
  // đang được đánh dấu trong markup thay vì bỏ trắng cả thanh nav.
  var onATab = navTabs.some(function (tab) {
    return hrefOf(tab) === here || (here === '' && hrefOf(tab) === 'index.html');
  });

  navTabs.forEach(function (tab) {
    var isHere = onATab && (hrefOf(tab) === here || (here === '' && hrefOf(tab) === 'index.html'));

    if (onATab) {
      if (isHere) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    }

    tab.addEventListener('click', function (e) {
      if (!isHere) return;                 // để trình duyệt mở trang tương ứng
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Lọc loại nội dung (tab Nghe & Xem) ---------- */
  var mediaChips = $('#mediaChips');

  if (mediaChips) {
    // Mỗi khối khai báo data-view liệt kê các chế độ mà nó xuất hiện,
    // khối không có data-view thì luôn hiện (bảng xếp hạng, gợi ý theo dõi, hashtag).
    // Bản thân các chip cũng mang data-view để biết mình thuộc chế độ nào —
    // phải loại chúng ra, nếu không bấm lọc sẽ ẩn luôn các chip còn lại.
    var viewBlocks = $$('[data-view]').filter(function (el) {
      return !el.classList.contains('chip');
    });
    var mediaEmpty = $('#mediaEmpty');

    $$('.chip', mediaChips).forEach(function (chip) {
      chip.addEventListener('click', function () {
        $$('.chip', mediaChips).forEach(function (c) { c.setAttribute('aria-selected', 'false'); });
        chip.setAttribute('aria-selected', 'true');

        var view = chip.getAttribute('data-view');
        var shown = 0;
        viewBlocks.forEach(function (el) {
          var match = el.getAttribute('data-view').split(/\s+/).indexOf(view) !== -1;
          el.hidden = !match;
          if (match) shown++;
        });
        if (mediaEmpty) mediaEmpty.classList.toggle('is-visible', shown === 0);

        chipsWrapScrollTo(mediaChips, chip);
        window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
      });
    });

    // Trang chủ dẫn sang đây kèm ?view=short — mở thẳng đúng chế độ, nếu không
    // người dùng bấm "Xem thêm" ở mục Video ngắn lại rơi vào tab "Tất cả".
    var viewYeuCau = (location.search.match(/[?&]view=([\w-]+)/) || [])[1];
    if (viewYeuCau) {
      $$('.chip', mediaChips).forEach(function (c) {
        if (c.getAttribute('data-view') === viewYeuCau) c.click();
      });
    }
  }

  function chipsWrapScrollTo(box, chip) {
    box.scrollTo({
      left: chip.offsetLeft - (box.clientWidth - chip.offsetWidth) / 2,
      behavior: prefersReduced ? 'auto' : 'smooth'
    });
  }

  /* ---------- Xem thêm ---------- */
  var loadBtn = $('#loadMore');
  var primaryFeed = $('#feedPrimary');

  /* Trang con không có #feedSecondary — nạp thẳng vào feed chính, nếu không nút
     "Xem thêm" ở các trang đó sẽ không làm gì cả. */
  var loadTarget = feed || primaryFeed;

  if (loadBtn && loadTarget && primaryFeed) {
    var pool = $$('.card', primaryFeed);
    var poolIndex = 0;

    loadBtn.addEventListener('click', function () {
      if (loadBtn.disabled) return;
      var label = $('.btn-outline__label', loadBtn);

      loadBtn.classList.add('is-loading');
      if (label) label.textContent = 'Đang tải…';

      setTimeout(function () {
        var added = 0;
        while (added < 3 && poolIndex < pool.length) {
          var clone = pool[poolIndex].cloneNode(true);
          clone.removeAttribute('data-cat');
          // Trạng thái tương tác không nên nhân bản
          $$('[aria-pressed]', clone).forEach(function (el) { el.setAttribute('aria-pressed', 'false'); });
          loadTarget.appendChild(clone);
          poolIndex++;
          added++;
        }

        loadBtn.classList.remove('is-loading');
        applyFilters();

        if (poolIndex >= pool.length) {
          loadBtn.disabled = true;
          if (label) label.textContent = 'Bạn đã xem hết nội dung';
        } else if (label) {
          label.textContent = 'Xem thêm';
        }
      }, 600);
    });
  }

  /* ---------- Bảng xếp hạng: đổi kỳ tháng / tuần ---------- */
  /* Hai kỳ là hai khối dựng sẵn, đổi kỳ chỉ bật tắt hidden — không dựng lại DOM,
     nhờ vậy trạng thái Theo dõi của kỳ kia vẫn còn nguyên khi quay lại. */
  var rangeBtns = $$('[data-range]');
  if (rangeBtns.length) {
    rangeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-range');
        rangeBtns.forEach(function (b) {
          b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
        });
        $$('[data-range-panel]').forEach(function (panel) {
          panel.hidden = panel.getAttribute('data-range-panel') !== key;
        });
      });
    });
  }
})();


/* ==========================================================================
   Trang cá nhân — quản lý bài viết
   Tách thành IIFE riêng: chỉ chạy khi trang có #postList, không đụng tới
   bộ lọc chuyên mục của các trang khác.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var list = $('#postList');
  if (!list) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Toast ---------- */
  var toastEl = $('#toast');
  var toastTimer = 0;
  function toast(msg) {
    if (!toastEl || !msg) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2600);
  }

  /* ---------- Dữ liệu trạng thái ----------
     Mô phỏng phần backend sẽ trả về. Nhãn và hành động gắn với trạng thái,
     không gắn với từng bài, nên thêm bài mới không phải sửa gì ở đây. */
  var LABEL = {
    published: 'Đã xuất bản',
    pending: 'Chờ duyệt',
    rejected: 'Từ chối',
    draft: 'Bản nháp'
  };
  var ICON = {
    published: 'verified', pending: 'clock',
    rejected: 'alert', draft: 'draft'
  };
  var NOTE = {
    pending: ['warn', 'Bài viết đang được Ban biên tập xem xét.'],
    rejected: ['danger', 'Bài viết chưa đáp ứng yêu cầu xuất bản.']
  };

  // Lý do phản hồi của Ban biên tập — không nêu tên người kiểm duyệt.
  var REASONS = {
    p10: {
      title: 'Yêu cầu chỉnh sửa',
      meta: 'Ban biên tập phản hồi lúc 11:15, 19/08/2026',
      reason: 'Phần dự báo tới năm 2050 chưa dẫn nguồn số liệu, cần bổ sung trước khi xuất bản.',
      note: 'Nội dung tổng thể tốt, chỉ cần chỉnh phần cuối. Không phải viết lại bài.',
      guide: 'Bổ sung nguồn cho ba mốc số liệu ở phần “Lộ trình”, sau đó gửi lại để duyệt.'
    },
    p11: {
      title: 'Lý do từ chối',
      meta: 'Ban biên tập phản hồi lúc 15:48, 17/08/2026',
      reason: 'Nội dung cần bổ sung nguồn tham khảo và điều chỉnh tiêu đề để phản ánh chính xác nội dung bài viết.',
      note: 'Số liệu định giá chưa có nguồn công khai kiểm chứng được.',
      guide: 'Bổ sung nguồn cho phần định giá và đổi tiêu đề bám sát nội dung, sau đó có thể gửi lại.'
    }
  };

  function icon(name) {
    return '<svg class="icon" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
  }

  /* ---------- Vẽ lại một hàng theo trạng thái hiện tại ---------- */
  function renderRow(row) {
    var st = row.getAttribute('data-status');

    var badge = $('.badge-status', row);
    badge.className = 'badge-status badge-status--' + st;
    badge.innerHTML = icon(ICON[st]) + LABEL[st];

    var note = $('.post-row__note', row);
    var cfg = NOTE[st];
    if (cfg) {
      if (!note) {
        note = document.createElement('p');
        row.querySelector('.post-row__foot').insertAdjacentElement('beforebegin', note);
      }
      note.className = 'post-row__note post-row__note--' + cfg[0];
      note.textContent = cfg[1];
    } else if (note) {
      note.remove();
    }

    var foot = $('.post-row__foot', row);
    var title = $('.post-row__title', row).textContent.trim();
    var btn = function (label, act, brand) {
      return '<button class="btn-row' + (brand ? ' btn-row--brand' : '') + '" type="button" data-act="' + act + '">' + label + '</button>';
    };
    if (st === 'published')      foot.innerHTML = btn('Xem bài viết', 'view');
    else if (st === 'pending')   foot.innerHTML = btn('Xem trước', 'preview');
    else if (st === 'rejected')  foot.innerHTML = btn('Xem lý do', 'reason', true);
    else                         foot.innerHTML = btn('Tiếp tục viết', 'edit', true);

    $('.btn-menu', row).setAttribute('aria-label', 'Hành động khác với bài “' + title + '”');
  }

  /* ---------- Bộ lọc trạng thái, tìm kiếm, sắp xếp ---------- */
  var chipsWrap = $('#statusChips');
  var search = $('#mineSearch');
  var sortSel = $('#mineSort');
  var blank = $('#mineBlank');
  var blankText = $('#mineBlankText');
  var blankCta = $('#mineBlankCta');
  var summary = $('#mineSummary');
  var filter = 'all';

  function rows() { return $$('.post-row', list); }

  function updateCounts() {
    var all = rows();
    var by = { all: all.length };
    all.forEach(function (r) {
      var st = r.getAttribute('data-status');
      by[st] = (by[st] || 0) + 1;
    });
    $$('.chip', chipsWrap).forEach(function (chip) {
      var k = chip.getAttribute('data-status-filter');
      $('.chip__n', chip).textContent = '(' + (by[k] || 0) + ')';
    });

    var pending = by.pending || 0;
    summary.innerHTML = '<b>' + all.length + ' bài viết</b>' +
      (pending ? ' · ' + pending + ' bài đang chờ duyệt' : '');
  }

  function sortRows() {
    var mode = sortSel.value;
    var key = mode === 'updated' ? 'data-updated' : 'data-created';
    var sorted = rows().sort(function (a, b) {
      var x = a.getAttribute(key), y = b.getAttribute(key);
      return mode === 'old' ? (x < y ? -1 : 1) : (x > y ? -1 : 1);
    });
    sorted.forEach(function (r) { list.appendChild(r); });
  }

  var BLANK_TEXT = {
    all: 'Bạn chưa có bài viết nào',
    published: 'Chưa có bài viết nào được xuất bản',
    pending: 'Không có bài viết nào đang chờ duyệt',
    rejected: 'Không có bài viết nào bị từ chối',
    draft: 'Không có bản nháp nào'
  };

  function apply() {
    var q = (search.value || '').trim().toLowerCase();
    var shown = 0;

    rows().forEach(function (r) {
      var okStatus = filter === 'all' || r.getAttribute('data-status') === filter;
      var text = $('.post-row__title', r).textContent.toLowerCase();
      var okText = !q || text.indexOf(q) !== -1;
      r.hidden = !(okStatus && okText);
      if (!r.hidden) shown++;
    });

    blank.hidden = shown !== 0;
    if (shown === 0) {
      if (q) {
        blankText.textContent = 'Không tìm thấy bài viết phù hợp';
        blankCta.hidden = false;
        $('button', blankCta).textContent = 'Xóa bộ lọc';
        $('button', blankCta).setAttribute('data-blank-act', 'clear');
      } else {
        blankText.textContent = BLANK_TEXT[filter] || BLANK_TEXT.all;
        // Chỉ mời viết bài khi thật sự chưa có bài nào, không mời khi chỉ là bộ lọc rỗng
        var offer = filter === 'all';
        blankCta.hidden = !offer;
        if (offer) {
          $('button', blankCta).textContent = 'Viết bài đầu tiên';
          $('button', blankCta).setAttribute('data-blank-act', 'create');
        }
      }
    }
    updateCounts();
  }

  $$('.chip', chipsWrap).forEach(function (chip) {
    chip.addEventListener('click', function () {
      $$('.chip', chipsWrap).forEach(function (c) { c.setAttribute('aria-selected', 'false'); });
      chip.setAttribute('aria-selected', 'true');
      filter = chip.getAttribute('data-status-filter');
      chipsWrap.scrollTo({
        left: chip.offsetLeft - (chipsWrap.clientWidth - chip.offsetWidth) / 2,
        behavior: reduced ? 'auto' : 'smooth'
      });
      apply();
    });
  });

  var searchTimer = 0;
  search.addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(apply, 180);
  });
  sortSel.addEventListener('change', function () { sortRows(); apply(); });

  blankCta.addEventListener('click', function (e) {
    var b = e.target.closest('[data-blank-act]');
    if (!b) return;
    if (b.getAttribute('data-blank-act') === 'clear') {
      search.value = '';
      $('.chip[data-status-filter="all"]', chipsWrap).click();
    } else {
      toast('Mở trình soạn thảo bài viết mới');
    }
  });

  /* ---------- Bottom sheet dùng chung ---------- */
  var sheet = $('#sheet');
  var sheetTitle = $('#sheetTitle');
  var sheetMeta = $('#sheetMeta');
  var sheetBody = $('#sheetBody');
  var lastFocus = null;

  function openSheet(title, meta, bodyHtml) {
    lastFocus = document.activeElement;
    sheetTitle.textContent = title;
    sheetMeta.textContent = meta || '';
    sheetMeta.hidden = !meta;
    sheetBody.innerHTML = bodyHtml;
    sheet.hidden = false;
    // buộc trình duyệt tính lại layout trước khi gắn class, nếu không sẽ mất hiệu ứng trượt
    void sheet.offsetWidth;
    sheet.classList.add('is-open');
    var first = sheet.querySelector('button, a');
    if (first) first.focus();
  }
  function closeSheet() {
    sheet.classList.remove('is-open');
    setTimeout(function () { sheet.hidden = true; }, reduced ? 0 : 260);
    if (lastFocus) lastFocus.focus();
  }
  sheet.addEventListener('click', function (e) {
    if (e.target.closest('[data-sheet-close]')) closeSheet();
  });

  /* ---------- Dialog xác nhận ---------- */
  var dialog = $('#dialog');
  var dlgTitle = $('#dialogTitle');
  var dlgText = $('#dialogText');
  var dlgActions = $('#dialogActions');
  var dlgFocus = null;

  function openDialog(title, text, actions) {
    dlgFocus = document.activeElement;
    dlgTitle.textContent = title;
    dlgText.textContent = text;
    dlgActions.innerHTML = '';
    actions.forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-block btn-block--' + a.kind;
      b.textContent = a.label;
      b.addEventListener('click', function () { closeDialog(); if (a.run) a.run(); });
      dlgActions.appendChild(b);
    });
    dialog.hidden = false;
    void dialog.offsetWidth;
    dialog.classList.add('is-open');
    var f = dlgActions.querySelector('button');
    if (f) f.focus();
  }
  function closeDialog() {
    dialog.classList.remove('is-open');
    setTimeout(function () { dialog.hidden = true; }, reduced ? 0 : 200);
    if (dlgFocus) dlgFocus.focus();
  }
  dialog.addEventListener('click', function (e) {
    if (e.target.closest('[data-dialog-close]')) closeDialog();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (dialog.classList.contains('is-open')) closeDialog();
    else if (sheet.classList.contains('is-open')) closeSheet();
  });

  /* ---------- Hành động trên từng bài ---------- */
  function setStatus(row, st, stamp) {
    row.setAttribute('data-status', st);
    if (stamp) {
      row.setAttribute('data-updated', stamp.iso);
      $('.post-row__time', row).textContent = stamp.text;
    }
    renderRow(row);
    apply();
  }

  function nowStamp(prefix) {
    // Không có backend nên lấy giờ máy, chỉ dùng cho bản mô phỏng
    var d = new Date();
    var two = function (n) { return (n < 10 ? '0' : '') + n; };
    var text = prefix + ' lúc ' + two(d.getHours()) + ':' + two(d.getMinutes()) +
      ', ' + two(d.getDate()) + '/' + two(d.getMonth() + 1) + '/' + d.getFullYear();
    var iso = d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()) +
      'T' + two(d.getHours()) + ':' + two(d.getMinutes());
    return { text: text, iso: iso };
  }

  function resubmit(row) {
    setStatus(row, 'pending', nowStamp('Đã gửi Ban biên tập'));
    toast('Bài viết đã được gửi lại cho Ban biên tập');
  }

  function showReason(row) {
    var r = REASONS[row.getAttribute('data-id')];
    if (!r) { toast('Chưa có phản hồi cho bài viết này'); return; }
    var html =
      '<div class="sheet__block"><p class="sheet__label">Lý do</p><p class="sheet__text">' + r.reason + '</p></div>' +
      '<div class="sheet__block"><p class="sheet__label">Ghi chú của Ban biên tập</p><p class="sheet__text">' + r.note + '</p></div>' +
      '<div class="sheet__block"><p class="sheet__label">Hướng dẫn chỉnh sửa</p><p class="sheet__text">' + r.guide + '</p></div>' +
      '<div class="sheet__actions">' +
        '<button class="btn-block btn-block--brand" type="button" data-sheet-act="edit">Chỉnh sửa bài</button>' +
        '<button class="btn-block btn-block--outline" type="button" data-sheet-act="resubmit">Gửi lại để duyệt</button>' +
      '</div>';
    openSheet(r.title, r.meta, html);

    sheetBody.addEventListener('click', function handler(e) {
      var b = e.target.closest('[data-sheet-act]');
      if (!b) return;
      sheetBody.removeEventListener('click', handler);
      closeSheet();
      if (b.getAttribute('data-sheet-act') === 'edit') toast('Mở trình soạn thảo để chỉnh sửa bài');
      else resubmit(row);
    });
  }

  function cancelReview(row) {
    openDialog('Hủy gửi duyệt?',
      'Bài viết sẽ trở về trạng thái bản nháp để bạn tiếp tục chỉnh sửa.',
      [
        { label: 'Tiếp tục chờ duyệt', kind: 'soft' },
        { label: 'Hủy gửi duyệt', kind: 'outline', run: function () {
            setStatus(row, 'draft', nowStamp('Cập nhật lần cuối'));
            toast('Bài viết đã trở về bản nháp');
          } }
      ]);
  }

  function editPublished(row) {
    // Sửa bài đã xuất bản sẽ phải duyệt lại — phải nói trước khi người dùng bấm tiếp
    openDialog('Chỉnh sửa bài đã xuất bản?',
      'Bài viết sẽ phải qua kiểm duyệt lại trước khi bản mới được xuất bản. Bản đang hiển thị vẫn giữ nguyên cho tới lúc đó.',
      [
        { label: 'Chỉnh sửa và gửi duyệt lại', kind: 'brand', run: function () {
            setStatus(row, 'pending', nowStamp('Đã gửi Ban biên tập'));
            toast('Bài viết đã được gửi lại cho Ban biên tập');
          } },
        { label: 'Để nguyên', kind: 'soft' }
      ]);
  }

  var MENUS = {
    published: [
      { act: 'edit', label: 'Chỉnh sửa', icon: 'nav-write' },
      { act: 'share', label: 'Chia sẻ', icon: 'share' },
      { act: 'copy', label: 'Sao chép liên kết', icon: 'link' },
      { act: 'stats', label: 'Xem thống kê', icon: 'eye' }
    ],
    pending: [
      { act: 'cancel', label: 'Hủy gửi duyệt', icon: 'close' },
      { act: 'copydraft', label: 'Sao chép thành bản nháp', icon: 'draft' }
    ],
    rejected: [
      { act: 'reason', label: 'Xem lý do', icon: 'alert' },
      { act: 'edit', label: 'Chỉnh sửa bài', icon: 'nav-write' },
      { act: 'resubmit', label: 'Gửi lại để duyệt', icon: 'send' },
      { act: 'delete', label: 'Xóa bài', icon: 'trash', danger: true }
    ],
    draft: [
      { act: 'submit', label: 'Gửi duyệt', icon: 'send' },
      { act: 'delete', label: 'Xóa bài', icon: 'trash', danger: true }
    ]
  };

  function openMenu(row) {
    var st = row.getAttribute('data-status');
    var title = $('.post-row__title', row).textContent.trim();
    var html = '<div class="sheet-menu">' + MENUS[st].map(function (m) {
      return '<button type="button" data-menu-act="' + m.act + '"' + (m.danger ? ' data-danger' : '') + '>' +
        icon(m.icon) + m.label + '</button>';
    }).join('') + '</div>';
    openSheet(title, LABEL[st], html);

    sheetBody.addEventListener('click', function handler(e) {
      var b = e.target.closest('[data-menu-act]');
      if (!b) return;
      sheetBody.removeEventListener('click', handler);
      closeSheet();
      setTimeout(function () { run(row, b.getAttribute('data-menu-act')); }, reduced ? 0 : 260);
    });
  }

  function run(row, act) {
    var st = row.getAttribute('data-status');
    switch (act) {
      case 'view':      toast('Mở bài viết'); break;
      case 'preview':   toast('Mở bản xem trước'); break;
      case 'reason':    showReason(row); break;
      case 'cancel':    cancelReview(row); break;
      case 'resubmit':  resubmit(row); break;
      case 'submit':    setStatus(row, 'pending', nowStamp('Đã gửi Ban biên tập'));
                        toast('Bài viết đã được gửi cho Ban biên tập'); break;
      case 'share':     toast('Đã mở bảng chia sẻ'); break;
      case 'copy':      toast('Đã sao chép liên kết bài viết'); break;
      case 'stats':     toast('Mở thống kê bài viết'); break;
      case 'copydraft': toast('Đã tạo một bản nháp từ bài viết này'); break;
      case 'delete':
        openDialog('Xóa bài viết?', 'Bài viết sẽ bị xóa khỏi danh sách của bạn. Thao tác này không hoàn tác được.',
          [{ label: 'Giữ lại', kind: 'soft' },
           { label: 'Xóa bài', kind: 'outline', run: function () { row.remove(); apply(); toast('Đã xóa bài viết'); } }]);
        break;
      case 'edit':
        if (st === 'published') editPublished(row);
        else if (st === 'pending') toast('Hãy hủy gửi duyệt trước khi chỉnh sửa bài');
        else toast('Mở trình soạn thảo để chỉnh sửa bài');
        break;
    }
  }

  list.addEventListener('click', function (e) {
    var menuBtn = e.target.closest('[data-row-menu]');
    if (menuBtn) { openMenu(menuBtn.closest('.post-row')); return; }
    var actBtn = e.target.closest('[data-act]');
    if (actBtn) run(actBtn.closest('.post-row'), actBtn.getAttribute('data-act'));
  });

  /* ---------- Tab cấp một ---------- */
  var ptabs = $$('.ptab');
  function selectTab(key) {
    ptabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-ptab') === key)); });
    $$('.ppanel').forEach(function (pnl) { pnl.hidden = pnl.getAttribute('data-ppanel') !== key; });
  }
  $$('[data-ptab-go]').forEach(function (b) {
    b.addEventListener('click', function () { selectTab(b.getAttribute('data-ptab-go')); });
  });
  ptabs.forEach(function (t) {
    t.addEventListener('click', function () { selectTab(t.getAttribute('data-ptab')); });
  });

  /* ---------- Thư viện ---------- */
  var libChips = $('#libChips');
  if (libChips) {
    $$('.chip', libChips).forEach(function (chip) {
      chip.addEventListener('click', function () {
        $$('.chip', libChips).forEach(function (c) { c.setAttribute('aria-selected', 'false'); });
        chip.setAttribute('aria-selected', 'true');
        var key = chip.getAttribute('data-lib');
        $$('[data-lib-panel]').forEach(function (pnl) {
          pnl.hidden = pnl.getAttribute('data-lib-panel') !== key;
        });
      });
    });
  }

  /* ---------- Xem thử dưới góc nhìn người khác ----------
     Trạng thái kiểm duyệt là dữ liệu riêng tư: ở chế độ khách, cả tab lẫn
     toàn bộ nội dung của nó bị gỡ khỏi luồng, không chỉ ẩn bằng mắt. */
  var viewerBtn = $('[data-viewer-toggle]');  // đã chuyển vào menu phụ, giữ để tương thích
  var guestNote = $('#guestNote');
  if (viewerBtn) {
    viewerBtn.addEventListener('click', function () {
      var guest = viewerBtn.getAttribute('aria-pressed') !== 'true';
      if (guestNote) guestNote.textContent = 'Đang xem hồ sơ dưới góc nhìn người khác — khu vực riêng tư đã bị ẩn.';
      applyGuest(guest);
      toast(guest ? 'Đang xem hồ sơ dưới góc nhìn người khác' : 'Đã trở lại chế độ chủ tài khoản');
    });
  }


  /* ---------- Xem hồ sơ của tác giả khác ----------
     Bấm avatar hoặc tên trong byline sẽ mở chính trang này kèm ?tac-gia=<slug>.
     Cùng một trang, chỉ thay danh tính và ép về chế độ khách — hồ sơ người khác
     không bao giờ được phép hiện khu vực kiểm duyệt. */
  var AUTHORS_REG = {"dang-khoa":{"name":"Đăng Khoa","avatar":"avatar-dang-khoa.jpg","cover":"kp-sai-gon-5h.jpg","role":"Nhà báo công nghệ","bio":"Viết về công nghệ và người trẻ. Tin rằng mọi câu chuyện đều đáng được nhìn từ một góc khác.","handle":"@dangkhoa","joined":"Tham gia tháng 1, 2024","followers":"3.3k","following":"399","posts":"29","views":"262.5k","likes":"36.3k"},"duc-anh":{"name":"Đức Anh","avatar":"avatar-duc-anh.png","cover":"kp-ha-noi.jpg","role":"Cây bút kinh tế","bio":"Theo dõi chuyển động kinh tế Việt Nam hơn mười năm. Thích những con số biết kể chuyện.","handle":"@ducanh","joined":"Tham gia tháng 2, 2025","followers":"10.4k","following":"251","posts":"48","views":"122k","likes":"74.5k"},"gnn":{"name":"Ban Biên Tập GNN","avatar":"avatar-gnn.png","cover":"cover-thanh-pho.png","role":"Nhà nghiên cứu xã hội","bio":"Quan tâm tới cách xã hội thay đổi qua từng thế hệ, và những gì bị bỏ lại phía sau.","handle":"@gnn","joined":"Tham gia tháng 3, 2025","followers":"31.9k","following":"175","posts":"14","views":"141.7k","likes":"42.5k"},"hoai-nam":{"name":"Hoài Nam","avatar":"avatar-hoai-nam.png","cover":"kp-tay-nguyen.jpg","role":"Phóng viên ảnh","bio":"Đi và ghi lại. Mỗi bức ảnh là một lát cắt của đời sống thường ngày.","handle":"@hoainam","joined":"Tham gia tháng 4, 2024","followers":"47.5k","following":"295","posts":"15","views":"55.5k","likes":"24.3k"},"hoang-nam":{"name":"PGS. Hoàng Nam","avatar":"avatar-hoang-nam.jpg","cover":"kp-song-cham.jpg","role":"Chuyên gia giáo dục","bio":"Viết về công nghệ và người trẻ. Tin rằng mọi câu chuyện đều đáng được nhìn từ một góc khác.","handle":"@hoangnam","joined":"Tham gia tháng 5, 2025","followers":"26.2k","following":"588","posts":"22","views":"40.8k","likes":"11.3k"},"khanh-linh":{"name":"Khánh Linh","avatar":"avatar-khanh-linh.png","cover":"cover-du-lich.png","role":"Nhà bình luận thời sự","bio":"Theo dõi chuyển động kinh tế Việt Nam hơn mười năm. Thích những con số biết kể chuyện.","handle":"@khanhlinh","joined":"Tham gia tháng 6, 2025","followers":"63.5k","following":"448","posts":"34","views":"66.1k","likes":"65.6k"},"lan-anh":{"name":"TS. Lan Anh","avatar":"avatar-lan-anh.png","cover":"kp-sai-gon-5h.jpg","role":"Biên tập viên","bio":"Quan tâm tới cách xã hội thay đổi qua từng thế hệ, và những gì bị bỏ lại phía sau.","handle":"@lananh","joined":"Tham gia tháng 7, 2024","followers":"35k","following":"430","posts":"33","views":"180k","likes":"30.6k"},"lan-chi":{"name":"Lan Chi","avatar":"avatar-lan-chi.png","cover":"kp-ha-noi.jpg","role":"Nhà báo môi trường","bio":"Đi và ghi lại. Mỗi bức ảnh là một lát cắt của đời sống thường ngày.","handle":"@lanchi","joined":"Tham gia tháng 8, 2025","followers":"45.2k","following":"163","posts":"5","views":"68.7k","likes":"28.1k"},"marco-rossi":{"name":"Marco Rossi","avatar":"avatar-marco-rossi.jpg","cover":"cover-thanh-pho.png","role":"Nhà báo công nghệ","bio":"Viết về công nghệ và người trẻ. Tin rằng mọi câu chuyện đều đáng được nhìn từ một góc khác.","handle":"@marcorossi","joined":"Tham gia tháng 9, 2025","followers":"50.4k","following":"220","posts":"45","views":"251.8k","likes":"67k"},"minh-duc":{"name":"Minh Đức","avatar":"avatar-minh-duc.png","cover":"kp-tay-nguyen.jpg","role":"Cây bút kinh tế","bio":"Theo dõi chuyển động kinh tế Việt Nam hơn mười năm. Thích những con số biết kể chuyện.","handle":"@minhduc","joined":"Tham gia tháng 10, 2024","followers":"9.9k","following":"617","posts":"34","views":"279.2k","likes":"33.2k"},"minh-hieu":{"name":"TS. Minh Hiếu","avatar":"avatar-minh-hieu.jpg","cover":"kp-song-cham.jpg","role":"Nhà nghiên cứu xã hội","bio":"Quan tâm tới cách xã hội thay đổi qua từng thế hệ, và những gì bị bỏ lại phía sau.","handle":"@minhhieu","joined":"Tham gia tháng 11, 2025","followers":"48.9k","following":"105","posts":"32","views":"295.4k","likes":"47.8k"},"minh-tuan":{"name":"Minh Tuấn","avatar":"avatar-minh-tuan.jpg","cover":"cover-du-lich.png","role":"Phóng viên ảnh","bio":"Đi và ghi lại. Mỗi bức ảnh là một lát cắt của đời sống thường ngày.","handle":"@minhtuan","joined":"Tham gia tháng 12, 2025","followers":"23.7k","following":"364","posts":"31","views":"198.9k","likes":"30k"},"ngoc-han":{"name":"Ngọc Hân","avatar":"avatar-ngoc-han.jpg","cover":"kp-sai-gon-5h.jpg","role":"Chuyên gia giáo dục","bio":"Viết về công nghệ và người trẻ. Tin rằng mọi câu chuyện đều đáng được nhìn từ một góc khác.","handle":"@ngochan","joined":"Tham gia tháng 1, 2024","followers":"55.3k","following":"329","posts":"58","views":"203.8k","likes":"65.5k"},"nguyen-thanh-binh":{"name":"GS. Nguyễn Thanh Bình","avatar":"avatar-nguyen-thanh-binh.png","cover":"kp-ha-noi.jpg","role":"Nhà bình luận thời sự","bio":"Theo dõi chuyển động kinh tế Việt Nam hơn mười năm. Thích những con số biết kể chuyện.","handle":"@nguyenthanhbinh","joined":"Tham gia tháng 2, 2025","followers":"52.2k","following":"636","posts":"49","views":"85.4k","likes":"32.6k"},"nhat-minh":{"name":"Nhật Minh","avatar":"avatar-nhat-minh.png","cover":"cover-thanh-pho.png","role":"Biên tập viên","bio":"Quan tâm tới cách xã hội thay đổi qua từng thế hệ, và những gì bị bỏ lại phía sau.","handle":"@nhatminh","joined":"Tham gia tháng 3, 2025","followers":"29k","following":"828","posts":"14","views":"310.7k","likes":"83.3k"},"phuong-anh":{"name":"Phương Anh","avatar":"avatar-phuong-anh.png","cover":"kp-tay-nguyen.jpg","role":"Nhà báo môi trường","bio":"Đi và ghi lại. Mỗi bức ảnh là một lát cắt của đời sống thường ngày.","handle":"@phuonganh","joined":"Tham gia tháng 4, 2024","followers":"7.1k","following":"435","posts":"27","views":"307.3k","likes":"20.7k"},"quang-huy":{"name":"TS. Quang Huy","avatar":"avatar-quang-huy.jpg","cover":"kp-song-cham.jpg","role":"Nhà báo công nghệ","bio":"Viết về công nghệ và người trẻ. Tin rằng mọi câu chuyện đều đáng được nhìn từ một góc khác.","handle":"@quanghuy","joined":"Tham gia tháng 5, 2025","followers":"2.6k","following":"233","posts":"56","views":"173.9k","likes":"86.9k"},"quoc-bao":{"name":"Quốc Bảo","avatar":"avatar-quoc-bao.png","cover":"cover-du-lich.png","role":"Cây bút kinh tế","bio":"Theo dõi chuyển động kinh tế Việt Nam hơn mười năm. Thích những con số biết kể chuyện.","handle":"@quocbao","joined":"Tham gia tháng 6, 2025","followers":"1.7k","following":"411","posts":"55","views":"125.2k","likes":"87.7k"},"quynh-chi":{"name":"Quỳnh Chi","avatar":"avatar-quynh-chi.jpg","cover":"kp-sai-gon-5h.jpg","role":"Nhà nghiên cứu xã hội","bio":"Quan tâm tới cách xã hội thay đổi qua từng thế hệ, và những gì bị bỏ lại phía sau.","handle":"@quynhchi","joined":"Tham gia tháng 7, 2024","followers":"42.8k","following":"637","posts":"29","views":"280.9k","likes":"43.9k"},"thanh-ha":{"name":"Thanh Hà","avatar":"avatar-thanh-ha.jpg","cover":"kp-ha-noi.jpg","role":"Phóng viên ảnh","bio":"Đi và ghi lại. Mỗi bức ảnh là một lát cắt của đời sống thường ngày.","handle":"@thanhha","joined":"Tham gia tháng 8, 2025","followers":"36.1k","following":"522","posts":"55","views":"274.8k","likes":"30.4k"},"thu-hang":{"name":"Thu Hằng","avatar":"avatar-thu-hang.png","cover":"cover-thanh-pho.png","role":"Chuyên gia giáo dục","bio":"Viết về công nghệ và người trẻ. Tin rằng mọi câu chuyện đều đáng được nhìn từ một góc khác.","handle":"@thuhang","joined":"Tham gia tháng 9, 2025","followers":"35.4k","following":"141","posts":"22","views":"160.7k","likes":"74.1k"},"tran-bao":{"name":"Trần Bảo","avatar":"avatar-tran-bao.jpg","cover":"kp-tay-nguyen.jpg","role":"Nhà bình luận thời sự","bio":"Theo dõi chuyển động kinh tế Việt Nam hơn mười năm. Thích những con số biết kể chuyện.","handle":"@tranbao","joined":"Tham gia tháng 10, 2024","followers":"32.1k","following":"817","posts":"17","views":"193.3k","likes":"22.1k"},"tran-bao-long":{"name":"Trần Bảo Long","avatar":"avatar-tran-bao-long.jpg","cover":"kp-song-cham.jpg","role":"Biên tập viên","bio":"Quan tâm tới cách xã hội thay đổi qua từng thế hệ, và những gì bị bỏ lại phía sau.","handle":"@tranbaolong","joined":"Tham gia tháng 11, 2025","followers":"54.9k","following":"488","posts":"33","views":"90.3k","likes":"13.6k"},"van-duc":{"name":"GS. Văn Đức","avatar":"avatar-van-duc.jpg","cover":"cover-du-lich.png","role":"Nhà báo môi trường","bio":"Đi và ghi lại. Mỗi bức ảnh là một lát cắt của đời sống thường ngày.","handle":"@vanduc","joined":"Tham gia tháng 12, 2025","followers":"40.2k","following":"389","posts":"7","views":"90.1k","likes":"11.9k"}};
  var ME = 'duc-anh';

  function applyGuest(on) {
    if (guestNote) guestNote.hidden = !on;
    $$('[data-owner-only]').forEach(function (el) { el.hidden = on; });
    $$('[data-guest-only]').forEach(function (el) { el.hidden = !on; });
    if (viewerBtn) viewerBtn.setAttribute('aria-pressed', String(on));
    if (on) selectTab('ho-so');
    // Khách chỉ còn đúng một tab — bày một tab đơn độc trông như lỗi, ẩn cả thanh đi.
    var bar = $('.ptabs');
    if (bar) bar.hidden = on;
  }

  var who = (location.search.match(/[?&]tac-gia=([a-z0-9-]+)/) || [])[1];
  if (who && AUTHORS_REG[who] && who !== ME) {
    var a = AUTHORS_REG[who];
    var set = function (key, val) {
      var el = $('[data-me="' + key + '"]');
      if (el) el.textContent = val;
    };
    // Bố cục mới bỏ ảnh bìa, nên phần tử này có thể không tồn tại
    var bia = $('[data-me="cover"]');
    if (bia) bia.src = 'assets/img/' + a.cover;
    $('[data-me="ava"]').src = 'assets/img/' + a.avatar;
    set('name', a.name);
    set('handle', a.handle);
    set('joined', a.joined);
    set('followers', viNum(a.followers));
    set('following', viNum(a.following));
    set('role', a.role);
    set('bio', a.bio);
    set('posts', a.posts);
    set('posts-guest', a.posts);
    // 6 bài nổi bật trên một hồ sơ chỉ có 5 bài là con số tự mâu thuẫn — suy ra từ số bài
    set('featured', Math.max(1, Math.round(a.posts * 0.4)));
    set('views', viNum(a.views));
    set('likes', viNum(a.likes));
    document.title = a.name + ' — Góc Nhìn Mới';

    // byline trong danh sách bài đã xuất bản phải khớp với tác giả đang xem
    $$('[data-ppanel="ho-so"] .byline').forEach(function (b) {
      var img = b.querySelector('img');
      var nm = b.querySelector('.byline__name');
      if (img) img.src = 'assets/img/' + a.avatar;
      if (nm) { nm.textContent = a.name; nm.setAttribute('href', 'ca-nhan.html?tac-gia=' + who); }
      var link = b.querySelector('.byline__who');
      if (link) link.setAttribute('href', 'ca-nhan.html?tac-gia=' + who);
    });

    syncBio();
    applyGuest(true);
    if (guestNote) guestNote.textContent = 'Bạn đang xem hồ sơ công khai của ' + a.name + '.';
  }


  /* ---------- Định dạng số kiểu Việt: 12,4K chứ không phải 12.4k ---------- */
  function viNum(v) {
    return String(v).replace('.', ',').replace(/k$/i, 'K');
  }
  $$('[data-me="followers"], [data-me="following"], [data-me="views"], [data-me="likes"]')
    .forEach(function (el) { el.textContent = viNum(el.textContent); });

  /* ---------- Tiểu sử: chỉ mời mở rộng khi thật sự bị cắt ---------- */
  var bio = $('.profile-bio');
  var bioMore = $('#bioMore');
  var bioAdd = $('#bioAdd');
  function syncBio() {
    if (!bio) return;
    var empty = !bio.textContent.trim();
    bio.hidden = empty;
    if (bioAdd) bioAdd.hidden = !empty;
    if (bioMore) bioMore.hidden = empty || bio.scrollHeight <= bio.clientHeight + 1;
  }
  if (bioMore) {
    bioMore.addEventListener('click', function () {
      bio.classList.toggle('is-expanded');
      bioMore.textContent = bio.classList.contains('is-expanded') ? 'Thu gọn' : 'Xem thêm';
    });
  }
  syncBio();
  window.addEventListener('resize', syncBio);

  /* ---------- Danh sách người theo dõi ---------- */
  var PEOPLE = [
    ['nguyen-thanh-binh', 'GS. Nguyễn Thanh Bình', 'Nhà nghiên cứu xã hội'],
    ['thu-hang', 'Thu Hằng', 'Chuyên gia giáo dục'],
    ['hoang-nam', 'PGS. Hoàng Nam', 'Nhà bình luận thời sự'],
    ['quynh-chi', 'Quỳnh Chi', 'Phóng viên ảnh'],
    ['minh-duc', 'Minh Đức', 'Nhà báo môi trường'],
    ['lan-anh', 'TS. Lan Anh', 'Cây bút kinh tế']
  ];
  function peopleSheet(kind) {
    var title = kind === 'followers' ? 'Người theo dõi' : 'Đang theo dõi';
    var n = $('[data-me="' + kind + '"]');
    var html = '<div class="sheet-menu">' + PEOPLE.map(function (x) {
      var reg = AUTHORS_REG[x[0]];
      var ava = reg ? reg.avatar : 'avatar-duc-anh.png';
      return '<a href="ca-nhan.html?tac-gia=' + x[0] + '" class="people-row">' +
        '<img src="assets/img/' + ava + '" alt="" width="40" height="40" loading="lazy">' +
        '<span><b>' + x[1] + '</b><i>' + x[2] + '</i></span></a>';
    }).join('') + '</div>';
    openSheet(title, (n ? n.textContent : '') + ' người', html);
  }
  $$('[data-people]').forEach(function (b) {
    b.addEventListener('click', function () { peopleSheet(b.getAttribute('data-people')); });
  });

  /* ---------- Bài đã xuất bản: bày 8 thẻ, bấm Xem thêm mở tiếp ---------- */
  var pubFeed = $('#pubFeed');
  var pubMore = $('#pubMore');
  if (pubFeed && pubMore) {
    var PUB_STEP = 4;
    var pubLabel = $('.btn-outline__label', pubMore);

    var syncPubMore = function () {
      var con = $$('.card[hidden]', pubFeed).length;
      pubMore.hidden = con === 0;
    };

    pubMore.addEventListener('click', function () {
      pubMore.classList.add('is-loading');
      pubLabel.textContent = 'Đang tải…';
      setTimeout(function () {
        $$('.card[hidden]', pubFeed).slice(0, PUB_STEP).forEach(function (c) { c.hidden = false; });
        pubMore.classList.remove('is-loading');
        pubLabel.textContent = 'Xem thêm';
        syncPubMore();
      }, 500);
    });

    syncPubMore();
  }

  /* ---------- Theo dõi / bỏ theo dõi ở hồ sơ người khác ---------- */
  var followBtn = $('[data-follow-toggle]');
  if (followBtn) {
    followBtn.addEventListener('click', function () {
      var on = followBtn.getAttribute('aria-pressed') !== 'true';
      followBtn.setAttribute('aria-pressed', String(on));
      $('.btn-outline-sm__label', followBtn).textContent = on ? 'Đang theo dõi' : 'Theo dõi';
      toast(on ? 'Đã theo dõi' : 'Đã bỏ theo dõi');
    });
  }

  /* ---------- Menu phụ của hồ sơ ---------- */
  var profMenuBtn = $('[data-profile-menu]');
  if (profMenuBtn) {
    profMenuBtn.addEventListener('click', function () {
      var guest = $('.ptabs').hidden;
      var items = guest
        ? [['alert', 'Báo cáo hồ sơ'], ['close', 'Chặn người dùng']]
        : [['nav-user', 'Xem như người khác'], ['nav-write', 'Cài đặt tài khoản']];
      var html = '<div class="sheet-menu">' + items.map(function (x) {
        return '<button type="button" data-prof-act="' + x[1] + '">' +
          '<svg class="icon" aria-hidden="true"><use href="#i-' + x[0] + '"></use></svg>' + x[1] + '</button>';
      }).join('') + '</div>';
      openSheet('Tuỳ chọn', '', html);
      sheetBody.addEventListener('click', function handler(ev) {
        var b = ev.target.closest('[data-prof-act]');
        if (!b) return;
        sheetBody.removeEventListener('click', handler);
        closeSheet();
        var act = b.getAttribute('data-prof-act');
        if (act === 'Xem như người khác') setTimeout(function () { applyGuest(true); toast('Đang xem hồ sơ dưới góc nhìn người khác'); }, 260);
        else setTimeout(function () { toast(act); }, 260);
      });
    });
  }

  sortRows();
  apply();
})();


/* ==========================================================================
   Trang chi tiết địa điểm — sheet đóng góp
   ========================================================================== */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var sheet = $('#contribSheet');
  if (!sheet) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var toastEl = $('#toast');
  var timer = 0;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(timer);
    timer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2600);
  }

  var lastFocus = null;
  function open(title) {
    lastFocus = document.activeElement;
    $('#contribTitle').textContent = title;
    sheet.hidden = false;
    void sheet.offsetWidth;
    sheet.classList.add('is-open');
    $('#cName').focus();
  }
  function close() {
    sheet.classList.remove('is-open');
    setTimeout(function () { sheet.hidden = true; }, reduced ? 0 : 260);
    if (lastFocus) lastFocus.focus();
  }

  $$('[data-contrib]').forEach(function (b) {
    b.addEventListener('click', function () { open('Đóng góp địa điểm'); });
  });
  $$('[data-contrib-update]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      // Cùng biểu mẫu, chỉ khác ngữ cảnh: điền sẵn địa điểm đang xem
      $('#cName').value = 'The Workshop Coffee';
      $('#cAddr').value = '27 Ngô Đức Kế, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh';
      open('Cập nhật thông tin địa điểm');
    });
  });
  sheet.addEventListener('click', function (e) {
    if (e.target.closest('[data-contrib-close]')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sheet.classList.contains('is-open')) close();
  });

  // đếm ký tự mô tả
  var desc = $('#cDesc'), count = $('#cCount');
  if (desc && count) {
    desc.addEventListener('input', function () {
      count.textContent = desc.value.length.toLocaleString('vi-VN') + '/1.000';
    });
  }

  $$('[data-photo-remove]').forEach(function (b) {
    b.addEventListener('click', function () { b.closest('.photo-thumb').remove(); });
  });

  $('[data-contrib-submit]').addEventListener('click', function () {
    var name = $('#cName'), addr = $('#cAddr');
    // Hai trường bắt buộc: báo tại chỗ thay vì gửi đi rồi mới báo lỗi
    if (!name.value.trim() || !addr.value.trim()) {
      (name.value.trim() ? addr : name).focus();
      toast('Vui lòng nhập tên địa điểm và địa chỉ');
      return;
    }
    close();
    setTimeout(function () {
      toast('Đã gửi đóng góp tới Ban biên tập, bài sẽ được duyệt trước khi hiển thị');
    }, reduced ? 0 : 280);
  });
})();


/* ==========================================================================
   Trang Photo — lọc bộ ảnh theo chủ đề
   ========================================================================== */


/* ==========================================================================
   Nghe & Xem — nút Xem thêm dưới mỗi lưới playlist
   ========================================================================== */
(function () {
  'use strict';
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-playlist-more]'));
  if (!buttons.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STEP = 2;

  buttons.forEach(function (btn) {
    var sec = document.getElementById(btn.getAttribute('data-playlist-more'));
    sec = sec ? sec.closest('section') : null;
    if (!sec) return;

    var hidden = function () {
      return Array.prototype.slice.call(sec.querySelectorAll('.plcard[hidden]'));
    };
    var sync = function () { btn.hidden = hidden().length === 0; };

    btn.addEventListener('click', function () {
      var label = btn.textContent;
      btn.textContent = 'Đang tải…';
      setTimeout(function () {
        hidden().slice(0, STEP).forEach(function (c) { c.hidden = false; });
        btn.textContent = label;
        sync();
      }, reduced ? 0 : 450);
    });

    sync();
  });
})();


/* ---------- Thanh tiêu đề dính của trang bài viết ---------- */
(function () {
  var bar = document.getElementById('artBar');
  var hero = document.querySelector('.article-hero');
  var float = document.querySelector('.article-back');
  if (!bar || !hero) return;

  // Ảnh mở đầu ghim tại đỉnh nên mép dưới của nó không bao giờ đi lên nữa —
  // mốc phải lấy theo mép trên của khối nội dung đang trượt đè lên.
  var lop = document.querySelector('.article-scroll');
  var moc = lop || hero;

  var on = false;
  function sync() {
    var r = moc.getBoundingClientRect();
    var want = (lop ? r.top : r.bottom) <= bar.offsetHeight;
    if (want === on) return;
    on = want;
    bar.classList.toggle('is-on', on);
    if (float) float.classList.toggle('is-off', on);
  }

  var tick = false;
  addEventListener('scroll', function () {
    if (tick) return;
    tick = true;
    requestAnimationFrame(function () { tick = false; sync(); });
  }, { passive: true });
  addEventListener('resize', sync, { passive: true });
  sync();
})();


/* ---------- Nút dẫn tới một mục trong trang ---------- */
(function () {
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-goto]');
    if (!b) return;
    var dich = document.querySelector(b.getAttribute('data-goto'));
    if (dich) dich.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();


/* ---------- Album ảnh địa điểm: lật bằng nút hai bên hoặc bấm ô nhỏ ---------- */
(function () {
  var box = document.querySelector('[data-gallery]');
  if (!box) return;
  var anhLon = box.querySelector('img');
  var oNho = [].slice.call(document.querySelectorAll('[data-gallery-go]'));
  if (!anhLon || !oNho.length) return;

  var nguon = oNho.map(function (b) { return b.querySelector('img').getAttribute('src'); });
  var dem = box.querySelector('[data-gallery-count]');
  var i = 0;

  function ve() {
    anhLon.setAttribute('src', nguon[i]);
    anhLon.setAttribute('alt', 'Ảnh ' + (i + 1) + ' của địa điểm');
    if (dem) dem.textContent = (i + 1) + '/' + nguon.length;
    oNho.forEach(function (b, k) { b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
  }
  function di(buoc) { i = (i + buoc + nguon.length) % nguon.length; ve(); }

  var truoc = box.querySelector('[data-gallery-prev]');
  var sau = box.querySelector('[data-gallery-next]');
  if (truoc) truoc.addEventListener('click', function () { di(-1); });
  if (sau) sau.addEventListener('click', function () { di(1); });
  oNho.forEach(function (b, k) { b.addEventListener('click', function () { i = k; ve(); }); });

  ve();
})();


/* ---------- Lọc danh sách địa điểm theo tỉnh thành và loại hình ---------- */
(function () {
  var ds = document.querySelector('[data-plist]');
  if (!ds) return;

  var muc = [].slice.call(ds.querySelectorAll('.plist__item'));
  var dem = document.querySelector('[data-plist-count]');
  var rong = document.querySelector('[data-plist-empty]');
  var chon = { tinh: 'tat-ca', loai: 'tat-ca' };

  /* Bày 8 địa điểm rồi mới tới nút Xem thêm. Đếm riêng số khớp bộ lọc và số
     thật sự bày ra: đổi bộ lọc thì lại tính từ 8, không giữ số của lần trước. */
  var BAY_DAU = 8, BUOC_BAY = 8;
  var bayToi = BAY_DAU;
  var themNut = document.querySelector('[data-plist-more]');
  var themHop = document.getElementById('plist-more');

  function loc() {
    var khop = 0, bay = 0;
    muc.forEach(function (li) {
      var hop = (chon.tinh === 'tat-ca' || li.dataset.tinh === chon.tinh) &&
                (chon.loai === 'tat-ca' || li.dataset.loai === chon.loai);
      if (hop) khop++;
      var hien = hop && bay < bayToi;
      if (hien) bay++;
      li.hidden = !hien;
    });
    if (dem) dem.textContent = khop + ' địa điểm';
    if (rong) rong.hidden = khop > 0;
    if (themHop) themHop.hidden = bay >= khop;
  }

  if (themNut) {
    themNut.addEventListener('click', function () {
      bayToi += BUOC_BAY;
      loc();
    });
  }

  ['tinh', 'loai'].forEach(function (nhom) {
    var nut = [].slice.call(document.querySelectorAll('[data-' + nhom + ']'));
    nut.forEach(function (b) {
      b.addEventListener('click', function () {
        var gt = b.getAttribute('data-' + nhom);
        // Chip ở thanh rút gọn và chip trong hộp lọc là hai phần tử khác nhau
        // nhưng cùng một giá trị — so theo giá trị thì cả hai cùng sáng.
        nut.forEach(function (x) {
          x.setAttribute('aria-selected', String(x.getAttribute('data-' + nhom) === gt));
        });
        chon[nhom] = b.getAttribute('data-' + nhom);
        bayToi = BAY_DAU;
        loc();
      });
    });
  });

  /* ---------- Hộp lọc ---------- */
  var hop = document.getElementById('placeFilter');
  var moNut = document.querySelector('[data-filter-open]');
  if (hop && moNut) {
    function dong() {
      hop.hidden = true;
      moNut.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    moNut.addEventListener('click', function () {
      hop.hidden = false;
      moNut.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    });
    [].slice.call(hop.querySelectorAll('[data-filter-close]')).forEach(function (b) {
      b.addEventListener('click', dong);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !hop.hidden) dong();
    });
  }

  loc();
})();

/* ---------- Trang viết bài ---------- */
(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var soan = $('.vb-soan');
  if (!soan) return;

  /* --- đếm chữ --- */
  var oSo = $('#vbSoChu');
  function demChu() {
    if (!oSo) return;
    var chu = soan.innerText.replace(/\s+/g, ' ').trim();
    oSo.textContent = chu ? String(chu.split(' ').length) : '0';
  }
  soan.addEventListener('input', demChu);
  demChu();

  /* --- bảng chọn khối --- */
  var menu = $('#vbMenu');
  var dangMo = null;

  function dongMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    if (dangMo) dangMo.setAttribute('aria-expanded', 'false');
    dangMo = null;
  }

  function moMenu(nut) {
    var o = nut.getBoundingClientRect();
    menu.hidden = false;
    /* Đặt ngay dưới nút; sát đáy màn thì lật lên trên cho khỏi tràn. */
    var cao = menu.offsetHeight;
    var tren = o.bottom + cao + 12 > window.innerHeight && o.top > cao + 12;
    menu.style.left = (window.scrollX + o.left) + 'px';
    menu.style.top = (window.scrollY + (tren ? o.top - cao - 8 : o.bottom + 8)) + 'px';
    nut.setAttribute('aria-expanded', 'true');
    dangMo = nut;
  }

  $$('[data-vb-them]').forEach(function (nut) {
    nut.addEventListener('click', function (e) {
      e.stopPropagation();
      if (dangMo === nut) { dongMenu(); return; }
      dongMenu();
      moMenu(nut);
    });
  });

  document.addEventListener('click', function (e) {
    if (menu && !menu.hidden && !menu.contains(e.target)) dongMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') dongMenu();
  });

  /* --- thêm khối mới ngay dưới khối đang chọn --- */
  var MAU = {
    h1: '<h1 class="vb-tieude" contenteditable="true" role="textbox" data-goi="Tiêu đề cấp 1"></h1>',
    h2: '<h2 class="vb-tieude vb-tieude--h2" contenteditable="true" role="textbox" data-goi="Tiêu đề cấp 2"></h2>',
    h3: '<h3 class="vb-tieude vb-tieude--h3" contenteditable="true" role="textbox" data-goi="Tiêu đề cấp 3"></h3>',
    anh: '<figure class="vb-anh"><img src="assets/img/kp-kinh-te-ai.png" alt="" width="860" height="484" loading="lazy"><figcaption contenteditable="true" role="textbox" data-goi="Thêm chú thích ảnh…"></figcaption></figure>',
    video: '<figure class="vb-anh"><img src="assets/img/nx-hero-momo.png" alt="" width="860" height="484" loading="lazy"><figcaption contenteditable="true" role="textbox" data-goi="Thêm chú thích video…"></figcaption></figure>'
  };

  function nutKhoi() {
    return '<div class="vb-khoi__nut">'
      + '<button class="vb-nut-tron" type="button" data-vb-them aria-expanded="false" aria-label="Thêm khối nội dung"><svg class="icon" aria-hidden="true"><use href="#i-plus"></use></svg></button>'
      + '<button class="vb-nut-tron" type="button" aria-label="Kéo để đổi chỗ khối"><svg class="icon" aria-hidden="true"><use href="#i-grip"></use></svg></button>'
      + '</div>';
  }

  $$('.vb-menu__muc', menu).forEach(function (muc) {
    muc.addEventListener('click', function () {
      var loai = muc.getAttribute('data-them');
      var goc = dangMo && dangMo.closest('[data-vb-khoi]');
      dongMenu();
      if (!goc || !MAU[loai]) return;
      var moi = document.createElement('div');
      moi.className = 'vb-khoi';
      moi.setAttribute('data-vb-khoi', '');
      moi.innerHTML = nutKhoi() + MAU[loai];
      goc.parentNode.insertBefore(moi, goc.nextSibling);
      gan(moi);
      var o = moi.querySelector('[contenteditable]');
      if (o) o.focus();
      demChu();
    });
  });

  function gan(khoi) {
    var nut = khoi.querySelector('[data-vb-them]');
    if (!nut) return;
    nut.addEventListener('click', function (e) {
      e.stopPropagation();
      if (dangMo === nut) { dongMenu(); return; }
      dongMenu();
      moMenu(nut);
    });
  }

  /* --- bỏ danh mục --- */
  $$('.vb-tag__bo').forEach(function (b) {
    b.addEventListener('click', function () { b.closest('.vb-tag').remove(); });
  });

  /* --- mũi tên mở/đóng --- */
  $$('.vb-hang__mo').forEach(function (b) {
    b.addEventListener('click', function () {
      b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
    });
  });
})();
