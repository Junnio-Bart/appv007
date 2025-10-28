import { createContext, useContext, useEffect, useMemo, useState, createElement } from "react";

const KEY = "book:library:v2";

/* ===================== utilidades ===================== */
function normalizeBook(b) {
  const total = Number(b.pagesTotal ?? b.pages ?? 0);
  const read  = Number(b.pagesRead ?? 0);
  const isFull = total > 0 && read >= total;

  const out = {
    ...b,
    pagesTotal: total,
    pages: total,
    pagesRead: Math.max(0, Math.min(read, total)),
    journal: {
      entries: Array.isArray(b.journal?.entries) ? b.journal.entries : []
    }
  };

  if (isFull) {
    out.status = "lido";
    out.finishedAt = b.finishedAt ?? new Date().toISOString();
  } else {
    out.status = "lendo";
    out.finishedAt = undefined;
  }
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { books: [], activeId: null };
    const parsed = JSON.parse(raw);
    return {
      books: Array.isArray(parsed.books) ? parsed.books.map(normalizeBook) : [],
      activeId: parsed.activeId ?? null,
    };
  } catch {
    return { books: [], activeId: null };
  }
}
function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

/* ===================== contexto ===================== */
const LibraryCtx = createContext(null);

export function LibraryProvider({ children }) {
  const initial = load();
  const [books, setBooks] = useState(initial.books);
  const [activeId, setActiveId] = useState(initial.activeId ?? (initial.books[0]?.id ?? null));

  useEffect(() => { save({ books, activeId }); }, [books, activeId]);

  /* --------- ações --------- */
  function addBook({ title, author, pagesTotal, cover }) {
    const id = `b_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const total = Number(pagesTotal) || 0;
    const book = normalizeBook({
      id,
      title: String(title || "").trim() || "Sem título",
      author: String(author || "").trim(),
      pagesTotal: total,
      pages: total,
      pagesRead: 0,
      status: "lendo",
      cover: cover || null,
      coverVer: 0,
      createdAt: Date.now(),
      journal: { entries: [] },
    });
    setBooks(prev => [...prev, book]);
    setActiveId(id);
    return id;
  }

  function updateBook(id, patch) {
    setBooks(prev => prev.map(b => {
      if (b.id !== id) return b;

      const curTotal = Number(b.pagesTotal ?? b.pages ?? 0);
      const nextTotal = Number(patch.pagesTotal ?? patch.pages ?? curTotal);

      const curRead = Number(b.pagesRead ?? 0);
      const nextReadRaw = (patch.pagesRead != null) ? Number(patch.pagesRead) : curRead;
      const nextRead = Math.max(0, Math.min(nextReadRaw, nextTotal || curTotal));

      const coverChanged = patch.cover != null && patch.cover !== b.cover;

      return normalizeBook({
        ...b,
        ...patch,
        pagesTotal: nextTotal,
        pages: nextTotal,
        pagesRead: nextRead,
        coverVer: coverChanged ? ((b.coverVer || 0) + 1) : (b.coverVer || 0),
      });
    }));
  }

  function removeBook(id) {
    setBooks(prev => {
      const next = prev.filter(b => b.id !== id);
      setActiveId(a => (a === id ? (next[0]?.id ?? null) : a));
      return next;
    });
  }

  const current = useMemo(
    () => books.find(b => b.id === activeId) || books[0] || null,
    [books, activeId]
  );
  const activeBook = current;

  /* --------- diário --------- */
  function addDailyEntry(bookId, { dateISO = new Date().toISOString(), pages = 0, minutes = 0, rating = 0, note = "" }) {
    setBooks(prev => prev.map(b => {
      if (b.id !== bookId) return b;
      const entry = {
        id: crypto.randomUUID(),
        dateISO,
        pages: Math.max(0, Math.floor(pages)),
        minutes: Math.max(0, Math.floor(minutes)),
        rating: Math.max(0, Math.min(5, Math.floor(rating))),
        note: String(note || "").slice(0, 2000),
      };
      const entries = [...(b.journal?.entries || []), entry]
        .sort((a, c) => String(a.dateISO).localeCompare(String(c.dateISO)));
      return { ...b, journal: { entries } };
    }));
  }

  function updateEntry(bookId, entryId, patch) {
    setBooks(prev => prev.map(b => {
      if (b.id !== bookId) return b;
      const entries = (b.journal?.entries || []).map(e => e.id === entryId ? { ...e, ...patch } : e);
      return { ...b, journal: { entries } };
    }));
  }

  function removeEntry(bookId, entryId) {
    setBooks(prev => prev.map(b => {
      if (b.id !== bookId) return b;
      const entries = (b.journal?.entries || []).filter(e => e.id !== entryId);
      return { ...b, journal: { entries } };
    }));
  }

  function getEntries(bookId) {
    const b = books.find(x => x.id === bookId);
    const list = b?.journal?.entries || [];
    return list.slice().sort((a, b) => String(b.dateISO).localeCompare(String(a.dateISO)));
  }

  function getAverageRating(bookId) {
    const list = getEntries(bookId);
    if (!list.length) return 0;
    const sum = list.reduce((acc, e) => acc + (e.rating || 0), 0);
    return Math.round((sum / list.length) * 10) / 10;
  }

  const value = {
    books,
    setBooks,
    activeId,
    setActiveId,
    activeBook,
    current,
    addBook,
    updateBook,
    removeBook,
    addDailyEntry,
    updateEntry,
    removeEntry,
    getEntries,
    getAverageRating,
  };

  // 👇 usa createElement pra evitar JSX (assim pode continuar .js)
  return createElement(LibraryCtx.Provider, { value }, children);
}

/* hook */
export default function useLibrary() {
  const ctx = useContext(LibraryCtx);
  if (!ctx) throw new Error("useLibrary deve ser usado dentro de <LibraryProvider>");
  return ctx;
}
