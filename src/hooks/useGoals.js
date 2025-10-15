import { useCallback, useSyncExternalStore } from "react";

const LS_KEY = "reading-goals-v1";

/* ---------- snapshot em memória (cache) ---------- */
function readFromLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
}
let current = readFromLS();                 // <- cache
const listeners = new Set();

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot() {                    // <- sempre mesma referência
  return current;
}
function writeSnapshot(next) {              // <- troca a referência e notifica
  current = next;
  localStorage.setItem(LS_KEY, JSON.stringify(next));
  listeners.forEach(fn => fn());
}

/* ---------- helpers ---------- */
const ymKey = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;

function finishedAtOf(b) {
  const pages = Number(b.pages ?? b.totalPages ?? b.pageCount ?? 0) || 0;
  const read  = Number(b.pagesRead ?? b.currentPage ?? b.readPages ?? 0) || 0;
  if (b.finishedAt) return new Date(b.finishedAt);
  if (pages > 0 && read >= pages && b.updatedAt) return new Date(b.updatedAt);
  return null;
}

export function countFinishedInMonth(books, y, m) {
  return (books || []).reduce((acc, b) => {
    const d = finishedAtOf(b);
    return acc + (d && d.getFullYear() === y && d.getMonth() === m ? 1 : 0);
  }, 0);
}
export function countFinishedInYear(books, y) {
  return (books || []).reduce((acc, b) => {
    const d = finishedAtOf(b);
    return acc + (d && d.getFullYear() === y ? 1 : 0);
  }, 0);
}

/* ---------- hook público ---------- */
export default function useGoals() {
  // getSnapshot retorna SEMPRE a mesma ref até writeSnapshot()
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setMonthlyGoal = useCallback((y, m, val) => {
    const snap = getSnapshot(); // usa o cache atual
    const next = {
      monthly: { ...(snap.monthly || {}) },
      yearly:  { ...(snap.yearly  || {}) },
    };
    next.monthly[ymKey(y, m)] = Math.max(0, Number(val) || 0);
    writeSnapshot(next);
  }, []);

  const getMonthlyGoal = useCallback((y, m) => {
    const snap = getSnapshot();
    return snap.monthly?.[ymKey(y, m)] ?? 0;
  }, []);

  const setYearlyGoal = useCallback((y, val) => {
    const snap = getSnapshot();
    const next = {
      monthly: { ...(snap.monthly || {}) },
      yearly:  { ...(snap.yearly  || {}) },
    };
    next.yearly[String(y)] = Math.max(0, Number(val) || 0);
    writeSnapshot(next);
  }, []);

  const getYearlyGoal = useCallback((y) => {
    const snap = getSnapshot();
    return snap.yearly?.[String(y)] ?? 0;
  }, []);

  return { getMonthlyGoal, setMonthlyGoal, getYearlyGoal, setYearlyGoal };
}
