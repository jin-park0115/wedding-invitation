import { $, reduce, toast } from './utils.js';
import { hearts } from './sky.js';
import { feedBubbles } from './bubbles.js';
import { connect } from './backend.js';

/* guestbook + live room, on claude.ai capabilities or Firebase (see backend.js) */
const form = $('#rsvp');
const list = $('#gblist');
const stat = $('#gbstat');
const status = $('#f-status');
const submitB = $('#f-submit');
const delB = $('#f-del');

let uid = null;
let be = null; // backend from connect()
let mine = null;

const rtf = new Intl.RelativeTimeFormat('ko', { numeric: 'auto' });
function ago(t) {
  const s = (t - Date.now()) / 1000;
  const a = Math.abs(s);
  if (a < 60) return '방금';
  if (a < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  return rtf.format(Math.round(s / 86400), 'day');
}

function lockForm(msg) {
  [...form.elements].forEach((el) => (el.disabled = true));
  status.textContent = msg;
}
function emptyMsg(msg) {
  list.replaceChildren(Object.assign(document.createElement('p'), { className: 'empty', textContent: msg }));
}

/* ---------- render ---------- */
function noteEl(d) {
  const n = document.createElement('article');
  n.className = 'note' + (d.id === uid ? ' mine' : '');

  const h = document.createElement('header');
  const b = document.createElement('b');
  b.textContent = String(d.name || '익명').slice(0, 20);
  const side = document.createElement('span');
  side.className = 'chip' + (d.side === 'g' ? ' g' : '');
  side.textContent = d.side === 'g' ? '신랑측' : '신부측';
  const att = document.createElement('span');
  att.className = 'chip g';
  att.textContent = d.attend === 'yes' ? `참석 ${Number(d.count) || 1}명` : '마음으로 함께';
  const t = document.createElement('time');
  t.textContent = (d.id === uid ? '내 메시지 · ' : '') + ago(Number(d.at) || Date.now());
  h.append(b, side, att, t);
  n.append(h);

  if (d.msg) {
    const p = document.createElement('p');
    p.textContent = String(d.msg).slice(0, 300);
    n.append(p);
  }
  return n;
}

function render(docs, changed) {
  feedBubbles(docs, changed);

  mine = docs.find((d) => d.id === uid) || null;
  delB.hidden = !mine;
  submitB.textContent = mine ? '수정하기' : '남기기';

  if (!docs.length) {
    stat.hidden = true;
    emptyMsg('아직 남겨진 메시지가 없어요. 첫 번째로 축하를 전해 주세요.');
    return;
  }

  const yes = docs.filter((d) => d.attend === 'yes');
  const sum = yes.reduce((a, d) => a + (Number(d.count) || 1), 0);
  stat.hidden = false;
  stat.innerHTML =
    `<span>참석 예정 <b>${sum}</b>명</span>` +
    `<span>신랑측 <b>${yes.filter((d) => d.side === 'g').length}</b>팀</span>` +
    `<span>신부측 <b>${yes.filter((d) => d.side === 'b').length}</b>팀</span>` +
    `<span>메시지 <b>${docs.filter((d) => d.msg).length}</b>개</span>`;
  list.replaceChildren(...docs.map(noteEl));
}

/* ---------- connect ---------- */
(async () => {
  const { backend, error } = await connect();
  if (error) {
    lockForm(error);
    emptyMsg('지금은 방명록을 불러올 수 없어요.');
    return;
  }
  be = backend;
  uid = be.uid;

  be.onCheer(() => {
    hearts(innerWidth * (0.2 + Math.random() * 0.6), innerHeight * 0.85, 26);
    toast('누군가 축하 하트를 보냈어요');
  });
  be.onCount((n) => {
    $('#live').hidden = n < 1;
    $('#liven').textContent = n;
  });
  be.listen(render, () => emptyMsg('방명록 연결이 끊겼어요. 새로고침해 주세요.'));

  if (!uid) {
    lockForm('이 링크로 들어온 방문자는 메시지를 남길 수 없어요. 읽기만 가능해요.');
    return;
  }

  // prefill with my previous entry
  const d = await be.getMine();
  if (d) {
    $('#f-name').value = d.name || '';
    $('#f-msg').value = d.msg || '';
    $('#f-count').value = d.count || 1;
    (d.side === 'b' ? $('#f-side-b') : $('#f-side-g')).checked = true;
    (d.attend === 'no' ? $('#f-att-n') : $('#f-att-y')).checked = true;
  }
})();

/* ---------- form ---------- */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!be || !uid) return;

  const name = $('#f-name').value.trim();
  const msg = $('#f-msg').value.trim();
  const count = Math.min(10, Math.max(1, parseInt($('#f-count').value, 10) || 1));
  if (!name) {
    status.textContent = '이름을 적어 주세요.';
    $('#f-name').focus();
    return;
  }

  submitB.disabled = true;
  status.textContent = '저장하는 중…';
  try {
    await be.save({
      name: name.slice(0, 20),
      msg: msg.slice(0, 300),
      count,
      side: form.side.value === 'b' ? 'b' : 'g',
      attend: form.attend.value === 'no' ? 'no' : 'yes',
      at: Date.now(),
    });
    status.textContent = '';
    toast(mine ? '메시지를 수정했어요' : '축하 메시지를 남겼어요');
    const r = submitB.getBoundingClientRect();
    hearts(r.left + r.width / 2, r.top, 24);
  } catch (err) {
    const code = err && err.code;
    status.textContent =
      code === 'invalid_argument' || code === 'permission-denied' ? '이 링크에서는 메시지를 남길 권한이 없어요.'
      : code === 'quota_exceeded' ? '방명록이 가득 찼어요.'
      : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.';
  } finally {
    submitB.disabled = false;
  }
});

/* delete needs two taps within 3s */
delB.addEventListener('click', async () => {
  if (!be || !uid) return;
  if (delB.dataset.arm !== '1') {
    delB.dataset.arm = '1';
    delB.textContent = '한 번 더 누르면 삭제돼요';
    setTimeout(() => {
      delB.dataset.arm = '';
      delB.textContent = '내 메시지 삭제';
    }, 3000);
    return;
  }
  delB.dataset.arm = '';
  delB.textContent = '내 메시지 삭제';
  try {
    await be.remove();
    toast('메시지를 삭제했어요');
  } catch {
    status.textContent = '삭제하지 못했어요. 잠시 후 다시 시도해 주세요.';
  }
});

/* ---------- ending: heart burst, shared with everyone in the room ---------- */
$('#burst').addEventListener('click', (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  hearts(r.left + r.width / 2, r.top + r.height / 2, 48);
  if (be) be.cheer();
  if (reduce) toast('축하해 주셔서 고마워요');
});

let endBurst = false;
if ('IntersectionObserver' in window) {
  new IntersectionObserver(
    (es) => {
      if (es[0].isIntersecting && !endBurst) {
        endBurst = true;
        hearts(innerWidth / 2, innerHeight * 0.75, 30);
      }
    },
    { threshold: 0.6 }
  ).observe($('.end'));
}
