// src/hooks/useBooksUnified.js
import { useEffect, useMemo, useState } from "react";

function normalizeBooks(raw = []) {
  return raw.map((b, i) => {
    const pages     = Number(b.pages ?? b.totalPages ?? 0) || 0;
    const pagesRead = Number(b.pagesRead ?? b.currentPage ?? b.readPages ?? 0) || 0;
    const finished  = b.finishedAt
      ? new Date(b.finishedAt).toISOString()
      : (pages > 0 && pagesRead >= pages ? (b.updatedAt ? new Date(b.updatedAt).toISOString() : null) : null);

    return {
      id: b.id || b._id || `bk-${i}`,
      title: b.title || b.name || "— sem título —",
      author: b.author ?? b.writer ?? "",
      pages,
      pagesRead,
      finishedAt: finished,      // usado pela estante
      cover: b.cover || b.image || "",
      status: b.status || (finished ? "lido" : "lendo"),
      progress: b.progress || [],
    };
  });
}

function readLocalStorageBooks(customKeys = []) {
  const defaults = ["reading-app-v4", "reading-app", "library", "books"];
  const keys = [...customKeys, ...defaults];
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return normalizeBooks(parsed);
      if (Array.isArray(parsed?.books)) return normalizeBooks(parsed.books);
      if (Array.isArray(parsed?.state?.books)) return normalizeBooks(parsed.state.books);
    } catch {}
  }
  return [];
}

/**
 * useBooksUnified
 * - Se receber booksFromStore, usa eles
 * - Senão, tenta ler do localStorage (chaves em localStorageKeys)
 */
export default function useBooksUnified({ booksFromStore, localStorageKeys = [] } = {}) {
  const [books, setBooks] = useState([]);

  const normalizedStore = useMemo(
    () => (booksFromStore?.length ? normalizeBooks(booksFromStore) : []),
    [booksFromStore]
  );

  useEffect(() => {
    if (normalizedStore.length) {
      setBooks(normalizedStore);
      return;
    }
    setBooks(readLocalStorageBooks(localStorageKeys));
  }, [normalizedStore, localStorageKeys]);

  return books;
}
