/* Paoliello Clinic — interações e movimento.
   Tudo progressivo: sem JavaScript a página é completa; com "movimento reduzido" ativo, nada se move. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  if (/[?&]qa=1/.test(location.search)) doc.classList.add('qa'); /* captura de revisão: altura fixa do hero */

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var body = document.body;
  var header = document.querySelector('.site-header');
  var hero = document.querySelector('.hero');

  /* entrada da página (temporizador em vez de rAF: funciona mesmo com a aba em segundo plano) */
  setTimeout(function () { body.classList.add('is-ready'); }, 30);
  window.addEventListener('pageshow', function () { body.classList.add('is-ready'); });

  /* transição suave entre páginas internas */
  if (!reduce) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || a.hasAttribute('data-open') || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) return;
      var url; try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      if (!/\.html?$|\/$/.test(url.pathname)) return;
      e.preventDefault();
      body.classList.add('is-leaving');
      setTimeout(function () { location.href = url.href; }, 240);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) body.classList.remove('is-leaving'); });
  }

  /* cabeçalho: transparente sobre o hero, sólido depois */
  function onScrollHeader() {
    var y = window.scrollY || window.pageYOffset;
    var solid = y > 24;
    if (hero) {
      var limit = hero.offsetHeight - header.offsetHeight;
      header.classList.toggle('on-hero', y < limit && !body.classList.contains('menu-open'));
      solid = y >= limit;
    }
    header.classList.toggle('is-solid', solid || body.classList.contains('menu-open'));
  }
  if (header) { if (hero) header.classList.add('on-hero'); onScrollHeader(); }

  /* menu mobile */
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      onScrollHeader();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) { body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); onScrollHeader(); }
    });
  }

  /* submenu de especialidades */
  document.querySelectorAll('.nav > li.has-sub').forEach(function (li) {
    var btn = li.querySelector('button');
    var timer;
    function open() { clearTimeout(timer); li.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
    function close() { timer = setTimeout(function () { li.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }, 120); }
    li.addEventListener('mouseenter', open);
    li.addEventListener('mouseleave', close);
    btn.addEventListener('click', function () { if (li.classList.contains('is-open')) { clearTimeout(timer); li.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); } else { open(); } });
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { li.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); } });
  });

  /* painel de agendamento */
  var dialog = document.getElementById('agendar');
  if (dialog) {
    var wa = dialog.querySelector('[data-wa]');
    var base = wa ? wa.getAttribute('data-wa') : '';
    var lastFocus = null;
    function openDialog(context) {
      lastFocus = document.activeElement;
      if (wa && base) {
        var text = base;
        var extra = context || body.getAttribute('data-wa-context') || '';
        if (extra) text += ' ' + extra;
        wa.href = 'https://wa.me/5511999083332?text=' + encodeURIComponent(text);
      }
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
      var first = dialog.querySelector('.way'); if (first) first.focus();
    }
    function closeDialog() { if (dialog.open) dialog.close(); else dialog.removeAttribute('open'); if (lastFocus) lastFocus.focus(); }
    document.querySelectorAll('[data-open="agendar"]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); openDialog(el.getAttribute('data-wa-context')); });
    });
    dialog.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', closeDialog); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) closeDialog(); });
  }

  /* lista da equipe: retrato que troca ao passar o mouse */
  document.querySelectorAll('.team').forEach(function (team) {
    var cap = team.querySelector('.por .cap');
    var current = team.querySelector('.por img.is-on');
    function show(key, label) {
      var next = team.querySelector('.por img[data-key="' + key + '"]');
      if (!next || next === current) return;
      if (current) current.classList.remove('is-on');
      next.classList.add('is-on'); current = next;
      if (cap) cap.textContent = label || '';
    }
    team.querySelectorAll('.team-row').forEach(function (row) {
      var key = row.getAttribute('data-key'), label = row.getAttribute('data-label') || '';
      row.addEventListener('mouseenter', function () { show(key, label); });
      row.addEventListener('focusin', function () { show(key, label); });
    });
    team.addEventListener('mouseleave', function () { show('default', ''); });
  });

  /* títulos revelados palavra a palavra */
  if (!reduce) {
    document.querySelectorAll('[data-split]').forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      el.classList.add('words');
      words.forEach(function (w, i) {
        var o = document.createElement('span'); o.className = 'w';
        var s = document.createElement('span'); s.textContent = w; s.style.transitionDelay = (i * 50) + 'ms';
        o.appendChild(s); el.appendChild(o); el.appendChild(document.createTextNode(' '));
      });
    });
  }

  /* manifesto: palavras que acendem conforme a rolagem */
  var wordBlocks = [];
  document.querySelectorAll('[data-words-progress]').forEach(function (el) {
    if (reduce) return;
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    var spans = words.map(function (w) { var s = document.createElement('span'); s.className = 'pw'; s.textContent = w; el.appendChild(s); el.appendChild(document.createTextNode(' ')); return s; });
    el.classList.add('words-progress');
    wordBlocks.push({ el: el, words: spans, n: -1 });
  });

  /* paralaxe leve: o elemento se desloca em relação ao seu contêiner */
  var px = [];
  /* só hero e faixas (transform, barato para o navegador); as demais imagens ficam estáticas para manter a rolagem leve */
  if (!reduce && !doc.classList.contains('qa')) document.querySelectorAll('[data-parallax]').forEach(function (el) { if (el.closest('.fig-p')) return; px.push({ el: el, ref: el.parentElement, f: parseFloat(el.getAttribute('data-parallax')) || 0.12, pos: false }); });

  /* revelação: o que já está na tela aparece de imediato; o resto, ao entrar */
  var items = Array.prototype.slice.call(document.querySelectorAll('.reveal, .words, .draw'));
  function inView(el) { var r = el.getBoundingClientRect(); return r.top < window.innerHeight * 0.94 && r.bottom > 0; }
  var pending = [];
  if (!reduce && items.length) {
    items.forEach(function (el) { if (inView(el)) el.classList.add('in'); });
    pending = items.filter(function (el) { return !el.classList.contains('in'); });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
      pending.forEach(function (el) { io.observe(el); });
    }
    setTimeout(function () { pending.forEach(function (el) { if (inView(el)) el.classList.add('in'); }); }, 1200);
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* linhas em SVG que se desenham ao entrar na tela */
  document.querySelectorAll('svg.draw path, svg.draw circle, svg.draw line, svg.draw polyline').forEach(function (p) {
    if (reduce || typeof p.getTotalLength !== 'function') return;
    var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
  });

  /* narrativa com imagem fixa: o passo em foco troca a imagem */
  document.querySelectorAll('.story').forEach(function (st) {
    var steps = st.querySelectorAll('.st'), imgs = st.querySelectorAll('.frame img');
    function show(i) { steps.forEach(function (s, j) { s.classList.toggle('is-on', j === i); }); imgs.forEach(function (im, j) { im.classList.toggle('is-on', j === i); }); }
    show(0);
    if ('IntersectionObserver' in window && !reduce) {
      var sio = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) show(Array.prototype.indexOf.call(steps, e.target)); }); }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
      steps.forEach(function (s) { sio.observe(s); });
    } else { steps.forEach(function (s) { s.classList.add('is-on'); }); }
  });

  /* imagem que acompanha o cursor nas listas (só com mouse) */
  if (fine && !reduce) {
    var lists = document.querySelectorAll('[data-preview]');
    if (lists.length) {
      var pv = document.createElement('div'); pv.className = 'preview'; pv.setAttribute('aria-hidden', 'true');
      var pin = document.createElement('div'); pin.className = 'in'; pv.appendChild(pin); body.appendChild(pv);
      var cache = {}, cur = null, tx = 0, ty = 0, x = -1, y = -1, raf = null;
      function loop() { x += (tx - x) * 0.14; y += (ty - y) * 0.14; pv.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)'; raf = requestAnimationFrame(loop); }
      lists.forEach(function (list) {
        list.querySelectorAll('[data-img]').forEach(function (row) {
          var src = row.getAttribute('data-img');
          if (!cache[src]) { var im = document.createElement('img'); im.src = src; im.alt = ''; pin.appendChild(im); cache[src] = im; }
          row.addEventListener('mouseenter', function () { if (cur) cur.classList.remove('is-on'); cur = cache[src]; cur.classList.add('is-on'); pv.classList.add('is-on'); });
        });
        list.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; if (x < 0) { x = tx; y = ty; } if (!raf) loop(); });
        list.addEventListener('mouseleave', function () { pv.classList.remove('is-on'); });
      });
    }
  }

  /* globo em linha: esfera de arame girando, com arcos até São Paulo */
  document.querySelectorAll('canvas.globe-canvas').forEach(function (cv) {
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2), size = 0, R = 0, rot = 0, last = 0, running = false;
    var ink = getComputedStyle(cv).color || '#012635';
    var SP = { lat: -23.55, lon: -46.63 };
    var origins = [{ lat: 40.7, lon: -74 }, { lat: 51.5, lon: -0.1 }, { lat: 45.5, lon: -73.6 }, { lat: 38.7, lon: -9.1 }, { lat: -34.6, lon: -58.4 }, { lat: 25.8, lon: -80.2 }, { lat: -3.1, lon: -60 }, { lat: -25.4, lon: -49.3 }, { lat: 48.9, lon: 2.3 }, { lat: -12.9, lon: -38.5 }];
    function resize() { var w = cv.clientWidth || 480; size = w; cv.width = w * dpr; cv.height = w * dpr; R = w * 0.44; }
    function p3(lat, lon, r) { var la = lat * Math.PI / 180, lo = (lon * Math.PI / 180) + r; return { x: Math.cos(la) * Math.sin(lo), y: -Math.sin(la), z: Math.cos(la) * Math.cos(lo) }; }
    function draw(t) {
      if (!last) last = t; var dt = Math.min(0.05, (t - last) / 1000); last = t; rot += dt * 0.12;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size, size);
      var cx = size / 2, cy = size / 2; ctx.lineWidth = 1; ctx.strokeStyle = ink;
      /* paralelos */
      for (var lat = -60; lat <= 60; lat += 30) { ctx.beginPath(); var first = true; for (var lon = 0; lon <= 360; lon += 4) { var q = p3(lat, lon, rot); if (q.z < -0.02) { first = true; continue; } ctx.globalAlpha = 0.10 + 0.22 * q.z; if (first) { ctx.moveTo(cx + q.x * R, cy + q.y * R); first = false; } else ctx.lineTo(cx + q.x * R, cy + q.y * R); } ctx.stroke(); }
      /* meridianos */
      for (var m = 0; m < 180; m += 30) { ctx.beginPath(); var f2 = true; for (var la2 = -90; la2 <= 90; la2 += 4) { var q2 = p3(la2, m, rot); if (q2.z < -0.02) { f2 = true; continue; } if (f2) { ctx.moveTo(cx + q2.x * R, cy + q2.y * R); f2 = false; } else ctx.lineTo(cx + q2.x * R, cy + q2.y * R); } ctx.globalAlpha = 0.18; ctx.stroke(); }
      /* contorno */
      ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      /* arcos até São Paulo */
      var sp = p3(SP.lat, SP.lon, rot);
      origins.forEach(function (o, i) {
        var a = p3(o.lat, o.lon, rot); if (a.z < 0 && sp.z < 0) return;
        var mx = (a.x + sp.x) / 2, my = (a.y + sp.y) / 2, mz = (a.z + sp.z) / 2, ml = Math.sqrt(mx * mx + my * my + mz * mz) || 1;
        var lift = 1.28; var hx = mx / ml * lift, hy = my / ml * lift, hz = mz / ml * lift;
        ctx.beginPath(); var vis = false;
        for (var s = 0; s <= 1.0001; s += 0.04) { var u = 1 - s; var bx = u * u * a.x + 2 * u * s * hx + s * s * sp.x, by = u * u * a.y + 2 * u * s * hy + s * s * sp.y, bz = u * u * a.z + 2 * u * s * hz + s * s * sp.z; if (bz < -0.05) { vis = false; continue; } if (!vis) { ctx.moveTo(cx + bx * R, cy + by * R); vis = true; } else ctx.lineTo(cx + bx * R, cy + by * R); }
        ctx.globalAlpha = 0.22 + 0.15 * Math.sin(t / 1400 + i); ctx.stroke();
        if (a.z > 0) { ctx.globalAlpha = 0.5 + 0.4 * a.z; ctx.beginPath(); ctx.arc(cx + a.x * R, cy + a.y * R, 2, 0, Math.PI * 2); ctx.fillStyle = ink; ctx.fill(); }
      });
      /* São Paulo */
      if (sp.z > -0.05) { var pulse = 6 + 5 * (0.5 + 0.5 * Math.sin(t / 700)); ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(cx + sp.x * R, cy + sp.y * R, 3.2, 0, Math.PI * 2); ctx.fillStyle = ink; ctx.fill(); ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(cx + sp.x * R, cy + sp.y * R, pulse, 0, Math.PI * 2); ctx.stroke(); }
      ctx.globalAlpha = 1;
      if (running) requestAnimationFrame(draw);
    }
    resize(); window.addEventListener('resize', function () { resize(); if (!running) { last = 0; draw(performance.now()); } });
    if (reduce) { draw(performance.now()); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting && !running) { running = true; last = 0; requestAnimationFrame(draw); } else if (!e.isIntersecting) { running = false; } }); }, { threshold: 0.05 }).observe(cv);
      draw(performance.now());
    } else { running = true; requestAnimationFrame(draw); }
  });

  /* laço de rolagem único para cabeçalho, paralaxe e manifesto */
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (header) onScrollHeader();
      var vh = window.innerHeight;
      px.forEach(function (p) {
        var r = p.ref.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
        var c = (r.top + r.height / 2) - vh / 2;
        if (p.pos) { var k = Math.max(-1, Math.min(1, c / vh)); p.el.style.objectPosition = '50% ' + (50 + k * p.f * 100).toFixed(2) + '%'; }
        else { p.el.style.transform = 'translate3d(0,' + (c * p.f).toFixed(1) + 'px,0)'; }
      });
      wordBlocks.forEach(function (b) { var r = b.el.getBoundingClientRect(); var start = vh * 0.88, end = vh * 0.38; var prog = (start - r.top) / (r.height + (start - end)); prog = Math.max(0, Math.min(1, prog)); var n = Math.round(prog * b.words.length); if (n !== b.n) { b.n = n; b.words.forEach(function (w, i) { w.classList.toggle('on', i < n); }); } });
      pending.forEach(function (el) { if (!el.classList.contains('in') && inView(el)) el.classList.add('in'); });
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
