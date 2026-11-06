import { $, reduce } from './utils.js';

const gal = $('#gal');
const tiles = [...gal.children];
const dots = $('#dots');
tiles.forEach(() => dots.append(document.createElement('i')));
let current = 0;

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
  $('#gprev').disabled = best === 0;
  $('#gnext').disabled = best === tiles.length - 1;
  current = best;
}

/* desktop has no swipe: arrows and dots jump to a tile */
/* Chrome snaps to the 3D-transformed tiles mid-scroll and lands off-center, so snap is paused until we arrive */
let resnap;
function goTo(i) {
  gal.style.scrollSnapType = 'none';
  gal.scrollTo({
    left: tiles[i].offsetLeft + tiles[i].offsetWidth / 2 - gal.offsetLeft - gal.clientWidth / 2,
    behavior: reduce ? 'auto' : 'smooth',
  });
  clearTimeout(resnap);
  resnap = setTimeout(() => (gal.style.scrollSnapType = ''), 900); // scrollend isn't in Safari yet
}
$('#gprev').addEventListener('click', () => goTo(Math.max(0, current - 1)));
$('#gnext').addEventListener('click', () => goTo(Math.min(tiles.length - 1, current + 1)));
[...dots.children].forEach((d, i) => d.addEventListener('click', () => goTo(i)));
gal.addEventListener('scroll', markDot, { passive: true });
markDot();

/* lightbox */
const lb = $('#lb');
tiles.forEach((t) =>
  t.addEventListener('click', () => {
    const img = t.querySelector('img');
    $('#lbimg').src = img.src;
    $('#lbimg').alt = img.alt;
    $('#lbcap').textContent = t.querySelector('span').textContent;
    lb.showModal();
  })
);
$('#lbclose').addEventListener('click', () => lb.close());
lb.addEventListener('click', (e) => {
  if (e.target === lb) lb.close();
});
