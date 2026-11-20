/* Palavra em pontos: os pontos montam a palavra, fogem do mouse e acendem nas cores da marca */
(function () {
  const PALETTE = ['#20FF8F', '#1F4BFF', '#1F97FF', '#FFB320', '#FF7F22', '#FF3822'];
  const BASE = [58, 58, 62];
  const LEVELS = 8;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const PAL = PALETTE.map(hex);
  // tabela de cores: [paleta][nível de brilho]
  const STYLES = PAL.map(c => Array.from({ length: LEVELS + 1 }, (_, l) => {
    const t = l / LEVELS; return `rgb(${Math.round(BASE[0] + (c[0] - BASE[0]) * t)},${Math.round(BASE[1] + (c[1] - BASE[1]) * t)},${Math.round(BASE[2] + (c[2] - BASE[2]) * t)})`;
  }));

  class DotWord {
    constructor(canvas) {
      this.c = canvas; this.ctx = canvas.getContext('2d');
      this.word = canvas.dataset.word || 'baseus';
      this.mode = canvas.dataset.mode || 'hero';
      this.pts = []; this.mouse = { x: -9999, y: -9999, on: false };
      this.visible = false; this.assembled = 0; this.scatter = 0; this.t0 = performance.now();
      this.resize = this.resize.bind(this); this.tick = this.tick.bind(this);
      const host = canvas.parentElement;
      host.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top; this.mouse.on = true; });
      host.addEventListener('pointerleave', () => { this.mouse.on = false; });
      new ResizeObserver(() => { clearTimeout(this._rt); this._rt = setTimeout(this.resize, 120); }).observe(canvas);
      new IntersectionObserver(es => es.forEach(e => {
        this.visible = e.isIntersecting;
        if (this.visible && !this.raf) this.raf = requestAnimationFrame(this.tick);
      }), { threshold: 0.05 }).observe(canvas);
      this.resize();
    }
    resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const W = this.c.clientWidth, H = this.c.clientHeight; if (!W || !H) return;
      this.W = W; this.H = H; this.dpr = dpr;
      this.c.width = W * dpr; this.c.height = H * dpr;
      // desenha a palavra fora da tela e amostra uma grade
      const off = document.createElement('canvas'); off.width = W; off.height = H;
      const o = off.getContext('2d');
      let fs = H * 1.3;
      o.font = `900 ${fs}px Satoshi, sans-serif`;
      const m = o.measureText(this.word);
      fs = fs * Math.min((W * 0.985) / m.width, 1);
      o.font = `900 ${fs}px Satoshi, sans-serif`;
      o.textBaseline = 'alphabetic'; o.textAlign = 'center';
      const mm = o.measureText(this.word);
      const asc = mm.actualBoundingBoxAscent, desc = mm.actualBoundingBoxDescent;
      const y = (H + asc - desc) / 2;
      o.fillStyle = '#fff'; o.fillText(this.word, W / 2, y);
      const g = Math.max(4, Math.min(11, Math.round(W / 190)));
      this.g = g; this.r = g * 0.36;
      const data = o.getImageData(0, 0, W, H).data;
      const old = this.pts; const pts = [];
      for (let yy = g / 2; yy < H; yy += g) for (let xx = g / 2; xx < W; xx += g) {
        if (data[((yy | 0) * W + (xx | 0)) * 4 + 3] > 128) {
          const prev = old[pts.length];
          pts.push({ hx: xx, hy: yy, x: prev ? prev.x : Math.random() * W, y: prev ? prev.y : H + Math.random() * H * 0.8, vx: 0, vy: 0, p: Math.min(5, Math.floor((xx / W) * 6)), s: Math.random() });
        }
      }
      this.pts = pts;
      if (reduce) { pts.forEach(p => { p.x = p.hx; p.y = p.hy; }); this.assembled = 1; this.draw(performance.now()); }
    }
    setScatter(v) { this.scatter = v; }
    tick(now) {
      this.raf = null;
      if (!this.visible || reduce) return;
      this.step(now); this.draw(now);
      this.raf = requestAnimationFrame(this.tick);
    }
    step(now) {
      const t = (now - this.t0) / 1000;
      this.assembled = Math.min(1, this.assembled + 0.012);
      const R = Math.max(70, this.W * 0.09), R2 = R * R;
      const { x: mx, y: my, on } = this.mouse;
      const sc = this.scatter;
      for (const p of this.pts) {
        // atraso escalonado da montagem (da esquerda pra direita)
        const ready = this.assembled * 1.6 - (p.hx / this.W) * 0.6 > 0;
        let tx = p.hx, ty = p.hy + Math.sin(p.hx * 0.012 + t * 1.6) * this.g * 0.35;
        if (sc > 0) { tx += (p.s - 0.5) * sc * this.W * 0.25; ty -= sc * p.s * this.H * 0.35; }
        if (ready) { p.vx += (tx - p.x) * 0.06; p.vy += (ty - p.y) * 0.06; }
        if (on) {
          const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 0.01) { const d = Math.sqrt(d2), f = (1 - d / R) * 6; p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
        }
        p.vx *= 0.8; p.vy *= 0.8; p.x += p.vx; p.y += p.vy;
      }
    }
    draw(now) {
      const ctx = this.ctx, dpr = this.dpr, W = this.W, H = this.H;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const t = (now - this.t0) / 1000;
      // faixa de luz que varre a palavra
      const span = W * 1.7, band = W * 0.16;
      const bx = ((t * W * 0.16) % span) - W * 0.35;
      const R = Math.max(110, W * 0.13);
      const { x: mx, y: my, on } = this.mouse;
      const buckets = new Map();
      for (const p of this.pts) {
        let k = Math.exp(-((p.hx - bx) ** 2) / (2 * band * band));
        if (on) { const d = Math.hypot(p.x - mx, p.y - my); if (d < R) k = Math.max(k, 1 - d / R); }
        const sp = Math.min(1, Math.hypot(p.vx, p.vy) / 6); k = Math.max(k, sp);
        const lvl = Math.round(k * LEVELS);
        const key = p.p * 16 + lvl;
        let b = buckets.get(key); if (!b) { b = []; buckets.set(key, b); } b.push(p);
      }
      const r = this.r;
      ctx.globalAlpha = Math.max(0, 1 - this.scatter * 1.1);
      buckets.forEach((arr, key) => {
        ctx.fillStyle = STYLES[(key / 16) | 0][key % 16];
        ctx.beginPath();
        for (const p of arr) { ctx.moveTo(p.x + r, p.y); ctx.arc(p.x, p.y, r, 0, 6.2832); }
        ctx.fill();
      });
    }
  }

  const start = () => {
    window.DOTWORDS = [...document.querySelectorAll('canvas.dotword')].map(c => new DotWord(c));
  };
  const fontReady = document.fonts && document.fonts.load ? document.fonts.load('900 100px Satoshi') : Promise.resolve();
  Promise.race([fontReady, new Promise(r => setTimeout(r, 2500))]).then(start, start);
})();
