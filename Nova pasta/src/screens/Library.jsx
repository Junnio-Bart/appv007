// src/screens/Library.jsx
import { useEffect, useMemo, useState } from "react";
import useLibrary from "../hooks/useLibrary.js";
import NewBookModal from "../components/NewBookModal.jsx";
import ModalMount from "../components/ModalMount.jsx";
import s from "./Library.module.css";

const SLIDE_MS = 320; // combine com o CSS

export default function Library({ onGoProgress }) {
  const { books, activeId, setActiveId, addBook } = useLibrary();

  // ---- TODOS os hooks no topo (ordem fixa) ----
  const [showNewBook, setShowNewBook] = useState(false);
  const [anim, setAnim] = useState(null);                        // "next" | "prev" | null
  const [roles, setRoles] = useState(["left", "center", "right"]); // papéis dos 3 nós fixos

  // fila = livros + item "novo" no fim
  const items = useMemo(() => [...books, { id: "__NEW__", isNew: true }], [books]);

  // índice central sincronizado com activeId
  const [centerIndex, setCenterIndex] = useState(() => {
    const i = items.findIndex((it) => it.id === activeId);
    return i >= 0 ? i : 0;
  });
  useEffect(() => {
    const i = items.findIndex((it) => it.id === activeId);
    if (i >= 0 && i !== centerIndex) setCenterIndex(i);
  }, [activeId, items, centerIndex]);

  // índices com wrap-around
  const prevIndex = (centerIndex - 1 + items.length) % items.length;
  const nextIndex = (centerIndex + 1) % items.length;

  // rotação de papéis após a animação (laterais viram centro)
  const rotateRolesNext = (arr) => [arr[2], arr[0], arr[1]];
  const rotateRolesPrev = (arr) => [arr[1], arr[2], arr[0]];

  function goNext() {
    if (anim) return;
    setAnim("next");
    setTimeout(() => {
      setCenterIndex((i) => (i + 1) % items.length);
      setRoles((r) => rotateRolesNext(r));
      setActiveId(items[nextIndex].id);
      setAnim(null);
    }, SLIDE_MS);
  }
  function goPrev() {
    if (anim) return;
    setAnim("prev");
    setTimeout(() => {
      setCenterIndex((i) => (i - 1 + items.length) % items.length);
      setRoles((r) => rotateRolesPrev(r));
      setActiveId(items[prevIndex].id);
      setAnim(null);
    }, SLIDE_MS);
  }

  function handleCenterClick() {
    const cur = items[centerIndex];
    if (cur.isNew) setShowNewBook(true);
    else { setActiveId(cur.id); onGoProgress?.(); }
  }

  const renderCover = (it) => {
    if (!it) return null;
    if (it.isNew) return <span className={s.sidePlus}>+</span>;
    if (it.cover) return <img src={it.cover} alt={it.title || ""} className={s.centerCover} />;
    return <div className={s.coverPlaceholder}>📘</div>;
  };

  // ===== RENDER =====
  const isEmpty = books.length === 0;

  return (
    <section
      className={`section ${s.lib}`}
      style={{ "--lib-box-h": "60dvh", "--lib-offset-y": "-4vh", "--shelf-w": "400px" }}
    >
      <div className={s.libBox}>
        <div
          className={[
            s.shelfEmpty,
            anim === "next" ? s.slidingNext : "",
            anim === "prev" ? s.slidingPrev : "",
          ].join(" ")}
        >
          {/* LEFT */}
          <button
            type="button"
            className={`${s.sideCard} ${s.left}`}
            onClick={goPrev}
            disabled={isEmpty}
            aria-label="Anterior"
          >
            {renderCover(isEmpty ? null : items[prevIndex])}
          </button>

          {/* CENTER */}
          <button
            type="button"
            className={
              (isEmpty || items[centerIndex]?.isNew) ? s.centerPlusCard : s.centerCard
            }
            onClick={handleCenterClick}
            aria-label={
              (isEmpty || items[centerIndex]?.isNew)
                ? "Adicionar livro"
                : `Abrir ${items[centerIndex]?.title || "Livro"}`
            }
          >
            {!isEmpty && !items[centerIndex]?.isNew && renderCover(items[centerIndex])}
          </button>

          {/* RIGHT */}
          <button
            type="button"
            className={`${s.sideCard} ${s.right}`}
            onClick={goNext}
            disabled={isEmpty}
            aria-label="Próximo"
          >
            {renderCover(isEmpty ? null : items[nextIndex])}
          </button>
        </div>

        {/* Título + chip */}
        {isEmpty || items[centerIndex]?.isNew ? (
          <>
            <h2 className={s.libTitle}>Adicione um livro</h2>
            <div className={s.libChip}>??? / ???</div>
          </>
        ) : (
          <>
            <h2 className={s.libTitle}>{items[centerIndex].title}</h2>
            <div className={s.libChip}>
              {items[centerIndex].pagesRead || 0} / {items[centerIndex].pagesTotal || 0}
            </div>
          </>
        )}
      </div>

      {/* Modal único */}
      <ModalMount open={showNewBook}>
        <NewBookModal
          open={showNewBook}
          onClose={() => setShowNewBook(false)}
          onSave={(data) => {
            addBook(data);
            setShowNewBook(false);
          }}
        />
      </ModalMount>
    </section>
  );
}
