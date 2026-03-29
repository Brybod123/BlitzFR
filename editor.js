const toggleBtns = document.querySelectorAll('.main-toggles .toggle-btn');
const aiEditor = document.getElementById('ai-editor');
const previewFrame = document.getElementById('preview-frame');
const promptArea = document.getElementById('prompt-area');
const generateBtn = document.querySelector('.btn-generate');
const codeView = document.getElementById('code-view');
const codeTabs = document.getElementById('code-tabs');
const btnFileExplorer = document.getElementById('btn-file-explorer');
const fileExplorer = document.getElementById('file-explorer');
const fileList = document.getElementById('file-list');
const btnNewFile = document.getElementById('btn-new-file');
const saveBtn = document.querySelector('.save-btn');
const hostedPublishApiBase = 'https://terminal.bookitreal.workers.dev';

let chatMessages = [
    {
        role: 'system',
        content: `You are an advanced AI coding assistant in the Blitz IDE. 
You can manipulate files using special tags. Use them only when necessary.

TOOLS:
1. To read a file: <read_file path="filename"/>
2. To create/overwrite a file: <write_file path="filename">content</write_file>
3. To edit a file via search/replace: <edit_file path="filename"><search>exact_text_to_find</search><replace>new_text</replace></edit_file>
4. To delete a file: <delete_file path="filename"/>

When editing, the <search> block must exactly match the text in the file.
You can use multiple tags in one response. Always explain what you are doing.`
    }
];

function wrapTemplateHtml(title, body) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
${body}
    <script src="script.js"></script>
</body>
</html>`;
}

const starterTemplates = {
    blank: {
        html: '',
        css: '',
        js: ''
    },
    default: {
        html: wrapTemplateHtml('Blitz Default', `    <main class="default-app">
        <section class="default-hero">
            <span class="eyebrow">Editorial starter</span>
            <h1>Design a clear landing page without fighting the layout.</h1>
            <p>
                A clean, flat starting point for products, docs, or portfolios. It avoids glass and keeps the
                emphasis on typography, spacing, and structure.
            </p>
            <div class="hero-actions">
                <button id="primary-cta" class="primary-btn">Ship the concept</button>
                <span class="status-pill">Plain, fast, readable</span>
            </div>
        </section>

        <aside class="default-panel">
            <div class="metric">
                <span>Files</span>
                <strong>3</strong>
            </div>
            <div class="metric">
                <span>Theme</span>
                <strong>Flat</strong>
            </div>
            <div class="metric">
                <span>State</span>
                <strong id="default-state">Ready</strong>
            </div>
        </aside>
    </main>`),
        css: `:root {
    color-scheme: dark;
    --bg: #0b0f16;
    --bg-alt: #111827;
    --panel: #0f172a;
    --panel-border: rgba(148, 163, 184, 0.16);
    --text: #f8fafc;
    --muted: #94a3b8;
    --accent: #22d3ee;
    --accent-2: #f97316;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    min-height: 100vh;
    font-family: Inter, system-ui, sans-serif;
    color: var(--text);
    background:
        linear-gradient(160deg, var(--bg), var(--bg-alt) 52%, #09090b),
        radial-gradient(circle at top left, rgba(34, 211, 238, 0.08), transparent 28%);
}

.default-app {
    min-height: 100vh;
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(240px, 0.7fr);
    gap: 22px;
    padding: 32px;
    align-items: center;
}

.default-hero,
.default-panel {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    box-shadow: 0 26px 72px rgba(0, 0, 0, 0.34);
}

.default-hero {
    padding: 42px;
    border-radius: 28px;
    position: relative;
    overflow: hidden;
}

.default-hero::after {
    content: "";
    position: absolute;
    inset: auto -8% -18% auto;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(34, 211, 238, 0.12), transparent 70%);
    pointer-events: none;
}

.eyebrow {
    display: inline-flex;
    padding: 8px 12px;
    border-radius: 999px;
    font-size: 0.78rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #0f172a;
    background: linear-gradient(135deg, #67e8f9, #fbbf24);
}

.default-hero h1 {
    margin: 18px 0 14px;
    font-size: clamp(2.7rem, 5.2vw, 5.2rem);
    line-height: 0.95;
    letter-spacing: -0.055em;
    max-width: 12ch;
}

.default-hero p {
    margin: 0;
    max-width: 58ch;
    color: var(--muted);
    font-size: 1.08rem;
    line-height: 1.7;
}

.hero-actions {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 30px;
    flex-wrap: wrap;
}

.primary-btn {
    border: 0;
    border-radius: 12px;
    padding: 14px 18px;
    background: linear-gradient(135deg, #22d3ee, #0ea5e9);
    color: #04111d;
    font: 800 0.98rem/1 Inter, system-ui, sans-serif;
    cursor: pointer;
    box-shadow: 0 16px 34px rgba(14, 165, 233, 0.22);
}

.status-pill {
    padding: 10px 14px;
    border-radius: 999px;
    color: #cbd5e1;
    background: rgba(148, 163, 184, 0.08);
    border: 1px solid rgba(148, 163, 184, 0.14);
}

.default-panel {
    border-radius: 24px;
    padding: 18px;
    display: grid;
    gap: 12px;
}

.metric {
    border-radius: 18px;
    padding: 18px;
    background: #111827;
    border: 1px solid rgba(148, 163, 184, 0.12);
}

.metric span {
    display: block;
    color: var(--muted);
    font-size: 0.88rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 8px;
}

.metric strong {
    display: block;
    font-size: 2rem;
    line-height: 1;
}`,
        js: `const cta = document.getElementById('primary-cta');
const state = document.getElementById('default-state');
let clicks = 0;

cta.addEventListener('click', () => {
    clicks += 1;
    state.textContent = clicks === 1 ? 'Opened' : 'Opened ' + clicks + ' times';
    cta.textContent = clicks === 1 ? 'Keep going' : 'Ship the concept';
});
`
    },
    'liquid-glass': {
        html: wrapTemplateHtml('Liquid Glass', `    <main class="glass-dashboard">
        <section class="glass-hero">
            <div class="glass-copy">
                <span class="glass-badge">Liquid Glass</span>
                <h1>Soft panels, bright gradients, and a very modern first impression.</h1>
                <p>
                    A polished starting point for portfolio pages, dashboards, or any interface that wants depth
                    without feeling heavy.
                </p>
            </div>

            <div class="glass-orb"></div>
        </section>

        <section class="glass-grid">
            <article class="glass-card">
                <span>Focus</span>
                <strong>86%</strong>
            </article>
            <article class="glass-card">
                <span>Clarity</span>
                <strong>High</strong>
            </article>
            <article class="glass-card glass-card-wide">
                <span>Status</span>
                <strong id="glass-status">Calm and responsive</strong>
                <button id="glass-toggle" class="glass-btn">Shift Accent</button>
            </article>
        </section>
    </main>`),
        css: `:root {
    color-scheme: dark;
    --bg-a: #07111f;
    --bg-b: #111827;
    --glass: rgba(255, 255, 255, 0.1);
    --glass-border: rgba(255, 255, 255, 0.18);
    --accent: #67e8f9;
    --accent-2: #c084fc;
    --text: #f8fafc;
    --muted: #cbd5e1;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    min-height: 100vh;
    font-family: Inter, system-ui, sans-serif;
    color: var(--text);
    background:
        radial-gradient(circle at 15% 15%, rgba(103, 232, 249, 0.22), transparent 26%),
        radial-gradient(circle at 85% 12%, rgba(192, 132, 252, 0.22), transparent 24%),
        linear-gradient(160deg, var(--bg-a), var(--bg-b));
}

.glass-dashboard {
    min-height: 100vh;
    padding: 32px;
    display: grid;
    gap: 20px;
    align-content: center;
}

.glass-hero,
.glass-card {
    background: var(--glass);
    border: 1px solid var(--glass-border);
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34);
    backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);
}

.glass-hero {
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) 240px;
    gap: 24px;
    align-items: center;
    padding: 34px;
    border-radius: 32px;
}

.glass-hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(103, 232, 249, 0.12), transparent 45%, rgba(192, 132, 252, 0.12));
    pointer-events: none;
}

.glass-copy {
    position: relative;
    z-index: 1;
}

.glass-badge {
    display: inline-flex;
    padding: 8px 12px;
    border-radius: 999px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-size: 0.78rem;
    color: #0f172a;
    background: linear-gradient(135deg, #67e8f9, #c084fc);
}

.glass-copy h1 {
    margin: 18px 0 14px;
    font-size: clamp(2.2rem, 4vw, 4.6rem);
    line-height: 0.98;
    max-width: 12ch;
}

.glass-copy p {
    margin: 0;
    max-width: 52ch;
    color: var(--muted);
    line-height: 1.6;
}

.glass-orb {
    width: 220px;
    height: 220px;
    border-radius: 50%;
    justify-self: end;
    background: radial-gradient(circle at 30% 30%, #ffffff, #67e8f9 34%, #8b5cf6 72%, rgba(139, 92, 246, 0.2) 100%);
    filter: blur(0.2px);
    box-shadow: 0 24px 60px rgba(103, 232, 249, 0.2);
    animation: floatOrb 6s ease-in-out infinite;
}

.glass-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
}

.glass-card {
    border-radius: 24px;
    padding: 22px;
}

.glass-card span {
    display: block;
    color: #e2e8f0;
    font-size: 0.9rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 12px;
}

.glass-card strong {
    font-size: 2rem;
}

.glass-card-wide {
    grid-column: span 1;
}

.glass-btn {
    margin-top: 16px;
    border: 0;
    border-radius: 999px;
    padding: 12px 16px;
    color: #0f172a;
    background: linear-gradient(135deg, #67e8f9, #c084fc);
    font-weight: 700;
    cursor: pointer;
}

@keyframes floatOrb {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-12px) scale(1.02); }
}`,
        js: `const toggle = document.getElementById('glass-toggle');
const status = document.getElementById('glass-status');
const accents = [
    ['#67e8f9', '#c084fc'],
    ['#fda4af', '#fb7185'],
    ['#86efac', '#22c55e']
];
let accentIndex = 0;

toggle.addEventListener('click', () => {
    accentIndex = (accentIndex + 1) % accents.length;
    const [a, b] = accents[accentIndex];
    document.documentElement.style.setProperty('--accent', a);
    document.documentElement.style.setProperty('--accent-2', b);
    status.textContent = ['Calm and responsive', 'Softly glowing', 'Freshly tuned'][accentIndex];
});`
    },
    platformer: {
        html: wrapTemplateHtml('Platformer', `    <main class="platformer-shell">
        <header class="platformer-hud">
            <div>
                <span class="hud-label">Platformer</span>
                <h1>Collect the stars and reach the flag.</h1>
            </div>
            <div class="hud-stats">
                <span>Coins: <strong id="coin-count">0</strong></span>
                <span>Lives: <strong id="life-count">3</strong></span>
                <span>Status: <strong id="status-text">Run</strong></span>
            </div>
        </header>

        <section class="platformer-stage" id="stage">
            <div class="platformer-flag"></div>
            <div class="platformer-player" id="player"></div>
            <div class="platform platform-1"></div>
            <div class="platform platform-2"></div>
            <div class="platform platform-3"></div>
            <div class="coin coin-1"></div>
            <div class="coin coin-2"></div>
            <div class="coin coin-3"></div>
        </section>
    </main>`),
        css: `:root {
    color-scheme: dark;
    --sky: #0f172a;
    --sky-2: #1d4ed8;
    --ground: #14532d;
    --platform: #38bdf8;
    --text: #f8fafc;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    min-height: 100vh;
    font-family: Inter, system-ui, sans-serif;
    color: var(--text);
    background:
        radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.16), transparent 34%),
        linear-gradient(180deg, var(--sky), #020617 72%);
    overflow: hidden;
}

.platformer-shell {
    min-height: 100vh;
    padding: 24px;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 18px;
}

.platformer-hud {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: end;
    padding: 18px 22px;
    border-radius: 22px;
    background: rgba(15, 23, 42, 0.74);
    border: 1px solid rgba(148, 163, 184, 0.18);
}

.hud-label {
    display: inline-flex;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.78rem;
    color: #93c5fd;
}

.platformer-hud h1 {
    margin: 0;
    font-size: clamp(1.8rem, 3vw, 3rem);
}

.hud-stats {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    color: #cbd5e1;
}

.hud-stats strong {
    color: #fff;
}

.platformer-stage {
    position: relative;
    min-height: 520px;
    border-radius: 30px;
    overflow: hidden;
    background:
        linear-gradient(180deg, rgba(56, 189, 248, 0.1), rgba(15, 23, 42, 0.12)),
        linear-gradient(180deg, transparent 72%, rgba(20, 83, 45, 0.95) 72%);
    border: 1px solid rgba(148, 163, 184, 0.16);
    box-shadow: 0 28px 70px rgba(0, 0, 0, 0.35);
}

.platformer-stage::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
        radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.18), transparent 10%),
        radial-gradient(circle at 82% 24%, rgba(255, 255, 255, 0.12), transparent 12%),
        linear-gradient(180deg, transparent 70%, rgba(20, 83, 45, 0.9) 70%);
    pointer-events: none;
}

.platformer-player,
.platform,
.coin,
.platformer-flag {
    position: absolute;
}

.platformer-player {
    left: 0;
    bottom: 0;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: linear-gradient(135deg, #fb7185, #ef4444);
    box-shadow: 0 12px 24px rgba(239, 68, 68, 0.35);
}

.platform {
    height: 16px;
    border-radius: 999px;
    background: linear-gradient(135deg, #38bdf8, #0ea5e9);
    box-shadow: 0 12px 30px rgba(14, 165, 233, 0.22);
}

.platform-1 { left: 56px; bottom: 96px; width: 160px; }
.platform-2 { left: 280px; bottom: 180px; width: 180px; }
.platform-3 { right: 88px; bottom: 250px; width: 200px; }

.coin {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #fff7b0, #f59e0b);
    box-shadow: 0 0 18px rgba(245, 158, 11, 0.35);
    animation: coinPulse 1.6s ease-in-out infinite;
}

.coin-1 { left: 110px; bottom: 136px; }
.coin-2 { left: 360px; bottom: 220px; animation-delay: 0.4s; }
.coin-3 { right: 140px; bottom: 290px; animation-delay: 0.8s; }

.platformer-flag {
    right: 48px;
    bottom: 250px;
    width: 12px;
    height: 120px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.65);
}

.platformer-flag::after {
    content: "";
    position: absolute;
    top: 8px;
    left: 12px;
    width: 66px;
    height: 34px;
    border-radius: 0 18px 18px 0;
    background: linear-gradient(135deg, #f8fafc, #22d3ee);
    clip-path: polygon(0 0, 100% 18%, 72% 100%, 0 84%);
}

@keyframes coinPulse {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}`,
        js: `const player = document.getElementById('player');
const stage = document.getElementById('stage');
const coinCountEl = document.getElementById('coin-count');
const lifeCountEl = document.getElementById('life-count');
const statusText = document.getElementById('status-text');
const coins = Array.from(document.querySelectorAll('.coin'));

const keys = new Set();
const world = {
    x: 72,
    y: 118,
    vx: 0,
    vy: 0,
    width: 34,
    height: 34,
    onGround: false,
    coins: 0,
    lives: 3
};

const platforms = [
    { x: 56, y: 96, w: 160, h: 16 },
    { x: 280, y: 180, w: 180, h: 16 },
    { x: 608, y: 250, w: 200, h: 16 }
];

const goal = { x: 836, y: 250, w: 66, h: 120 };
const gravity = 0.9;
const moveSpeed = 0.7;
const jumpStrength = 14;

document.addEventListener('keydown', (event) => {
    keys.add(event.key.toLowerCase());
    if ((event.key === ' ' || event.key === 'ArrowUp') && world.onGround) {
        world.vy = -jumpStrength;
        world.onGround = false;
        statusText.textContent = 'Jump';
    }
});

document.addEventListener('keyup', (event) => {
    keys.delete(event.key.toLowerCase());
});

function intersects(a, b) {
    return a.x < b.x + b.w && a.x + a.width > b.x && a.y < b.y + b.h && a.y + a.height > b.y;
}

function updatePlayerPosition() {
    if (keys.has('arrowleft') || keys.has('a')) world.vx = Math.max(world.vx - moveSpeed, -5);
    if (keys.has('arrowright') || keys.has('d')) world.vx = Math.min(world.vx + moveSpeed, 5);
    if (!(keys.has('arrowleft') || keys.has('a') || keys.has('arrowright') || keys.has('d'))) {
        world.vx *= 0.84;
    }

    world.vy += gravity;
    world.x += world.vx;
    world.y += world.vy;
    world.onGround = false;

    const floorY = stage.clientHeight - 72 - world.height;
    if (world.y >= floorY) {
        world.y = floorY;
        world.vy = 0;
        world.onGround = true;
    }

    for (const platform of platforms) {
        const playerBox = { x: world.x, y: world.y, width: world.width, height: world.height };
        if (!intersects(playerBox, platform)) continue;
        const playerBottom = world.y + world.height;
        const playerTop = world.y;
        const platformTop = platform.y;
        const platformBottom = platform.y + platform.h;
        if (playerBottom - world.vy <= platformTop + 10 && world.vy >= 0) {
            world.y = platformTop - world.height;
            world.vy = 0;
            world.onGround = true;
        } else if (playerTop - world.vy >= platformBottom - 10 && world.vy < 0) {
            world.y = platformBottom;
            world.vy = 0;
        }
    }

    if (world.x < 0) {
        world.x = 0;
        world.vx = 0;
    }
    const maxX = stage.clientWidth - world.width;
    if (world.x > maxX) {
        world.x = maxX;
        world.vx = 0;
    }
    if (world.y > stage.clientHeight - world.height) {
        world.y = stage.clientHeight - world.height;
        world.vy = 0;
    }
}

function updateCoins() {
    coins.forEach((coin, index) => {
        const rect = coin.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();
        const coinBox = {
            x: rect.left - stageRect.left,
            y: rect.top - stageRect.top,
            width: rect.width,
            height: rect.height
        };
        const playerBox = { x: world.x, y: world.y, width: world.width, height: world.height };
        if (coin.dataset.collected === 'true') return;
        if (intersects(playerBox, coinBox)) {
            coin.dataset.collected = 'true';
            coin.style.opacity = '0';
            world.coins += 1;
            coinCountEl.textContent = String(world.coins);
        }
    });
}

function checkWin() {
    const playerBox = { x: world.x, y: world.y, width: world.width, height: world.height };
    if (intersects(playerBox, goal)) {
        statusText.textContent = 'Goal reached';
        world.vx *= 0.2;
    }
}

function render() {
    player.style.transform = 'translate(' + world.x + 'px, ' + world.y + 'px)';
    lifeCountEl.textContent = String(world.lives);
}

function loop() {
    updatePlayerPosition();
    updateCoins();
    checkWin();
    render();
    requestAnimationFrame(loop);
}

render();
loop();`
    },
    clicker: {
        html: wrapTemplateHtml('Clicker Game', `    <main class="clicker-app">
        <section class="clicker-hero">
            <span class="eyebrow">Arcade starter</span>
            <h1>Tap to build a tiny economy.</h1>
            <p>
                A more thoughtful clicker foundation with upgrades, an auto-income loop, and enough UI to extend
                into a real game.
            </p>
            <button id="click-btn" class="clicker-btn">Tap the Core</button>
        </section>

        <aside class="clicker-panel">
            <div class="score-card">
                <span>Score</span>
                <strong id="score">0</strong>
            </div>
            <div class="score-card">
                <span>Per click</span>
                <strong id="power">1</strong>
            </div>
            <div class="score-card">
                <span>Auto / sec</span>
                <strong id="auto">0</strong>
            </div>
            <div class="upgrade-list">
                <button class="upgrade-btn" id="upgrade-power">Upgrade click (+1) - 10</button>
                <button class="upgrade-btn" id="upgrade-auto">Hire auto-clicker (+1/s) - 25</button>
            </div>
        </aside>
    </main>`),
        css: `:root {
    color-scheme: dark;
    --bg: #09090f;
    --panel: rgba(17, 24, 39, 0.86);
    --border: rgba(168, 85, 247, 0.22);
    --text: #f8fafc;
    --muted: #94a3b8;
    --accent: #a855f7;
    --accent-2: #22d3ee;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    min-height: 100vh;
    font-family: Inter, system-ui, sans-serif;
    color: var(--text);
    background:
        radial-gradient(circle at 20% 20%, rgba(168, 85, 247, 0.18), transparent 28%),
        radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.14), transparent 24%),
        linear-gradient(160deg, var(--bg), #111827 78%);
}

.clicker-app {
    min-height: 100vh;
    padding: 32px;
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(290px, 0.8fr);
    gap: 20px;
    align-items: center;
}

.clicker-hero,
.clicker-panel {
    border: 1px solid var(--border);
    background: var(--panel);
    box-shadow: 0 26px 70px rgba(0, 0, 0, 0.34);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
}

.clicker-hero {
    border-radius: 32px;
    padding: 40px;
    position: relative;
    overflow: hidden;
}

.clicker-hero::after {
    content: "";
    position: absolute;
    inset: auto -15% -20% auto;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(168, 85, 247, 0.18), transparent 65%);
    pointer-events: none;
}

.clicker-hero h1 {
    margin: 18px 0 14px;
    font-size: clamp(2.4rem, 4.4vw, 4.8rem);
    line-height: 0.96;
    max-width: 12ch;
}

.clicker-hero p {
    margin: 0 0 28px;
    max-width: 54ch;
    color: var(--muted);
    line-height: 1.6;
}

.clicker-btn {
    border: 0;
    border-radius: 24px;
    padding: 18px 26px;
    color: #fff;
    font: 800 1.05rem/1 Inter, system-ui, sans-serif;
    cursor: pointer;
    background: linear-gradient(135deg, #a855f7, #22d3ee);
    box-shadow: 0 18px 40px rgba(168, 85, 247, 0.28);
}

.clicker-panel {
    border-radius: 28px;
    padding: 20px;
    display: grid;
    gap: 12px;
}

.score-card {
    border-radius: 22px;
    padding: 18px;
    background: rgba(15, 23, 42, 0.62);
    border: 1px solid rgba(148, 163, 184, 0.14);
}

.score-card span {
    display: block;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.78rem;
    margin-bottom: 8px;
}

.score-card strong {
    font-size: 2rem;
}

.upgrade-list {
    display: grid;
    gap: 10px;
    margin-top: 6px;
}

.upgrade-btn {
    border-radius: 18px;
    border: 1px solid rgba(168, 85, 247, 0.22);
    background: rgba(168, 85, 247, 0.12);
    color: #f5d0fe;
    padding: 14px 16px;
    font: 700 0.95rem/1.2 Inter, system-ui, sans-serif;
    text-align: left;
    cursor: pointer;
}`,
        js: `let score = 0;
let clickPower = 1;
let autoPower = 0;

const scoreEl = document.getElementById('score');
const powerEl = document.getElementById('power');
const autoEl = document.getElementById('auto');
const clickBtn = document.getElementById('click-btn');
const upgradePowerBtn = document.getElementById('upgrade-power');
const upgradeAutoBtn = document.getElementById('upgrade-auto');

function render() {
    scoreEl.textContent = String(score);
    powerEl.textContent = String(clickPower);
    autoEl.textContent = String(autoPower);
    upgradePowerBtn.textContent = 'Upgrade click (+1) - ' + (10 + (clickPower - 1) * 8);
    upgradeAutoBtn.textContent = 'Hire auto-clicker (+1/s) - ' + (25 + autoPower * 18);
}

clickBtn.addEventListener('click', () => {
    score += clickPower;
    clickBtn.style.transform = 'scale(0.98)';
    requestAnimationFrame(() => (clickBtn.style.transform = 'scale(1)'));
    render();
});

upgradePowerBtn.addEventListener('click', () => {
    const cost = 10 + (clickPower - 1) * 8;
    if (score < cost) return;
    score -= cost;
    clickPower += 1;
    render();
});

upgradeAutoBtn.addEventListener('click', () => {
    const cost = 25 + autoPower * 18;
    if (score < cost) return;
    score -= cost;
    autoPower += 1;
    render();
});

setInterval(() => {
    if (!autoPower) return;
    score += autoPower;
    render();
}, 1000);

render();`
    }
};

function createInitialFiles(templateKey = 'default') {
    const template = starterTemplates[templateKey] || starterTemplates.default;
    return {
        'index.html': { model: monaco.editor.createModel(template.html, "html", monaco.Uri.file("index.html")), lang: 'html' },
        'styles.css': { model: monaco.editor.createModel(template.css, "css", monaco.Uri.file("styles.css")), lang: 'css' },
        'script.js': { model: monaco.editor.createModel(template.js, "javascript", monaco.Uri.file("script.js")), lang: 'javascript' }
    };
}

// Intercept window.open explicitly for Monaco's link clicker
const originalWindowOpen = window.open;
window.open = function(url, ...args) {
    if (typeof url === 'string') {
        const cleanUrl = url.replace(/^[a-zA-Z]+:\/\//, '').replace(/^\.\//, '').replace(/^\//, '');
        const possibleFileName = cleanUrl.split('/').pop();
        if (files[possibleFileName]) {
            console.log("VFS Navigate via Editor Link:", possibleFileName);
            openFile(possibleFileName);
            return { focus: () => {} }; // Mock window object to avoid errors
        }
    }
    return originalWindowOpen.call(window, url, ...args);
};

const urlParams = new URLSearchParams(window.location.search);
const templateId = urlParams.get('template') || 'default';

// Setup Monaco Models (Virtual File System)
let files = createInitialFiles(templateId);

let activeFile = 'index.html';
let currentUser = window.firebaseUser || null;
let currentProjectOwnerUid = null;
let currentProjectId = null;
let forkSourceProject = null;
let currentHostedWebsite = null;
let currentHostedSlug = null;

// Create editor
const editor = monaco.editor.create(document.getElementById('monaco-container'), {
    model: files[activeFile].model,
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace'
});

// Setup Diff Editor
const diffEditor = monaco.editor.createDiffEditor(document.getElementById('diff-editor-inner'), {
    theme: 'vs-dark',
    automaticLayout: true,
    fontSize: 14,
    fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    readOnly: true
});

const diffContainer = document.getElementById('monaco-diff-container');
document.getElementById('btn-close-diff').addEventListener('click', () => {
    diffContainer.classList.add('hidden');
});

function applyEditorTheme(theme) {
    const monacoTheme = theme === 'light' ? 'vs' : 'vs-dark';
    monaco.editor.setTheme(monacoTheme);
}

window.blitzApplyTheme = (theme) => {
    document.body.dataset.theme = theme === 'light' ? 'light' : 'dark';
    applyEditorTheme(document.body.dataset.theme);
};

window.blitzApplyTheme(localStorage.getItem('blitz_theme') || 'dark');

function renderMarkdownSafe(text) {
    const rawHtml = marked.parse(text || "");
    if (window.DOMPurify) {
        return window.DOMPurify.sanitize(rawHtml);
    }
    const fallback = document.createElement('div');
    fallback.textContent = text || "";
    return fallback.innerHTML;
}

function waitForAuth() {
    if (window.firebaseAuthReady && window.firebaseUser) {
        currentUser = window.firebaseUser;
        return Promise.resolve(currentUser);
    }

    if (!window.firebaseUser && typeof window.firebaseSignIn === 'function') {
        return window.firebaseSignIn().then(() => waitForAuth());
    }

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error("Authentication timed out."));
        }, 8000);

        function handleReady() {
            currentUser = window.firebaseUser || null;
            if (!currentUser) return;
            cleanup();
            resolve(currentUser);
        }

        function cleanup() {
            clearTimeout(timer);
            window.removeEventListener('firebase-auth-ready', handleReady);
        }

        window.addEventListener('firebase-auth-ready', handleReady);
    });
}

function updateSaveButtonState() {
    if (!saveBtn) return;

    if (!currentUser) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'SIGN IN';
        saveBtn.style.opacity = '1';
        saveBtn.style.cursor = 'pointer';
        return;
    }

    if (currentProjectId && currentProjectOwnerUid && currentProjectOwnerUid !== currentUser.uid) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'READ ONLY';
        saveBtn.style.opacity = '0.45';
        saveBtn.style.cursor = 'not-allowed';
        return;
    }

    saveBtn.disabled = false;
    saveBtn.textContent = 'PUBLISH';
    saveBtn.style.opacity = '1';
    saveBtn.style.cursor = 'pointer';
}

window.addEventListener('firebase-auth-ready', () => {
    currentUser = window.firebaseUser || null;
    updateSaveButtonState();
});

updateSaveButtonState();

function showDiff(filename, oldContent, newContent) {
    const originalModel = monaco.editor.createModel(oldContent, files[filename].lang);
    const modifiedModel = monaco.editor.createModel(newContent, files[filename].lang);
    diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel
    });
    diffContainer.classList.remove('hidden');
    // Switch to file first
    openFile(filename);
}

let currentPreviewPage = 'index.html';
let activeBlobUrls = {}; // Track blob URLs to prevent memory leaks

function buildRenderableHtml(pageToLoad = currentPreviewPage) {
    if (!files[pageToLoad]) pageToLoad = Object.keys(files).find(f => f.endsWith('.html')) || 'index.html';

    const assetUrls = {};
    for (const [filename, fileObj] of Object.entries(files)) {
        if (filename.endsWith('.html')) continue;
        let type = 'text/plain';
        if (filename.endsWith('.css')) type = 'text/css';
        else if (filename.endsWith('.js')) type = 'application/javascript';
        const blob = new Blob([fileObj.model.getValue()], { type });
        assetUrls[filename] = URL.createObjectURL(blob);
    }

    let htmlContent = files[pageToLoad] ? files[pageToLoad].model.getValue() : "<h1>No valid HTML page found</h1>";

    for (const [filename, url] of Object.entries(assetUrls)) {
        const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regexHref = new RegExp(`href=["']\\.?/?${escapedFilename}["']`, 'g');
        const regexSrc = new RegExp(`src=["']\\.?/?${escapedFilename}["']`, 'g');
        htmlContent = htmlContent.replace(regexHref, `href="${url}"`);
        htmlContent = htmlContent.replace(regexSrc, `src="${url}"`);
    }

    return { pageToLoad, htmlContent, assetUrls };
}

function buildPublishFilesPayload() {
    const payload = {};
    for (const [filename, fileObj] of Object.entries(files)) {
        payload[filename] = fileObj.model.getValue();
    }
    return payload;
}

function slugifyProjectName(projectName) {
    const base = String(projectName || 'blitz-project')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'blitz-project';
    const suffix = Math.random().toString(36).slice(2, 8);
    return `${base}-${suffix}`;
}

function getHostedProjectUrl(slug) {
    return `${hostedPublishApiBase.replace(/\/$/, '')}/site/${slug}`;
}

window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'navigate') {
        let target = e.data.url;
        target = target.replace(/^\.\//, '').replace(/^\//, ''); // Clean leading slashes
        if (files[target]) {
            console.log(`VFS Navigation: Route to ${target}`);
            updatePreview(target);
        } else {
            console.warn(`VFS Navigation: Route ${target} not found in virtual system.`);
        }
    }
});

// Build Live Preview with multi-page and asset support
function updatePreview(pageToLoad = currentPreviewPage) {
    try {
        const rendered = buildRenderableHtml(pageToLoad);
        currentPreviewPage = rendered.pageToLoad;

        // Clean up old object URLs
        Object.values(activeBlobUrls).forEach(URL.revokeObjectURL);
        activeBlobUrls = rendered.assetUrls;

        let htmlContent = rendered.htmlContent;

        // Inject navigation interceptor script
        const interceptScript = `
<script>
    document.addEventListener('click', function(e) {
        const a = e.target.closest('a');
        if (a && a.getAttribute('href')) {
            const href = a.getAttribute('href');
            // Allow external links or anchors
            if (!href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
                e.preventDefault();
                window.parent.postMessage({ type: 'navigate', url: href }, '*');
            }
        }
    });
<\/script>`;

        if (htmlContent.includes('</body>')) {
            htmlContent = htmlContent.replace('</body>', interceptScript + '\n</body>');
        } else {
            htmlContent += interceptScript;
        }

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        previewFrame.src = url;

        if (previewFrame.dataset.lastUrl) URL.revokeObjectURL(previewFrame.dataset.lastUrl);
        previewFrame.dataset.lastUrl = url;
    } catch (e) {
        console.error("Preview Update Error:", e);
    }
}


// Bind active listeners
function bindContentChange(model) {
    model.onDidChangeContent(() => {
        updatePreview();
    });
}

Object.values(files).forEach(f => bindContentChange(f.model));
updatePreview();

// UI Render Logic
function renderFiles() {
    fileList.innerHTML = '';
    codeTabs.innerHTML = '';

    Object.keys(files).forEach(filename => {
        // File Tree Item
        const li = document.createElement('li');
        li.className = `file-item ${filename === activeFile ? 'active' : ''}`;

        let icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
        if (filename.endsWith('.html')) {
            icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e34f26" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;
        } else if (filename.endsWith('.css')) {
            icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a90e2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`;
        } else if (filename.endsWith('.js')) {
            icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f7df1e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2"></path><path d="M15 3h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2"></path></svg>`;
        } else if (filename.endsWith('.py')) {
            icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#357abd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`;
        }

        const iconWrap = document.createElement('span');
        iconWrap.innerHTML = icon;
        const nameWrap = document.createElement('span');
        nameWrap.textContent = filename;
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'file-item-delete';
        deleteBtn.title = 'Delete';
        deleteBtn.textContent = '✕';
        li.append(iconWrap, nameWrap, deleteBtn);

        li.addEventListener('click', (e) => {
            if (e.target.classList.contains('file-item-delete')) return;
            openFile(filename);
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteFile(filename);
        });

        fileList.appendChild(li);

        // Code Tab Item
        const tab = document.createElement('button');
        tab.className = `code-tab ${filename === activeFile ? 'active' : ''}`;
        tab.textContent = filename;
        tab.addEventListener('click', () => openFile(filename));
        codeTabs.appendChild(tab);
    });
}

function openFile(filename) {
    if (!files[filename]) return;
    activeFile = filename;
    editor.setModel(files[filename].model);
    renderFiles();
}

function deleteFile(filename) {
    if (Object.keys(files).length <= 1) {
        alert("You must leave at least one file open.");
        return;
    }

    files[filename].model.dispose();
    delete files[filename];

    if (activeFile === filename) {
        activeFile = Object.keys(files)[0];
        editor.setModel(files[activeFile].model);
    }

    renderFiles();
    updatePreview();
}

btnNewFile.addEventListener('click', () => {
    let filename = prompt("Enter a file name (e.g., main.py, index.html):", "newfile.py");
    if (!filename) return;

    filename = filename.trim();
    if (files[filename]) {
        alert("File already exists!");
        return;
    }

    let ext = filename.split('.').pop().toLowerCase();
    let lang = 'plaintext';
    if (ext === 'html') lang = 'html';
    else if (ext === 'css') lang = 'css';
    else if (ext === 'js') lang = 'javascript';
    else if (ext === 'py') lang = 'python';

    files[filename] = {
        model: monaco.editor.createModel("", lang, monaco.Uri.file(filename)),
        lang: lang
    };

    bindContentChange(files[filename].model);
    openFile(filename);
    updatePreview();
});

renderFiles();

// File Explorer Toggle
btnFileExplorer.addEventListener('click', () => {
    fileExplorer.classList.toggle('hidden');
    btnFileExplorer.classList.toggle('active');
    setTimeout(() => editor.layout(), 0);
});

// Helper for AI File Editing
function applyFileEdit(filename, search, replace) {
    if (!files[filename]) return `Error: File ${filename} not found.`;
    const model = files[filename].model;
    const content = model.getValue();

    if (!content.includes(search)) {
        return `Error: Search string not found in ${filename}.`;
    }

    const newContent = content.replace(search, replace);

    // Capture for diff
    showDiff(filename, content, newContent);

    model.setValue(newContent);
    updatePreview();
    return `Successfully updated ${filename}.`;
}

function aiCreateFile(filename, content) {
    let ext = filename.split('.').pop().toLowerCase();
    let lang = 'plaintext';
    if (ext === 'html') lang = 'html';
    else if (ext === 'css') lang = 'css';
    else if (ext === 'js') lang = 'javascript';
    else if (ext === 'py') lang = 'python';

    if (files[filename]) {
        files[filename].model.setValue(content);
    } else {
        files[filename] = {
            model: monaco.editor.createModel(content, lang, monaco.Uri.file(filename)),
            lang: lang
        };
        bindContentChange(files[filename].model);
    }
    openFile(filename);
    updatePreview();
    return `File ${filename} created/updated.`;
}

// Main UI Toggles (Code vs AI)
toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const mode = btn.dataset.mode;

        if (mode === 'ai') {
            codeView.classList.add('hidden');
            aiEditor.classList.remove('hidden');
            aiEditor.classList.add('active');
        } else {
            aiEditor.classList.remove('active');
            aiEditor.classList.add('hidden');
            codeView.classList.remove('hidden');
            setTimeout(() => editor.layout(), 0);
        }
    });
});

// Handle Enter to send, Shift+Enter for newline
const chatHistory = document.getElementById('chat-history');
promptArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        generateBtn.click();
    }
});

// AI Generation Logic
generateBtn.addEventListener('click', async () => {
    if (generateBtn.disabled) return;
    
    const promptText = promptArea.value.trim();
    if (!promptText) return;

    if (globalCredits <= 50) {
        alert("Global credits depleted. Messages are disabled until the balance is restored.");
        return;
    }

    const remaining = getRemainingHourlyRequests(dropdownTrigger.dataset.value || "qwen/qwen3.5-flash-02-23");
    if (remaining <= 0) {
        alert("Hourly message limit reached for this specific model. Switch to a cheaper model or wait until the next hour.");
        return;
    }

    chatMessages.push({ role: 'user', content: promptText });
    await incrementHourlyRequests();

    // Append user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user-message';
    const userAvatar = document.createElement('span');
    userAvatar.className = 'chat-avatar';
    userAvatar.textContent = 'U';
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble';
    userBubble.innerHTML = renderMarkdownSafe(promptText);
    userMsg.append(userAvatar, userBubble);
    chatHistory.appendChild(userMsg);
    promptArea.value = '';

    // Add AI loading message
    const aiMsg = document.createElement('div');
    aiMsg.className = 'chat-message ai-message';
    const aiAvatar = document.createElement('span');
    aiAvatar.className = 'chat-avatar';
    aiAvatar.textContent = 'AI';
    const aiBubble = document.createElement('div');
    aiBubble.className = 'chat-bubble';
    aiBubble.textContent = 'Generating your request...';
    aiMsg.append(aiAvatar, aiBubble);
    chatHistory.appendChild(aiMsg);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    generateBtn.disabled = true;
    const bubble = aiBubble;

    await runChatLoop(bubble);
    generateBtn.disabled = false;
});

async function runChatLoop(bubble, turn = 1) {
    if (turn > 3) return;

    const fileContext = Object.keys(files).map(f => `- ${f}`).join('\n');
    const tempMessages = [
        ...chatMessages.slice(0, 1),
        { role: 'system', content: `Current files in project:\n${fileContext}\nProject context: This is a web project. index.html is the entry point.` },
        ...chatMessages.slice(1)
    ];

    const currentModelId = document.getElementById('model-dropdown-trigger').dataset.value || "qwen/qwen3.5-flash-02-23";

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                messages: tempMessages,
                model: currentModelId
            })
        });

        if (!response.ok) {
            bubble.textContent = "Error communicating with AI.";
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let aiContent = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === '[DONE]') break;
                    try {
                        const json = JSON.parse(dataStr);
                        if (json.choices && json.choices[0].delta && json.choices[0].delta.content) {
                            aiContent += json.choices[0].delta.content;
                            updateAiMessageUI(bubble, aiContent);
                            chatHistory.scrollTop = chatHistory.scrollHeight;
                        }
                    } catch (e) { }
                }
            }
        }

        chatMessages.push({ role: 'assistant', content: aiContent });
        updateCredits();
        updateModelStats(); // Market refresh
        await recordUsageEvent(currentModelId);

        // Parse and Execute Tools
        const needsReply = executeAiTools(aiContent);

        if (needsReply) {
            await new Promise(r => setTimeout(r, 300));
            // Add a separator for the next turn
            const sep = document.createElement('div');
            sep.style.height = "1px";
            sep.style.background = "#2d3748";
            sep.style.margin = "10px 0";
            bubble.appendChild(sep);
            await runChatLoop(bubble, turn + 1);
        }
    } catch (err) {
        console.error(err);
        bubble.textContent = "Connection error.";
    }
}

async function recordUsageEvent(modelId) {
    if (!currentUser || !window.firebaseReady || !window.firebasePush || !window.firebaseSet || !window.firebaseRef || !window.firebaseDB) {
        return;
    }

    try {
        const pricePerToken = parseFloat(modelPrices[modelId]) || 0.000005;
        const cost = avgTokens * pricePerToken;
        const usageRef = window.firebaseRef(window.firebaseDB, `users/${currentUser.uid}/usageEvents`);
        const newRef = window.firebasePush(usageRef);
        await window.firebaseSet(newRef, {
            modelId,
            cost,
            tokens: avgTokens,
            createdAt: Date.now()
        });
    } catch (error) {
        console.error('Failed to record usage event', error);
    }
}

function updateAiMessageUI(bubble, content) {
    bubble.innerHTML = '';

    // Combined regex for XML-style and Kimi-style tools
    const regex = /(<(read_file|write_file|edit_file|delete_file|create_file|read_codebase|search_codebase|todo_add|todo_read|todo_check)[^>]*\/>|<(write_file|edit_file|create_file|search_codebase)[^>]*>[\s\S]*?<\/(write_file|edit_file|create_file|search_codebase)>|<\|tool_call_begin\|> functions\.(read_file|write_file|edit_file|delete_file|create_file|read_codebase|search_codebase|todo_add|todo_read|todo_check):\d+ <\|tool_call_argument_begin\|> ([\s\S]*?) <\|tool_call_end\|>)|(<(read_file|write_file|edit_file|delete_file|create_file|read_codebase|search_codebase|todo_add|todo_read|todo_check)[^>]*$|<(write_file|edit_file|create_file|search_codebase)[^>]*>[\s\S]*?$|<\|tool_call_begin\|> functions\.(read_file|write_file|edit_file|delete_file|create_file|read_codebase|search_codebase|todo_add|todo_read|todo_check):\d+ <\|tool_call_argument_begin\|> [\s\S]*?$)/g;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const textBefore = content.substring(lastIndex, match.index);
        if (textBefore) {
            const span = document.createElement('span');
            span.innerHTML = renderMarkdownSafe(textBefore);
            bubble.appendChild(span);
        }

        const fullMatch = match[0];
        const isComplete = !!match[1];

        let type, path, diffData = null;

        if (fullMatch.includes('<|tool_call_begin|>')) {
            // Kimi style
            const typeM = fullMatch.match(/functions\.(\w+):/);
            type = typeM ? typeM[1] : "tool";
            const argM = fullMatch.match(/<\|tool_call_argument_begin\|> ([\s\S]*?)( <\|tool_call_end\|>|$)/);
            if (argM) {
                try {
                    const args = JSON.parse(argM[1].trim());
                    path = args.path || args.task || "";
                    if (type === 'edit_file' && isComplete) {
                        diffData = { path, search: args.search, replace: args.replace };
                    }
                } catch (e) { path = "item"; }
            }
        } else {
            // XML style
            const typeMatch = fullMatch.match(/<(read_file|write_file|edit_file|delete_file|create_file|read_codebase|search_codebase|todo_add|todo_read|todo_check)/);
            type = typeMatch ? typeMatch[1] : "tool";
            const pathMatch = fullMatch.match(/path="([^"]+)"/);
            const taskMatch = fullMatch.match(/task="([^"]+)"/);
            path = pathMatch ? pathMatch[1] : (taskMatch ? taskMatch[1] : "");

            if (type === 'edit_file' && isComplete) {
                const sm = fullMatch.match(/<search>([\s\S]*?)<\/search>/);
                const rm = fullMatch.match(/<replace>([\s\S]*?)<\/replace>/);
                if (sm && rm) diffData = { path, search: sm[1], replace: rm[1] };
            }
        }

        const labelMap = {
            'read_file': 'Reading ',
            'write_file': 'Writing ',
            'create_file': 'Creating ',
            'edit_file': 'Modifying ',
            'delete_file': 'Deleting ',
            'read_codebase': 'Scanning Codebase...',
            'search_codebase': 'Searching Codebase...',
            'todo_add': 'Adding To-Do: ',
            'todo_read': 'Reading To-Do List',
            'todo_check': 'Checking To-Do: '
        };
        const doneMap = {
            'read_file': 'Read ',
            'write_file': 'Updated ',
            'create_file': 'Created ',
            'edit_file': 'Modified ',
            'delete_file': 'Deleted ',
            'read_codebase': 'Scan Complete',
            'search_codebase': 'Search Complete',
            'todo_add': 'Added To-Do: ',
            'todo_read': 'To-Do List Read',
            'todo_check': 'Checked To-Do: '
        };

        const label = isComplete ? (doneMap[type] + (path || "")) : (labelMap[type] + (path || ""));
        bubble.appendChild(createToolCard(label, isComplete, type, path, diffData));
        lastIndex = regex.lastIndex;
    }

    const remainingText = content.substring(lastIndex);
    if (remainingText) {
        const span = document.createElement('span');
        span.innerHTML = renderMarkdownSafe(remainingText);
        bubble.appendChild(span);
    }
}

let globalCredits = 100;

// Console Debug Tools
window.setBalance = (num) => {
    globalCredits = num;
    console.log(`DEBUG: balance set to $${num}. Updating UI...`);
    
    // Manually trigger UI update logic similar to updateCredits but with mock value
    const bar = document.getElementById('credits-bar');
    const text = document.getElementById('credits-text');
    const percentage = Math.max(0, Math.min(100, num));
    bar.style.width = percentage + '%';
    text.textContent = `$${num.toFixed(2)} (MOCK) credits remaining`;
    
    if (num <= 50) {
        bar.style.background = 'black';
        generateBtn.disabled = true;
        generateBtn.textContent = 'Credits Depleted';
    } else {
        bar.style.background = '#10b981';
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate';
    }
    calculateEstimatedCost(dropdownTrigger.dataset.value);
};

// Credits Logic
async function updateCredits() {
    try {
        const res = await fetch('/api/credits');
        const data = await res.json();
        const credits = data.credits;
        globalCredits = credits;
        const bar = document.getElementById('credits-bar');
        const text = document.getElementById('credits-text');

        // Visualization: Scale 0-100 to 0-100%
        const percentage = Math.max(0, Math.min(100, credits));
        bar.style.width = percentage + '%';
        text.textContent = `$${credits.toFixed(2)} global credits remaining`;

        if (credits <= 50) {
            bar.style.background = 'black';
            generateBtn.disabled = true;
            generateBtn.textContent = 'Credits Depleted';
        } else if (credits <= 55) {
            bar.style.background = '#ff4d4f'; // red
        } else if (credits <= 60) {
            bar.style.background = '#f59e0b'; // yellow
        } else {
            bar.style.background = '#10b981'; // green
        }
    } catch (e) {
        console.error("Credits fetch failed", e);
    }
}
updateCredits();

// Model Dropdown Logic
const dropdownTrigger = document.getElementById('model-dropdown-trigger');
const dropdownList = document.getElementById('model-dropdown-list');
const modelNameSpan = document.getElementById('current-model-name');
let avgTokens = 1000;
let modelPrices = {};

// Bootstrap the trigger value
dropdownTrigger.dataset.value = "qwen/qwen3.5-flash-02-23";

dropdownTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownList.classList.toggle('hidden');
});

// Close when clicking outside
window.addEventListener('click', () => {
    dropdownList.classList.add('hidden');
});

function formatSigDigit(n) {
    if (n === 0) return "0.00";
    const d = Math.max(1, Math.ceil(-Math.log10(n)));
    const power = Math.pow(10, d);
    return (Math.floor(n * power) / power).toFixed(d);
}

// Hourly Limit Tracking
function getHourlyState() {
    const now = Date.now();
    let state = window.firebaseHourlyState || {};
    if (!state.ts || (now - state.ts) > 3600000) { // reset every 1 hour
        state = { ts: now, count: 0, spent: 0 };
    }
    return state;
}

async function incrementHourlyRequests() {
    const state = getHourlyState();
    const currentModelId = dropdownTrigger.dataset.value || "qwen/qwen3.5-flash-02-23";
    const pricePerToken = parseFloat(modelPrices[currentModelId]) || 0.000005;
    const requestCost = avgTokens * pricePerToken;
    state.count++;
    state.spent = (Number(state.spent) || 0) + requestCost;
    state.ts = state.ts || Date.now();
    window.firebaseHourlyState = state;
    if (window.firebaseUser && window.firebaseDB && window.firebaseRef && window.firebaseSet) {
        const usageRef = window.firebaseRef(window.firebaseDB, `users/${window.firebaseUser.uid}/hourlyUsage`);
        await window.firebaseSet(usageRef, state);
    }
    calculateEstimatedCost(currentModelId);
    if (typeof window.blitzRefreshHourlyPanel === 'function') {
        window.blitzRefreshHourlyPanel();
    }
    if (typeof window.blitzAnimateAccountDrain === 'function') {
        window.blitzAnimateAccountDrain();
    }
}

function getRemainingHourlyRequests(modelId) {
    const state = getHourlyState();
    const pricePerToken = parseFloat(modelPrices[modelId]) || 0.000005; // fallback
    const estCost = avgTokens * pricePerToken;
    const balance = globalCredits;

    if (balance < 50) return 0;

    const tier = window.firebaseUserProfile?.tier || 'basic';
    const hourlyBudgetByTier = { basic: 0.03, gold: 0.04, diamond: 0.05 };
    const hourlyBudget = hourlyBudgetByTier[tier] || hourlyBudgetByTier.basic;
    const spent = Number(state.spent) || 0;
    const remainingBudget = Math.max(0, hourlyBudget - spent);
    return Math.max(0, Math.floor(remainingBudget / estCost));
}

async function updateModelStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        console.log("MARKET STATS FETCHED:", data);
        avgTokens = data.avgTokens || 1000;
        modelPrices = data.prices || {};

        // Update current cost estimate
        const currentModelId = dropdownTrigger.dataset.value || "qwen/qwen3.5-flash-02-23";
        calculateEstimatedCost(currentModelId);

        // Re-render dropdown list options with costs
        const listContainer = document.getElementById('model-list-items');

        const models = [
            { id: "qwen/qwen3.5-flash-02-23", name: "Qwen 3.5 Flash", type: "speed" },
            { id: "inception/mercury-2", name: "Mercury 2", type: "cost" },
            { id: "xiaomi/mimo-v2-omni", name: "Mimo v2 Omni", type: "performance" },
            { id: "openai/gpt-5.4-nano", name: "GPT 5.4 Nano", type: "speed" },
            { id: "moonshotai/kimi-k2.5", name: "Kimi K2.5", type: "performance" },
            { id: "kwaipilot/kat-coder-pro-v2", name: "KAT Coder Pro", type: "performance" },
            { id: "x-ai/grok-code-fast-1", name: "Grok-Code Fast", type: "speed" },
            { id: "google/gemini-3.1-flash-lite-preview", name: "Gemini 3.1 Flash Lite", type: "speed" },
            { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash Preview", type: "speed" },
            { id: "openai/gpt-oss-120b", name: "GPT OSS 120B", type: "cost" },
            { id: "xiaomi/mimo-v2-flash", name: "Mimo v2 Flash", type: "speed" },
            { id: "xiaomi/mimo-v2-pro", name: "Mimo v2 Pro", type: "performance" }
        ];

        models.forEach(m => m.price = parseFloat(modelPrices[m.id]) || 0);

        let currentFilter = 'cost';

        const renderModels = () => {
            if (!listContainer) return;
            listContainer.innerHTML = '';
            
            let sortedModels = [...models];
            if (currentFilter === 'cost') {
                sortedModels.sort((a, b) => a.price - b.price);
            } else if (currentFilter === 'performance') {
                sortedModels.sort((a, b) => b.price - a.price); // higher price roughly maps to larger context/better intelligence
            } else if (currentFilter === 'speed') {
                // Prioritize designated high-speed models, then by lowest price acting as a proxy for speed
                sortedModels.sort((a, b) => {
                    if (a.type === 'speed' && b.type !== 'speed') return -1;
                    if (b.type === 'speed' && a.type !== 'speed') return 1;
                    return a.price - b.price;
                });
            }

            sortedModels.forEach(m => {
                const cost = formatSigDigit(avgTokens * m.price);
                const opt = document.createElement('div');
                opt.className = 'model-option';
                opt.dataset.value = m.id;
                opt.dataset.name = m.name;
                opt.textContent = m.name;
                const costSpan = document.createElement('span');
                costSpan.style.opacity = '0.5';
                costSpan.style.marginLeft = 'auto';
                costSpan.textContent = `~$${cost}/req`;
                opt.appendChild(costSpan);

                opt.addEventListener('click', () => {
                    dropdownTrigger.dataset.value = m.id;
                    modelNameSpan.textContent = m.name;
                    dropdownList.classList.add('hidden');
                    calculateEstimatedCost(m.id);
                });
                listContainer.appendChild(opt);
            });
        };

        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            // Remove old listeners to avoid duplicates on re-render
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'transparent';
                    b.style.color = '#a0aec0';
                });
                newBtn.classList.add('active');
                newBtn.style.background = '#2d3748';
                newBtn.style.color = '#fff';
                currentFilter = newBtn.dataset.sort;
                renderModels();
            });
        });

        renderModels();

    } catch (e) {
        console.error("Stats fetch failed", e);
    }
}

function calculateEstimatedCost(modelId) {
    const pricePerToken = parseFloat(modelPrices[modelId]) || 0;
    const estCost = formatSigDigit(avgTokens * pricePerToken);
    localStorage.setItem('blitz_estimated_request_cost', estCost);
    console.log(`Calculating cost for ${modelId}: ${avgTokens.toFixed(0)} avg tokens * ${pricePerToken.toFixed(9)} price = $${estCost}`);
    document.getElementById('avg-cost-val').textContent = `$${estCost}`;

    // Update Hourly Remaining
    const remaining = getRemainingHourlyRequests(modelId);
    document.getElementById('remaining-msgs-val').textContent = remaining;
    generateBtn.disabled = (remaining <= 0);
    generateBtn.style.opacity = (remaining <= 0) ? "0.3" : "1";
    generateBtn.style.cursor = (remaining <= 0) ? "not-allowed" : "pointer";
}

updateModelStats();
setInterval(updateModelStats, 5000); // refresh every 5s

const creditsModal = document.getElementById('credits-modal');
if (document.getElementById('btn-credits-about')) {
    document.getElementById('btn-credits-about').addEventListener('click', () => creditsModal.classList.remove('hidden'));
}
if (document.getElementById('btn-close-credits')) {
    document.getElementById('btn-close-credits').addEventListener('click', () => creditsModal.classList.add('hidden'));
}

function createToolCard(text, isDone, type, path, diffData) {
    const card = document.createElement('div');
    card.className = `tool-status-card ${isDone ? 'done' : ''} ${isDone ? 'clickable' : ''}`;

    card.style.display = "flex";
    card.style.margin = "12px 0";
    card.style.width = "100%";
    card.style.maxWidth = "400px";
    card.style.padding = "10px 16px";
    card.style.background = "#1a202c";
    card.style.border = "1px solid #2d3748";
    card.style.borderRadius = "8px";
    card.style.alignItems = "center";
    card.style.gap = "12px";
    card.style.cursor = isDone ? "pointer" : "default";
    card.style.transition = "transform 0.1s, background 0.2s";

    if (isDone) {
        card.style.borderColor = "#2f855a";
        const check = document.createElement('span');
        check.style.color = '#48bb78';
        check.style.fontWeight = 'bold';
        check.textContent = '✓';
        const label = document.createElement('span');
        label.style.fontSize = '13px';
        label.style.color = '#e2e8f0';
        label.textContent = text;
        const viewLabel = document.createElement('span');
        viewLabel.style.fontSize = '10px';
        viewLabel.style.opacity = '0.6';
        viewLabel.style.marginLeft = '8px';
        viewLabel.textContent = '(View)';
        label.appendChild(viewLabel);
        card.append(check, label);

        card.addEventListener('mouseenter', () => { card.style.background = "#2d3748"; card.style.transform = "translateY(-1px)"; });
        card.addEventListener('mouseleave', () => { card.style.background = "#1a202c"; card.style.transform = "none"; });

        card.addEventListener('click', () => {
            if (type === 'edit_file' && diffData) {
                const oldContent = files[diffData.path].model.getValue();
                const newContent = oldContent.replace(diffData.search, diffData.replace);
                showDiff(diffData.path, oldContent, newContent);
            } else if (path && files[path]) {
                switchToFile(path);
            }
        });
    } else {
        const spinner = document.createElement('div');
        spinner.className = 'status-spinner';
        spinner.style.width = '14px';
        spinner.style.height = '14px';
        spinner.style.border = '2px solid rgba(74, 144, 226, 0.2)';
        spinner.style.borderTopColor = '#4a90e2';
        spinner.style.borderRadius = '50%';
        spinner.style.animation = 'spin 0.8s linear infinite';
        const label = document.createElement('span');
        label.style.fontSize = '13px';
        label.style.color = '#e2e8f0';
        label.textContent = text;
        card.append(spinner, label);
    }
    return card;
}

function executeAiTools(content) {
    let contextAdded = false;

    // To-Do Read
    if (content.includes('<todo_read/>')) {
        let listText = "Current AI To-Do List:\n";
        if (todos.length === 0) listText += "(Empty)";
        todos.forEach((t, i) => {
            listText += `${i + 1}. [${t.done ? 'x' : ' '}] ${t.task}\n`;
        });
        chatMessages.push({ role: 'system', content: listText });
        contextAdded = true;
    }

    // To-Do Add
    const todoAddMatches = content.matchAll(/<todo_add task="([^"]+)"\/>/g);
    for (const match of todoAddMatches) {
        todos.push({ task: match[1], done: false });
    }

    // To-Do Check
    const todoCheckMatches = content.matchAll(/<todo_check task="([^"]+)"\/>/g);
    for (const match of todoCheckMatches) {
        const taskName = match[1];
        const t = todos.find(item => item.task === taskName);
        if (t) t.done = true;
    }

    // Moonshot / Kimi style: <|tool_call_begin|> functions.name:0 <|tool_call_argument_begin|> {...} <|tool_call_end|>
    const kimiMatches = content.matchAll(/<\|tool_call_begin\|> functions\.(\w+):\d+ <\|tool_call_argument_begin\|> ([\s\S]*?) <\|tool_call_end\|>/g);
    for (const match of kimiMatches) {
        const type = match[1];
        let args = {};
        try { args = JSON.parse(match[2].trim()); } catch (e) { }

        if (type === 'read_file' && args.path && files[args.path]) {
            chatMessages.push({ role: 'system', content: `Content of ${args.path}:\n${files[args.path].model.getValue()}` });
            contextAdded = true;
        } else if ((type === 'write_file' || type === 'create_file') && args.path) {
            aiCreateFile(args.path, args.content || "");
        } else if (type === 'edit_file' && args.path) {
            applyFileEdit(args.path, args.search, args.replace);
        } else if (type === 'delete_file' && args.path) {
            if (files[args.path]) deleteFile(args.path);
        } else if (type === 'todo_add' && args.task) {
            todos.push({ task: args.task, done: false });
        } else if (type === 'todo_check' && args.task) {
            const t = todos.find(item => item.task === args.task);
            if (t) t.done = true;
        } else if (type === 'read_codebase') {
            let codebaseData = "Current Codebase:\n";
            for (const path in files) codebaseData += `\n--- FILE: ${path} ---\n${files[path].model.getValue()}\n`;
            chatMessages.push({ role: 'system', content: codebaseData });
            contextAdded = true;
        } else if (type === 'search_codebase' && args.query) {
            let results = `Search results for "${args.query}":\n`;
            for (const path in files) {
                if (files[path].model.getValue().includes(args.query)) results += `- Found in: ${path}\n`;
            }
            chatMessages.push({ role: 'system', content: results });
            contextAdded = true;
        }
    }

    // Read Codebase
    if (content.includes('<read_codebase/>')) {
        let codebaseData = "Current Codebase:\n";
        for (const path in files) {
            codebaseData += `\n--- FILE: ${path} ---\n${files[path].model.getValue()}\n`;
        }
        chatMessages.push({ role: 'system', content: codebaseData });
        contextAdded = true;
    }

    // Search Codebase
    const searchMatches = content.matchAll(/<search_codebase>([\s\S]*?)<\/search_codebase>/g);
    for (const match of searchMatches) {
        const query = match[1].trim();
        let results = `Search results for "${query}":\n`;
        for (const path in files) {
            const content = files[path].model.getValue();
            if (content.includes(query)) {
                results += `- Found in: ${path}\n`;
            }
        }
        chatMessages.push({ role: 'system', content: results });
        contextAdded = true;
    }

    // Read Files
    const readMatches = content.matchAll(/<read_file path="([^"]+)"\/>/g);
    for (const match of readMatches) {
        const path = match[1];
        if (files[path]) {
            const fileData = files[path].model.getValue();
            chatMessages.push({ role: 'system', content: `Content of ${path}:\n${fileData}` });
            contextAdded = true;
        }
    }

    // Create/Write Files
    const writeMatches = content.matchAll(/<(write_file|create_file) path="([^"]+)">([\s\S]*?)<\/(write_file|create_file)>/g);
    for (const match of writeMatches) {
        aiCreateFile(match[2], match[3]);
    }

    // Edit Files (Search/Replace)
    const editMatches = content.matchAll(/<edit_file path="([^"]+)">\s*<search>([\s\S]*?)<\/search>\s*<replace>([\s\S]*?)<\/replace>\s*<\/edit_file>/g);
    for (const match of editMatches) {
        applyFileEdit(match[1], match[2], match[3]);
    }

    // Delete Files
    const deleteMatches = content.matchAll(/<delete_file path="([^"]+)"\/>/g);
    for (const match of deleteMatches) {
        if (files[match[1]]) deleteFile(match[1]);
    }

    return contextAdded;
}

setInterval(updateCredits, 5000);

// =========================================
// Firebase RTDB Save/Load Project Logic
// =========================================

function buildFallbackThumbnail(projectName = 'Untitled Project') {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const context = canvas.getContext('2d');
    if (!context) return null;

    const seedSource = `${projectName}|${Object.keys(files).sort().join('|')}`;
    let seed = 0;
    for (const char of seedSource) seed = ((seed << 5) - seed) + char.charCodeAt(0);
    const hue = Math.abs(seed) % 360;
    const accentHue = (hue + 36) % 360;
    const primary = `hsl(${hue} 65% 58%)`;
    const secondary = `hsl(${accentHue} 70% 48%)`;

    const gradient = context.createLinearGradient(0, 0, 400, 300);
    gradient.addColorStop(0, '#10131a');
    gradient.addColorStop(1, '#1b2330');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = primary;
    context.fillRect(24, 24, 352, 208);

    context.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let i = 0; i < 6; i += 1) {
        context.fillRect(48, 64 + (i * 24), 304 - (i * 18), 10);
    }

    context.fillStyle = secondary;
    context.fillRect(24, 246, 120, 20);

    context.fillStyle = '#ffffff';
    context.font = 'bold 28px Arial, sans-serif';
    context.fillText((projectName || 'Untitled Project').slice(0, 22), 28, 284);

    context.fillStyle = 'rgba(255, 255, 255, 0.75)';
    context.font = '16px Arial, sans-serif';
    context.fillText(`${Object.keys(files).length} file${Object.keys(files).length === 1 ? '' : 's'}`, 306, 282);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
    console.log('[thumbnail] fallback thumbnail generated', { length: dataUrl.length });
    return dataUrl;
}

function svgToDataUrl(svgMarkup) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
}

function inlineThumbnailAssets(iframeDoc, rendered) {
    for (const [filename, assetUrl] of Object.entries(rendered.assetUrls)) {
        if (filename.endsWith('.css')) {
            iframeDoc.querySelectorAll('link').forEach((linkEl) => {
                const href = linkEl.getAttribute('href');
                if (href === assetUrl) {
                    const styleEl = iframeDoc.createElement('style');
                    styleEl.textContent = files[filename]?.model.getValue() || '';
                    linkEl.replaceWith(styleEl);
                }
            });
            continue;
        }

        if (filename.endsWith('.js')) {
            iframeDoc.querySelectorAll('script').forEach((scriptEl) => {
                const src = scriptEl.getAttribute('src');
                if (src === assetUrl) {
                    scriptEl.removeAttribute('src');
                    scriptEl.textContent = '';
                }
            });
        }
    }
}

// Generate a tiny thumbnail from the preview iframe
async function captureThumbnail(projectName = 'Untitled Project') {
    const captureRoot = document.createElement('div');
    captureRoot.style.position = 'fixed';
    captureRoot.style.left = '-99999px';
    captureRoot.style.top = '0';
    captureRoot.style.width = '400px';
    captureRoot.style.height = '300px';
    captureRoot.style.overflow = 'hidden';
    captureRoot.style.background = '#ffffff';

    try {
        console.log('[thumbnail] capture start', { currentPreviewPage, fileCount: Object.keys(files).length });
        const rendered = buildRenderableHtml(currentPreviewPage);
        console.log('[thumbnail] renderable html ready', {
            page: rendered.pageToLoad,
            assetCount: Object.keys(rendered.assetUrls).length,
            htmlLength: rendered.htmlContent.length
        });
        const captureFrame = document.createElement('iframe');
        captureFrame.style.width = '400px';
        captureFrame.style.height = '300px';
        captureFrame.style.border = 'none';
        captureFrame.style.background = '#ffffff';
        captureRoot.appendChild(captureFrame);
        document.body.appendChild(captureRoot);

        const htmlBlobUrl = URL.createObjectURL(new Blob([rendered.htmlContent], { type: 'text/html' }));
        console.log('[thumbnail] blob url created');

        await new Promise((resolve) => {
            captureFrame.onload = () => {
                console.log('[thumbnail] iframe loaded');
                setTimeout(resolve, 400);
            };
            captureFrame.src = htmlBlobUrl;
        });

        const iframeDoc = captureFrame.contentDocument || captureFrame.contentWindow?.document;
        if (!iframeDoc?.documentElement) {
            console.warn('[thumbnail] iframe document missing');
            return null;
        }

        if (iframeDoc.fonts?.ready) {
            console.log('[thumbnail] waiting for fonts');
            await iframeDoc.fonts.ready.catch(() => {});
        }

        const assetLoads = Array.from(iframeDoc.images || []).map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
            });
        });
        await Promise.all(assetLoads);
        console.log('[thumbnail] assets settled', { imageCount: (iframeDoc.images || []).length });

        inlineThumbnailAssets(iframeDoc, rendered);
        console.log('[thumbnail] local assets inlined');

        const serializedHtml = new XMLSerializer().serializeToString(iframeDoc.documentElement);
        const svgMarkup = `
            <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
                <foreignObject width="100%" height="100%">
                    ${serializedHtml}
                </foreignObject>
            </svg>
        `;
        console.log('[thumbnail] svg prepared', { length: svgMarkup.length });

        URL.revokeObjectURL(htmlBlobUrl);
        Object.values(rendered.assetUrls).forEach(URL.revokeObjectURL);
        const dataUrl = svgToDataUrl(svgMarkup);
        console.log('[thumbnail] data url generated', { length: dataUrl.length });
        return dataUrl;
    } catch (e) {
        console.warn("Thumbnail capture failed:", e);
        return buildFallbackThumbnail(projectName);
    } finally {
        captureRoot.remove();
    }
}

// Firebase RTDB keys can't contain ".", so we encode/decode
function encodeKey(k) { return k.replace(/\./g, '_DOT_'); }
function decodeKey(k) { return k.replace(/_DOT_/g, '.'); }

// Serialize all files to a plain object for RTDB
function serializeFiles() {
    const out = {};
    for (const [name, fileObj] of Object.entries(files)) {
        out[encodeKey(name)] = {
            content: fileObj.model.getValue(),
            lang: fileObj.lang
        };
    }
    return out;
}

// Save project to Firebase RTDB
async function saveProject() {
    if (!window.firebaseReady) {
        console.warn("Firebase not ready yet.");
        return;
    }

    try {
        await waitForAuth();
    } catch (error) {
        alert(error.message);
        return;
    }

    if (!currentUser) {
        alert("You must be signed in before saving.");
        return;
    }

    if (currentProjectId && currentProjectOwnerUid && currentProjectOwnerUid !== currentUser.uid) {
        alert("This project belongs to another user. Fork it to save your own copy.");
        return;
    }

    const projectName = prompt("Project name:", "My Blitz Project");
    if (!projectName) return;

    const thumbnail = await captureThumbnail(projectName);
    console.log('[thumbnail] save payload thumbnail result', thumbnail ? { length: thumbnail.length } : null);
    const hostedSlug = currentHostedSlug || slugifyProjectName(projectName);
    const publishPayload = {
        slug: hostedSlug,
        title: projectName,
        entry: 'index.html',
        files: buildPublishFilesPayload()
    };

    let publishResponse;
    try {
        publishResponse = await fetch(`${hostedPublishApiBase.replace(/\/$/, '')}/api/publish`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(publishPayload)
        });
    } catch (error) {
        console.error("Publish request failed:", error);
        alert("Publish failed: " + error.message);
        return;
    }

    if (!publishResponse.ok) {
        const errorText = await publishResponse.text().catch(() => '');
        console.error("Publish failed:", publishResponse.status, errorText);
        alert(`Publish failed: ${errorText || publishResponse.statusText}`);
        return;
    }

    const publishData = await publishResponse.json().catch(() => ({}));
    const hostedWebsite = publishData.url || getHostedProjectUrl(hostedSlug);

    const projectPayload = {
        name: projectName,
        hostedSlug,
        hostedWebsite,
        ownerDisplayName: currentUser.displayName || currentUser.email || currentUser.uid,
        ownerPhotoURL: currentUser.photoURL || '',
        thumbnail,
        updatedAt: Date.now(),
        forkedFrom: forkSourceProject,
        ownerUid: currentUser.uid
    };
    console.log('[thumbnail] project payload prepared', {
        projectName,
        hasThumbnail: Boolean(thumbnail),
        payloadKeys: Object.keys(projectPayload)
    });

    try {
        let projectRef;
        if (currentProjectId) {
            // Update existing project
            projectRef = window.firebaseRef(window.firebaseDB, 'projects/' + currentProjectId);
            await window.firebaseSet(projectRef, projectPayload);
            currentProjectOwnerUid = currentUser.uid;
            console.log("Project updated:", currentProjectId);
        } else {
            // Create new project
            const projListRef = window.firebaseRef(window.firebaseDB, 'projects');
            const newRef = window.firebasePush(projListRef);
            currentProjectId = newRef.key;
            projectRef = newRef;
            await window.firebaseSet(projectRef, projectPayload);
            currentProjectOwnerUid = currentUser.uid;
            // Update URL so refreshes keep the project loaded
            history.replaceState(null, '', 'editor.html?project=' + currentProjectId);
            console.log("Project created:", currentProjectId);
        }

        currentHostedSlug = hostedSlug;
        currentHostedWebsite = hostedWebsite;
        updateSaveButtonState();
        alert("Project published!");
    } catch (e) {
        console.error("Save failed:", e);
        alert("Save failed: " + e.message);
    }
}

// Load project from Firebase RTDB
async function loadProject(projectId) {
    if (!window.firebaseReady) {
        // Wait for Firebase to be ready
        window.addEventListener('firebase-ready', () => loadProject(projectId), { once: true });
        return;
    }

    try {
        const projRef = window.firebaseRef(window.firebaseDB, 'projects/' + projectId);
        const snapshot = await window.firebaseGet(projRef);
        if (!snapshot.exists()) {
            console.warn("Project not found:", projectId);
            return;
        }

        const data = snapshot.val();
        const isForkLoad = urlParams.get('forkOf') === projectId;
        currentProjectId = isForkLoad ? null : projectId;
        currentProjectOwnerUid = isForkLoad ? null : (data.ownerUid || null);
        forkSourceProject = isForkLoad
            ? { id: projectId, name: data.name || 'Untitled' }
            : (data.forkedFrom || null);
        currentHostedWebsite = data.hostedWebsite || null;
        currentHostedSlug = data.hostedSlug || null;

        if (currentHostedWebsite && !data.files) {
            window.location.href = `viewer.html?project=${projectId}`;
            return;
        }

        // Clear existing files
        for (const name in files) {
            files[name].model.dispose();
            delete files[name];
        }

        // Load files from RTDB (decode keys back from _DOT_ to .)
        if (data.files) {
            for (const [encodedName, fileInfo] of Object.entries(data.files)) {
                const name = decodeKey(encodedName);
                const lang = fileInfo.lang || 'plaintext';
                files[name] = {
                    model: monaco.editor.createModel(fileInfo.content || "", lang, monaco.Uri.file(name)),
                    lang: lang
                };
                bindContentChange(files[name].model);
            }
        }

        // Set active file
        activeFile = Object.keys(files)[0] || 'index.html';
        if (files[activeFile]) editor.setModel(files[activeFile].model);
        renderFiles();
        updatePreview();
        updateSaveButtonState();
        console.log("Project loaded:", projectId, data.name);
    } catch (e) {
        console.error("Load failed:", e);
    }
}

// Wire SAVE button
document.querySelector('.save-btn').addEventListener('click', saveProject);

// Check URL for ?project=ID on page load
const loadId = urlParams.get('project');
const forkId = urlParams.get('forkOf');
const sourceId = forkId || loadId;
if (sourceId) {
    if (window.firebaseReady) {
        loadProject(sourceId);
    } else {
        window.addEventListener('firebase-ready', () => loadProject(sourceId), { once: true });
    }
}
