/* ============================================================
   OUR WORLD — App Logic
   Vanilla JS, no dependencies. Everything persists in localStorage.
   Organized by section. Search "// ===== " headers to jump around.
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     STATE & STORAGE
     Single source of truth, persisted to localStorage as JSON.
     ============================================================ */
  const STORAGE_KEY = 'ourworld_data_v1';

  const DEFAULT_STATE = {
    names: { me: 'Me', her: 'My Love' },
    avatar: null, // base64 data URL
    anniversary: '2023-01-01',
    theme: 'rose', // rose | gold | lavender | ocean
    pin: '1234',
    countdownTitle: 'Our next meeting',
    countdownDate: null, // ISO string
    photos: [], // [{id, src}]
    letters: [], // [{id, title, body, date}]
    bucket: [], // [{id, text, done}]
    music: { name: '', artist: '', dataUrl: '' },
    dailyNoteIndex: null,
    dailyNoteDate: null,
    scratchHistory: [], // [{id, category, date, text, emoji}]
    scratchTakenDates: {}, // { "cat-key|YYYY-MM-DD": true }
    secretUnlocked: false,
    secretNotes: [
      { title: 'For when you miss me', body: "Close your eyes. I'm right there in the quiet space behind your eyelids, the way I always am. This isn't goodbye, it's just a small distance — and every distance has an end." },
      { title: 'For when you feel low', body: "You don't have to be strong for me right now. Just be here. I love every version of you, especially this tired, honest one. Text me anything — I'm not going anywhere." }
    ]
  };

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredCloneSafe(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      return Object.assign(structuredCloneSafe(DEFAULT_STATE), parsed);
    } catch (e) {
      console.warn('Could not load saved data, starting fresh.', e);
      return structuredCloneSafe(DEFAULT_STATE);
    }
  }

  function structuredCloneSafe(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Storage full or unavailable.', e);
      showToast('Storage is full — try removing a few photos 💛');
    }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* ============================================================
     THEME SYSTEM
     ============================================================ */
  const THEMES = {
    rose:    { primary: ['#e8a8a0', '#c8607a', '#8e4a72'], gold: ['#e6c98a', '#d9b46a'], name: 'Rose' },
    gold:    { primary: ['#f0d28a', '#d9a23c', '#a8702a'], gold: ['#f0d28a', '#d9a23c'], name: 'Amber' },
    lavender:{ primary: ['#c8aee8', '#9a6fc0', '#5e4a8e'], gold: ['#d6c0f0', '#a87fd9'], name: 'Lavender' },
    ocean:   { primary: ['#8ad0e8', '#4a9ac0', '#2a5e8e'], gold: ['#9ae0d6', '#4ad9b4'], name: 'Ocean' }
  };

  function applyTheme(key) {
    const t = THEMES[key] || THEMES.rose;
    const root = document.documentElement.style;
    root.setProperty('--grad-primary', `linear-gradient(135deg, ${t.primary[0]} 0%, ${t.primary[1]} 50%, ${t.primary[2]} 100%)`);
    root.setProperty('--rose', t.primary[1]);
    root.setProperty('--rose-deep', t.primary[2]);
    root.setProperty('--grad-gold', `linear-gradient(135deg, ${t.gold[0]} 0%, ${t.gold[1]} 100%)`);
    root.setProperty('--gold', t.gold[1]);
    root.setProperty('--gold-soft', t.gold[0]);
  }

  /* ============================================================
     NAVIGATION
     ============================================================ */
  const SCREENS = ['home', 'counter', 'gallery', 'letters', 'openwhen', 'bucket', 'countdown', 'music', 'secret', 'gifts', 'scratch', 'settings'];

  const TAB_ITEMS = [
    { id: 'home', label: 'Home', icon: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>' },
    { id: 'counter', label: 'Us', icon: '<path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>' },
    { id: 'gallery', label: 'Gallery', icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>' },
    { id: 'scratch', label: 'Surprise', icon: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>' },
    { id: 'settings', label: 'Settings', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9"/>' }
  ];

  function buildTabbars() {
    document.querySelectorAll('.tabbar').forEach(bar => {
      bar.innerHTML = TAB_ITEMS.map(t => `
        <button class="tab" data-nav="${t.id}" aria-label="${t.label}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${t.icon}</svg>
          <span>${t.label}</span>
        </button>`).join('');
    });
  }

  function goTo(screenId) {
    if (!SCREENS.includes(screenId)) return;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen-' + screenId);
    if (target) target.classList.add('active');
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.nav === screenId);
    });
    // Refresh content relevant to the screen we just entered
    refreshScreen(screenId);
    window.scrollTo(0, 0);
  }

  function refreshScreen(id) {
    if (id === 'home') renderHome();
    if (id === 'counter') renderCounter();
    if (id === 'gallery') renderGallery();
    if (id === 'letters') renderLetters();
    if (id === 'openwhen') renderOpenWhen();
    if (id === 'bucket') renderBucket();
    if (id === 'countdown') renderCountdownPage();
    if (id === 'secret') renderSecretGate();
    if (id === 'gifts') renderGifts('flowers');
    if (id === 'scratch') renderScratch();
    if (id === 'settings') renderSettings();
  }

  document.addEventListener('click', (e) => {
    const navEl = e.target.closest('[data-nav]');
    if (navEl) goTo(navEl.dataset.nav);
  });

  /* ============================================================
     TOAST
     ============================================================ */
  let toastTimer = null;
  function showToast(msg, icon) {
    const el = document.getElementById('toast');
    el.innerHTML = (icon ? icon + ' ' : '') + msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  /* ============================================================
     SHEET (bottom modal) HELPER
     ============================================================ */
  const sheetOverlay = document.getElementById('sheet-overlay');
  const sheetContent = document.getElementById('sheet-content');

  function openSheet(html) {
    sheetContent.innerHTML = `<div class="sheet-handle"></div>${html}`;
    sheetOverlay.classList.add('active');
  }
  function closeSheet() {
    sheetOverlay.classList.remove('active');
  }
  sheetOverlay.addEventListener('click', (e) => {
    if (e.target === sheetOverlay) closeSheet();
  });

  /* ============================================================
     WELCOME SCREEN — heart particle canvas + enter transition
     ============================================================ */
  function initHeartCanvas() {
    const canvas = document.getElementById('heart-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let raf;
    let running = true;

    function resize() {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
    }
    resize();
    window.addEventListener('resize', resize);

    function spawn() {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      particles.push({
        x: Math.random() * w,
        y: h + 20,
        size: 8 + Math.random() * 14,
        speed: 0.4 + Math.random() * 0.9,
        drift: (Math.random() - 0.5) * 0.6,
        wobble: Math.random() * Math.PI * 2,
        opacity: 0.15 + Math.random() * 0.35,
        hue: Math.random() > 0.5 ? '232,138,138' : '217,180,106'
      });
      if (particles.length > 36) particles.shift();
    }

    function drawHeart(x, y, size, opacity, hue) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(devicePixelRatio, devicePixelRatio);
      ctx.beginPath();
      const s = size / 2;
      ctx.moveTo(0, s * 0.3);
      ctx.bezierCurveTo(-s, -s * 0.6, -s * 1.6, s * 0.5, 0, s * 1.4);
      ctx.bezierCurveTo(s * 1.6, s * 0.5, s, -s * 0.6, 0, s * 0.3);
      ctx.fillStyle = `rgba(${hue},${opacity})`;
      ctx.fill();
      ctx.restore();
    }

    let frame = 0;
    function loop() {
      if (!running) return;
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (frame % 18 === 0) spawn();
      particles.forEach(p => {
        p.y -= p.speed;
        p.wobble += 0.02;
        p.x += Math.sin(p.wobble) * 0.4 + p.drift;
        drawHeart(p.x, p.y, p.size, p.opacity, p.hue);
      });
      particles = particles.filter(p => p.y > -40);
      raf = requestAnimationFrame(loop);
    }
    loop();
    return () => { running = false; cancelAnimationFrame(raf); };
  }

  /* ============================================================
     AMBIENT FLOATING HEARTS ON HOME
     ============================================================ */
  function spawnAmbientHeart() {
    const container = document.getElementById('home-float-hearts');
    if (!container || !document.getElementById('screen-home').classList.contains('active')) return;
    const h = document.createElement('div');
    h.className = 'float-heart';
    h.textContent = Math.random() > 0.5 ? '♥' : '❀';
    h.style.left = (5 + Math.random() * 90) + '%';
    h.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
    h.style.animationDuration = (7 + Math.random() * 6) + 's';
    container.appendChild(h);
    setTimeout(() => h.remove(), 14000);
  }
  setInterval(spawnAmbientHeart, 2600);

  /* ============================================================
     TAP-HEART INTERACTION (avatar tap → floating hearts burst)
     ============================================================ */
  document.getElementById('tap-heart-zone').addEventListener('click', (e) => {
    burstHeartsAt(e.currentTarget);
    showToast('Loved that 💕');
  });

  function burstHeartsAt(el) {
    const rect = el.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      const h = document.createElement('div');
      h.className = 'tap-heart';
      h.textContent = '❤';
      h.style.left = (rect.left + rect.width / 2 + (Math.random() * 50 - 25)) + 'px';
      h.style.top = (rect.top + rect.height / 2) + 'px';
      h.style.color = i % 2 === 0 ? 'var(--rose)' : 'var(--gold-soft)';
      h.style.animationDelay = (i * 0.06) + 's';
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 1100);
    }
  }

  /* ============================================================
     CONFETTI & FIREWORKS (canvas-based, full screen)
     ============================================================ */
  const fxCanvas = document.getElementById('fx-canvas');
  const fxCtx = fxCanvas.getContext('2d');
  function resizeFx() {
    fxCanvas.width = innerWidth * devicePixelRatio;
    fxCanvas.height = innerHeight * devicePixelRatio;
    fxCanvas.style.width = innerWidth + 'px';
    fxCanvas.style.height = innerHeight + 'px';
  }
  resizeFx();
  window.addEventListener('resize', resizeFx);

  function fireConfetti() {
    const colors = ['#e8a8a0', '#c8607a', '#d9b46a', '#f6ecdf', '#e6c98a'];
    let pieces = [];
    for (let i = 0; i < 90; i++) {
      pieces.push({
        x: Math.random() * innerWidth,
        y: -20 - Math.random() * innerHeight * 0.3,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: 2 + Math.random() * 3,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        drift: (Math.random() - 0.5) * 2
      });
    }
    let frames = 0;
    function step() {
      frames++;
      fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
      fxCtx.save();
      fxCtx.scale(devicePixelRatio, devicePixelRatio);
      pieces.forEach(p => {
        p.y += p.speed;
        p.x += p.drift;
        p.rot += p.rotSpeed;
        fxCtx.save();
        fxCtx.translate(p.x, p.y);
        fxCtx.rotate(p.rot * Math.PI / 180);
        fxCtx.fillStyle = p.color;
        fxCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        fxCtx.restore();
      });
      fxCtx.restore();
      pieces = pieces.filter(p => p.y < innerHeight + 30);
      if (pieces.length && frames < 240) requestAnimationFrame(step);
      else fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    }
    step();
  }

  function fireFireworks() {
    const colors = ['#e8a8a0', '#c8607a', '#d9b46a', '#f6ecdf'];
    let particles = [];
    function burst(x, y) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const count = 36;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 2 + Math.random() * 3;
        particles.push({
          x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 60 + Math.random() * 20, color, size: 2 + Math.random() * 2
        });
      }
    }
    const launchPoints = [
      [innerWidth * 0.3, innerHeight * 0.35],
      [innerWidth * 0.7, innerHeight * 0.3],
      [innerWidth * 0.5, innerHeight * 0.45]
    ];
    launchPoints.forEach((pt, i) => setTimeout(() => burst(pt[0], pt[1]), i * 350));

    let frames = 0;
    function step() {
      frames++;
      fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
      fxCtx.save();
      fxCtx.scale(devicePixelRatio, devicePixelRatio);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life--;
        fxCtx.globalAlpha = Math.max(p.life / 80, 0);
        fxCtx.fillStyle = p.color;
        fxCtx.beginPath();
        fxCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        fxCtx.fill();
      });
      fxCtx.globalAlpha = 1;
      fxCtx.restore();
      particles = particles.filter(p => p.life > 0);
      if (frames < 200 && (particles.length || frames < 50)) requestAnimationFrame(step);
      else fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    }
    step();
  }

  /* ============================================================
     WELCOME → ENTER TRANSITION
     ============================================================ */
  const stopHeartCanvas = initHeartCanvas();
  document.getElementById('btn-enter').addEventListener('click', () => {
    const welcomeScreen = document.getElementById('screen-welcome');
    welcomeScreen.style.transition = 'opacity .6s ease, transform .6s ease';
    welcomeScreen.style.opacity = '0';
    welcomeScreen.style.transform = 'scale(1.04)';
    setTimeout(() => {
      welcomeScreen.classList.remove('active');
      welcomeScreen.style.display = 'none';
      goTo('home');
      fireConfetti();
    }, 560);
  });

  /* ============================================================
     HOME RENDER
     ============================================================ */
  function formatDate(d) {
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  function renderHome() {
    document.getElementById('home-date').textContent = formatDate(new Date());
    document.getElementById('home-greeting').textContent = `Hi, ${state.names.her || 'love'} 👋`;
    document.getElementById('welcome-names').textContent = `A little universe for ${state.names.me || 'me'} & ${state.names.her || 'you'}.`;

    const avatarEls = [document.getElementById('avatar-display'), document.getElementById('settings-avatar-preview')];
    avatarEls.forEach(el => {
      if (!el) return;
      if (state.avatar) {
        el.outerHTML = el.outerHTML; // no-op safeguard
      }
    });
    renderAvatar();

    // stats
    const days = daysBetween(new Date(state.anniversary), new Date());
    document.getElementById('home-days-num').textContent = Math.max(days, 0);
    document.getElementById('home-letters-num').textContent = state.letters.length;
    document.getElementById('home-photos-num').textContent = state.photos.length;

    // daily note
    document.getElementById('home-daily-note').textContent = getDailyNote();
  }

  function renderAvatar() {
    document.querySelectorAll('#avatar-display, #settings-avatar-preview').forEach(el => {
      const parent = el.parentElement;
      let img = parent.querySelector('img');
      if (state.avatar) {
        if (!img) {
          img = document.createElement('img');
          img.alt = 'Her photo';
          parent.insertBefore(img, el);
        }
        img.src = state.avatar;
        el.style.display = 'none';
      } else {
        if (img) img.remove();
        el.style.display = 'flex';
        el.textContent = (state.names.her || '💛').trim().charAt(0).toUpperCase() || '💛';
      }
    });
  }

  function daysBetween(start, end) {
    const ms = end - start;
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }

  /* ============================================================
     DAILY LOVE NOTE — deterministic by date, no repeats until cycle ends
     ============================================================ */
  const LOVE_NOTES = [
    "Every morning I wake up grateful that you exist in this world, in my world.",
    "If I could give you one thing in life, I'd give you the ability to see yourself through my eyes.",
    "You are my favorite notification, my favorite person, my favorite everything.",
    "Distance means so little when someone means so much.",
    "I fall for you a little more every single day — and I didn't think that was possible.",
    "You're the calm in my chaos and the song I didn't know I needed.",
    "Loving you is the easiest thing I've ever done.",
    "You make ordinary days feel like they're worth remembering.",
    "I love you not just for who you are, but for who I am when I'm with you.",
    "My favorite place in the world is right next to you.",
    "Every love story is beautiful, but ours is my favorite.",
    "You're the reason I believe in soft, quiet, real love.",
    "If you were a flower, I'd pick you first, every single time.",
    "Thank you for being my person — today and every day.",
    "I didn't know what home meant until I found it in you.",
    "You turn the simplest moments into my favorite memories.",
    "Even on hard days, loving you is the easy part.",
    "You're the last thought before I sleep and the first when I wake.",
    "I love you more today than yesterday, and that's saying a lot.",
    "With you, even silence feels like a conversation."
  ];

  function getDailyNote() {
    const today = new Date().toDateString();
    if (state.dailyNoteDate === today && state.dailyNoteIndex !== null) {
      return LOVE_NOTES[state.dailyNoteIndex];
    }
    // deterministic pseudo-random index from date string, avoids same note twice in a row
    const seed = dateSeed(new Date());
    let idx = seed % LOVE_NOTES.length;
    if (idx === state.dailyNoteIndex) idx = (idx + 1) % LOVE_NOTES.length;
    state.dailyNoteIndex = idx;
    state.dailyNoteDate = today;
    saveState();
    return LOVE_NOTES[idx];
  }

  function dateSeed(date) {
    const str = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  /* ============================================================
     LOVE COUNTER
     ============================================================ */
  let counterInterval = null;
  function renderCounter() {
    document.getElementById('counter-since-date').textContent = formatDate(new Date(state.anniversary));
    document.getElementById('counter-edit-value').textContent = state.anniversary;
    updateCounterNumbers();
    clearInterval(counterInterval);
    counterInterval = setInterval(updateCounterNumbers, 1000);
  }

  function updateCounterNumbers() {
    const start = new Date(state.anniversary);
    const now = new Date();
    let diffMs = now - start;
    if (diffMs < 0) diffMs = 0;

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();
    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) { months += 12; years -= 1; }
    years = Math.max(years, 0); months = Math.max(months, 0); days = Math.max(days, 0);

    const totalHours = Math.floor(diffMs / 3.6e6) % 24;
    const totalMins = Math.floor(diffMs / 60000) % 60;

    setText('cu-years', years);
    setText('cu-months', months);
    setText('cu-days', days);
    setText('cu-hours', totalHours);
    setText('cu-mins', totalMins);
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  document.getElementById('btn-edit-anniversary').addEventListener('click', () => {
    openSheet(`
      <h3>Relationship start date</h3>
      <div class="form-group">
        <label class="form-label">When did it begin?</label>
        <input type="date" id="sheet-anniversary-input" value="${state.anniversary}">
      </div>
      <div class="sheet-actions">
        <button class="btn-ghost" id="sheet-cancel">Cancel</button>
        <button class="btn-primary" id="sheet-save-anniv">Save</button>
      </div>
    `);
    document.getElementById('sheet-cancel').onclick = closeSheet;
    document.getElementById('sheet-save-anniv').onclick = () => {
      const val = document.getElementById('sheet-anniversary-input').value;
      if (val) { state.anniversary = val; saveState(); renderCounter(); showToast('Date updated 💛'); }
      closeSheet();
    };
  });

  /* ============================================================
     MEMORY GALLERY
     ============================================================ */
  let lightboxIndex = 0;

  function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = state.photos.map((p, i) => `
      <div class="gallery-item" data-idx="${i}">
        <img src="${p.src}" alt="Memory ${i + 1}" loading="lazy">
        <button class="gi-del" data-del-idx="${i}" aria-label="Delete photo">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    `).join('') + `
      <div class="upload-tile" id="upload-tile-inline">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 11h-6V5a1 1 0 0 0-2 0v6H5a1 1 0 0 0 0 2h6v6a1 1 0 0 0 2 0v-6h6a1 1 0 0 0 0-2z"/></svg>
        Add photos
      </div>
    `;
    grid.querySelectorAll('.gallery-item img').forEach(img => {
      img.addEventListener('click', () => openLightbox(parseInt(img.parentElement.dataset.idx)));
    });
    grid.querySelectorAll('[data-del-idx]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.delIdx);
        state.photos.splice(idx, 1);
        saveState();
        renderGallery();
        showToast('Photo removed');
      });
    });
    const inlineTile = document.getElementById('upload-tile-inline');
    if (inlineTile) inlineTile.addEventListener('click', () => document.getElementById('gallery-input').click());
  }

  document.getElementById('fab-gallery').addEventListener('click', () => document.getElementById('gallery-input').click());
  document.getElementById('gallery-input').addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    let remaining = files.length;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        compressImage(ev.target.result, 1280, 0.82).then(compressed => {
          state.photos.push({ id: uid(), src: compressed });
          remaining--;
          if (remaining === 0) {
            saveState();
            renderGallery();
            showToast(`${files.length} photo${files.length > 1 ? 's' : ''} added 📸`);
          }
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  });

  // Resize/compress images client-side before storing, so localStorage doesn't fill up fast.
  function compressImage(dataUrl, maxDim, quality) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round(height * (maxDim / width)); width = maxDim; }
          else { width = Math.round(width * (maxDim / height)); height = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  const lightbox = document.getElementById('lightbox');
  function openLightbox(idx) {
    lightboxIndex = idx;
    updateLightboxImg();
    lightbox.classList.add('active');
  }
  function updateLightboxImg() {
    if (!state.photos.length) return;
    document.getElementById('lightbox-img').src = state.photos[lightboxIndex].src;
  }
  document.getElementById('lightbox-close').addEventListener('click', () => lightbox.classList.remove('active'));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('active'); });
  document.getElementById('lightbox-prev').addEventListener('click', () => {
    lightboxIndex = (lightboxIndex - 1 + state.photos.length) % state.photos.length;
    updateLightboxImg();
  });
  document.getElementById('lightbox-next').addEventListener('click', () => {
    lightboxIndex = (lightboxIndex + 1) % state.photos.length;
    updateLightboxImg();
  });

  /* ============================================================
     LOVE LETTERS
     ============================================================ */
  function renderLetters() {
    const scroll = document.getElementById('letters-scroll');
    if (!state.letters.length) {
      scroll.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg>
          <p>No letters yet. Write the first one — it doesn't have to be perfect, just honest.</p>
          <button class="btn-primary" id="empty-write-letter">Write a letter</button>
        </div>`;
      document.getElementById('empty-write-letter').addEventListener('click', openLetterEditor);
      return;
    }
    scroll.innerHTML = [...state.letters].reverse().map(l => `
      <div class="letter-card glass" data-id="${l.id}">
        <div class="letter-head" data-toggle="${l.id}">
          <div>
            <div class="lh-title">${escapeHtml(l.title)}</div>
            <div class="lh-date">${formatShortDate(l.date)}</div>
          </div>
          <svg class="letter-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="letter-body">
          <p>${escapeHtml(l.body)}</p>
          <div class="letter-del" data-del="${l.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0-1 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 6"/></svg>
            Delete letter
          </div>
        </div>
      </div>
    `).join('');

    scroll.querySelectorAll('[data-toggle]').forEach(head => {
      head.addEventListener('click', () => {
        const card = head.closest('.letter-card');
        card.classList.toggle('open');
        if (card.classList.contains('open')) {
          const body = card.querySelector('.letter-body');
          body.style.maxHeight = body.scrollHeight + 40 + 'px';
        } else {
          card.querySelector('.letter-body').style.maxHeight = '0';
        }
      });
    });
    scroll.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.del;
        state.letters = state.letters.filter(l => l.id !== id);
        saveState();
        renderLetters();
        renderHome();
        showToast('Letter deleted');
      });
    });
  }

  function formatShortDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  document.getElementById('fab-letter').addEventListener('click', openLetterEditor);
  function openLetterEditor() {
    openSheet(`
      <h3>Write a love letter</h3>
      <div class="form-group">
        <label class="form-label">Title</label>
        <input type="text" id="letter-title-input" placeholder="For my favorite person">
      </div>
      <div class="form-group">
        <label class="form-label">Your letter</label>
        <textarea id="letter-body-input" placeholder="Dear you…"></textarea>
      </div>
      <div class="sheet-actions">
        <button class="btn-ghost" id="sheet-cancel">Cancel</button>
        <button class="btn-primary" id="sheet-save-letter">Save letter</button>
      </div>
    `);
    document.getElementById('sheet-cancel').onclick = closeSheet;
    document.getElementById('sheet-save-letter').onclick = () => {
      const title = document.getElementById('letter-title-input').value.trim();
      const body = document.getElementById('letter-body-input').value.trim();
      if (!title || !body) { showToast('Add a title and a few words 💌'); return; }
      state.letters.push({ id: uid(), title, body, date: new Date().toISOString() });
      saveState();
      closeSheet();
      renderLetters();
      renderHome();
      showToast('Letter saved 💌');
    };
  }

  /* ============================================================
     OPEN WHEN CARDS
     ============================================================ */
  const OPEN_WHEN_CARDS = [
    { key: 'miss', title: 'Open when you miss me', sub: 'A little closeness, delivered', icon: '<path d="M12 21s-7.4-4.6-10.1-9.1C.4 9.2 1.6 5.6 4.9 4.6c2-.6 4 .2 5.1 1.9.5.8.9 1.5 2 1.5s1.5-.7 2-1.5c1.1-1.7 3.1-2.5 5.1-1.9 3.3 1 4.5 4.6 3 7.3C19.4 16.4 12 21 12 21z"/>',
      msg: "I miss you too, right now, reading this. Close your eyes for ten seconds and picture my arms around you — that's exactly where I wish I was." },
    { key: 'sad', title: 'Open when you are sad', sub: 'A soft place to land', icon: '<circle cx="12" cy="12" r="9"/><path d="M8 15s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
      msg: "Whatever it is, it's allowed to be hard. You don't need to fix your face for me. I love your sad days too — they're still you, and you're still loved completely." },
    { key: 'happy', title: 'Open when you are happy', sub: "Let's celebrate together", icon: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
      msg: "Yes! I love this version of you — tell me everything, I want every detail. Your joy is one of my favorite things in this entire world." },
    { key: 'motivation', title: 'Open when you need motivation', sub: 'A push from your favorite person', icon: '<path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>',
      msg: "You are so much more capable than you're giving yourself credit for right now. One small step. That's all this needs. I already believe in you — now go show yourself why." },
    { key: 'sleep', title: 'Open when you cannot sleep', sub: 'A little lullaby in words', icon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
      msg: "Put the phone down after this. Breathe in for four, hold for four, out for four. I'm thinking of you right now, and I'll be thinking of you when I wake up too. Goodnight, my love." }
  ];

  function renderOpenWhen() {
    const grid = document.getElementById('ow-grid');
    grid.innerHTML = OPEN_WHEN_CARDS.map(c => `
      <button class="ow-card glass" data-ow="${c.key}">
        <div class="ow-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${c.icon}</svg></div>
        <div class="ow-text">
          <div class="ow-title">${c.title}</div>
          <div class="ow-sub">${c.sub}</div>
        </div>
      </button>
    `).join('');
    grid.querySelectorAll('[data-ow]').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = OPEN_WHEN_CARDS.find(c => c.key === btn.dataset.ow);
        document.getElementById('ow-modal-title').textContent = card.title;
        document.getElementById('ow-modal-text').textContent = card.msg;
        document.getElementById('ow-modal').classList.add('active');
      });
    });
  }
  document.getElementById('ow-modal-close').addEventListener('click', () => document.getElementById('ow-modal').classList.remove('active'));
  document.getElementById('ow-modal').addEventListener('click', (e) => {
    if (e.target.id === 'ow-modal') document.getElementById('ow-modal').classList.remove('active');
  });

  /* ============================================================
     BUCKET LIST
     ============================================================ */
  function renderBucket() {
    const list = document.getElementById('bucket-list');
    if (!state.bucket.length) {
      list.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <p>No dreams added yet. What's something you both want to do someday?</p>
        </div>`;
    } else {
      list.innerHTML = state.bucket.map(b => `
        <div class="bucket-item glass ${b.done ? 'done' : ''}" data-id="${b.id}">
          <div class="bucket-check" data-check="${b.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2a1018" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>
          </div>
          <div class="bucket-text">${escapeHtml(b.text)}</div>
          <button class="bucket-del" data-bdel="${b.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      `).join('');
    }
    const total = state.bucket.length;
    const done = state.bucket.filter(b => b.done).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById('bucket-pct').textContent = pct + '%';
    document.getElementById('bucket-progress-fill').style.width = pct + '%';

    list.querySelectorAll('[data-check]').forEach(el => {
      el.addEventListener('click', () => {
        const item = state.bucket.find(b => b.id === el.dataset.check);
        item.done = !item.done;
        saveState();
        renderBucket();
        if (item.done) {
          showToast('Dream completed! 🎉');
          fireConfetti();
        }
      });
    });
    list.querySelectorAll('[data-bdel]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        state.bucket = state.bucket.filter(b => b.id !== el.dataset.bdel);
        saveState();
        renderBucket();
      });
    });
  }

  document.getElementById('fab-bucket').addEventListener('click', () => {
    openSheet(`
      <h3>Add to our bucket list</h3>
      <div class="form-group">
        <label class="form-label">What do you want to do together?</label>
        <input type="text" id="bucket-input" placeholder="e.g. Watch the sunrise on a beach">
      </div>
      <div class="sheet-actions">
        <button class="btn-ghost" id="sheet-cancel">Cancel</button>
        <button class="btn-primary" id="sheet-save-bucket">Add</button>
      </div>
    `);
    document.getElementById('sheet-cancel').onclick = closeSheet;
    document.getElementById('sheet-save-bucket').onclick = () => {
      const val = document.getElementById('bucket-input').value.trim();
      if (!val) return;
      state.bucket.push({ id: uid(), text: val, done: false });
      saveState();
      closeSheet();
      renderBucket();
      showToast('Added to the list 💫');
    };
  });

  /* ============================================================
     COUNTDOWN PAGE
     ============================================================ */
  let countdownInterval = null;
  function renderCountdownPage() {
    document.getElementById('countdown-event-title').textContent = state.countdownTitle || 'Next meeting';
    clearInterval(countdownInterval);
    updateCountdownNumbers();
    countdownInterval = setInterval(updateCountdownNumbers, 1000);
  }

  function updateCountdownNumbers() {
    if (!state.countdownDate) {
      setText('cd-days', '–'); setText('cd-hours', '–'); setText('cd-mins', '–'); setText('cd-secs', '–');
      return;
    }
    const target = new Date(state.countdownDate);
    let diff = target - new Date();
    if (diff <= 0) {
      setText('cd-days', 0); setText('cd-hours', 0); setText('cd-mins', 0); setText('cd-secs', 0);
      return;
    }
    const d = Math.floor(diff / 86400000); diff -= d * 86400000;
    const h = Math.floor(diff / 3600000); diff -= h * 3600000;
    const m = Math.floor(diff / 60000); diff -= m * 60000;
    const s = Math.floor(diff / 1000);
    setText('cd-days', d); setText('cd-hours', h); setText('cd-mins', m); setText('cd-secs', s);
  }

  document.getElementById('btn-edit-countdown').addEventListener('click', () => {
    const val = state.countdownDate ? state.countdownDate.slice(0, 16) : '';
    openSheet(`
      <h3>Set your countdown</h3>
      <div class="form-group">
        <label class="form-label">What are you counting down to?</label>
        <input type="text" id="cd-title-input" value="${escapeHtml(state.countdownTitle || '')}" placeholder="Our next meeting">
      </div>
      <div class="form-group">
        <label class="form-label">Date & time</label>
        <input type="datetime-local" id="cd-date-input" value="${val}">
      </div>
      <div class="sheet-actions">
        <button class="btn-ghost" id="sheet-cancel">Cancel</button>
        <button class="btn-primary" id="sheet-save-cd">Save</button>
      </div>
    `);
    document.getElementById('sheet-cancel').onclick = closeSheet;
    document.getElementById('sheet-save-cd').onclick = () => {
      const title = document.getElementById('cd-title-input').value.trim();
      const date = document.getElementById('cd-date-input').value;
      if (date) state.countdownDate = new Date(date).toISOString();
      state.countdownTitle = title || 'Our next meeting';
      saveState();
      closeSheet();
      renderCountdownPage();
      showToast('Countdown set 🕊️');
    };
  });

  /* ============================================================
     MUSIC PLAYER
     ============================================================ */
  const audioPlayer = document.getElementById('audio-player');
  let isPlaying = false;

  function loadMusicUI() {
    document.getElementById('music-title').textContent = state.music.name || 'No song yet';
    document.getElementById('music-artist').textContent = state.music.artist || 'Add your song below';
    if (state.music.dataUrl) audioPlayer.src = state.music.dataUrl;
  }
  loadMusicUI();

  document.getElementById('btn-add-music').addEventListener('click', () => document.getElementById('music-input').click());
  document.getElementById('music-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      state.music = { name: file.name.replace(/\.[^/.]+$/, ''), artist: 'Our song', dataUrl: ev.target.result };
      saveState();
      loadMusicUI();
      showToast('Song added 🎵');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  document.getElementById('music-play').addEventListener('click', () => {
    if (!audioPlayer.src) { showToast('Add a song first 🎶'); return; }
    if (isPlaying) {
      audioPlayer.pause();
    } else {
      audioPlayer.play().catch(() => showToast("Couldn't play — try tapping again"));
    }
  });
  audioPlayer.addEventListener('play', () => {
    isPlaying = true;
    document.getElementById('music-play-icon').innerHTML = '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>';
    document.getElementById('album-art').classList.add('spinning');
  });
  audioPlayer.addEventListener('pause', () => {
    isPlaying = false;
    document.getElementById('music-play-icon').innerHTML = '<path d="M8 5v14l11-7z"/>';
    document.getElementById('album-art').classList.remove('spinning');
  });
  audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
      document.getElementById('music-progress-fill').style.width = (audioPlayer.currentTime / audioPlayer.duration * 100) + '%';
    }
  });
  audioPlayer.addEventListener('ended', () => {
    document.getElementById('music-progress-fill').style.width = '0%';
  });
  document.getElementById('music-prev').addEventListener('click', () => { audioPlayer.currentTime = 0; });
  document.getElementById('music-next').addEventListener('click', () => { audioPlayer.currentTime = Math.max(audioPlayer.duration - 1, 0); });

  /* ============================================================
     SECRET SECTION — PIN PROTECTED
     ============================================================ */
  let pinBuffer = '';
  function renderSecretGate() {
    document.getElementById('pin-screen').classList.remove('hidden');
    document.getElementById('secret-content').classList.add('hidden');
    pinBuffer = '';
    updatePinDots();
    buildPinPad();
  }

  function buildPinPad() {
    const pad = document.getElementById('pin-pad');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
    pad.innerHTML = keys.map(k => {
      if (k === '') return `<div></div>`;
      if (k === 'del') return `<button class="pin-key fn glass" data-key="del"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM18 9l-6 6m0-6l6 6"/></svg></button>`;
      return `<button class="pin-key glass" data-key="${k}">${k}</button>`;
    }).join('');
    pad.querySelectorAll('[data-key]').forEach(btn => {
      btn.addEventListener('click', () => handlePinKey(btn.dataset.key));
    });
  }

  function updatePinDots() {
    const dots = document.getElementById('pin-dots');
    dots.innerHTML = Array.from({ length: 4 }).map((_, i) =>
      `<div class="pin-dot ${i < pinBuffer.length ? 'filled' : ''}"></div>`
    ).join('');
  }

  function handlePinKey(key) {
    if (key === 'del') { pinBuffer = pinBuffer.slice(0, -1); updatePinDots(); return; }
    if (pinBuffer.length >= 4) return;
    pinBuffer += key;
    updatePinDots();
    if (pinBuffer.length === 4) {
      setTimeout(() => {
        if (pinBuffer === state.pin) {
          unlockSecret();
        } else {
          const wrap = document.getElementById('pin-screen');
          wrap.classList.add('shake');
          document.getElementById('pin-title-text').textContent = 'Incorrect PIN — try again';
          setTimeout(() => wrap.classList.remove('shake'), 460);
          pinBuffer = '';
          updatePinDots();
        }
      }, 150);
    }
  }

  function unlockSecret() {
    document.getElementById('pin-screen').classList.add('hidden');
    document.getElementById('secret-content').classList.remove('hidden');
    document.getElementById('pin-title-text').textContent = 'Enter PIN';
    renderSecretContent();
  }

  function renderSecretContent() {
    const list = document.getElementById('secret-letters-list');
    list.innerHTML = state.secretNotes.map(n => `
      <div class="card glass-strong">
        <div class="lh-title serif" style="font-weight:600; font-style:italic; margin-bottom:10px;">${escapeHtml(n.title)}</div>
        <p style="font-size:14px; line-height:1.7; color:var(--cream-dim); margin:0;">${escapeHtml(n.body)}</p>
      </div>
    `).join('');
    if (state.photos.length) {
      list.innerHTML += `<div class="section-head" style="margin-top:8px;"><h2 style="font-size:16px;">A few favorite photos</h2></div>
        <div class="gallery-grid">${state.photos.slice(0, 4).map((p, i) => `
          <div class="gallery-item"><img src="${p.src}" alt="Memory"></div>
        `).join('')}</div>`;
    }
  }

  /* ============================================================
     VIRTUAL GIFTS
     ============================================================ */
  const GIFT_DATA = {
    flowers: {
      options: [
        { emoji: '🌹', msg: 'A rose for the one who makes my heart bloom.' },
        { emoji: '🌷', msg: 'A tulip, simple and sweet — just like you.' },
        { emoji: '🌻', msg: 'A sunflower, because you light up every room.' },
        { emoji: '🌸', msg: 'A cherry blossom — delicate, beautiful, fleeting, like our favorite moments.' },
        { emoji: '💐', msg: 'A whole bouquet, because one flower could never be enough for you.' }
      ],
      defaultMsg: 'Pick a flower to send'
    },
    chocolate: {
      options: [
        { emoji: '🍫', msg: 'A classic bar, sweet and reliable — like my love for you.' },
        { emoji: '🍬', msg: 'Something sweet for someone sweeter.' },
        { emoji: '🧁', msg: 'A little cupcake of love, just for you.' },
        { emoji: '🍪', msg: 'A warm cookie, because you deserve all things cozy.' },
        { emoji: '🍰', msg: 'A slice of cake to celebrate just being us.' }
      ],
      defaultMsg: 'Pick a treat to send'
    },
    box: {
      options: [
        { emoji: '🎁', msg: 'Inside this box: every reason I fell for you, wrapped up with a bow.' },
        { emoji: '💎', msg: "A little sparkle, because you're precious to me." },
        { emoji: '✨', msg: 'A box full of magic, because that\'s what you bring to my life.' },
        { emoji: '💝', msg: 'My heart, gift-wrapped — yours to keep.' }
      ],
      defaultMsg: 'Open a surprise box'
    }
  };

  let currentGiftTab = 'flowers';
  function renderGifts(tab) {
    currentGiftTab = tab;
    document.querySelectorAll('.gift-tab').forEach(t => t.classList.toggle('active', t.dataset.gift === tab));
    const data = GIFT_DATA[tab];
    document.getElementById('gift-emoji').textContent = tab === 'flowers' ? '🌹' : tab === 'chocolate' ? '🍫' : '🎁';
    document.getElementById('gift-emoji').classList.remove('pop');
    document.getElementById('gift-msg').textContent = data.defaultMsg;
    document.getElementById('gift-options').innerHTML = data.options.map((o, i) => `
      <button class="gift-pick" data-gift-idx="${i}">${o.emoji}</button>
    `).join('');
    document.querySelectorAll('[data-gift-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const opt = data.options[parseInt(btn.dataset.giftIdx)];
        const emojiEl = document.getElementById('gift-emoji');
        emojiEl.textContent = opt.emoji;
        emojiEl.classList.remove('pop');
        requestAnimationFrame(() => emojiEl.classList.add('pop'));
        document.getElementById('gift-msg').textContent = opt.msg;
        fireConfetti();
      });
    });
  }
  document.querySelectorAll('.gift-tab').forEach(tab => {
    tab.addEventListener('click', () => renderGifts(tab.dataset.gift));
  });

  /* ============================================================
     SCRATCH CARDS
     ============================================================ */
  const SCRATCH_CATEGORIES = [
    { key: 'date', emoji: '🌙', title: 'Date Night Ideas', sub: 'Something to plan together' },
    { key: 'flirty', emoji: '😘', title: 'Flirty Messages', sub: 'A little spark for today' },
    { key: 'challenge', emoji: '🎯', title: 'Couple Challenges', sub: 'A fun dare for both of you' },
    { key: 'bonding', emoji: '💬', title: 'Emotional Bonding', sub: 'A question worth asking' },
    { key: 'surprise', emoji: '🎉', title: 'Surprise Activities', sub: 'Something unexpected' }
  ];

  const SCRATCH_CONTENT = {
    date: [
      { emoji: '🌙', text: 'Plan a surprise video call date — candles, music, and your favorite drink each.' },
      { emoji: '🍿', text: 'Pick a movie, watch it "together" on a call, and rate it after.' },
      { emoji: '🌅', text: 'Wake up early and watch the sunrise, even just from your own window, and send a photo to each other.' },
      { emoji: '🍳', text: 'Cook the same recipe at the same time, miles apart, and compare results.' }
    ],
    flirty: [
      { emoji: '💌', text: 'Send a voice note saying what you like most about each other right now.' },
      { emoji: '😘', text: 'Text them the exact moment you knew you liked them.' },
      { emoji: '🔥', text: "Tell them one thing you can't stop thinking about." },
      { emoji: '💭', text: 'Describe your perfect date with them in exactly 3 sentences.' }
    ],
    challenge: [
      { emoji: '📸', text: 'Send a random cute selfie right now, no filter, no warning.' },
      { emoji: '🎵', text: 'Send a song that describes your mood today, no explanation needed.' },
      { emoji: '🗣️', text: 'Talk for 60 seconds straight about your day, voice note only.' },
      { emoji: '🤝', text: 'Both write down "our song" separately and compare — did you match?' }
    ],
    bonding: [
      { emoji: '🌊', text: 'Ask a deep "get to know me better" question you\'ve never asked before.' },
      { emoji: '🧠', text: 'Share your favorite memory together and why it stuck with you.' },
      { emoji: '🌱', text: 'Write 3 things you appreciate about them, right now, no overthinking.' },
      { emoji: '🔮', text: 'Share one dream for your future together you haven\'t said out loud yet.' }
    ],
    surprise: [
      { emoji: '📦', text: 'Plan your next meet-up idea — even a rough one counts.' },
      { emoji: '🎁', text: 'Order them something small online, just because, no occasion needed.' },
      { emoji: '🗺️', text: "Pick a random place neither of you have visited and plan a 'someday' trip there." },
      { emoji: '⏰', text: 'Set a reminder to call them at a random, unexpected time today.' }
    ]
  };

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function getDailySpecial() {
    const seed = dateSeed(new Date());
    const allEntries = Object.entries(SCRATCH_CONTENT).flatMap(([cat, arr]) => arr.map(item => ({ ...item, cat })));
    const idx = seed % allEntries.length;
    return allEntries[idx];
  }

  function renderScratch() {
    const special = getDailySpecial();
    const specialTaken = !!state.scratchTakenDates['daily|' + todayKey()];
    document.getElementById('daily-special-title').textContent = specialTaken
      ? "Today's moment revealed — see history below"
      : "Tap to reveal today's card";
    document.getElementById('daily-special-card').onclick = () => {
      if (specialTaken) { showToast("You've already revealed today's special 💛"); return; }
      openScratchModal('daily', { emoji: '🎁', title: "Today's Couple Moment" }, special);
    };

    const grid = document.getElementById('scratch-cat-grid');
    grid.innerHTML = SCRATCH_CATEGORIES.map(c => {
      const taken = !!state.scratchTakenDates[c.key + '|' + todayKey()];
      return `
      <button class="scratch-cat glass" data-cat="${c.key}">
        <div class="sc-emoji">${c.emoji}</div>
        <div>
          <div class="sc-title">${c.title}</div>
          <div class="sc-sub">${c.sub}</div>
        </div>
        ${taken ? '<span class="sc-badge">Done today</span>' : ''}
      </button>`;
    }).join('');

    grid.querySelectorAll('[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.cat;
        if (state.scratchTakenDates[key + '|' + todayKey()]) {
          showToast('Come back tomorrow for a new one 🌙');
          return;
        }
        const cat = SCRATCH_CATEGORIES.find(c => c.key === key);
        const pool = SCRATCH_CONTENT[key];
        const seed = dateSeed(new Date()) + key.length;
        const content = pool[seed % pool.length];
        openScratchModal(key, cat, content);
      });
    });

    renderScratchHistory();
  }

  function renderScratchHistory() {
    const container = document.getElementById('scratch-history');
    if (!state.scratchHistory.length) {
      container.className = 'empty-state';
      container.innerHTML = '<p>Nothing revealed yet — go scratch a card!</p>';
      return;
    }
    container.className = '';
    container.innerHTML = [...state.scratchHistory].reverse().slice(0, 20).map(h => `
      <div class="card glass">
        <div class="row-between" style="margin-bottom:8px;">
          <span style="font-size:20px;">${h.emoji}</span>
          <span style="font-size:11px; color:var(--cream-faint);">${formatShortDate(h.date)}</span>
        </div>
        <p style="font-size:13.5px; line-height:1.6; margin:0; color:var(--cream-dim);">${escapeHtml(h.text)}</p>
      </div>
    `).join('');
  }

  // --- Scratch modal mechanics ---
  const scratchModal = document.getElementById('scratch-modal');
  // ─── SCRATCH CARD ENGINE ──────────────────────────────────────
  const scratchCard3d = document.getElementById('scratch-card-3d');
  const scratchCanvas = document.getElementById('scratch-canvas');
  let scratchKey = null;
  let scratchRevealed = false;
  let _td = null, _tm = null, _tu = null; // stored touch handlers for cleanup

  function openScratchModal(key, catMeta, content) {
    scratchKey = key;
    scratchRevealed = false;

    // Always reset canvas visibility before opening
    scratchCanvas.style.display = '';
    scratchCanvas.style.opacity = '1';
    scratchCanvas.style.transition = '';

    scratchCard3d.classList.remove('flipped');
    document.getElementById('scratch-done-actions').classList.add('hidden');
    document.getElementById('scratch-hint').style.opacity = '1';

    document.getElementById('scf-emoji').textContent = catMeta.emoji;
    document.getElementById('scf-title').textContent = catMeta.title;
    document.getElementById('sr-emoji').textContent = content.emoji;
    document.getElementById('sr-text').textContent = content.text;

    scratchModal.classList.add('active');

    setTimeout(() => {
      scratchCard3d.classList.add('flipped');
      setTimeout(() => setupScratchCanvas(key, content), 720);
    }, 500);
  }

  function setupScratchCanvas(key, content) {
    const rect = scratchCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Resize canvas fresh every time
    scratchCanvas.width = Math.floor(rect.width * dpr);
    scratchCanvas.height = Math.floor(rect.height * dpr);

    // Always get a fresh context after resize
    const ctx = scratchCanvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Draw gold foil
    const grad = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    grad.addColorStop(0, '#e8c97a');
    grad.addColorStop(0.5, '#d4b060');
    grad.addColorStop(1, '#c4a050');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Texture flecks
    ctx.globalAlpha = 0.07;
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#8B6914';
      ctx.fillRect(Math.random() * rect.width, Math.random() * rect.height, 2, 2);
    }
    ctx.globalAlpha = 1;

    ctx.font = '600 14px sans-serif';
    ctx.fillStyle = 'rgba(80,50,0,.5)';
    ctx.textAlign = 'center';
    ctx.fillText('✨ scratch to reveal ✨', rect.width / 2, rect.height / 2);

    let isDown = false;
    let checkThrottle = 0;

    function scratchAt(x, y) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    function getPos(e) {
      const r = scratchCanvas.getBoundingClientRect();
      const pt = e.touches ? e.touches[0] : e;
      return { x: pt.clientX - r.left, y: pt.clientY - r.top };
    }

    function checkReveal() {
      if (scratchRevealed) return;
      checkThrottle++;
      if (checkThrottle % 5 !== 0) return;
      const data = ctx.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height).data;
      let cleared = 0;
      for (let i = 3; i < data.length; i += 4 * 32) {
        if (data[i] < 50) cleared++;
      }
      if (cleared / (data.length / (4 * 32)) > 0.52) {
        revealScratchCard(key, content);
      }
    }

    function onDown(e) {
      e.preventDefault();
      isDown = true;
      const p = getPos(e);
      scratchAt(p.x, p.y);
      document.getElementById('scratch-hint').style.opacity = '0';
    }
    function onMove(e) {
      e.preventDefault();
      if (!isDown) return;
      const p = getPos(e);
      scratchAt(p.x, p.y);
      checkReveal();
    }
    function onUp(e) {
      isDown = false;
      checkReveal();
    }

    // Clean up previous listeners
    if (_td) scratchCanvas.removeEventListener('touchstart', _td);
    if (_tm) scratchCanvas.removeEventListener('touchmove', _tm);
    if (_tu) scratchCanvas.removeEventListener('touchend', _tu);
    scratchCanvas.onmousedown = null;
    scratchCanvas.onmousemove = null;
    scratchCanvas.onmouseup = null;

    // Attach fresh listeners
    _td = onDown; _tm = onMove; _tu = onUp;
    scratchCanvas.addEventListener('touchstart', onDown, { passive: false });
    scratchCanvas.addEventListener('touchmove', onMove, { passive: false });
    scratchCanvas.addEventListener('touchend', onUp, { passive: false });
    scratchCanvas.onmousedown = onDown;
    scratchCanvas.onmousemove = onMove;
    scratchCanvas.onmouseup = onUp;
  }

  function revealScratchCard(key, content) {
    if (scratchRevealed) return;
    scratchRevealed = true;
    scratchCanvas.style.transition = 'opacity .5s ease';
    scratchCanvas.style.opacity = '0';
    setTimeout(() => { scratchCanvas.style.display = 'none'; }, 500);

    state.scratchTakenDates[key + '|' + todayKey()] = true;
    state.scratchHistory.push({
      id: uid(),
      category: key,
      date: new Date().toISOString(),
      text: content.text,
      emoji: content.emoji
    });
    saveState();
    fireConfetti();
    document.getElementById('scratch-done-actions').classList.remove('hidden');
    showToast('Revealed! Saved to your history 💛');
  }

  document.getElementById('scratch-modal-close').addEventListener('click', closeScratchModal);
  document.getElementById('scratch-close-btn').addEventListener('click', closeScratchModal);

  function closeScratchModal() {
    scratchModal.classList.remove('active');
    scratchCanvas.style.display = '';
    scratchCanvas.style.opacity = '1';
    scratchCanvas.style.transition = '';
    if (_td) scratchCanvas.removeEventListener('touchstart', _td);
    if (_tm) scratchCanvas.removeEventListener('touchmove', _tm);
    if (_tu) scratchCanvas.removeEventListener('touchend', _tu);
    _td = _tm = _tu = null;
    scratchCanvas.onmousedown = scratchCanvas.onmousemove = scratchCanvas.onmouseup = null;
    renderScratch();
  }


  /* ============================================================
     SETTINGS
     ============================================================ */
  function renderSettings() {
    document.getElementById('setting-name-me').value = state.names.me || '';
    document.getElementById('setting-name-her').value = state.names.her || '';
    document.getElementById('setting-anniversary').value = state.anniversary || '';
    renderAvatar();
    buildThemeSwatches();
  }

  function buildThemeSwatches() {
    const wrap = document.getElementById('theme-swatches');
    wrap.innerHTML = Object.entries(THEMES).map(([key, t]) => `
      <button class="theme-swatch ${state.theme === key ? 'active' : ''}" data-theme="${key}"
        style="background:linear-gradient(135deg, ${t.primary[0]}, ${t.primary[2]})" aria-label="${t.name} theme" title="${t.name}"></button>
    `).join('');
    wrap.querySelectorAll('[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.theme = btn.dataset.theme;
        saveState();
        applyTheme(state.theme);
        buildThemeSwatches();
        showToast('Theme updated 🎨');
      });
    });
  }

  document.getElementById('btn-change-avatar').addEventListener('click', () => document.getElementById('avatar-input').click());
  document.getElementById('avatar-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      compressImage(ev.target.result, 600, 0.85).then(compressed => {
        state.avatar = compressed;
        saveState();
        renderAvatar();
        showToast('Photo updated 💛');
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  document.getElementById('btn-save-names').addEventListener('click', () => {
    state.names.me = document.getElementById('setting-name-me').value.trim() || 'Me';
    state.names.her = document.getElementById('setting-name-her').value.trim() || 'My Love';
    saveState();
    renderHome();
    showToast('Names saved 💛');
  });

  document.getElementById('btn-save-anniversary').addEventListener('click', () => {
    const val = document.getElementById('setting-anniversary').value;
    if (!val) { showToast('Pick a date first'); return; }
    state.anniversary = val;
    saveState();
    showToast('Anniversary saved 💛');
  });

  document.getElementById('btn-save-pin').addEventListener('click', () => {
    const val = document.getElementById('setting-pin').value;
    if (!/^\d{4}$/.test(val)) { showToast('PIN must be exactly 4 digits'); return; }
    state.pin = val;
    saveState();
    document.getElementById('setting-pin').value = '';
    showToast('PIN updated 🔒');
  });

  document.getElementById('btn-export-data').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `our-world-backup-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded 💾');
  });

  document.getElementById('btn-reset-data').addEventListener('click', () => {
    openSheet(`
      <h3>Reset everything?</h3>
      <p style="font-size:14px; color:var(--cream-dim); line-height:1.6; margin-bottom:20px;">This deletes all photos, letters, dates, and settings on this device. This cannot be undone.</p>
      <div class="sheet-actions">
        <button class="btn-ghost" id="sheet-cancel">Cancel</button>
        <button class="btn-primary" id="confirm-reset" style="background:var(--rose-deep); color:#fff;">Reset everything</button>
      </div>
    `);
    document.getElementById('sheet-cancel').onclick = closeSheet;
    document.getElementById('confirm-reset').onclick = () => {
      localStorage.removeItem(STORAGE_KEY);
      closeSheet();
      location.reload();
    };
  });

  /* ============================================================
     SPECIAL EVENT TRIGGER — fireworks when anniversary matches today
     ============================================================ */
  function checkSpecialDay() {
    const anniv = new Date(state.anniversary);
    const today = new Date();
    if (anniv.getMonth() === today.getMonth() && anniv.getDate() === today.getDate()) {
      setTimeout(() => {
        fireFireworks();
        showToast('Happy anniversary! 🎆', '🎉');
      }, 1200);
    }
  }

  /* ============================================================
     PWA — SERVICE WORKER REGISTRATION
     ============================================================ */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {
        /* offline support degrades gracefully if registration fails */
      });
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    buildTabbars();
    applyTheme(state.theme);
    renderHome();
    checkSpecialDay();
  }

  init();
})();
