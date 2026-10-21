import { $, reduce } from './utils.js';

/* falling petals + heart bursts on one full-screen canvas */
const cv = $('#sky');
const cx = cv.getContext('2d');
let W = 0;
let H = 0;
let dpr = 1;
let petalColor = '#F0A3B8';
let blushColor = '#D9668A';

function readColors() {
  const cs = getComputedStyle(document.documentElement);
  petalColor = cs.getPropertyValue('--petal').trim() || petalColor;
  blushColor = cs.getPropertyValue('--blush').trim() || blushColor;
}
function size() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = cv.width = innerWidth * dpr;
  H = cv.height = innerHeight * dpr;
}
size();
readColors();
addEventListener('resize', size);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColors);
new MutationObserver(readColors).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme'],
});

/* particles: k=0 petal (loops forever), k=1 heart (dies after life) */
const parts = [];
const MAXP = innerWidth < 600 ? 22 : 34;

function petal(top) {
  return {
    k: 0,
    x: Math.random() * W,
    y: top ? -20 * dpr : Math.random() * H,
    s: (5 + Math.random() * 6) * dpr,
    vy: (0.35 + Math.random() * 0.7) * dpr,
    vx: (Math.random() - 0.3) * 0.5 * dpr,
    a: Math.random() * 6.28,
    va: (Math.random() - 0.5) * 0.05,
    sw: Math.random() * 6.28,
  };
}
if (!reduce) for (let i = 0; i < MAXP; i++) parts.push(petal(false));

function addHearts(x, y, n) {
  if (reduce) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = (2 + Math.random() * 5) * dpr;
    parts.push({
      k: 1,
      x: x * dpr,
      y: y * dpr,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 4 * dpr,
      s: (6 + Math.random() * 9) * dpr,
      life: 110 + Math.random() * 40,
      t: 0,
      a: (Math.random() - 0.5) * 0.6,
      c: Math.random() < 0.5,
    });
  }
}

function drawPetal(p) {
  const s = p.s;
  cx.save();
  cx.translate(p.x, p.y);
  cx.rotate(p.a);
  cx.scale(Math.cos(p.sw) * 0.6 + 0.6, 1);
  cx.beginPath();
  cx.moveTo(0, -s);
  cx.bezierCurveTo(s * 0.9, -s * 0.5, s * 0.6, s * 0.7, 0, s);
  cx.bezierCurveTo(-s * 0.6, s * 0.7, -s * 0.9, -s * 0.5, 0, -s);
  cx.fillStyle = petalColor;
  cx.globalAlpha = 0.75;
  cx.fill();
  cx.restore();
}

function drawHeart(p) {
  const s = p.s / 16;
  cx.save();
  cx.translate(p.x, p.y);
  cx.rotate(p.a);
  cx.scale(s, s);
  cx.translate(-16, -16);
  cx.beginPath();
  cx.moveTo(16, 28);
  cx.bezierCurveTo(6, 21, 2, 15.5, 2, 10.5);
  cx.bezierCurveTo(2, 6.4, 5.2, 3.5, 9, 3.5);
  cx.bezierCurveTo(11.8, 3.5, 14.2, 5.1, 16, 7.5);
  cx.bezierCurveTo(17.8, 5.1, 20.2, 3.5, 23, 3.5);
  cx.bezierCurveTo(26.8, 3.5, 30, 6.4, 30, 10.5);
  cx.bezierCurveTo(30, 15.5, 26, 21, 16, 28);
  cx.closePath();
  cx.globalAlpha = Math.max(0, 1 - p.t / p.life);
  cx.fillStyle = p.c ? blushColor : petalColor;
  cx.fill();
  cx.restore();
}

let running = false;

function frame() {
  cx.clearRect(0, 0, W, H);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (p.k === 0) {
      p.sw += 0.04;
      p.a += p.va;
      p.x += p.vx + Math.sin(p.sw) * 0.4 * dpr;
      p.y += p.vy;
      if (p.y > H + 20 * dpr || p.x < -30 * dpr || p.x > W + 30 * dpr) parts[i] = petal(true);
      else drawPetal(p);
    } else {
      p.t++;
      p.vy += 0.12 * dpr;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      if (p.t > p.life) parts.splice(i, 1);
      else drawHeart(p);
    }
  }
  if (!document.hidden && parts.length) requestAnimationFrame(frame);
  else running = false;
}

function run() {
  if (!running && parts.length) {
    running = true;
    requestAnimationFrame(frame);
  }
}
document.addEventListener('visibilitychange', run);
run();

/* burst n hearts from viewport point (x, y) */
export function hearts(x, y, n) {
  addHearts(x, y, n);
  run();
}
