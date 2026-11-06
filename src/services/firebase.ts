import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Question, Subject, Feedback, AppNotification, LoginRecord, PresenceRecord } from '../types';
import { INITIAL_QUESTIONS, INITIAL_SUBJECTS, INITIAL_NOTIFICATIONS } from './initialData';

// Initialize Firebase App & Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'anonymous-client',
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Info: ', JSON.stringify(errInfo));
}

// Test initial connection per skill mandate
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client in offline/cache mode');
    }
  }
}
testConnection();

// Initial Local Storage Keys for fast, instantaneous offline loading & resilience
const STORAGE_KEYS = {
  QUESTIONS: 'mpq_cached_questions',
  SUBJECTS: 'mpq_cached_subjects',
  NOTIFICATIONS: 'mpq_cached_notifications',
  FEEDBACKS: 'mpq_cached_feedbacks',
  LOGINS: 'mpq_cached_logins',
  PRESENCE: 'mpq_cached_presence',
};

function getLocal<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota
  }
}

/**
 * Real-time Questions Listener with Fallback & Seed
 */
export function subscribeQuestions(callback: (questions: Question[]) => void) {
  // Immediately call with cached or initial data
  const cached = getLocal<Question[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
  callback(cached);

  const unsub = onSnapshot(
    collection(db, 'questions'),
    (snapshot) => {
      if (snapshot.empty) {
        // If empty in cloud, initialize with INITIAL_QUESTIONS
        seedQuestionsIfEmpty();
        callback(cached.length > 0 ? cached : INITIAL_QUESTIONS);
      } else {
        const questions: Question[] = [];
        snapshot.forEach((d) => {
          questions.push({ id: d.id, ...(d.data() as Omit<Question, 'id'>) });
        });
        questions.sort((a, b) => (a.order || 0) - (b.order || 0));
        setLocal(STORAGE_KEYS.QUESTIONS, questions);
        callback(questions);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'questions');
      callback(cached);
    }
  );

  return unsub;
}

/**
 * Seed initial questions into Firestore if database collection is empty
 */
async function seedQuestionsIfEmpty() {
  try {
    for (const q of INITIAL_QUESTIONS) {
      const qDoc = doc(db, 'questions', q.id || `q-${Math.random().toString(36).substring(2, 9)}`);
      await setDoc(qDoc, q, { merge: true });
    }
  } catch (err) {
    console.warn('Seeding note:', err);
  }
}

/**
 * Real-time Subjects Listener
 */
export function subscribeSubjects(callback: (subjects: Subject[]) => void) {
  const cached = getLocal<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  callback(cached);

  const unsub = onSnapshot(
    collection(db, 'subjects'),
    (snapshot) => {
      if (snapshot.empty) {
        seedSubjectsIfEmpty();
        callback(cached.length > 0 ? cached : INITIAL_SUBJECTS);
      } else {
        const subs: Subject[] = [];
        snapshot.forEach((d) => {
          subs.push({ id: d.id, ...(d.data() as Omit<Subject, 'id'>) });
        });
        subs.sort((a, b) => (a.order || 0) - (b.order || 0));
        setLocal(STORAGE_KEYS.SUBJECTS, subs);
        callback(subs);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'subjects');
      callback(cached);
    }
  );

  return unsub;
}

async function seedSubjectsIfEmpty() {
  try {
    for (const sub of INITIAL_SUBJECTS) {
      await setDoc(doc(db, 'subjects', sub.id), sub, { merge: true });
    }
  } catch (err) {
    console.warn('Seed subjects note:', err);
  }
}

/**
 * Real-time Notifications Listener
 */
export function subscribeNotifications(callback: (notifications: AppNotification[]) => void) {
  const cached = getLocal<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  callback(cached);

  const unsub = onSnapshot(
    collection(db, 'notifications'),
    (snapshot) => {
      if (!snapshot.empty) {
        const notifs: AppNotification[] = [];
        snapshot.forEach((d) => {
          notifs.push({ id: d.id, ...(d.data() as Omit<AppNotification, 'id'>) });
        });
        notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLocal(STORAGE_KEYS.NOTIFICATIONS, notifs);
        callback(notifs);
      } else {
        callback(cached);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'notifications');
      callback(cached);
    }
  );

  return unsub;
}

/**
 * Real-time Feedback Listener
 */
export function subscribeFeedbacks(callback: (feedbacks: Feedback[]) => void) {
  const cached = getLocal<Feedback[]>(STORAGE_KEYS.FEEDBACKS, []);
  callback(cached);

  const unsub = onSnapshot(
    collection(db, 'feedbacks'),
    (snapshot) => {
      const items: Feedback[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<Feedback, 'id'>) });
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLocal(STORAGE_KEYS.FEEDBACKS, items);
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'feedbacks');
      callback(cached);
    }
  );

  return unsub;
}

/**
 * Real-time Logins Listener (for Admin view)
 */
export function subscribeLogins(callback: (logins: LoginRecord[]) => void) {
  const cached = getLocal<LoginRecord[]>(STORAGE_KEYS.LOGINS, []);
  callback(cached);

  const unsub = onSnapshot(
    collection(db, 'logins'),
    (snapshot) => {
      const items: LoginRecord[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<LoginRecord, 'id'>) });
      });
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLocal(STORAGE_KEYS.LOGINS, items);
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'logins');
      callback(cached);
    }
  );

  return unsub;
}

/**
 * Real-time Presence Listener (for Online active count)
 */
export function subscribePresence(callback: (presence: PresenceRecord[]) => void) {
  const cached = getLocal<PresenceRecord[]>(STORAGE_KEYS.PRESENCE, []);
  callback(cached);

  const unsub = onSnapshot(
    collection(db, 'presence'),
    (snapshot) => {
      const items: PresenceRecord[] = [];
      const now = Date.now();
      snapshot.forEach((d) => {
        const item = { id: d.id, ...(d.data() as Omit<PresenceRecord, 'id'>) };
        // Filter users active in last 5 minutes (300,000 ms)
        if (now - new Date(item.lastSeen).getTime() < 300000) {
          items.push(item);
        }
      });
      setLocal(STORAGE_KEYS.PRESENCE, items);
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'presence');
      callback(cached);
    }
  );

  return unsub;
}

// ---------------- Database Actions ----------------

export async function addQuestion(q: Omit<Question, 'id'>) {
  const id = `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newQuestion: Question = { ...q, id };
  try {
    await setDoc(doc(db, 'questions', id), newQuestion);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'questions');
    // Save to local cache as fallback
    const cached = getLocal<Question[]>(STORAGE_KEYS.QUESTIONS, []);
    setLocal(STORAGE_KEYS.QUESTIONS, [...cached, newQuestion]);
  }
  return newQuestion;
}

export async function updateQuestion(id: string, updates: Partial<Question>) {
  try {
    await updateDoc(doc(db, 'questions', id), updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `questions/${id}`);
    const cached = getLocal<Question[]>(STORAGE_KEYS.QUESTIONS, []);
    setLocal(
      STORAGE_KEYS.QUESTIONS,
      cached.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  }
}

export async function deleteQuestion(id: string) {
  try {
    await deleteDoc(doc(db, 'questions', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `questions/${id}`);
    const cached = getLocal<Question[]>(STORAGE_KEYS.QUESTIONS, []);
    setLocal(
      STORAGE_KEYS.QUESTIONS,
      cached.filter((q) => q.id !== id)
    );
  }
}

/**
 * Swap two questions positions (e.g. swap position of Q1 and Q8)
 */
export async function swapQuestions(q1: Question, q2: Question) {
  if (!q1.id || !q2.id) return;
  const tempOrder = q1.order ?? 0;
  const newOrder2 = q2.order ?? 0;

  await updateQuestion(q1.id, { order: newOrder2 });
  await updateQuestion(q2.id, { order: tempOrder });
}

export async function addSubject(sub: Omit<Subject, 'id'>) {
  const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newSub: Subject = { ...sub, id };
  try {
    await setDoc(doc(db, 'subjects', id), newSub);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'subjects');
  }
  return newSub;
}

export async function updateSubject(id: string, updates: Partial<Subject>) {
  try {
    await updateDoc(doc(db, 'subjects', id), updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `subjects/${id}`);
  }
}

export async function deleteSubject(id: string) {
  try {
    await deleteDoc(doc(db, 'subjects', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `subjects/${id}`);
  }
}

export async function recordLogin(username: string, passwordUsed: string, role: 'user' | 'admin') {
  const id = `login-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const record: LoginRecord = {
    id,
    username,
    passwordUsed,
    timestamp: new Date().toISOString(),
    role,
  };
  try {
    await setDoc(doc(db, 'logins', id), record);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'logins');
  }
}

export async function updatePresenceHeartbeat(username: string, role: 'user' | 'admin') {
  const safeId = `user-${encodeURIComponent(username).replace(/%/g, '_')}`;
  const record: PresenceRecord = {
    id: safeId,
    username,
    role,
    lastSeen: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'presence', safeId), record, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'presence');
  }
}

export async function submitFeedback(username: string, text: string) {
  const id = `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const item: Feedback = {
    id,
    username,
    text,
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'feedbacks', id), item);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'feedbacks');
  }
  return item;
}

export async function broadcastNotification(message: string, type: 'info' | 'success' | 'warning' = 'info') {
  const id = `notif-${Date.now()}`;
  const item: AppNotification = {
    id,
    message,
    timestamp: new Date().toISOString(),
    type,
  };
  try {
    await setDoc(doc(db, 'notifications', id), item);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'notifications');
  }
  return item;
}
