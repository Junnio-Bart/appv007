// src/hooks/useLibrary.js
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "book.app.v1";

export default function useLibrary() {
  const [books, setBooks] = useState([]);
  const [activeId, setActiveId] = useState(null);

  // Carregar 1x
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { books: b = [], activeId: a = null } = JSON.parse(raw);
        setBooks(b);
        setActiveId(a ?? (b[0]?.id ?? null));
      }
    } catch (e) {
      console.warn("Falha ao ler storage:", e);
    }
  }, []);

  // Salvar sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ books, activeId, updatedAt: Date.now() })
      );
    } catch (e) {
      console.warn("Falha ao salvar storage:", e);
    }
  }, [books, activeId]);

  const addBook = (data) => {
    const id =
      (globalThis.crypto?.randomUUID?.() ?? String(Date.now()));
    const book = {
      id,
      title: data.title?.trim() || "Sem título",
      pagesTotal: Number(data.pagesTotal) || 0,
      pagesRead: Number(data.pagesRead) || 0,
      cover: data.cover || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setBooks((prev) => [...prev, book]);
    setActiveId(id);
  };

  const updateBook = (id, patch) => {
    setBooks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, ...patch, updatedAt: Date.now() } : b
      )
    );
  };

  const removeBook = (id) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
  };

  const current = useMemo(
    () => books.find((b) => b.id === activeId) || books[0] || null,
    [books, activeId]
  );

  return {
    books,
    current,
    activeId,
    setActiveId,
    addBook,
    updateBook,
    removeBook,
    setBooks,         // << vamos usar no sync com o Drive
  };
}
