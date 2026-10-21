import { $, reduce } from './utils.js';

/* live bubbles: new messages pop up at once, older ones drift by every few seconds */
const layer = $('#bubbles');
const toggleB = $('#bubtoggle');
let on = true;
try {
  on = localStorage.getItem('bubbles') !== '0';
} catch {}

let pool = [];
let poolIdx = 0;
const seen = new Set();
let firstSnap = true;

function setOn(v) {
  on = v;
  toggleB.textContent = v ? '말풍선 끄기' : '말풍선 켜기';
  toggleB.setAttribute('aria-pressed', String(v));
  if (!v) layer.replaceChildren();
  try {
    localStorage.setItem('bubbles', v ? '1' : '0');
  } catch {}
}
setOn(on);
toggleB.addEventListener('click', () => setOn(!on));

function bubble(d, isNew) {
  if (!on || reduce || document.hidden || !d.msg) return;
  if (layer.childElementCount >= 3) {
    if (!isNew) return;
    layer.firstElementChild.remove();
  }

  const el = document.createElement('div');
  el.className = 'bub' + (isNew ? ' new' : '');
  const b = document.createElement('b');
  b.textContent = (isNew ? '방금 도착 · ' : '') + String(d.name || '익명').slice(0, 20);
  const m = String(d.msg);
  const s = document.createElement('span');
  s.textContent = m.length > 80 ? m.slice(0, 80) + '…' : m;
  el.append(b, s);

  const bw = Math.min(240, innerWidth * 0.7);
  el.style.left = 8 + Math.random() * Math.max(0, innerWidth - bw - 16) + 'px';
  el.style.setProperty('--z', (Math.random() * 160 - 80).toFixed(0) + 'px');
  el.style.setProperty('--ry', (Math.random() * 30 - 15).toFixed(1) + 'deg');
  el.style.setProperty('--sx', (Math.random() * 70 - 35).toFixed(0) + 'px');
  el.style.setProperty('--dur', (isNew ? 9 : 11 + Math.random() * 4).toFixed(1) + 's');
  el.addEventListener('animationend', () => el.remove());
  layer.append(el);
}

setInterval(() => {
  if (pool.length) bubble(pool[poolIdx++ % pool.length], false);
}, 6500);

/* call on every guestbook update; the first one only seeds what's already there */
export function feedBubbles(docs, changed) {
  pool = docs.filter((d) => d.msg).sort(() => Math.random() - 0.5);
  if (firstSnap) {
    firstSnap = false;
    docs.forEach((d) => seen.add(d.id + ':' + d.at));
    return;
  }
  changed.forEach((d) => {
    const k = d.id + ':' + d.at;
    if (!seen.has(k)) {
      seen.add(k);
      bubble(d, true);
    }
  });
}
