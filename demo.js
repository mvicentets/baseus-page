/* Demo interativa: quadro do Baseus com arrastar e soltar */
(function () {
  const board = document.getElementById('demoBoard');
  if (!board) return;
  const toasts = document.getElementById('demoToasts');
  const COLS = [
    { id: 'copy', name: 'Copywriting', c: '#1F97FF', st: 'Escrevendo' },
    { id: 'design', name: 'Design gráfico', c: '#1F4BFF', st: 'Em produção' },
    { id: 'edicao', name: 'Edição de vídeo', c: '#FF3822', st: 'Editando' },
    { id: 'aprov', name: 'Aprovação do cliente', c: '#FF7F22', st: 'Em aprovação' },
    { id: 'pub', name: 'Publicação', c: '#20FF8F', st: 'Para agendar' }
  ];
  const START = [
    { id: 1, cl: 'Helena', who: 'Dra. Helena', cc: '#E5603B', fmt: 'Reels', title: 'Reel 9 — Compulsão alimentar não é falta de força de vontade', col: 'copy', st: 'Escrevendo', av: 'SM' },
    { id: 2, cl: 'Rafael', who: 'Dr. Rafael', cc: '#2F7FD8', fmt: 'Carrossel', title: 'Carrossel 3 — O mesmo diagnóstico, tratamentos diferentes', col: 'design', st: 'Em produção', av: 'M' },
    { id: 3, cl: 'Bianca', who: 'Dra. Bianca', cc: '#16A34A', fmt: 'Reels', title: 'Reel 2 — Você está perdendo peso do jeito certo?', col: 'edicao', st: 'Editando', av: 'M' },
    { id: 4, cl: 'Lumen', who: 'Clínica Lumen', cc: '#8B5CF6', fmt: 'Reels', title: 'Reels 6 — Aquele inchaço que você sente todo mês', col: 'aprov', st: 'Em aprovação', av: 'SM' },
    { id: 5, cl: 'Lívia', who: 'Dra. Lívia', cc: '#E0A100', fmt: 'Reels', title: 'Reel 2 — Normal da idade ou sinal de alerta?', col: 'pub', st: 'Agendado', av: 'SM' }
  ];
  const ORDER = COLS.map(c => c.id);
  const COL = Object.fromEntries(COLS.map(c => [c.id, c]));
  const stClass = s => ({ 'Em aprovação': 'amber', 'Aprovado': 'green', 'Agendado': 'blue', 'Postado': 'blue', 'Ajuste': 'red', 'Copy aprovada': 'green' }[s] || '');
  const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex'];
  let cards = [], timers = [], touched = false;
  const G = () => window.gsap;

  function render() {
    board.innerHTML = COLS.map(c => `<div class="dcol" data-col="${c.id}" style="--c:${c.c}"><div class="dcol-h"><i></i>${c.name}<span class="dcount"></span></div><div class="dcol-list"></div></div>`).join('');
    cards.forEach(cd => colList(cd.col).appendChild(cardEl(cd)));
    counts();
    if (!touched) hint();
  }
  const colList = id => board.querySelector(`.dcol[data-col="${id}"] .dcol-list`);
  function cardEl(cd) {
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'dcard'; el.dataset.id = cd.id; el.style.setProperty('--cc', cd.cc);
    el.setAttribute('aria-label', `${cd.title}. Etapa ${COL[cd.col].name}. Toque para mandar para a próxima etapa.`);
    el.innerHTML = `<div class="dcard-top"><span class="dwho"><i></i>${cd.cl}</span><span class="dfmt">${cd.fmt}</span></div><b>${cd.title}</b><div class="dcard-foot"><span class="dst ${stClass(cd.st)}">${cd.st}</span><span class="dav">${cd.av}</span></div>`;
    return el;
  }
  function counts() {
    COLS.forEach(c => { board.querySelector(`.dcol[data-col="${c.id}"] .dcount`).textContent = cards.filter(x => x.col === c.id).length; });
    const set = (id, v) => { const el = document.getElementById(id); if (el.textContent != v) { el.textContent = v; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } };
    set('kProd', cards.filter(x => ['copy', 'design', 'edicao'].includes(x.col)).length);
    set('kWait', cards.filter(x => x.col === 'aprov' && x.st === 'Em aprovação').length);
    set('kSched', cards.filter(x => x.st === 'Agendado').length);
  }
  function toast(ico, title, sub, tone) {
    const t = document.createElement('div');
    t.className = 'dtoast ' + (tone || '');
    t.innerHTML = `<span>${ico}</span><div><b>${title}</b><small>${sub}</small></div>`;
    toasts.prepend(t);
    if (G()) G().fromTo(t, { x: 60, opacity: 0, scale: 0.9 }, { x: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' });
    while (toasts.children.length > 3) toasts.lastChild.remove();
    setTimeout(() => { if (G()) G().to(t, { opacity: 0, x: 40, duration: 0.4, onComplete: () => t.remove() }); else t.remove(); }, 4200);
  }
  function burst(el) {
    const r = el.getBoundingClientRect(), host = document.getElementById('demoApp').getBoundingClientRect();
    const colors = ['#20FF8F', '#1F4BFF', '#1F97FF', '#FFB320', '#FF7F22', '#FF3822'];
    for (let i = 0; i < 22; i++) {
      const d = document.createElement('i'); d.className = 'dbit';
      d.style.background = colors[i % 6];
      d.style.left = (r.left - host.left + r.width / 2) + 'px'; d.style.top = (r.top - host.top + r.height / 2) + 'px';
      document.getElementById('demoApp').appendChild(d);
      const a = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 90;
      if (G()) G().to(d, { x: Math.cos(a) * dist, y: Math.sin(a) * dist - 30, opacity: 0, scale: 0.4, duration: 0.9 + Math.random() * 0.5, ease: 'power3.out', onComplete: () => d.remove() });
      else d.remove();
    }
  }
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  // move o card com animação FLIP
  function move(cd, toCol, opts = {}) {
    const el = board.querySelector(`.dcard[data-id="${cd.id}"]`);
    const from = opts.fromRect || (el && el.getBoundingClientRect());
    const prev = cd.col; cd.col = toCol;
    if (opts.st) cd.st = opts.st; else if (prev !== toCol) cd.st = COL[toCol].st;
    const fresh = cardEl(cd); el && el.remove();
    colList(toCol).appendChild(fresh);
    const to = fresh.getBoundingClientRect();
    if (G() && from) G().fromTo(fresh, { x: from.left - to.left, y: from.top - to.top, rotate: opts.fromRect ? 4 : 0 }, { x: 0, y: 0, rotate: 0, duration: 0.6, ease: 'expo.out' });
    counts();
    if (prev !== toCol && !opts.silent) react(cd, prev, toCol);
    return fresh;
  }
  function setStatus(cd, st) {
    cd.st = st;
    const el = board.querySelector(`.dcard[data-id="${cd.id}"] .dst`);
    if (el) { el.textContent = st; el.className = 'dst ' + stClass(st); G() && G().fromTo(el, { scale: 1.3 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }); }
    counts();
  }
  function react(cd, prev, to) {
    const back = ORDER.indexOf(to) < ORDER.indexOf(prev);
    if (to === 'aprov') {
      toast('📲', `Enviado para ${cd.who}`, 'aparece agora na fila de aprovação do portal', 'amber');
      const id = cd.id;
      later(() => { if (cd.col !== 'aprov' || cd.id !== id) return; setStatus(cd, 'Aprovado'); toast('✓', `${cd.who} aprovou`, 'direto pelo portal do cliente', 'green'); }, 2200);
      later(() => { if (cd.col !== 'aprov' || cd.st !== 'Aprovado') return; move(cd, 'pub', { silent: true, st: 'Para agendar' }); toast('⚡', 'Automação', 'aprovado → Gestão de publicação', 'blue'); }, 3600);
      later(() => { if (cd.col !== 'pub' || cd.st !== 'Para agendar') return; setStatus(cd, 'Agendado'); const el = board.querySelector(`.dcard[data-id="${cd.id}"]`); el && burst(el); toast('📅', 'Agendado', `${DIAS[cd.id % 5]}, 11:00 · entrou no calendário`, 'blue'); }, 5200);
    } else if (to === 'pub') {
      toast('👀', 'Sem passar pelo cliente?', 'tudo bem, fica em "Para agendar"', '');
    } else if (back) {
      toast('↩', `Voltou para ${COL[to].name}`, 'o responsável recebe um aviso', 'red');
    } else {
      toast('→', `Movido para ${COL[to].name}`, `status: ${COL[to].st}`, '');
    }
  }

  // arrastar com ponteiro (mouse e toque)
  let drag = null;
  board.addEventListener('pointerdown', e => {
    const el = e.target.closest('.dcard'); if (!el || e.button > 0) return;
    const cd = cards.find(c => c.id == el.dataset.id);
    const r = el.getBoundingClientRect();
    drag = { el, cd, r, sx: e.clientX, sy: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, moved: false, ghost: null, over: null, pid: e.pointerId };
  });
  window.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.pid) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!drag.moved) {
      drag.moved = true; stopHint(); touched = true;
      const g = drag.el.cloneNode(true); g.classList.add('dghost');
      g.style.width = drag.r.width + 'px'; g.style.height = drag.r.height + 'px';
      document.body.appendChild(g); drag.ghost = g;
      drag.el.classList.add('dplace');
      document.body.classList.add('ddragging');
    }
    e.preventDefault();
    drag.ghost.style.transform = `translate(${e.clientX - drag.ox}px,${e.clientY - drag.oy}px) rotate(${Math.max(-8, Math.min(8, dx / 30))}deg)`;
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const col = under && under.closest('.dcol');
    if (drag.over !== col) { drag.over && drag.over.classList.remove('dover'); col && col.classList.add('dover'); drag.over = col; }
  }, { passive: false });
  const end = e => {
    if (!drag || (e && e.pointerId !== drag.pid)) return;
    const d = drag; drag = null;
    document.body.classList.remove('ddragging');
    if (!d.moved) { // toque = próxima etapa
      touched = true; stopHint();
      const i = ORDER.indexOf(d.cd.col);
      if (i < ORDER.length - 1) move(d.cd, ORDER[i + 1]);
      return;
    }
    const gr = d.ghost.getBoundingClientRect(); d.ghost.remove(); d.el.classList.remove('dplace');
    d.over && d.over.classList.remove('dover');
    if (d.over && d.over.dataset.col !== d.cd.col) move(d.cd, d.over.dataset.col, { fromRect: gr });
    else if (G()) { const to = d.el.getBoundingClientRect(); G().fromTo(d.el, { x: gr.left - to.left, y: gr.top - to.top }, { x: 0, y: 0, duration: 0.5, ease: 'expo.out' }); }
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  board.addEventListener('click', e => { // teclado (Enter/Espaço)
    if (e.detail !== 0) return; const el = e.target.closest('.dcard'); if (!el) return;
    const cd = cards.find(c => c.id == el.dataset.id); const i = ORDER.indexOf(cd.col);
    touched = true; stopHint(); if (i < ORDER.length - 1) { move(cd, ORDER[i + 1]); const f = board.querySelector(`.dcard[data-id="${cd.id}"]`); f && f.focus(); }
  });

  // dica: o primeiro card "chama" para ser arrastado
  let hintTl = null;
  function hint() {
    const el = board.querySelector('.dcard[data-id="1"]'); if (!el) return;
    const tag = document.createElement('span'); tag.className = 'dhint'; tag.textContent = 'Arraste-me →'; el.appendChild(tag);
    if (G()) hintTl = G().timeline({ repeat: -1, repeatDelay: 1.6 }).to(el, { x: 18, rotate: 2, duration: 0.35, ease: 'power2.out' }).to(el, { x: 0, rotate: 0, duration: 0.6, ease: 'elastic.out(1,.4)' });
  }
  function stopHint() { if (hintTl) { hintTl.kill(); hintTl = null; } board.querySelectorAll('.dhint').forEach(h => h.remove()); board.querySelectorAll('.dcard').forEach(c => { G() ? G().set(c, { clearProps: 'transform' }) : (c.style.transform = ''); }); }

  function reset() {
    timers.forEach(clearTimeout); timers = []; stopHint(); touched = false;
    cards = START.map(c => ({ ...c })); toasts.innerHTML = ''; render();
  }
  document.getElementById('demoReset').addEventListener('click', reset);
  reset();
})();
