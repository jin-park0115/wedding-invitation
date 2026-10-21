import { $, reduce } from './utils.js';
import { depth } from './hero.js';

/* reveal: only below-the-fold elements start dimmed */
if (!reduce && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12 }
  );
  document.querySelectorAll('.rv').forEach((el) => {
    if (el.getBoundingClientRect().top > innerHeight) {
      el.classList.add('pre');
      io.observe(el);
    }
  });
}

/* progress bar + timeline fill */
const tl = $('#timeline');
const evs = [...tl.querySelectorAll('.ev')];
let ticking = false;

function onScroll() {
  ticking = false;
  const max = document.documentElement.scrollHeight - innerHeight;
  $('#progress').style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;

  const r = tl.getBoundingClientRect();
  const mark = innerHeight * 0.62;
  tl.style.setProperty('--p', Math.min(1, Math.max(0, (mark - r.top) / r.height)).toFixed(3));
  evs.forEach((e) => e.classList.toggle('on', e.getBoundingClientRect().top < mark));

  if (!reduce) depth();
}

onScroll();
addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  },
  { passive: true }
);
addEventListener('resize', onScroll);
