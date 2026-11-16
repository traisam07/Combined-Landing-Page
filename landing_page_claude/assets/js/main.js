/* PulseMind — landing page interactions (vanilla, no dependencies) */
(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const range = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const debounce = (fn, ms) => { let id; return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); }; };
  const mulberry = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const hash = s => { let h = 2166136261; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  /* One mechanical-ventilation breath (pressure–time), phase 0..1 → 0..1 */
  function breathShape(p) {
    if (p <= 0) return 0;
    if (p < .09) { const t = p / .09; return 1 - Math.pow(1 - t, 3); }
    if (p < .13) { const t = (p - .09) / .04; return 1 - .16 * t; }
    if (p < .34) { const t = (p - .13) / .21; return .84 - .05 * t; }
    if (p < .41) { const t = (p - .34) / .07; return .79 * Math.pow(1 - t, 2.2); }
    return 0;
  }

  /* ───────────────── Split headings into animated lines ───────────────── */
  function initSplit() {
    $$('[data-split]').forEach(el => {
      $$('.line', el).forEach((line, i) => {
        const inner = document.createElement('span');
        inner.className = 'line-i';
        inner.style.transitionDelay = (i * 0.1) + 's';
        while (line.firstChild) inner.appendChild(line.firstChild);
        line.appendChild(inner);
      });
    });
  }

  /* ───────────────── Reveal on scroll ───────────────── */
  function initReveal() {
    const els = $$('[data-reveal], [data-split]').filter(el => !el.classList.contains('hero-title'));
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
    els.forEach(el => io.observe(el));
  }

  /* ───────────────── Count-up numbers ───────────────── */
  function initCounts() {
    const els = $$('[data-count]');
    const fmt = (v, dec, suf) => (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')) + (suf || '');
    const run = el => {
      const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || '';
      if (reduce) { el.textContent = fmt(to, dec, suf); return; }
      const t0 = performance.now(), dur = 1600;
      const tick = now => {
        const t = clamp((now - t0) / dur, 0, 1);
        el.textContent = fmt(to * easeOut(t), dec, suf);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: .6 });
    els.forEach(el => { if (!reduce) el.textContent = fmt(0, +(el.dataset.dec || 0), el.dataset.suffix || ''); io.observe(el); });
  }

  /* ───────────────── Nav: theme, progress, active link ───────────────── */
  function initNav() {
    const nav = $('#nav'), bar = $('#progressBar');
    const themed = $$('main > section[data-theme]');
    const links = $$('.nav-links a');
    const targets = links.map(a => $(a.getAttribute('href')));
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = 34;
      let theme = 'dark';
      for (const s of themed) { const r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) { theme = s.dataset.theme; break; } }
      nav.dataset.on = theme;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      const mid = innerHeight * .4;
      let active = -1;
      targets.forEach((t, i) => { if (!t) return; const r = t.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) active = i; });
      links.forEach((a, i) => a.classList.toggle('is-active', i === active));
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
  }

  /* ───────────────── Waveform renderer (hero + footer) ───────────────── */
  class Wave {
    constructor(canvas, opts) {
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      this.o = Object.assign({
        trend: true, labels: true, axis: true, grid: true,
        sweepSec: 7.5, rgb: '200,242,90', baseline: .8, ampMin: .36, ampMax: .58, alpha: 1, dimOld: .36,
      }, opts);
      this.sweep = 0; this.sweeps = 0; this.seed = 1; this.prev = null; this.last = 0;
      this.running = false; this.hx = null; this.trendIn = 0;
      this.resize();
      addEventListener('resize', debounce(() => this.resize(), 160));
    }
    resize() {
      const r = this.c.getBoundingClientRect();
      this.w = Math.max(20, r.width); this.h = Math.max(20, r.height);
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.c.width = Math.round(this.w * this.dpr); this.c.height = Math.round(this.h * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.build();
      this.curr = this.sample(this.seed);
      if (this.prev) this.prev = this.sample(this.seed + 1);
      if (this.sweep > this.w) this.sweep = 0;
      if (reduce) this.drawStatic();
    }
    build() {
      const w = this.w;
      const unit = clamp(w / 15, 52, 112);
      this.breaths = [];
      let x = -unit * .25;
      while (x < w + unit) {
        const t = clamp(x / w, 0, 1);
        const per = this.o.trend ? lerp(unit * 1.28, unit * .8, t) : unit;
        const amp = this.o.trend ? lerp(this.o.ampMin, this.o.ampMax, t) : (this.o.ampMin + this.o.ampMax) / 2;
        this.breaths.push({ x0: x, x1: x + per, amp });
        x += per;
      }
      // snapshot labels: spaced at least ~150px apart
      this.labels = [];
      if (this.o.labels) {
        let lastX = -999;
        this.breaths.forEach(b => {
          const px = b.x0 + (b.x1 - b.x0) * .09;
          const t = px / w;
          if (t < .03 || t > .84 || px - lastX < Math.max(140, w / 8)) return;
          lastX = px;
          this.labels.push({ x: px, amp: b.amp, val: Math.round(lerp(24, 29, t)) });
        });
      }
    }
    base() { return this.h * this.o.baseline; }
    A() { return this.h * .95; }
    sample(seed) {
      const n = Math.ceil(this.w) + 2;
      const ys = new Float32Array(n);
      const rnd = mulberry(seed * 9973 + 7);
      const jit = this.breaths.map(() => 1 + (rnd() - .5) * .06);
      const base = this.base(), A = this.A();
      let bi = 0;
      for (let x = 0; x < n; x++) {
        while (bi < this.breaths.length - 1 && x >= this.breaths[bi].x1) bi++;
        const b = this.breaths[bi];
        const ph = (x - b.x0) / (b.x1 - b.x0);
        ys[x] = base - breathShape(ph) * b.amp * jit[bi] * A + (rnd() - .5) * .7;
      }
      return ys;
    }
    trendY(x) { return this.base() - lerp(this.o.ampMin, this.o.ampMax, clamp(x / this.w, 0, 1)) * this.A() - 10; }
    trace(ys, a, b, alpha) {
      if (!ys || b <= a) return;
      const ctx = this.ctx;
      a = Math.max(0, Math.floor(a)); b = Math.min(ys.length - 1, Math.ceil(b));
      ctx.beginPath(); ctx.moveTo(a, ys[a]);
      for (let x = a + 1; x <= b; x++) ctx.lineTo(x, ys[x]);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(${this.o.rgb},${.13 * alpha * this.o.alpha})`; ctx.lineWidth = 8; ctx.stroke();
      ctx.strokeStyle = `rgba(${this.o.rgb},${.95 * alpha * this.o.alpha})`; ctx.lineWidth = 1.8; ctx.stroke();
    }
    drawGrid() {
      const { ctx, w, h } = this;
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,.045)';
      const base = this.base();
      for (let k = 0; k <= 4; k++) { const y = Math.round(base - k * (base - 8) / 4) + .5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      for (let k = 1; k < 6; k++) { const x = Math.round(k * w / 6) + .5; ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x, base); ctx.stroke(); }
    }
    drawAxis() {
      const { ctx, w, h } = this;
      ctx.font = '500 10.5px "Geist Mono", ui-monospace, monospace';
      ctx.fillStyle = 'rgba(163,170,165,.75)';
      ctx.textBaseline = 'alphabetic';
      const y = h - 8;
      const ticks = [['T−6H', 0, 'left'], ['T−4H', w / 3, 'center'], ['T−2H', 2 * w / 3, 'center'], ['NOW', w, 'right']];
      ticks.forEach(([t, x, al]) => { ctx.textAlign = al; ctx.fillText(t, clamp(x, 16, w - 16), y); });
      ctx.strokeStyle = 'rgba(255,255,255,.12)';
      ctx.beginPath(); ctx.moveTo(0, h - 26.5); ctx.lineTo(w, h - 26.5); ctx.stroke();
    }
    drawLabels(sx, gap) {
      const { ctx } = this;
      ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      const base = this.base(), A = this.A();
      this.labels.forEach(l => {
        let a = 0;
        if (l.x < sx) a = 1; else if (this.prev && l.x > sx + gap) a = .4;
        if (!a) return;
        const y = base - l.amp * A - 16;
        ctx.fillStyle = `rgba(236,238,232,${.9 * a})`;
        ctx.fillText(`Ppeak ${l.val}`, l.x, y);
        ctx.fillStyle = `rgba(200,242,90,${.85 * a})`;
        ctx.fillText('✓', l.x + 36, y);
      });
    }
    drawTrend(sx, full) {
      const { ctx, w } = this;
      if (full) this.trendIn = 1;
      const done = full || this.sweeps > 0;
      const until = done ? w : sx;
      if (until < 4) return;
      ctx.save();
      ctx.setLineDash([5, 6]);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = 'rgba(236,238,232,.55)';
      ctx.beginPath(); ctx.moveTo(0, this.trendY(0));
      for (let x = 8; x <= until; x += 8) ctx.lineTo(x, this.trendY(x));
      ctx.stroke();
      ctx.restore();
      if (done) {
        this.trendIn = Math.min(1, this.trendIn + .02);
        const a = this.trendIn;
        const tx = w - 12, ty = this.trendY(w) - 14;
        ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
        ctx.textAlign = 'right';
        const txt = 'TREND  +5 cmH₂O / 6 h';
        const tw = ctx.measureText(txt).width;
        ctx.fillStyle = `rgba(200,242,90,${a})`;
        roundRect(ctx, tx - tw - 12, ty - 15, tw + 20, 22, 6); ctx.fill();
        ctx.fillStyle = `rgba(27,36,0,${a})`;
        ctx.fillText(txt, tx, ty);
      }
    }
    drawHover() {
      if (this.hx == null) return;
      const { ctx, h } = this;
      const x = Math.round(this.hx) + .5;
      ctx.strokeStyle = 'rgba(236,238,232,.35)'; ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h - 26); ctx.stroke(); ctx.setLineDash([]);
      const ys = this.curr; const y = ys[Math.round(this.hx)] ?? this.base();
      ctx.fillStyle = 'rgba(200,242,90,1)'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    frame(now) {
      const dt = this.last ? Math.min(.05, (now - this.last) / 1000) : 0;
      this.last = now;
      this.sweep += (this.w / this.o.sweepSec) * dt;
      if (this.sweep > this.w + 2) {
        this.sweep = 0; this.sweeps++;
        this.prev = this.curr; this.seed++; this.curr = this.sample(this.seed);
      }
      this.render(this.sweep);
    }
    render(sx) {
      const { ctx, w, h } = this;
      ctx.clearRect(0, 0, w, h);
      const gap = 30;
      if (this.o.grid) this.drawGrid();
      if (this.o.axis) this.drawAxis();
      if (this.prev) this.trace(this.prev, sx + gap, w, this.o.dimOld);
      this.trace(this.curr, 0, sx, 1);
      if (this.o.labels) this.drawLabels(sx, gap);
      if (this.o.trend) this.drawTrend(sx);
      // sweep head
      const hy = this.curr[Math.max(0, Math.min(this.curr.length - 1, Math.round(sx)))];
      const g = ctx.createRadialGradient(sx, hy, 0, sx, hy, 16);
      g.addColorStop(0, `rgba(${this.o.rgb},${.9 * this.o.alpha})`); g.addColorStop(1, `rgba(${this.o.rgb},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, hy, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${this.o.alpha})`; ctx.beginPath(); ctx.arc(sx, hy, 2.4, 0, Math.PI * 2); ctx.fill();
      this.drawHover();
    }
    drawStatic() {
      const { ctx, w, h } = this;
      ctx.clearRect(0, 0, w, h);
      if (this.o.grid) this.drawGrid();
      if (this.o.axis) this.drawAxis();
      this.trace(this.curr, 0, w, 1);
      if (this.o.labels) this.drawLabels(w + 1, 0);
      if (this.o.trend) this.drawTrend(w, true);
      this.drawHover();
    }
    start() {
      if (reduce) { this.drawStatic(); return; }
      if (this.running) return;
      this.running = true; this.last = 0;
      const loop = now => { if (!this.running) return; this.frame(now); this.raf = requestAnimationFrame(loop); };
      this.raf = requestAnimationFrame(loop);
    }
    stop() { this.running = false; cancelAnimationFrame(this.raf); }
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function autoRun(wave, el) {
    if (!('IntersectionObserver' in window)) { wave.start(); return; }
    new IntersectionObserver(([e]) => { if (e.isIntersecting && !document.hidden) wave.start(); else wave.stop(); }, { threshold: 0 }).observe(el);
    document.addEventListener('visibilitychange', () => { if (document.hidden) wave.stop(); });
  }

  let heroWave = null;
  function initHeroWave() {
    const canvas = $('#heroWave'), wrap = $('#heroWaveWrap'), out = $('#waveReadout');
    if (!canvas) return;
    heroWave = new Wave(canvas, {});
    const move = clientX => {
      const r = wrap.getBoundingClientRect();
      const x = clamp(clientX - r.left, 0, r.width);
      heroWave.hx = x;
      const t = x / r.width;
      const mins = Math.round((1 - t) * 360);
      const hh = Math.floor(mins / 60), mm = String(mins % 60).padStart(2, '0');
      const pp = Math.round(lerp(24, 29, t)), rr = Math.round(lerp(16, 22, t));
      out.innerHTML = `${mins === 0 ? 'NOW' : `T−${hh}:${mm}`}<br>Ppeak <b>${pp}</b> cmH₂O · RR <b>${rr}</b>/min<br><span style="color:#a3aaa5">in range on its own</span>`;
      const ow = out.offsetWidth;
      out.style.transform = `translate(${x + 16 + ow > r.width ? x - ow - 16 : x + 16}px, 8px)`;
      out.classList.add('is-on');
      if (reduce || !heroWave.running) heroWave.drawStatic();
    };
    wrap.addEventListener('pointermove', e => move(e.clientX));
    wrap.addEventListener('pointerleave', () => { heroWave.hx = null; out.classList.remove('is-on'); if (reduce) heroWave.drawStatic(); });
  }

  function initCtaWave() {
    const canvas = $('#ctaWave');
    if (!canvas) return;
    const w = new Wave(canvas, { trend: false, labels: false, axis: false, grid: false, sweepSec: 11, baseline: .78, ampMin: .5, ampMax: .5, alpha: .8, dimOld: .3 });
    w.prev = w.sample(99);
    autoRun(w, canvas);
  }

  /* ───────────────── §01 Noise → order (pinned, scroll-scrubbed) ───────────────── */
  function initNoise() {
    const sec = $('#problem'); if (!sec) return;
    const sticky = $('#noiseSticky'), scene = $('#noiseScene'), svg = $('#lanes');
    const frags = $$('.frag', scene), chips = $$('.chip', scene);
    const tray = $('#trayLabel'), prompt = $('#promptCard');
    const stA = $('.noise-a', sec), stB = $('.noise-b', sec), bar = $('#noiseBar'), day = $('#noiseDay');
    chips.forEach((c, i) => c.style.setProperty('--i', i));
    const order = ['vent', 'monitor', 'labs', 'chart', 'exam', 'handover'];
    const scatter = { vent: [.02, .03, -5], monitor: [.52, 0, 4], labs: [.98, .38, -3], chart: [.0, .5, 3], exam: [.36, .86, -4], handover: [.92, .98, 5] };
    const chipXY = [[.3, .02], [.86, .24], [.12, .34], [.5, .3], [.96, .62], [.24, .7], [.6, .6], [.04, .92], [.56, 1]];
    const NS = 'http://www.w3.org/2000/svg';
    let G = null, laneEls = [], riskEl = null, axisEl = null, connEl = null;

    const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };

    function layout() {
      const W = scene.clientWidth, H = scene.clientHeight;
      const small = W < 600;
      const trayW = small ? 0 : Math.min(200, W * .25);
      const stripH = small ? 90 : 0;
      const labelW = small ? 66 : 96;
      const x0 = 0, x1 = W - trayW - (small ? 4 : 28);
      const axisH = 24, top = 4;
      const usableH = H - axisH - top - stripH;
      const laneH = usableH / 7.35;
      const laneY = i => top + i * laneH + (i === 6 ? laneH * .35 : 0);
      G = { W, H, small, trayW, stripH, labelW, x0, x1, tx0: x0 + labelW, tx1: x1, laneH, laneY, axisH, top };
      frags.forEach(f => { f._w = f.offsetWidth; f._h = f.offsetHeight; });
      chips.forEach(c => { c._w = c.offsetWidth; c._h = c.offsetHeight; });
      buildLanes();
      layoutTargets();
      render(progress(), performance.now());
    }

    function buildLanes() {
      const { W, H, tx0, tx1, laneH, laneY, labelW, x0 } = G;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.innerHTML = '';
      laneEls = [];
      const names = ['Ventilator', 'Monitor', 'Blood gas', 'Chart', 'Exam', 'Handover'];
      const span = tx1 - tx0;
      const X = t => tx0 + t * span;
      for (let i = 0; i < 6; i++) {
        const g = el('g', { opacity: 0 }, svg);
        const cy = laneY(i) + laneH / 2;
        el('line', { class: 'ln-base', x1: tx0, x2: tx1, y1: cy, y2: cy }, g);
        const lbl = el('text', { class: 'ln-label', x: x0, y: cy + 3.5 }, g); lbl.textContent = G.small ? names[i].replace('Blood gas', 'ABG').replace('Ventilator', 'Vent').replace('Handover', 'Hand.') : names[i];
        const paths = [], marks = [];
        const yv = v => cy + laneH * .3 - v * laneH * .6; // v 0..1
        if (i === 0) { // ventilator: compressed breaths, peaks creeping up
          const n = Math.max(12, Math.round(span / 19));
          let d = '';
          for (let k = 0; k <= span; k += 1) {
            const t = k / span; const b = t * n; const ph = b - Math.floor(b);
            const amp = lerp(.42, .72, t);
            const y = cy + laneH * .3 - breathShape(ph) * amp * laneH * .6;
            d += (k ? 'L' : 'M') + (tx0 + k).toFixed(1) + ' ' + y.toFixed(1);
          }
          paths.push(el('path', { class: 'ln-path', d, pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, g));
        } else if (i === 1) { // SpO2 drifting down
          const rnd = mulberry(5);
          let d = '';
          for (let k = 0; k <= 60; k++) {
            const t = k / 60; const v = lerp(.85, .25, Math.pow(t, 1.4)) + (rnd() - .5) * .1;
            d += (k ? 'L' : 'M') + X(t).toFixed(1) + ' ' + yv(v).toFixed(1);
          }
          paths.push(el('path', { class: 'ln-path', d, pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, g));
          const t = el('text', { x: tx1, y: yv(.25) - 8, 'text-anchor': 'end' }, g); t.textContent = 'SpO₂ 92'; marks.push(t);
        } else if (i === 2) { // labs: sparse
          [[.22, .75, 'PaO₂ 82'], [.78, .35, 'PaO₂ 64']].forEach(([t, v, s]) => {
            marks.push(el('circle', { class: 'ln-dot', cx: X(t), cy: yv(v), r: 4 }, g));
            const tt = el('text', { x: X(t) + 9, y: yv(v) + 4 }, g); tt.textContent = s; marks.push(tt);
          });
        } else if (i === 3) { // chart: every 2h, last one missing
          [[.1, .4, 'RR 18'], [.43, .55, 'RR 20'], [.76, .7, 'RR 22']].forEach(([t, v, s]) => {
            marks.push(el('circle', { class: 'ln-dot', cx: X(t), cy: yv(v), r: 4 }, g));
            const tt = el('text', { x: X(t) + 9, y: yv(v) + 4 }, g); tt.textContent = s; marks.push(tt);
          });
          marks.push(el('circle', { class: 'ln-hollow', cx: X(.99), cy: yv(.6), r: 5 }, g));
          if (!G.small) { const tt = el('text', { x: X(.99), y: yv(.6) + 22, 'text-anchor': 'end' }, g); tt.textContent = '02:00 not charted'; marks.push(tt); }
        } else if (i === 4) { // exam
          [[.18, 'clear'], [.62, 'accessory muscles']].forEach(([t, s]) => {
            marks.push(el('rect', { class: 'ln-dot', x: X(t) - 4, y: cy - 4, width: 8, height: 8, transform: `rotate(45 ${X(t)} ${cy})` }, g));
            const tt = el('text', { x: X(t) + 10, y: cy + 4 }, g); tt.textContent = s; marks.push(tt);
          });
        } else if (i === 5) { // handover
          marks.push(el('rect', { class: 'ln-dot', x: X(.1) - 1.5, y: cy - 8, width: 3, height: 16 }, g));
          const tt = el('text', { x: X(.1) + 9, y: cy + 4 }, g); tt.textContent = '“stable” · day shift'; marks.push(tt);
        }
        laneEls.push({ g, paths, marks });
      }
      // risk lane
      const rg = el('g', { opacity: 0 }, svg);
      const cy = laneY(6) + laneH / 2;
      const yr = v => cy + laneH * .42 - (v / 100) * laneH * 1.05;
      const lbl = el('text', { class: 'ln-label ln-risk-label', x: G.x0, y: cy + 3.5 }, rg); lbl.textContent = G.small ? 'Risk' : 'Est. risk';
      el('line', { class: 'ln-base', x1: tx0, x2: tx1, y1: yr(0), y2: yr(0) }, rg);
      const thr = el('line', { class: 'ln-thr', x1: tx0, x2: tx1, y1: yr(65), y2: yr(65) }, rg);
      const thrT = el('text', { x: tx0 + 4, y: yr(65) - 5 }, rg); thrT.textContent = 'prompt threshold';
      const pts = [];
      for (let k = 0; k <= 40; k++) { const t = k / 40; pts.push([X(t), yr(lerp(20, 68.2, Math.pow(t, 2.1)))]); }
      const dLine = pts.map((p, k) => (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
      const dArea = dLine + `L${tx1} ${yr(0)}L${tx0} ${yr(0)}Z`;
      const clipId = 'riskClip';
      const defs = el('defs', {}, rg);
      const cp = el('clipPath', { id: clipId }, defs);
      const clipRect = el('rect', { x: tx0, y: 0, width: 0, height: G.H }, cp);
      const area = el('path', { class: 'ln-area', d: dArea, 'clip-path': `url(#${clipId})` }, rg);
      const line = el('path', { class: 'ln-risk', d: dLine, pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, rg);
      const end = el('circle', { class: 'ln-end', cx: tx1, cy: yr(68.2), r: 6, opacity: 0 }, rg);
      riskEl = { g: rg, line, area, clipRect, end, endY: yr(68.2), span };
      // axis + now line
      axisEl = el('g', { class: 'ln-axis', opacity: 0 }, svg);
      const ay = G.H - G.stripH - 6;
      [['T−6h', 0, 'start'], ['T−4h', 1 / 3, 'middle'], ['T−2h', 2 / 3, 'middle'], ['Now', 1, 'end']].forEach(([s, t, a]) => {
        const tt = el('text', { x: X(t), y: ay, 'text-anchor': a }, axisEl); tt.textContent = s;
      });
      el('line', { class: 'ln-now', x1: tx1, x2: tx1, y1: G.top, y2: ay - 14 }, axisEl);
      // connector from risk end to prompt
      connEl = el('path', { class: 'ln-conn', d: '' }, svg);
      connEl.style.opacity = 0;
    }

    let T = null;
    function layoutTargets() {
      const { W, H, small, trayW, stripH, laneH, laneY, x0, top } = G;
      T = { frags: [], chips: [], tray: null, prompt: null };
      frags.forEach(f => {
        const k = order.indexOf(f.dataset.src);
        const sc = scatter[f.dataset.src];
        const fs = small ? .74 : 1;
        const fw = f._w * fs, fh = f._h * fs;
        const sx = sc[0] * Math.max(0, W - fw), sy = sc[1] * Math.max(0, H - fh - (small ? 0 : 10));
        const ts = Math.min(.42, (laneH * .9) / f._h);
        const tx = x0, ty = laneY(k) + laneH / 2 - (f._h * ts) / 2;
        T.frags.push({ f, k, sx, sy, sr: sc[2], fs, tx, ty, ts });
      });
      // chip targets
      const chipScale = small ? .72 : 1;
      let cx = 0, cy = H - stripH + 24, rowH = 0;
      chips.forEach((c, j) => {
        const cw = c._w * chipScale, ch = c._h * chipScale;
        const [fx, fy] = chipXY[j];
        const sx = fx * Math.max(0, W - c._w), sy = fy * Math.max(0, H - c._h);
        let tx, ty;
        if (small) {
          if (cx + cw > W) { cx = 0; cy += rowH + 5; rowH = 0; }
          tx = cx; ty = cy; cx += cw + 5; rowH = Math.max(rowH, ch);
        } else {
          tx = W - trayW; ty = top + 46 + j * (c._h + 6);
        }
        T.chips.push({ c, sx, sy, tx, ty, s: chipScale });
      });
      T.tray = small ? { x: 0, y: H - stripH + 2 } : { x: W - trayW, y: top };
      tray.style.width = small ? 'auto' : trayW + 'px';
      const pw = small ? Math.min(180, W * .52) : trayW;
      prompt.style.width = pw + 'px';
      const ph = prompt.offsetHeight;
      const riskTop = laneY(6);
      T.prompt = small
        ? { x: W - pw, y: Math.max(top, riskTop - ph - 10) }
        : { x: W - trayW, y: Math.min(H - G.axisH - ph - 6, Math.max(top + 46 + chips.length * 32 + 10, riskTop + laneH / 2 - ph / 2)) };
      // connector
      const ex = G.tx1, ey = riskEl.endY;
      const px = T.prompt.x, py = small ? T.prompt.y + ph : T.prompt.y + ph / 2;
      connEl.setAttribute('d', small ? `M${ex} ${ey - 8}L${ex} ${py + 2}` : `M${ex + 8} ${ey}C${(ex + px) / 2} ${ey} ${(ex + px) / 2} ${py} ${px - 4} ${py}`);
    }

    function progress() {
      const r = sec.getBoundingClientRect();
      const total = sec.offsetHeight - innerHeight;
      return clamp(-r.top / total, 0, 1);
    }

    let lastLight = null;
    function render(p, now) {
      if (!G || !T) return;
      const time = now / 1000;
      const jitter = reduce ? 0 : 1;
      // copy states
      const aOut = range(p, .24, .32), bIn = range(p, .47, .56);
      stA.style.opacity = 1 - aOut; stA.style.transform = `translateY(${-24 * aOut}px)`;
      stB.style.opacity = bIn; stB.style.transform = `translateY(${24 * (1 - bIn)}px)`;
      stA.setAttribute('aria-hidden', aOut > .5); stB.setAttribute('aria-hidden', bIn < .5);
      bar.style.transform = `scaleX(${p})`;
      // background: the lights come on — a circular reveal from the scene
      const b = easeIO(range(p, .3, .47));
      day.style.clipPath = `circle(${(b * 112).toFixed(2)}% at ${G.small ? '50% 64%' : '66% 56%'})`;
      const light = b > .62;
      if (light !== lastLight) { lastLight = light; sec.classList.toggle('is-light', light); sec.dataset.theme = light ? 'light' : 'dark'; }
      sec.classList.toggle('is-chaos', p < .3);
      // fragments
      T.frags.forEach((o, i) => {
        const a = easeIO(range(p, .2 + i * .028, .44 + i * .028));
        const jx = Math.sin(time * .7 + i * 1.7) * 7 * (1 - a) * jitter;
        const jy = Math.cos(time * .55 + i * 1.3) * 6 * (1 - a) * jitter;
        const x = lerp(o.sx, o.tx, a) + jx, y = lerp(o.sy, o.ty, a) + jy;
        const r = lerp(o.sr, 0, a), s = lerp(o.fs, o.ts, a);
        o.f.style.transform = `translate3d(${x}px,${y}px,0) rotate(${r}deg) scale(${s})`;
        o.f.style.opacity = 1 - range(a, .55, .95);
        o.f.style.visibility = a >= .999 ? 'hidden' : 'visible';
      });
      // alarm chips: appear over time, then file neatly into the tray (they are NOT removed)
      T.chips.forEach((o, j) => {
        const appear = j < 4 ? 1 : range(p, (j - 3) * .025, (j - 3) * .025 + .03);
        const a = easeIO(range(p, .28 + j * .014, .46 + j * .014));
        const jx = Math.sin(time * 1.1 + j * 2.1) * 4 * (1 - a) * jitter;
        const jy = Math.cos(time * .9 + j) * 3 * (1 - a) * jitter;
        const x = lerp(o.sx, o.tx, a) + jx, y = lerp(o.sy, o.ty, a) + jy;
        const s = lerp(1, o.s, a) * lerp(.6, 1, appear);
        o.c.style.transform = `translate3d(${x}px,${y}px,0) scale(${s})`;
        o.c.style.transformOrigin = '0 0';
        o.c.style.opacity = appear * lerp(1, .8, a);
      });
      // lanes
      laneEls.forEach((L, i) => {
        const op = range(p, .38 + i * .025, .46 + i * .025);
        const dr = easeIO(range(p, .4 + i * .025, .6 + i * .025));
        L.g.setAttribute('opacity', op);
        L.paths.forEach(pth => pth.setAttribute('stroke-dashoffset', 1 - dr));
        L.marks.forEach((m, k) => m.setAttribute('opacity', range(dr, k / (L.marks.length + 1), k / (L.marks.length + 1) + .3)));
      });
      axisEl.setAttribute('opacity', range(p, .46, .56));
      const rOp = range(p, .58, .64), rDr = easeIO(range(p, .6, .8));
      riskEl.g.setAttribute('opacity', rOp);
      riskEl.line.setAttribute('stroke-dashoffset', 1 - rDr);
      riskEl.clipRect.setAttribute('width', riskEl.span * rDr);
      riskEl.end.setAttribute('opacity', range(p, .79, .82));
      // tray label + prompt
      const tOp = range(p, .48, .56);
      tray.style.opacity = tOp;
      tray.style.transform = `translate3d(${T.tray.x}px,${T.tray.y}px,0)`;
      const pIn = easeOut(range(p, .8, .88));
      prompt.style.opacity = pIn;
      prompt.style.transform = `translate3d(${T.prompt.x}px,${T.prompt.y + 14 * (1 - pIn)}px,0)`;
      connEl.style.opacity = pIn;
    }

    let running = false, raf = 0;
    const loop = now => { if (!running) return; render(progress(), now); raf = requestAnimationFrame(loop); };
    const start = () => { if (running) return; running = true; raf = requestAnimationFrame(loop); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    layout();
    addEventListener('resize', debounce(layout, 150));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: '120px 0px' }).observe(sec);
    } else start();
  }

  /* ───────────────── §02 Voices: 36-dot scrollytelling ───────────────── */
  function initVoices() {
    const A = $('#dotsA'), B = $('#dotsB'); if (!A) return;
    const nEl = $('#countN'), dEl = $('#countD'), lEl = $('#countLabel');
    const make = (host, n, nurses, off) => Array.from({ length: n }, (_, i) => {
      const d = document.createElement('span');
      d.className = 'dot ' + (i < nurses ? 'n' : 'p');
      d.dataset.role = i < nurses ? 'n' : 'p';
      d.style.setProperty('--i', i + off);
      host.appendChild(d); return d;
    });
    const da = make(A, 22, 13, 0), db = make(B, 14, 9, 22);
    const rnd = mulberry(36);
    const shuffle = n => { const a = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const oA = shuffle(22), oB = shuffle(14), oAll = shuffle(36);
    const top = (ord, k) => new Set(ord.slice(0, k));
    const A20 = top(oA, 20), A21 = top(oA, 21), B8 = top(oB, 8), All28 = top(oAll, 28);

    const steps = [
      { n: 36, d: 36, label: 'ICU professionals surveyed · 22 nurses, 14 physicians', A: () => 'base', B: () => 'base' },
      { n: 36, d: 36, label: 'use the ventilator screen and its alarms', A: () => 'on', B: () => 'on' },
      { n: 20, d: 22, label: 'Hospital A · named alarms or abnormal ventilator parameters as the biggest issue', A: i => (A20.has(i) ? 'on' : 'off'), B: () => 'na' },
      { n: 8, d: 14, label: 'Hospital B · rated juggling many devices & records a major barrier', A: () => 'na', B: i => (B8.has(i) ? 'on' : 'off') },
      { n: 21, d: 21, label: 'Hospital A · valid answers flagging “too many prompts” as a concern', A: i => (A21.has(i) ? 'on' : 'void'), B: () => 'na' },
      { n: 14, d: 14, label: 'Hospital B · want existing ventilator & monitor alarms kept', A: () => 'na', B: () => 'on' },
      { n: 28, d: 36, label: 'rated it useful or very useful, if proven safe and workflow-fit', A: i => (All28.has(i) ? 'on' : 'off'), B: i => (All28.has(i + 22) ? 'on' : 'off') },
    ];

    let current = -1, shown = 36, tween = 0;
    const setCount = to => {
      cancelAnimationFrame(tween);
      if (reduce) { nEl.textContent = to; shown = to; return; }
      const from = shown, t0 = performance.now(), dur = 700;
      const tick = now => {
        const t = clamp((now - t0) / dur, 0, 1);
        shown = Math.round(lerp(from, to, easeOut(t)));
        nEl.textContent = shown;
        if (t < 1) tween = requestAnimationFrame(tick);
      };
      tween = requestAnimationFrame(tick);
    };
    const apply = k => {
      if (k === current) return; current = k;
      const s = steps[k];
      da.forEach((d, i) => { const st = s.A(i); d.className = 'dot ' + d.dataset.role + (st === 'base' ? '' : ' s-' + st); });
      db.forEach((d, i) => { const st = s.B(i); d.className = 'dot ' + d.dataset.role + (st === 'base' ? '' : ' s-' + st); });
      setCount(s.n); dEl.textContent = '/ ' + s.d; lEl.textContent = s.label;
      $$('.step').forEach(el => el.classList.toggle('is-active', +el.dataset.step === k));
    };
    apply(0);
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) apply(+e.target.dataset.step); });
    }, { rootMargin: '-52% 0px -42% 0px', threshold: 0 });
    $$('.step').forEach(el => io.observe(el));
  }

  /* ───────────────── Team: generative waveform signatures ───────────────── */
  function initSignatures() {
    $$('.sig').forEach(svg => {
      const name = svg.dataset.name || 'x';
      const rnd = mulberry(hash(name));
      const W = 320, base = 66;
      const n = 4 + Math.floor(rnd() * 3);
      const lens = Array.from({ length: n }, () => .75 + rnd() * .6);
      const sum = lens.reduce((a, b) => a + b, 0);
      const usable = W * .9;
      let x = W * .04;
      let d = `M0 ${base} L${x.toFixed(1)} ${base}`;
      lens.forEach(l => {
        const p = (l / sum) * usable;
        const amp = 20 + rnd() * 40;
        const plateau = rnd() * .08;
        for (let k = 1; k <= 48; k++) {
          const ph = k / 48;
          const v = breathShape(ph) * (ph > .13 && ph < .34 ? 1 + plateau : 1);
          d += ` L${(x + ph * p).toFixed(1)} ${(base - v * amp).toFixed(1)}`;
        }
        x += p;
      });
      d += ` L${W} ${base}`;
      svg.innerHTML = `<line class="sig-base" x1="0" x2="${W}" y1="${base}" y2="${base}"/><path class="sig-wave" d="${d}"/>`;
      const path = svg.querySelector('.sig-wave');
      const len = Math.ceil(path.getTotalLength());
      path.style.setProperty('--len', len);
      path.style.strokeDasharray = len;
    });
  }

  /* ───────────────── Preloader → hero entrance ───────────────── */
  function boot() {
    const pre = $('#preloader');
    const go = () => {
      $('.hero-title')?.classList.add('is-in');
      if (heroWave) autoRun(heroWave, $('#heroWave'));
    };
    if (!pre || reduce) { pre && pre.remove(); go(); return; }
    document.documentElement.classList.add('is-loading');
    const cnt = $('#preCount'), t0 = performance.now(), dur = 1350;
    const tick = now => {
      const t = clamp((now - t0) / dur, 0, 1);
      cnt.textContent = Math.round(easeIO(t) * 100);
      if (t < 1) { requestAnimationFrame(tick); return; }
      pre.classList.add('is-done');
      document.documentElement.classList.remove('is-loading');
      setTimeout(go, 380);
      setTimeout(() => pre.remove(), 1500);
    };
    requestAnimationFrame(tick);
  }

  /* ───────────────── Init ───────────────── */
  // This page is a story: on reload, start from the beginning unless a section was linked.
  if ('scrollRestoration' in history && !location.hash) { history.scrollRestoration = 'manual'; window.scrollTo(0, 0); }
  initSplit();
  initSignatures();
  initHeroWave();
  initCtaWave();
  initNoise();
  initVoices();
  initReveal();
  initCounts();
  initNav();
  boot();
})();
