export const $ = (s) => document.querySelector(s);
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let toastT;
export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2200);
}
