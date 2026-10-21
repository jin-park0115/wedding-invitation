import { $, reduce, toast } from './utils.js';
import { hearts } from './sky.js';
import { feedBubbles } from './bubbles.js';

/* guestbook + live room, backed by claude.ai Artifact capabilities (db, user, room) */
const form = $('#rsvp');
const list = $('#gblist');
const stat = $('#gbstat');
const status = $('#f-status');
const submitB = $('#f-submit');
const delB = $('#f-del');

let uid = null;
let col = null;
let mine = null;
let room = null;

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

function render(snap) {
  const docs = snap.docs.filter((d) => d.exists).map((d) => ({ id: d.id, ...d.data() }));
  feedBubbles(snap, docs);

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
  const C = window.claude;
  if (!C || !C.use) {
    lockForm('방명록은 claude.ai에서 열었을 때 사용할 수 있어요.');
    emptyMsg('지금은 방명록을 불러올 수 없어요.');
    return;
  }
  const [db, user, rm] = await Promise.all([C.use('db'), C.use('user'), C.use('room')]);

  if (rm) {
    room = rm;
    room.on('cheer', (m) => {
      if (m.sameTab) return;
      hearts(innerWidth * (0.2 + Math.random() * 0.6), innerHeight * 0.85, 26);
      toast('누군가 축하 하트를 보냈어요');
    });
    room.onPeers((ch) => {
      const n = ch.peers.filter((p) => p.kind === 'viewer').length;
      $('#live').hidden = n < 1;
      $('#liven').textContent = n;
    });
  }

  if (!db) {
    lockForm('로그인하면 방명록을 보고 남길 수 있어요.');
    emptyMsg('로그인하면 축하 메시지를 볼 수 있어요.');
    return;
  }
  uid = user ? await user.id() : null;
  col = db.collection('guestbook');
  col.orderBy('at', 'desc').limit(200).onSnapshot(render, () => emptyMsg('방명록 연결이 끊겼어요. 새로고침해 주세요.'));

  if (!uid) {
    lockForm('이 링크로 들어온 방문자는 메시지를 남길 수 없어요. 읽기만 가능해요.');
    return;
  }

  // prefill with my previous entry
  const me = await col.doc(uid).get().catch(() => null);
  if (me && me.exists) {
    const d = me.data();
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
  if (!col || !uid) return;

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
    await col.doc(uid).set({
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
      code === 'invalid_argument' ? '이 링크에서는 메시지를 남길 권한이 없어요.'
      : code === 'quota_exceeded' ? '방명록이 가득 찼어요.'
      : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.';
  } finally {
    submitB.disabled = false;
  }
});

/* delete needs two taps within 3s */
delB.addEventListener('click', async () => {
  if (!col || !uid) return;
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
    await col.doc(uid).delete();
    toast('메시지를 삭제했어요');
  } catch {
    status.textContent = '삭제하지 못했어요. 잠시 후 다시 시도해 주세요.';
  }
});

/* ---------- ending: heart burst, shared with everyone in the room ---------- */
$('#burst').addEventListener('click', (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  hearts(r.left + r.width / 2, r.top + r.height / 2, 48);
  if (room) room.emit('cheer', {}).catch(() => {});
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
