// /src/hooks/useLibrary.js
import { useEffect, useMemo, useState } from "react";

const KEY = "book:library:v2";

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
      const raw = localStorage.getItem(KEY); // <-- KEY (corrigido)
      if (raw) {
        const { books: b = [], activeId: a = null } = JSON.parse(raw);
        setBooks(b);
        setActiveId(a ?? (b[0]?.id ?? null));
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
    const book = {
      id,
      title: title?.trim() || "Sem título",
      author: author?.trim() || "",
      pagesTotal: Number(pagesTotal) || 0,
      pagesRead: 0,
      cover: cover || null,
      createdAt: Date.now(),
    };
    setBooks(prev => [...prev, book]);
    setActiveId(id);
    return id;
  }

  function updateBook(id, patch) {
    setBooks(prev => prev.map(b => (b.id === id ? { ...b, ...patch } : b)));
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
  };
}
