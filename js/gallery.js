import { $, reduce } from './utils.js';

const gal = $('#gal');
const tiles = [...gal.children];
const dots = $('#dots');
tiles.forEach(() => dots.append(document.createElement('i')));

/* highlight the centered tile's dot and rotate tiles like a coverflow */
function markDot() {
  const center = gal.scrollLeft + gal.clientWidth / 2;
  let best = 0;
  let bestDist = 1e9;
  tiles.forEach((t, i) => {
    const off = t.offsetLeft + t.offsetWidth / 2 - gal.offsetLeft - center;
    const d = Math.abs(off);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
    if (!reduce) {
      const k = Math.max(-1, Math.min(1, off / gal.clientWidth));
      const a = Math.abs(k);
      t.style.transform =
        `perspective(800px) rotateY(${(-k * 42).toFixed(2)}deg) ` +
        `translateZ(${(-a * 110).toFixed(1)}px) scale(${(1 - a * 0.1).toFixed(3)})`;
    }
  });
  [...dots.children].forEach((d, i) => d.classList.toggle('on', i === best));
}
gal.addEventListener('scroll', markDot, { passive: true });
markDot();

/* lightbox */
const lb = $('#lb');
tiles.forEach((t) =>
  t.addEventListener('click', () => {
    $('#lbuse').setAttribute('href', '#' + t.dataset.s);
    $('#lbcap').textContent = t.dataset.c;
    lb.showModal();
  })
);
$('#lbclose').addEventListener('click', () => lb.close());
lb.addEventListener('click', (e) => {
  if (e.target === lb) lb.close();
});
