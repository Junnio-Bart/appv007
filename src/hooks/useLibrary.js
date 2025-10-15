// /src/hooks/useLibrary.js
import { useEffect, useMemo, useState } from "react";

const KEY = "book:library:v2";

function normalizeBook(b){
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
      books: Array.isArray(parsed.books) ? parsed.books : [],
      activeId: parsed.activeId ?? null,
    };
  } catch {
    return { books: [], activeId: null };
  }
}
function save(state) { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }

export default function useLibrary() {
  const [books, setBooks] = useState(() => load().books);
  const [activeId, setActiveId] = useState(() => load().activeId);

  // carregar 1x
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const { books: b = [], activeId: a = null } = JSON.parse(raw);
        // saneia livros incoerentes (ex.: finishedAt setado mas não completo)
        const sane = b.map(normalizeBook);
        setBooks(sane);
        setActiveId(a ?? (sane[0]?.id ?? null));
      }
    } catch (e) {
      console.warn("Falha ao ler storage:", e);
    }
  }, []);
  

  // salvar sempre que mudar
  useEffect(() => { save({ books, activeId }); }, [books, activeId]);

  // helpers
  function addBook({ title, author, pagesTotal, cover }) {
    const id = `b_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const total = Number(pagesTotal) || 0;
    const book = {
      id,
      title: title?.trim() || "Sem título",
      author: author?.trim() || "",
      pagesTotal: total,   // usado no Progress
      pages: total,        // alguns lugares usam "pages" (Journal)
      pagesRead: 0,
      status: "lendo",
      cover: cover || null,
      createdAt: Date.now(),
    };
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
  
      return normalizeBook({
        ...b,
        ...patch,
        pagesTotal: nextTotal,
        pages: nextTotal,
        pagesRead: nextRead,
      });
    }));
  }
  

  function removeBook(id) {
    setBooks(prev => prev.filter(b => b.id !== id));
    setActiveId(prev => (prev === id ? (books[0]?.id ?? null) : prev));
  }

  const current = useMemo(
    () => books.find(b => b.id === activeId) || books[0] || null,
    [books, activeId]
  );
  const activeBook = current; // alias

  // ---------- Diário ----------
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
      const entries = [...(b.journal?.entries || []), entry].sort((a, c) => a.dateISO.localeCompare(c.dateISO));
      return { ...b, journal: { entries } };
    }));
  }

  function updateEntry(bookId, entryId, patch){
    setBooks(prev => prev.map(b => {
      if (b.id !== bookId) return b;
      const entries = (b.journal?.entries || []).map(e => e.id === entryId ? { ...e, ...patch } : e);
      return { ...b, journal: { entries } };
    }));
  }

  function removeEntry(bookId, entryId){
    setBooks(prev => prev.map(b => {
      if (b.id !== bookId) return b;
      const entries = (b.journal?.entries || []).filter(e => e.id !== entryId);
      return { ...b, journal: { entries } };
    }));
  }

  function getEntries(bookId){
       const b = books.find(x => x.id === bookId);
       const list = b?.journal?.entries || [];
       // mais recentes primeiro
       return list.slice().sort((a, b) =>
         String(b.dateISO || "").localeCompare(String(a.dateISO || ""))
       );
     }

  function getAverageRating(bookId){
    const list = getEntries(bookId);
    if (!list.length) return 0;
    const sum = list.reduce((acc,e)=> acc + (e.rating||0), 0);
    return Math.round((sum / list.length) * 10) / 10;
  }


  return {
    books,
    current,
    activeBook,
    activeId,
    setActiveId,
    addBook,
    updateBook,
    removeBook,
    setBooks,

    // diário:
    addDailyEntry, 
    updateEntry, 
    removeEntry, 
    getEntries, 
    getAverageRating,
  };
}
