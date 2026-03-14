// ════════════════════════════════════════════
// HUMAN INTELLIGENCE — App Logic
// ════════════════════════════════════════════

// ── State ──────────────────────────────────
let currentChapter = null;
let sidebarOpen = true;

// ── Chapter order for prev/next ────────────
const CHAPTER_ORDER = [
  'preface',
  ...BOOK.chapters.map((_, i) => i),
  'conclusion',
  'bibliography'
];

function getChapterLabel(key) {
  if (key === 'preface') return 'Preface';
  if (key === 'conclusion') return 'Conclusion';
  if (key === 'bibliography') return 'Bibliography';
  return `Chapter ${BOOK.chapters[key].num}: ${BOOK.chapters[key].title}`;
}

function getChapterData(key) {
  if (key === 'preface') return BOOK.preface;
  if (key === 'conclusion') return BOOK.conclusion;
  if (key === 'bibliography') return BOOK.bibliography;
  return BOOK.chapters[key];
}

// ── Init ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildSidebarChapterLinks();
  drawNeuralNet();

  // Handle hash routing
  const hash = window.location.hash;
  if (hash && hash.startsWith('#chapter-')) {
    const key = hash.replace('#chapter-', '');
    const parsed = isNaN(key) ? key : parseInt(key);
    openReader();
    loadChapter(parsed);
  }
});

// ── Sidebar chapter links ─────────────────
function buildSidebarChapterLinks() {
  const container = document.getElementById('chapterLinks');
  container.innerHTML = BOOK.chapters.map((ch, i) => `
    <a class="snav-chapter" href="#" onclick="loadChapter(${i})">
      <span class="snav-chapter-num">${String(ch.num).padStart(2,'0')}</span>${ch.title}
    </a>
  `).join('');
}

// ── Navigation ────────────────────────────
function startReading() {
  openReader();
  loadChapter('preface');
}

function openReader() {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('reader').classList.add('active');
}

function goHome() {
  document.getElementById('reader').classList.remove('active');
  document.getElementById('landing').style.display = '';
  window.location.hash = '';
}

function showTOC() {
  document.getElementById('tocOverlay').classList.add('open');
}

function hideTOC(e) {
  if (!e || e.target === document.getElementById('tocOverlay') || !e.target) {
    document.getElementById('tocOverlay').classList.remove('open');
  }
}

function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  document.getElementById('sidebar').classList.toggle('open', sidebarOpen);
}

// ── Load Chapter ──────────────────────────
function loadChapter(key) {
  currentChapter = key;
  const data = getChapterData(key);
  if (!data) return;

  // Update URL hash
  window.location.hash = `chapter-${key}`;

  // Topbar title
  document.getElementById('topbarTitle').textContent = data.title;

  // Content
  const html = `
    <div class="ch-eyebrow">${data.eyebrow}</div>
    <h1 class="ch-title">${data.title}</h1>
    ${data.content}
  `;
  document.getElementById('chapterContent').innerHTML = html;

  // Scroll to top
  document.getElementById('readerMain').scrollTo({ top: 0, behavior: 'smooth' });

  // Update sidebar active state
  document.querySelectorAll('.snav-item, .snav-chapter').forEach(el => el.classList.remove('active'));
  if (key === 'preface') {
    document.querySelector('.snav-item[onclick*="preface"]')?.classList.add('active');
  } else if (key === 'conclusion') {
    document.querySelector('.snav-item[onclick*="conclusion"]')?.classList.add('active');
  } else if (key === 'bibliography') {
    document.querySelector('.snav-item[onclick*="bibliography"]')?.classList.add('active');
  } else {
    const links = document.querySelectorAll('.snav-chapter');
    if (links[key]) links[key].classList.add('active');
  }

  // Prev / Next footer
  buildFooterNav(key);

  // Close sidebar on mobile after nav
  if (window.innerWidth < 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

function buildFooterNav(key) {
  const idx = CHAPTER_ORDER.indexOf(key);
  const prevKey = idx > 0 ? CHAPTER_ORDER[idx - 1] : null;
  const nextKey = idx < CHAPTER_ORDER.length - 1 ? CHAPTER_ORDER[idx + 1] : null;

  // Produce the correct JS literal: numbers unquoted, strings quoted
  function keyLiteral(k) {
    return typeof k === 'number' ? k : `'${k}'`;
  }

  let html = '';
  if (prevKey !== null) {
    const prev = getChapterData(prevKey);
    html += `<button class="nav-btn prev" onclick="loadChapter(${keyLiteral(prevKey)})">
      <span class="nav-btn-label">← Previous</span>
      <span class="nav-btn-title">${prev.title}</span>
    </button>`;
  } else {
    html += `<div></div>`;
  }
  if (nextKey !== null) {
    const next = getChapterData(nextKey);
    html += `<button class="nav-btn next" onclick="loadChapter(${keyLiteral(nextKey)})">
      <span class="nav-btn-label">Next →</span>
      <span class="nav-btn-title">${next.title}</span>
    </button>`;
  }

  document.getElementById('chapterFooter').innerHTML = html;
}

// ── Neural Net Canvas ─────────────────────
function drawNeuralNet() {
  const container = document.getElementById('neuralCanvas');
  const W = window.innerWidth, H = window.innerHeight;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';

  const N = Math.min(55, Math.floor(W * H / 18000));
  const nodes = Array.from({length: N}, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 2.5 + 1,
    vx: (Math.random() - .5) * .35,
    vy: (Math.random() - .5) * .35,
  }));

  function render() {
    svg.innerHTML = '';
    const DIST = 190;

    // Draw edges
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < DIST) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', nodes[i].x);
          line.setAttribute('y1', nodes[i].y);
          line.setAttribute('x2', nodes[j].x);
          line.setAttribute('y2', nodes[j].y);
          const alpha = (1 - d/DIST) * 0.35;
          line.setAttribute('stroke', `rgba(58,114,212,${alpha})`);
          line.setAttribute('stroke-width', '0.7');
          svg.appendChild(line);
        }
      }
    }

    // Draw nodes
    nodes.forEach(n => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', n.x);
      circle.setAttribute('cy', n.y);
      circle.setAttribute('r', n.r);
      circle.setAttribute('fill', 'rgba(201,168,76,0.55)');
      svg.appendChild(circle);
    });
  }

  container.appendChild(svg);

  // Animate
  function step() {
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    });
    render();
    requestAnimationFrame(step);
  }
  step();
}

// ── Keyboard shortcuts ────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { hideTOC(); }
  if (!document.getElementById('reader').classList.contains('active')) return;
  const idx = CHAPTER_ORDER.indexOf(currentChapter);
  if (e.key === 'ArrowRight' && idx < CHAPTER_ORDER.length - 1) loadChapter(CHAPTER_ORDER[idx + 1]);
  if (e.key === 'ArrowLeft' && idx > 0) loadChapter(CHAPTER_ORDER[idx - 1]);
});
