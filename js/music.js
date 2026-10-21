import { $, toast } from './utils.js';

/* music box (WebAudio, original arpeggio over C–Am–F–G) */
const MEL = [
  76, 0, 79, 0, 84, 83, 79, 0, 81, 0, 76, 0, 72, 74, 76, 0,
  77, 0, 81, 0, 84, 0, 81, 79, 79, 0, 74, 0, 77, 76, 74, 0,
  76, 79, 84, 88, 86, 84, 79, 0, 81, 84, 88, 0, 86, 84, 81, 0,
  77, 81, 84, 0, 86, 84, 81, 0, 83, 0, 86, 0, 84, 0, 0, 0,
];
const BASS = [60, 57, 53, 55, 60, 57, 53, 55];
const STEP = 0.27; // seconds per 8th note

let ac = null;
let master = null;
let nextT = 0;
let step = 0;
let timer = null;

const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

/* one music-box tine: sine + two inharmonic partials, fast attack, long decay */
function tine(t, n, v) {
  const g = ac.createGain();
  g.connect(master);
  [[1, 1], [4.02, 0.14], [6.8, 0.04]].forEach(([mul, amp]) => {
    const o = ac.createOscillator();
    const og = ac.createGain();
    o.type = 'sine';
    o.frequency.value = hz(n) * mul;
    og.gain.value = amp;
    o.connect(og).connect(g);
    o.start(t);
    o.stop(t + 1.9);
  });
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
}

function schedule() {
  while (nextT < ac.currentTime + 0.15) {
    const m = MEL[step];
    const bass = BASS[Math.floor(step / 8)];
    if (m) tine(nextT, m, 0.22);
    if (step % 8 === 0) tine(nextT, bass, 0.16);
    if (step % 8 === 4) tine(nextT, bass + 7, 0.1);
    nextT += STEP;
    step = (step + 1) % MEL.length;
  }
}

function setup() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ac = new AC();
  master = ac.createGain();
  master.gain.value = 0.5;
  // feedback delay for a little room
  const dl = ac.createDelay();
  const fb = ac.createGain();
  const wet = ac.createGain();
  dl.delayTime.value = 0.32;
  fb.gain.value = 0.32;
  wet.gain.value = 0.3;
  master.connect(ac.destination);
  master.connect(dl);
  dl.connect(fb).connect(dl);
  dl.connect(wet).connect(ac.destination);
  return true;
}

function setButton(b, on) {
  b.classList.toggle('on', on);
  b.setAttribute('aria-pressed', String(on));
  b.setAttribute('aria-label', on ? '배경음악 끄기' : '배경음악 켜기');
}

$('#music').addEventListener('click', async (e) => {
  const b = e.currentTarget;
  if (!ac && !setup()) {
    toast('이 브라우저에서는 음악을 재생할 수 없어요');
    return;
  }
  if (timer) {
    clearInterval(timer);
    timer = null;
    master.gain.setTargetAtTime(0, ac.currentTime, 0.15);
    setButton(b, false);
    return;
  }
  await ac.resume();
  master.gain.cancelScheduledValues(ac.currentTime);
  master.gain.setValueAtTime(0.5, ac.currentTime);
  nextT = ac.currentTime + 0.05;
  timer = setInterval(schedule, 25);
  schedule();
  setButton(b, true);
});
