import { $, reduce } from './utils.js';

const stage = $('#stage');
const secs = [...document.querySelectorAll('main > section')].slice(1);
let tiltX = 0;
let tiltY = 0;

/* envelope replay */
$('#replay').addEventListener('click', () => {
  stage.classList.remove('play');
  void stage.offsetWidth;
  stage.classList.add('play');
});

/* 3D: sections lift up like cards as they enter; the hero tips back as you leave it */
export function depth() {
  const vh = innerHeight;
  secs.forEach((s) => {
    const r = s.getBoundingClientRect();
    if (r.top > vh + 100 || r.bottom < -100) return;
    const t = Math.min(1, Math.max(0, (r.top - vh * 0.5) / (vh * 0.5)));
    s.style.transform = t
      ? `perspective(1100px) rotateX(${(t * 28).toFixed(2)}deg) translateZ(${(-t * 90).toFixed(1)}px)`
      : '';
  });
  const hr = stage.getBoundingClientRect();
  const ht = Math.min(1, Math.max(0, -hr.top / hr.height));
  stage.style.transform =
    `perspective(1000px) rotateX(${(ht * 32 + tiltX).toFixed(2)}deg) ` +
    `rotateY(${tiltY.toFixed(2)}deg) translateZ(${(-ht * 140).toFixed(1)}px)`;
}

/* mouse tilt on desktop */
if (!reduce && matchMedia('(pointer: fine)').matches) {
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    tiltY = ((e.clientX - r.left) / r.width - 0.5) * 16;
    tiltX = -((e.clientY - r.top) / r.height - 0.5) * 10;
    requestAnimationFrame(depth);
  });
  stage.addEventListener('pointerleave', () => {
    tiltX = tiltY = 0;
    requestAnimationFrame(depth);
  });
}
