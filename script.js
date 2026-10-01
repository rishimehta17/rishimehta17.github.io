(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) root.classList.add('no-motion');

  /* ---------- footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- nav state and active links ---------- */
  const nav = $('#nav');
  const navLinks = $$('.nav-links a');
  const onNavScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  onNavScroll();
  window.addEventListener('scroll', onNavScroll, { passive: true });

  // Highlight the link for the section in view.
  const spy = (links, band) => {
    if (!('IntersectionObserver' in window) || !links.length) return;
    const targets = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const link = links.find((a) => a.getAttribute('href') === '#' + e.target.id);
        if (!link) return;
        if (e.isIntersecting) links.forEach((a) => a.classList.toggle('on', a === link));
        else link.classList.remove('on');
      });
    }, { rootMargin: band });
    targets.forEach((t) => io.observe(t));
  };
  spy(navLinks, '-45% 0px -50% 0px');
  spy($$('.subnav-links a'), '-40% 0px -55% 0px');

  /* ---------- reveal on scroll ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
    // Safety net so nothing stays hidden if the observer never fires.
    setTimeout(() => revealEls.forEach((el) => el.classList.add('in')), 4000);
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------- word-by-word light-up ---------- */
  // Wraps each word of a paragraph in a span so the words can light up one by one.
  const splitWords = (el) => {
    const text = el.textContent.trim();
    el.textContent = '';
    const spans = [];
    text.split(/\s+/).forEach((word, i, all) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = word;
      el.appendChild(span);
      if (i < all.length - 1) el.appendChild(document.createTextNode(' '));
      spans.push(span);
    });
    return spans;
  };

  // The task paragraph lights up as you scroll through it.
  const statement = $('#statement-text');
  const statementWords = statement ? splitWords(statement) : [];
  if (statement && reduceMotion) statement.classList.add('done');

  // The intro paragraph sits at the top of the page, so it lights up on load instead.
  const lede = $('.lede[data-words="load"]');
  if (lede) {
    const words = splitWords(lede);
    if (reduceMotion) {
      words.forEach((w) => w.classList.add('lit'));
    } else {
      words.forEach((w, i) => setTimeout(() => w.classList.add('lit'), 650 + i * 55));
    }
  }

  /* ---------- scroll-linked effects ---------- */
  const frame = $('#demo-frame');
  let ticking = false;
  const update = () => {
    ticking = false;
    if (reduceMotion) return;
    const vh = window.innerHeight;
    if (frame) {
      const r = frame.getBoundingClientRect();
      const p = clamp(1 - r.top / (vh * 0.95), 0, 1);
      frame.style.setProperty('--s', (0.9 + 0.1 * p).toFixed(4));
    }
    if (statement) {
      const r = statement.getBoundingClientRect();
      const p = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.28), 0, 1);
      const lit = Math.round(p * statementWords.length * 1.08);
      statementWords.forEach((w, i) => w.classList.toggle('lit', i < lit));
    }
  };
  const requestUpdate = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();

  /* ---------- typewriter role line ---------- */
  // Each entry is [article, word]. The article is corrected between words (a / an).
  const roles = [
    ['a', 'roboticist'],
    ['a', 'thinker'],
    ['an', 'engineer'],
    ['an', 'AI/ML engineer'],
    ['a', 'builder'],
    ['a', 'hardware hacker']
  ];
  const twWord = $('#tw-word');
  const twArt = $('.tw-art');
  if (twWord && twArt && !reduceMotion) {
    const typeLoop = async () => {
      twWord.textContent = '';
      await sleep(1300);
      let i = 0;
      for (;;) {
        const [article, word] = roles[i];
        if (twArt.textContent !== article) {
          await sleep(140);
          twArt.textContent = article;
          await sleep(160);
        }
        for (let k = 1; k <= word.length; k++) {
          twWord.textContent = word.slice(0, k);
          await sleep(65 + Math.random() * 55);
        }
        await sleep(1700);
        for (let k = word.length - 1; k >= 0; k--) {
          twWord.textContent = word.slice(0, k);
          await sleep(34);
        }
        await sleep(380);
        i = (i + 1) % roles.length;
      }
    };
    typeLoop();
  }

  /* ---------- demo video ---------- */
  // Plays on the page. Nothing loads or plays until the visitor presses play, then it plays with sound.
  const stage = $('#demo-stage');
  const video = $('#demo-video');
  const playBtn = $('#demo-play');
  if (stage && video && playBtn) {
    let ready = false;
    const markMissing = () => { if (!ready) stage.classList.add('is-missing'); };
    const source = $('source', video);
    if (source) source.addEventListener('error', markMissing);
    video.addEventListener('error', markMissing);
    video.addEventListener('loadedmetadata', () => { ready = true; stage.classList.remove('is-missing'); });
    // The error can fire before this script runs, so also check the state directly.
    window.addEventListener('load', () => {
      if (!ready && (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE)) markMissing();
    });

    playBtn.addEventListener('click', () => {
      stage.classList.add('is-playing');
      video.controls = true;
      video.muted = false;
      const p = video.play();
      if (p && p.catch) p.catch(() => { /* controls are visible, so the visitor can press play */ });
    });

    // Back to the poster when the video ends.
    video.addEventListener('ended', () => {
      stage.classList.remove('is-playing');
      video.controls = false;
      video.currentTime = 0;
    });

    // Pause when the video scrolls out of view.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (!e.isIntersecting && !video.paused) video.pause(); });
      }, { threshold: 0.15 }).observe(stage);
    }
  }

  /* ---------- bento: pointer spotlight ---------- */
  $$('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- photo slideshows ---------- */
  // Each photo fades in over the last one. It pauses on hover, on focus, when scrolled away,
  // when the tab is hidden, and when the visitor presses the pause button.
  $$('[data-shots]').forEach((box) => {
    const shots = $$('.shot', box);
    if (shots.length < 2) return;
    const dotsWrap = $('.shots-dots', box);
    const capOut = $('[data-cap-out]', box);
    const pauseBtn = $('.shots-pause', box);
    const HOLD = 4400;   // how long each photo stays
    const FADE = 1400;   // a little longer than the CSS fade
    const offset = parseInt(box.dataset.offset || '0', 10) || 0;
    let cur = 0, timer = 0, fadeTimer = 0, capTimer = 0;
    let userPaused = false, hovering = false, focused = false, inView = false;

    const dots = shots.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' of ' + shots.length);
      b.addEventListener('click', () => { show(i); schedule(HOLD + FADE); });
      dotsWrap.appendChild(b);
      return b;
    });
    const markDot = () => dots.forEach((d, n) => d.setAttribute('aria-current', String(n === cur)));

    const setCaption = (text) => {
      if (!capOut) return;
      clearTimeout(capTimer);
      capOut.classList.add('swap');
      capTimer = setTimeout(() => { capOut.textContent = text; capOut.classList.remove('swap'); }, reduceMotion ? 0 : 320);
    };

    function show(i) {
      if (i === cur) return;
      const prev = shots[cur];
      const next = shots[i];
      // The new photo fades in on top while the old one stays put underneath, so the frame never dips to black.
      shots.forEach((el) => { if (el !== prev && el !== next) el.classList.remove('was', 'is-on'); });
      prev.classList.remove('is-on');
      prev.classList.add('was');
      next.classList.remove('was');
      next.classList.add('is-on');
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(() => prev.classList.remove('was'), FADE);
      cur = i;
      markDot();
      setCaption(next.dataset.cap || '');
    }

    const running = () => !reduceMotion && !userPaused && !hovering && !focused && inView && !document.hidden;
    function schedule(delay) {
      clearTimeout(timer);
      if (!running()) return;
      timer = setTimeout(() => { show((cur + 1) % shots.length); schedule(HOLD + FADE); }, delay == null ? HOLD : delay);
    }

    markDot();
    if (capOut && shots[0].dataset.cap) capOut.textContent = shots[0].dataset.cap;

    if (pauseBtn) {
      if (reduceMotion) {
        pauseBtn.hidden = true;
      } else {
        pauseBtn.addEventListener('click', () => {
          userPaused = !userPaused;
          pauseBtn.setAttribute('aria-pressed', String(userPaused));
          pauseBtn.setAttribute('aria-label', userPaused ? 'Play the photo slideshow' : 'Pause the photo slideshow');
          schedule(HOLD);
        });
      }
    }

    // Hover only pauses for a mouse. A touch would otherwise leave it stuck.
    box.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hovering = true; clearTimeout(timer); } });
    box.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hovering = false; schedule(HOLD); } });
    box.addEventListener('focusin', () => { focused = true; clearTimeout(timer); });
    box.addEventListener('focusout', () => { focused = false; schedule(HOLD); });
    document.addEventListener('visibilitychange', () => schedule(HOLD));

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        inView = entries[0].isIntersecting;
        if (inView) schedule(HOLD + offset); else clearTimeout(timer);
      }, { threshold: 0.3 }).observe(box);
    } else {
      inView = true;
      schedule(HOLD + offset);
    }
  });

  /* ---------- pipeline tabs ---------- */
  const pipe = $('#pipe');
  if (pipe) {
    const tabs = $$('.step', pipe);
    const panels = $$('.panel', pipe);
    let current = 0;
    let manual = reduceMotion;
    let inView = false;

    const select = (i, focus) => {
      current = (i + tabs.length) % tabs.length;
      tabs.forEach((t, n) => {
        const on = n === current;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach((p, n) => {
        const on = n === current;
        p.hidden = !on;
        p.classList.toggle('is-active', on);
      });
      // Restart the progress bar animation.
      pipe.classList.remove('playing');
      void pipe.offsetWidth;
      if (!manual && inView) pipe.classList.add('playing');
      if (focus) tabs[current].focus();
      tabs[current].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    };

    const stopAuto = () => { manual = true; pipe.classList.remove('playing'); pipe.classList.add('manual'); };

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { stopAuto(); select(i); });
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); stopAuto(); select(current + 1, true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); stopAuto(); select(current - 1, true); }
        if (e.key === 'Home') { e.preventDefault(); stopAuto(); select(0, true); }
        if (e.key === 'End') { e.preventDefault(); stopAuto(); select(tabs.length - 1, true); }
      });
    });

    pipe.addEventListener('animationend', (e) => {
      if (e.animationName === 'fill' && !manual) select(current + 1);
    });

    if (reduceMotion) pipe.classList.add('manual');

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        inView = entries[0].isIntersecting;
        if (manual) return;
        if (inView) pipe.classList.add('playing'); else pipe.classList.remove('playing');
      }, { threshold: 0.4 }).observe(pipe);
    }
  }

  /* ---------- copy email ---------- */
  const copyBtn = $('#copy-email');
  const toast = $('#toast');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const value = $('#email').textContent.trim();
      let ok = false;
      try { await navigator.clipboard.writeText(value); ok = true; } catch (err) {
        const range = document.createRange();
        range.selectNodeContents($('#email'));
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      }
      toast.textContent = ok ? 'Copied' : 'Press Ctrl or Cmd + C';
      setTimeout(() => { toast.textContent = ''; }, 2200);
    });
  }
})();
