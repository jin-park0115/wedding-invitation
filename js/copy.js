import { $, toast } from './utils.js';

/* copy buttons: any [data-copy] element; falls back to selecting the text */
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-copy]');
  if (!b) return;

  const fallback = () => {
    const code = b.parentElement.querySelector('code') || $('#addrtext');
    const r = document.createRange();
    r.selectNodeContents(code);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    toast('선택해 두었어요. 길게 눌러 복사하세요');
  };

  try {
    navigator.clipboard
      .writeText(b.dataset.copy)
      .then(() => toast(b.dataset.ok || '계좌번호를 복사했어요'), fallback);
  } catch {
    fallback();
  }
});
