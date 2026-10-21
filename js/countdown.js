import { $, reduce } from './utils.js';

const WED = new Date('2027-04-17T12:30:00+09:00');

/* calendar (April 2027) */
const cal = $('#cal');
'일월화수목금토'.split('').forEach((d) => {
  const h = document.createElement('div');
  h.className = 'h';
  h.textContent = d;
  cal.append(h);
});
const first = new Date(2027, 3, 1).getDay();
const days = 30;
for (let i = 0; i < first; i++) cal.append(document.createElement('div'));
for (let d = 1; d <= days; d++) {
  const c = document.createElement('div');
  const dow = (first + d - 1) % 7;
  if (dow === 0) c.className = 'sun';
  if (d === 17) {
    c.className = 'wd';
    c.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><use href="#heart"/></svg><b>17</b>';
    c.setAttribute('aria-label', '4월 17일 결혼식');
  } else {
    c.textContent = d;
  }
  cal.append(c);
}

/* countdown with flip digits */
function setFlip(el, v) {
  if (el.dataset.v === v) return;
  el.dataset.v = v;
  const old = el.querySelector('.cur');
  const nw = document.createElement('span');
  nw.className = 'cur';
  nw.textContent = v;
  if (old && !reduce) {
    nw.classList.add('in');
    old.className = 'out';
    old.addEventListener('animationend', () => old.remove(), { once: true });
  } else if (old) {
    old.remove();
  }
  el.append(nw);
}

const pad = (n) => String(n).padStart(2, '0');

function tick() {
  let ms = WED - Date.now();
  if (ms <= 0) {
    $('#dday').textContent = 'JUST MARRIED';
    $('#cdtext').textContent = '서준과 하늘이 부부가 되었습니다';
    ms = 0;
  } else {
    $('#dday').textContent = 'D-' + Math.ceil(ms / 86400000);
  }
  const s = Math.floor(ms / 1000);
  setFlip($('#cd-d'), String(Math.floor(s / 86400)));
  setFlip($('#cd-h'), pad(Math.floor((s % 86400) / 3600)));
  setFlip($('#cd-m'), pad(Math.floor((s % 3600) / 60)));
  setFlip($('#cd-s'), pad(s % 60));
}
tick();
setInterval(tick, 1000);
