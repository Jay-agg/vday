/* ============================================
   Valentine's Day Memory Board — script.js
   ============================================ */

(function () {
  'use strict';

  // ── Photo list ──────────────────────────────
  const photos = [
    'IMG_1736.jpg', 'IMG_3706.jpg', 'IMG_4125.jpg', 'IMG_4127.jpg', 'IMG_4391.jpg',
    'IMG_4461.jpg', 'IMG_4615.jpg', 'IMG_5657.jpg', 'IMG_5765.jpg', 'IMG_6094.jpg',
    'IMG_6211.jpg', 'IMG_6245.jpg', 'IMG_6253.jpg', 'IMG_6315.jpg', 'IMG_6376.jpg',
    'IMG_6405.jpg', 'IMG_6533.jpg', 'IMG_6604.jpg', 'IMG_6665.jpg', 'IMG_6741.jpg',
    'IMG_7004.jpg', 'IMG_7079.jpg', 'IMG_7863.jpg', 'IMG_7881.jpg', 'IMG_8059.jpg',
    'IMG_8074.jpg', 'IMG_8075.jpg', 'IMG_8179.jpg', 'IMG_8180.jpg', 'IMG_8181.jpg',
    'IMG_8182.jpg', 'IMG_8183.jpg', 'IMG_8184.jpg', 'IMG_8185.jpg', 'IMG_8186.jpg',
    'IMG_8187.jpg', 'IMG_8190.jpg', 'IMG_8191.jpg', 'IMG_8192.jpg', 'IMG_8193.jpg',
    'IMG_8194.jpg', 'IMG_8195.jpg', 'IMG_8196.jpg', 'IMG_8197.jpg', 'IMG_8198.jpg',
    'IMG_8199.jpg', 'IMG_8200.jpg', 'IMG_8201.jpg', 'IMG_8202.jpg', 'IMG_8203.jpg',
    'IMG_8204.jpg', 'IMG_8205.jpg', 'IMG_8206.jpg', 'IMG_8207.jpg', 'IMG_8208.jpg',
    'IMG_8209.jpg', 'IMG_8210.jpg', 'IMG_8211.jpg', 'IMG_8212.jpg', 'IMG_8213.jpg',
    'IMG_8214.jpg', 'IMG_8216.jpg', 'IMG_8217.jpg', 'IMG_8218.jpg', 'IMG_8219.jpg',
    'IMG_8220.jpg'
  ];

  // ── Config ──────────────────────────────────
  const CARD_SIZES = [
    { w: 200, h: 260 },
    { w: 240, h: 300 },
    { w: 180, h: 230 },
    { w: 260, h: 330 },
    { w: 220, h: 280 },
  ];
  const GRID_COLS = 10;
  const GRID_ROWS = Math.ceil(photos.length / GRID_COLS);
  const CELL_W = 380;
  const CELL_H = 460;
  const PADDING = 800; // extra space around the grid edge
  const CANVAS_W = GRID_COLS * CELL_W + PADDING * 2;
  const CANVAS_H = GRID_ROWS * CELL_H + PADDING * 2;

  // ── DOM refs ────────────────────────────────
  const canvas = document.getElementById('photo-canvas');
  const wrapper = document.getElementById('canvas-wrapper');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  const welcomeOverlay = document.getElementById('welcome-overlay');
  const scrollHint = document.getElementById('scroll-hint');

  // ── Setup canvas size ──────────────────────
  canvas.style.width = CANVAS_W + 'px';
  canvas.style.height = CANVAS_H + 'px';

  // ── Camera / pan state ─────────────────────
  let camX = -(CANVAS_W / 2 - window.innerWidth / 2);
  let camY = -(CANVAS_H / 2 - window.innerHeight / 2);
  let zoom = 1;
  const ZOOM_MIN = 0.3;
  const ZOOM_MAX = 3;
  let isDragging = false;
  let startX, startY;
  let dragMoved = false;

  function applyCamera() {
    canvas.style.transform = `translate(${camX}px, ${camY}px) scale(${zoom})`;
    canvas.style.transformOrigin = '0 0';
  }
  applyCamera();

  function applyZoom(newZoom, pivotX, pivotY) {
    // pivotX/pivotY are in viewport coords
    // Convert pivot point to canvas coords before zoom
    const canvasXBefore = (pivotX - camX) / zoom;
    const canvasYBefore = (pivotY - camY) / zoom;
    zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom));
    // Adjust cam so the same canvas point stays under the pivot
    camX = pivotX - canvasXBefore * zoom;
    camY = pivotY - canvasYBefore * zoom;
    applyCamera();
    checkVisibility();
    updateZoomDisplay();
  }

  // ── Scatter photos on canvas ───────────────
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const shuffled = shuffle(photos);
  const cards = [];

  shuffled.forEach((photo, i) => {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    const size = CARD_SIZES[Math.floor(Math.random() * CARD_SIZES.length)];
    const rotation = (Math.random() - 0.5) * 12; // -6 to 6 degrees

    // Position within cell with some random jitter
    const jitterX = (Math.random() - 0.5) * 60;
    const jitterY = (Math.random() - 0.5) * 60;
    const x = PADDING + col * CELL_W + (CELL_W - size.w) / 2 + jitterX;
    const y = PADDING + row * CELL_H + (CELL_H - size.h) / 2 + jitterY;

    const card = document.createElement('div');
    card.className = 'photo-card' + (Math.random() > 0.6 ? ' has-tape' : '');
    card.style.cssText = `
      left: ${x}px;
      top: ${y}px;
      width: ${size.w}px;
      --rotation: ${rotation}deg;
    `;

    const img = document.createElement('img');
    img.src = `photos_web/${photo}`;
    img.alt = 'Memory';
    img.loading = 'lazy';
    img.draggable = false;

    card.appendChild(img);
    canvas.appendChild(card);

    card.addEventListener('click', (e) => {
      if (dragMoved) return; // don't open if we were dragging
      openLightbox(`photos_web/${photo}`);
    });

    cards.push({ el: card, x, y, w: size.w, h: size.h });
  });

  // ── Edge labels: "picture abhi baaki h puchhi" ──
  const edgeText = 'picture abhi baaki h puchhi';
  const gridLeft = PADDING;
  const gridRight = PADDING + GRID_COLS * CELL_W;
  const gridTop = PADDING;
  const gridBottom = PADDING + GRID_ROWS * CELL_H;
  const midX = CANVAS_W / 2;
  const midY = CANVAS_H / 2;

  const edgePositions = [
    { x: midX, y: gridTop - 100, rot: 0 },      // top
    { x: midX, y: gridBottom + 60, rot: 0 },     // bottom
    { x: gridLeft - 60, y: midY, rot: -90 },      // left
    { x: gridRight + 60, y: midY, rot: 90 },      // right
  ];

  edgePositions.forEach(({ x, y, rot }) => {
    const label = document.createElement('div');
    label.className = 'edge-label';
    label.textContent = edgeText;
    label.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      transform: translate(-50%, -50%) rotate(${rot}deg);
      white-space: nowrap;
    `;
    canvas.appendChild(label);
  });

  // ── Visibility / scroll-reveal ─────────────
  function checkVisibility() {
    const vl = -camX / zoom;
    const vt = -camY / zoom;
    const vr = vl + window.innerWidth / zoom;
    const vb = vt + window.innerHeight / zoom;
    const margin = 100; // reveal a little early

    cards.forEach(({ el, x, y, w, h }) => {
      const inView =
        x + w > vl - margin &&
        x < vr + margin &&
        y + h > vt - margin &&
        y < vb + margin;

      if (inView && !el.classList.contains('visible')) {
        // Stagger animation slightly based on distance from center
        const dx = (x + w / 2) - (vl + window.innerWidth / 2);
        const dy = (y + h / 2) - (vt + window.innerHeight / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const delay = Math.min(dist * 0.3, 400);
        el.style.transitionDelay = delay + 'ms';
        el.classList.add('visible');
      }
    });
  }

  // Initial visibility check
  checkVisibility();

  // ── Drag / pan (mouse) ─────────────────────
  wrapper.addEventListener('mousedown', (e) => {
    if (lightbox.classList.contains('active')) return;
    isDragging = true;
    dragMoved = false;
    startX = e.clientX - camX;
    startY = e.clientY - camY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX - camX;
    const dy = e.clientY - startY - camY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
    camX = e.clientX - startX;
    camY = e.clientY - startY;
    applyCamera();
    checkVisibility();
    hideScrollHint();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    // Reset dragMoved after a tick so click handlers can read it
    setTimeout(() => { dragMoved = false; }, 0);
  });

  // ── Drag / pan (touch) + pinch-to-zoom ─────
  let lastPinchDist = 0;
  let lastPinchMidX = 0;
  let lastPinchMidY = 0;

  wrapper.addEventListener('touchstart', (e) => {
    if (lightbox.classList.contains('active')) return;
    if (e.touches.length === 2) {
      // Start pinch
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist = Math.sqrt(dx * dx + dy * dy);
      lastPinchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      lastPinchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      isDragging = false;
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      isDragging = true;
      dragMoved = false;
      startX = t.clientX - camX;
      startY = t.clientY - camY;
    }
  }, { passive: true });

  wrapper.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      if (lastPinchDist > 0) {
        const scale = dist / lastPinchDist;
        applyZoom(zoom * scale, midX, midY);
      }
      lastPinchDist = dist;
      lastPinchMidX = midX;
      lastPinchMidY = midY;
      hideScrollHint();
      return;
    }
    if (!isDragging) return;
    const t = e.touches[0];
    const tdx = t.clientX - startX - camX;
    const tdy = t.clientY - startY - camY;
    if (Math.abs(tdx) > 4 || Math.abs(tdy) > 4) dragMoved = true;
    camX = t.clientX - startX;
    camY = t.clientY - startY;
    applyCamera();
    checkVisibility();
    hideScrollHint();
    e.preventDefault();
  }, { passive: false });

  wrapper.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) lastPinchDist = 0;
    if (e.touches.length === 0) {
      isDragging = false;
      setTimeout(() => { dragMoved = false; }, 0);
    }
  });

  // ── Scroll-wheel: zoom (Ctrl/Cmd) or pan ───
  wrapper.addEventListener('wheel', (e) => {
    e.preventDefault();
    hideScrollHint();
    if (e.ctrlKey || e.metaKey) {
      // Zoom toward cursor
      const delta = -e.deltaY * 0.003;
      applyZoom(zoom * (1 + delta), e.clientX, e.clientY);
    } else {
      camX -= e.deltaX;
      camY -= e.deltaY;
      applyCamera();
      checkVisibility();
    }
  }, { passive: false });

  // ── Lightbox ───────────────────────────────
  function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.classList.add('active');
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // ── Welcome overlay ────────────────────────
  setTimeout(() => {
    welcomeOverlay.classList.add('fade-out');
    setTimeout(() => {
      welcomeOverlay.style.display = 'none';
    }, 1000);
  }, 3000);

  // ── Scroll hint ────────────────────────────
  function hideScrollHint() {
    scrollHint.classList.add('hidden');
  }

  // Also hide hint after 6 seconds regardless
  setTimeout(hideScrollHint, 6000);

  // ── Zoom UI controls ──────────────────────
  const zoomControls = document.createElement('div');
  zoomControls.id = 'zoom-controls';
  zoomControls.innerHTML = `
    <button id="zoom-in" aria-label="Zoom in">+</button>
    <span id="zoom-level">100%</span>
    <button id="zoom-out" aria-label="Zoom out">&minus;</button>
  `;
  document.body.appendChild(zoomControls);

  function updateZoomDisplay() {
    document.getElementById('zoom-level').textContent = Math.round(zoom * 100) + '%';
  }

  document.getElementById('zoom-in').addEventListener('click', (e) => {
    e.stopPropagation();
    applyZoom(zoom * 1.25, window.innerWidth / 2, window.innerHeight / 2);
  });

  document.getElementById('zoom-out').addEventListener('click', (e) => {
    e.stopPropagation();
    applyZoom(zoom / 1.25, window.innerWidth / 2, window.innerHeight / 2);
  });

  // ── Window resize ──────────────────────────
  window.addEventListener('resize', checkVisibility);

  // ── Floating hearts background decoration ──
  function createFloatingHeart() {
    const heart = document.createElement('div');
    heart.textContent = ['💕', '💗', '💖', '🩷', '♥️'][Math.floor(Math.random() * 5)];
    heart.style.cssText = `
      position: fixed;
      z-index: 0;
      font-size: ${12 + Math.random() * 16}px;
      left: ${Math.random() * 100}vw;
      top: 100vh;
      opacity: ${0.1 + Math.random() * 0.15};
      pointer-events: none;
      animation: floatUp ${8 + Math.random() * 8}s linear forwards;
    `;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 16000);
  }

  // Add float-up animation dynamically
  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatUp {
      0% { transform: translateY(0) rotate(0deg); }
      100% { transform: translateY(-120vh) rotate(${Math.random() > 0.5 ? '' : '-'}360deg); }
    }
  `;
  document.head.appendChild(style);

  // Spawn hearts periodically
  setInterval(createFloatingHeart, 2000);
  // Initial burst
  for (let i = 0; i < 5; i++) {
    setTimeout(createFloatingHeart, i * 400);
  }

  // ── Background music ──────────────────────
  const bgMusic = document.getElementById('bg-music');
  bgMusic.volume = 0.4;

  function tryPlayMusic() {
    bgMusic.play().then(() => {
      // Remove listeners once playing
      document.removeEventListener('click', tryPlayMusic);
      document.removeEventListener('touchstart', tryPlayMusic);
      document.removeEventListener('wheel', tryPlayMusic);
      document.removeEventListener('mousedown', tryPlayMusic);
    }).catch(() => { });
  }

  // Browsers require user interaction before autoplay
  document.addEventListener('click', tryPlayMusic);
  document.addEventListener('touchstart', tryPlayMusic);
  document.addEventListener('wheel', tryPlayMusic);
  document.addEventListener('mousedown', tryPlayMusic);

})();
