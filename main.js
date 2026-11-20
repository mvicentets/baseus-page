/* Baseus — landing page interactions */

// ▸ WhatsApp de vendas (DDI 55 + DDD + número)
const WHATSAPP = '5567993031239';
// ▸ Supabase do Baseus (chave pública, a mesma que o app usa no navegador)
const SUPABASE = { url: 'https://bfpzjpwtzogtgwwklkjz.supabase.co', key: 'sb_publishable_S_0MZ2yopkPPBIOT3dERmw_IQPvdAzE' };
// ▸ Mensagem de cada plano (o nome, WhatsApp e Instagram do formulário vão no fim)
const PLANOS = {
  solo:   { nome: 'Solo · 1 usuário · R$ 99/mês', msg: 'Olá! Quero assinar o Baseus *Solo* (1 usuário, R$ 99/mês). Trabalho solo como social media e quero organizar minha produção e as aprovações dos clientes num lugar só.' },
  dupla:  { nome: 'Dupla · 2 usuários · R$ 129/mês', msg: 'Olá! Quero assinar o Baseus *Dupla* (2 usuários, R$ 129/mês). Divido a produção com mais uma pessoa e a gente quer parar de se perder entre planilha e WhatsApp.' },
  equipe: { nome: 'Equipe · até 5 usuários · R$ 199/mês', msg: 'Olá! Quero assinar o Baseus *Equipe* (até 5 usuários, R$ 199/mês). Temos um time de produção e queremos cada pessoa na sua etapa, com o cliente aprovando pelo portal.' },
  mais:   { nome: 'Mais de 5 usuários', msg: 'Olá! Minha equipe tem mais de 5 pessoas e quero saber como fica o Baseus para a gente.' }
};

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  // ---- salva o contato no Supabase do Baseus (aba Leads do app). Se falhar, o WhatsApp abre do mesmo jeito.
  const origem = () => {
    const q = new URLSearchParams(location.search); const utm = ['utm_source', 'utm_medium', 'utm_campaign'].map(k => q.get(k)).filter(Boolean).join(' / ');
    let ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
    return (utm || ref || 'direto').slice(0, 200);
  };
  const salvarLead = body => {
    try {
      fetch(`${SUPABASE.url}/rest/v1/rpc/lead_new`, {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE.key, Authorization: `Bearer ${SUPABASE.key}` },
        body: JSON.stringify(body)
      }).catch(() => {});
    } catch (e) {}
  };

  // ---- formulário antes do WhatsApp
  const lead = $('#lead'), form = $('#leadForm'), err = $('#leadErr');
  let plano = 'solo', lastFocus = null;
  const maskTel = v => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
  };
  const openLead = key => {
    plano = PLANOS[key] ? key : 'solo'; lastFocus = document.activeElement;
    $('#leadPlan').textContent = `[ ${PLANOS[plano].nome.toUpperCase()} ]`;
    err.textContent = ''; lead.hidden = false; document.documentElement.classList.add('lead-open');
    if (window.__lenis) window.__lenis.stop();
    requestAnimationFrame(() => requestAnimationFrame(() => { lead.classList.add('on'); setTimeout(() => form.nome.focus(), 250); }));
  };
  const closeLead = () => {
    lead.classList.remove('on'); document.documentElement.classList.remove('lead-open');
    if (window.__lenis) window.__lenis.start();
    setTimeout(() => { lead.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }, 300);
  };
  $$('[data-plan]').forEach(a => { a.href = '#'; a.addEventListener('click', e => { e.preventDefault(); openLead(a.dataset.plan); }); });
  $$('[data-close]', lead).forEach(el => el.addEventListener('click', closeLead));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lead.hidden) closeLead(); });
  form.whats.addEventListener('input', () => { form.whats.value = maskTel(form.whats.value); });
  form.insta.addEventListener('input', () => { form.insta.value = form.insta.value.replace(/^@+/, '').replace(/\s/g, ''); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const nome = form.nome.value.trim(), tel = form.whats.value.replace(/\D/g, ''), ig = form.insta.value.trim().replace(/^@+/, '');
    if (nome.length < 2) { err.textContent = 'Coloca seu nome pra gente saber com quem fala.'; form.nome.focus(); return; }
    if (tel.length < 10) { err.textContent = 'Confere o WhatsApp com DDD.'; form.whats.focus(); return; }
    if (ig.length < 2) { err.textContent = 'Qual é o seu @ no Instagram?'; form.insta.focus(); return; }
    if (form.site && form.site.value) { closeLead(); return; } // campo invisível: só robô preenche
    salvarLead({ p_nome: nome, p_whats: tel, p_insta: ig, p_plano: plano, p_origem: origem() });
    const texto = `${PLANOS[plano].msg}\n\n*Nome:* ${nome}\n*WhatsApp:* ${form.whats.value}\n*Instagram:* @${ig}`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
    closeLead();
  });

  // ---- comparador claro/escuro (funciona mesmo sem GSAP)
  const cmp = $('#compare');
  if (cmp) {
    const handle = $('.compare-handle', cmp);
    let drag = false;
    const set = pct => { pct = Math.max(0, Math.min(100, pct)); cmp.style.setProperty('--p', pct + '%'); handle.setAttribute('aria-valuenow', Math.round(pct)); };
    const fromEv = e => { const r = cmp.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); };
    cmp.addEventListener('pointerdown', e => { drag = true; cmp.setPointerCapture(e.pointerId); fromEv(e); cmp.dataset.touched = '1'; });
    cmp.addEventListener('pointermove', e => { if (drag) fromEv(e); });
    cmp.addEventListener('pointerup', () => { drag = false; });
    cmp.addEventListener('pointercancel', () => { drag = false; });
    handle.addEventListener('keydown', e => {
      const cur = parseFloat(getComputedStyle(cmp).getPropertyValue('--p')) || 50;
      if (e.key === 'ArrowLeft') { set(cur - 5); e.preventDefault(); }
      if (e.key === 'ArrowRight') { set(cur + 5); e.preventDefault(); }
    });
    cmp._set = set;
  }

  if (!window.gsap || !window.ScrollTrigger || reduce) {
    $$('.big-words').forEach(el => el.style.opacity = 1);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('js-anim');

  // ---- rolagem suave
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const t = $(id); if (!t) return;
      e.preventDefault(); lenis.scrollTo(t, { offset: id === '#top' ? 0 : -20, duration: 1.6 });
    }));
  }

  // ---- nav some ao descer, volta ao subir
  const nav = $('#nav'); let lastY = 0;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => {
    const y = s.scroll(); nav.classList.toggle('hide', y > 300 && y > lastY); lastY = y;
  }});

  // ---- HERO intro
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro.fromTo('.hero-title .line > span', { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: 0.09 }, 0.35)
       .fromTo('.fade-up', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 0.9)
       .fromTo('.sticker', { opacity: 0, scale: 0.4, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 1, stagger: 0.08, ease: 'back.out(1.8)' }, 1.1);

  // stickers seguem o mouse (parallax) e o scroll
  const stickers = $$('.sticker');
  if (fine) {
    const hero = $('#hero');
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
      stickers.forEach(s => { const d = parseFloat(s.dataset.depth || 1); gsap.to(s, { x: dx * 40 * d, y: dy * 30 * d, duration: 1.2, ease: 'power3.out', overwrite: 'auto' }); });
    });
  }
  gsap.to('.stickers', { y: -40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '20% top', end: '70% top', scrub: true } });
  // pontos da palavra se espalham ao rolar a primeira dobra
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onUpdate: s => {
    (window.DOTWORDS || []).forEach(d => { if (d.mode === 'hero') d.setScatter(s.progress * 1.2); });
  }});
  gsap.to('.hero-mid', { yPercent: -25, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });

  // ---- device sobe deitado e endireita
  gsap.fromTo('#heroDevice', { rotateX: 32, scale: 0.84, y: 0 }, {
    rotateX: 0, scale: 1, y: 0, ease: 'none',
    scrollTrigger: { trigger: '.rise', start: 'top 95%', end: 'top 15%', scrub: 0.8 }
  });

  // ---- frase que acende palavra por palavra
  $$('.big-words').forEach(el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
            else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    gsap.to($$('.w', el), { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  });

  // ---- marquee que acelera e inclina com a velocidade do scroll
  const mq = $('#mq');
  if (mq) {
    let x = 0, vel = 0, skew = 0;
    const half = () => mq.scrollWidth / 2;
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => { vel = s.getVelocity(); } });
    gsap.ticker.add(() => {
      const boost = Math.min(Math.abs(vel) / 120, 18);
      x -= 0.8 + boost * (vel < 0 ? -1 : 1) * 0.6;
      const w = half(); if (x <= -w) x += w; if (x > 0) x -= w;
      skew += ((Math.max(-12, Math.min(12, vel / 300))) - skew) * 0.1;
      mq.style.transform = `translate3d(${x}px,0,0) skewX(${-skew}deg)`;
      vel *= 0.92;
    });
  }

  // ---- títulos das seções: linhas sobem com máscara
  $$('section h2').forEach(h => {
    if (h.closest('.hero')) return;
    gsap.from(h, { yPercent: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
  });
  $$('.label, .sc-head .sub, .portal-copy .sub, .auto .sub, .checks li, .faq-list details').forEach(el => {
    gsap.from(el, { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });

  // ---- ESTEIRA fixada
  const track = $('#plTrack'), card = $('#plCard');
  if (track && card) {
    const cols = $$('.pl-col[data-step]', track).sort((a, b) => a.dataset.step - b.dataset.step);
    const slots = cols.map(c => $('.slot', c));
    const names = cols.map(c => $('.pl-name', c).textContent.trim());
    const statusEl = $('#plStatus'), bubble = $('#plBubble'), bar = $('#plBar'), stepEl = $('#plStep'), nameEl = $('#plName');
    const ST = [['Planejado', ''], ['Copy aprovada', 's-green'], ['Roteiro e gravação', 's-amber'], ['Editando', 's-blue'], ['Aprovado', 's-green'], ['Postado', 's-blue']];
    const pos = i => { const s = slots[i]; return { x: s.offsetLeft, y: s.offsetTop }; };
    const size = () => { card.style.width = slots[0].offsetWidth + 'px'; };
    size(); ScrollTrigger.addEventListener('refreshInit', size);
    let rz; new ResizeObserver(() => { size(); clearTimeout(rz); rz = setTimeout(() => ScrollTrigger.refresh(), 150); }).observe(track);
    let cur = -1;
    const setStep = i => {
      if (i === cur) return; cur = i;
      cols.forEach((c, k) => c.classList.toggle('active', k === i));
      statusEl.textContent = ST[i][0]; statusEl.className = 'status ' + ST[i][1];
      bubble.classList.toggle('on', i >= 4);
      bubble.textContent = i >= 5 ? '✓ Publicado' : '✓ Cliente aprovou';
      stepEl.textContent = String(i + 1).padStart(2, '0') + ' / 06';
      nameEl.textContent = names[i];
      gsap.fromTo(card, { scale: 1.06 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
    };
    const mobile = matchMedia('(max-width: 900px)').matches;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.pipeline', start: 'top top', end: () => '+=' + (mobile ? 1400 : 2600), pin: '.pl-pin', scrub: 0.7, invalidateOnRefresh: true,
      },
      onUpdate: () => {
        bar.style.width = (tl.progress() * 100) + '%';
        const t = tl.time(); let n = 0;
        for (let k = 0; k < slots.length; k++) { const lt = tl.labels['s' + k]; if (lt !== undefined && t >= lt - 0.45) n = k; }
        setStep(n);
      }
    });
    tl.set(card, { x: () => pos(0).x, y: () => pos(0).y }, 0).addLabel('s0', 0).to({}, { duration: 0.5 });
    for (let i = 1; i < slots.length; i++) {
      tl.to(card, { x: () => pos(i).x, y: () => pos(i).y, rotate: i % 2 ? 3 : -3, duration: 1, ease: 'power2.inOut' })
        .to(card, { rotate: 0, duration: 0.3 }, '>-0.3')
        .addLabel('s' + i).to({}, { duration: 0.5 });
    }
    setStep(0);
  }

  // ---- SHOWCASE: troca a tela conforme o texto
  const frames = $$('.sc-frame'), dots = $$('.sc-dots i'), items = $$('.sc-item');
  const activate = i => { frames.forEach((f, k) => f.classList.toggle('on', k === i)); dots.forEach((d, k) => d.classList.toggle('on', k === i)); items.forEach((it, k) => it.classList.toggle('on', k === i)); };
  items.forEach((it, i) => ScrollTrigger.create({ trigger: it, start: 'top 60%', end: 'bottom 40%', onToggle: s => s.isActive && activate(i) }));
  activate(0);
  gsap.from('.sc-sticky .device', { clipPath: 'inset(12% 12% 12% 12% round 40px)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.sc-grid', start: 'top 75%' } });
  $$('.sc-inline').forEach(img => gsap.from(img, { clipPath: 'inset(0 0 100% 0 round 14px)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: img, start: 'top 88%' } }));

  // ---- PORTAL: celular gira e notificações caem
  gsap.fromTo('#phone', { rotate: -10, y: 120, rotateY: 18 }, { rotate: 0, y: 0, rotateY: 0, ease: 'none', scrollTrigger: { trigger: '.portal', start: 'top bottom', end: 'center center', scrub: 0.8 } });
  $$('.toast').forEach((t, i) => {
    gsap.from(t, { opacity: 0, scale: 0.6, y: 50, duration: 0.9, ease: 'back.out(1.7)', delay: i * 0.25, scrollTrigger: { trigger: '.portal-visual', start: 'top 65%' } });
    gsap.to(t, { y: [-60, -20, -90][i], ease: 'none', scrollTrigger: { trigger: '.portal', start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // ---- AUTOMAÇÃO em loop
  const mini = $('#miniCard'), laneA = $('#laneA'), laneB = $('#laneB'), ruleSt = $('#ruleSt');
  if (mini) {
    const lanes = $('#lanes');
    const at = el => ({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth });
    const place = el => { const p = at(el); gsap.set(mini, { x: p.x, y: p.y, width: p.w }); };
    place(laneA);
    const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.8, paused: true });
    loop.call(() => { ruleSt.textContent = 'Escrevendo'; ruleSt.classList.remove('done'); place(laneA); })
        .to({}, { duration: 1.2 })
        .call(() => { ruleSt.textContent = 'Copy aprovada'; ruleSt.classList.add('done'); })
        .fromTo(ruleSt, { scale: 1.25 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' })
        .to(mini, { x: () => at(laneB).x, y: () => at(laneB).y, rotate: 4, duration: 1, ease: 'power3.inOut' }, '+=0.5')
        .to(mini, { rotate: 0, duration: 0.3 })
        .to({}, { duration: 1.6 })
        .to(mini, { opacity: 0, duration: 0.3 })
        .call(() => place(laneA))
        .to(mini, { opacity: 1, duration: 0.3 });
    ScrollTrigger.create({ trigger: lanes, start: 'top 85%', end: 'bottom top', onToggle: s => s.isActive ? loop.play() : loop.pause() });
    ScrollTrigger.addEventListener('refresh', () => { gsap.set(mini, { width: laneA.offsetWidth }); if (!loop.isActive()) place(laneA); });
  }

  // ---- CARDS empilhados: o de baixo encolhe quando o próximo chega
  const stk = $$('.stk');
  stk.forEach((c, i) => {
    const next = stk[i + 1];
    if (next) gsap.fromTo(c, { scale: 1, filter: 'brightness(1)' }, { scale: 0.92, filter: 'brightness(0.78)', ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 20%', scrub: true } });
    const img = $('.stk-shot img', c);
    if (img) gsap.fromTo(img, { scale: 1.15, x: 60 }, { scale: 1, x: 0, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'top 30%', scrub: true } });
  });
  // cofre: contagem regressiva
  const vt = $('#vaultT');
  if (vt) { let s = 300; setInterval(() => { s = s <= 0 ? 300 : s - 1; vt.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }, 1000); }

  // ---- comparador: varre sozinho ao aparecer
  if (cmp) {
    const o = { p: 50 };
    gsap.timeline({ scrollTrigger: { trigger: cmp, start: 'top 70%' } })
      .to(o, { p: 85, duration: 1, ease: 'power2.inOut', onUpdate: () => !cmp.dataset.touched && cmp._set(o.p) })
      .to(o, { p: 18, duration: 1.3, ease: 'power2.inOut', onUpdate: () => !cmp.dataset.touched && cmp._set(o.p) })
      .to(o, { p: 50, duration: 0.9, ease: 'power2.inOut', onUpdate: () => !cmp.dataset.touched && cmp._set(o.p) });
    gsap.from(cmp, { scale: 0.9, borderRadius: 60, ease: 'none', scrollTrigger: { trigger: cmp, start: 'top bottom', end: 'top 40%', scrub: true } });
  }

  // ---- PREÇOS: cards caem tortos como adesivos e endireitam
  $$('.plan').forEach((p, i) => {
    const r = getComputedStyle(p).getPropertyValue('--r') || '0deg';
    gsap.fromTo(p, { y: 140, rotate: parseFloat(r) * 3, opacity: 0 }, { y: 0, rotate: parseFloat(r) * 0.25, opacity: 1, duration: 1.3, ease: 'expo.out', delay: i * 0.12, scrollTrigger: { trigger: '#plans', start: 'top 80%' } });
    const b = $('[data-price]', p); const end = +b.dataset.price; const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.6, ease: 'expo.out', delay: 0.2 + i * 0.12, onUpdate: () => { b.textContent = Math.round(o.v); }, scrollTrigger: { trigger: '#plans', start: 'top 80%' } });
    if (fine) {
      p.addEventListener('mousemove', e => { const rc = p.getBoundingClientRect(); const dx = (e.clientX - rc.left) / rc.width - 0.5, dy = (e.clientY - rc.top) / rc.height - 0.5; gsap.to(p, { rotateY: dx * 8, rotateX: -dy * 8, rotate: 0, transformPerspective: 900, duration: 0.6, ease: 'power3.out' }); });
      p.addEventListener('mouseleave', () => gsap.to(p, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'elastic.out(1,.5)' }));
    }
  });

  // ---- cursor personalizado + botões magnéticos
  if (fine) {
    const cur = $('#cursor'), txt = $('#cursorTxt');
    const xTo = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' }), yTo = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('mousemove', e => { xTo(e.clientX); yTo(e.clientY); cur.style.opacity = 1; });
    document.addEventListener('mouseleave', () => cur.style.opacity = 0);
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => { txt.textContent = el.dataset.cursor; cur.classList.add('big'); });
      el.addEventListener('mouseleave', () => { cur.classList.remove('big'); });
    });
    $$('.magnetic').forEach(b => {
      b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.5, ease: 'power3.out' }); });
      b.addEventListener('mouseleave', () => gsap.to(b, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,.4)' }));
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
