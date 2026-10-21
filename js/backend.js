import { firebaseConfig } from './firebase-config.js';

/*
 * One small interface over two backends, so the guestbook works in both places:
 *   - claude.ai Artifact: db + user + room capabilities
 *   - anywhere else (GitHub Pages): Firebase anonymous auth + Firestore
 *
 * connect() resolves { backend } or { error } (a message to show the visitor).
 * backend: { uid, listen(cb, onErr), getMine(), save(data), remove(), cheer(), onCheer(cb), onCount(cb) }
 *   listen cb(docs, changed): docs = every entry newest first, changed = entries added or edited since the last call
 */
export async function connect() {
  if (window.claude && window.claude.use) return claudeBackend(window.claude);
  if (firebaseConfig) return firebaseBackend();
  return { error: '방명록이 아직 연결되지 않았어요.' };
}

/* ---------- claude.ai ---------- */
async function claudeBackend(C) {
  const [db, user, room] = await Promise.all([C.use('db'), C.use('user'), C.use('room')]);
  if (!db) return { error: '로그인하면 방명록을 보고 남길 수 있어요.' };
  const uid = user ? await user.id() : null;
  const col = db.collection('guestbook');
  const toObj = (d) => ({ id: d.id, ...d.data() });

  return {
    backend: {
      uid,
      listen(cb, onErr) {
        col.orderBy('at', 'desc').limit(200).onSnapshot(
          (s) => cb(s.docs.filter((d) => d.exists).map(toObj), s.docChanges().filter((c) => c.type !== 'removed').map((c) => toObj(c.doc))),
          onErr
        );
      },
      async getMine() {
        const s = await col.doc(uid).get().catch(() => null);
        return s && s.exists ? s.data() : null;
      },
      save: (data) => col.doc(uid).set(data),
      remove: () => col.doc(uid).delete(),
      cheer() {
        if (room) room.emit('cheer', {}).catch(() => {});
      },
      onCheer(cb) {
        if (room) room.on('cheer', (m) => !m.sameTab && cb());
      },
      onCount(cb) {
        if (room) room.onPeers((ch) => cb(ch.peers.filter((p) => p.kind === 'viewer').length));
      },
    },
  };
}

/* ---------- Firebase ---------- */
const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
const ALIVE_MS = 60000; // a presence heartbeat older than this counts as gone

async function firebaseBackend() {
  let app, fs, auth;
  try {
    [app, fs, auth] = await Promise.all([import(FB + 'firebase-app.js'), import(FB + 'firebase-firestore.js'), import(FB + 'firebase-auth.js')]);
  } catch {
    return { error: '방명록을 불러오지 못했어요. 네트워크를 확인해 주세요.' };
  }
  const { collection, doc, setDoc, deleteDoc, getDoc, onSnapshot, query, orderBy, limit } = fs;

  const fbApp = app.initializeApp(firebaseConfig);
  const store = fs.getFirestore(fbApp);
  let uid;
  try {
    uid = (await auth.signInAnonymously(auth.getAuth(fbApp))).user.uid;
  } catch {
    return { error: '방명록에 연결하지 못했어요. 잠시 후 새로고침해 주세요.' };
  }
  const mineRef = doc(store, 'guestbook', uid);
  const cheerRef = doc(store, 'live', 'cheer');
  const presRef = doc(store, 'presence', uid);
  const toObj = (d) => ({ id: d.id, ...d.data() });

  return {
    backend: {
      uid,
      listen(cb, onErr) {
        onSnapshot(
          query(collection(store, 'guestbook'), orderBy('at', 'desc'), limit(200)),
          (s) => cb(s.docs.map(toObj), s.docChanges().filter((c) => c.type !== 'removed').map((c) => toObj(c.doc))),
          onErr
        );
      },
      async getMine() {
        const s = await getDoc(mineRef).catch(() => null);
        return s && s.exists() ? s.data() : null;
      },
      save: (data) => setDoc(mineRef, data),
      remove: () => deleteDoc(mineRef),
      cheer() {
        setDoc(cheerRef, { at: Date.now(), by: uid }).catch(() => {});
      },
      onCheer(cb) {
        let first = true;
        onSnapshot(cheerRef, (s) => {
          if (first) return void (first = false); // skip the cheer that was already there
          const d = s.data();
          if (d && d.by !== uid && !s.metadata.hasPendingWrites) cb();
        });
      },
      onCount(cb) {
        // ponytail: heartbeat docs in Firestore; switch to Realtime Database onDisconnect if visitors reach the thousands
        const beat = () => !document.hidden && setDoc(presRef, { at: Date.now() }).catch(() => {});
        beat();
        setInterval(beat, 25000);
        document.addEventListener('visibilitychange', beat);
        addEventListener('pagehide', () => deleteDoc(presRef).catch(() => {}));
        let docs = [];
        const count = () => cb(Math.max(1, docs.filter((d) => Date.now() - d.at < ALIVE_MS).length));
        onSnapshot(collection(store, 'presence'), (s) => {
          docs = s.docs.map((d) => d.data());
          count();
        });
        setInterval(count, 15000);
      },
    },
  };
}
