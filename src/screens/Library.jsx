// src/screens/Library.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import useLibrary from "../hooks/useLibrary.js";
import NewBookModal from "../components/NewBookModal.jsx";
import EditPagesModal from "../components/EditPagesModal.jsx";
import ModalMount from "../components/ModalMount.jsx";
import s from "./Library.module.css";

const SWIPE_START = 8;   // px para considerar que saiu de "tap"
const SWIPE_COMMIT = 40; // px para trocar de slide

export default function Library({ onGoProgress }) {
  // precisa de updateBook no seu useLibrary
  const { books, activeId, setActiveId, addBook, updateBook } = useLibrary();

  const [showNewBook, setShowNewBook] = useState(false);
  const [showPages, setShowPages] = useState(false);

  // trilho real: livros + card "+" no final (sem loop infinito)
  const items = useMemo(() => [...books, { id: "__NEW__", isNew: true }], [books]);

  // índice atual baseado no activeId
  const [index, setIndex] = useState(() => {
    const i = items.findIndex((it) => it.id === activeId);
    return i >= 0 ? i : 0;
  });

  // sincroniza quando activeId mudar (ex.: depois de salvar)
  useEffect(() => {
    const i = items.findIndex((it) => it.id === activeId);
    if (i >= 0 && i !== index) setIndex(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, items]);

  const isEmpty = books.length === 0;
  const current = items[index];
  const prevIndex = index > 0 ? index - 1 : null;
  const nextIndex = index < items.length - 1 ? index + 1 : null;

  // ---------- navegação por setas ----------
  function goPrev() {
    if (prevIndex == null) return;
    setIndex(prevIndex);
    const it = items[prevIndex];
    if (it && !it.isNew) setActiveId(it.id);
  }
  function goNext() {
    if (nextIndex == null) return;
    setIndex(nextIndex);
    const it = items[nextIndex];
    if (it && !it.isNew) setActiveId(it.id);
  }

  function handleCenterClick() {
    if (current?.isNew) setShowNewBook(true);
    else { setActiveId(current.id); onGoProgress?.(); }
  }

  // clicar num slide lateral traz pro centro
  function handleSlideClick(i) {
    if (i === index) handleCenterClick();
    else {
      setIndex(i);
      const it = items[i];
      if (it && !it.isNew) setActiveId(it.id);
    }
  }

  // ---------- drag / swipe (tap + swipe coexistem) ----------
  const [dragging, setDragging] = useState(false);
  const [dx, setDx] = useState(0);
  const startXRef = useRef(0);
  const movedRef = useRef(false);

  function getX(e) {
    return e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
  }

  function onPointerDown(e) {
    startXRef.current = getX(e);
    movedRef.current = false;
    setDragging(true);
  }
  function onPointerMove(e) {
    if (!dragging) return;
    const x = getX(e);
    const delta = x - startXRef.current;
    if (!movedRef.current && Math.abs(delta) > SWIPE_START) {
      movedRef.current = true; // passou do “tap”
    }
    setDx(delta);
  }
  function endGesture(commit = false) {
    setDragging(false);
    setDx(0);
    movedRef.current = false;
  }
  function onPointerUp() {
    if (!dragging) return;
    if (movedRef.current) {
      if (dx < -SWIPE_COMMIT && nextIndex != null) goNext();
      else if (dx > SWIPE_COMMIT && prevIndex != null) goPrev();
    }
    endGesture();
  }
  function onPointerCancel() { endGesture(); }

  // um slide (capa ou +)
  const renderSlide = (it, i) => {
    const isCenter = i === index;
    const cls = [
      s.slide,
      it.isNew ? s.plus : s.card,
      isCenter ? s.isCenter : s.isSide,
    ].join(" ");

    return (
      <button
        key={it.id || `i-${i}`}
        type="button"
        className={cls}
        onClick={() => handleSlideClick(i)}
        aria-label={it.isNew ? "Adicionar livro" : `Abrir ${it.title || "Livro"}`}
      >
        {it.isNew ? (
          <span className={s.plusMark}>+</span>
        ) : it.cover ? (
          <img className={s.cover} src={it.cover} alt={it.title || ""} />
        ) : (
          <div className={s.coverPlaceholder}>📘</div>
        )}
      </button>
    );
  };

  // chip (cores por banda)
  const read = Number(current?.pagesRead || 0);
  const total = Number(current?.pagesTotal || 0);
  const pct = total > 0 ? Math.round((read / total) * 100) : 0;
  const bandClass = pct < 40 ? s.pRed : pct < 65 ? s.pYellow : pct < 85 ? s.pGreen : s.pBlue;

  return (
    <section
      className={`section ${s.lib}`}
      aria-label="Biblioteca"
      style={{
        // knobs inline – ajuste se quiser sobrescrever os do CSS
        "--panel-h": "640px",
        "--shelf-h": "420px",
        "--card-w": "168px",
        "--peek": "60px",
        "--gap": "12px",
      }}
    >
      <div className={s.libBox}>
        {/* viewport + trilho real */}
        <div
          className={[s.viewport, dragging ? s.dragging : ""].join(" ")}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        >
          <div
            className={s.track}
            style={{ "--index": index, "--dx": `${dx}px` }}
          >
            {items.map((it, i) => renderSlide(it, i))}
          </div>

          {/* setas (opcionais) */}
          <button className={`${s.nav} ${s.left}`}  onClick={goPrev} disabled={prevIndex == null} aria-label="Anterior">‹</button>
          <button className={`${s.nav} ${s.right}`} onClick={goNext} disabled={nextIndex == null} aria-label="Próximo">›</button>
        </div>

        {/* título / autor / chip */}
        {current?.isNew || isEmpty ? (
          <>
            <h2 className={s.libTitle}>Adicione um livro</h2>
            <div className={s.libChip}>??? / ???</div>
          </>
        ) : (
          <>
            <h2 className={s.libTitle}>{current.title}</h2>
            {current.author && <p className={s.libAuthor}>{current.author}</p>}
            <button
              type="button"
              className={`${s.libChip} ${bandClass}`}
              onClick={() => setShowPages(true)}
              aria-label="Editar páginas lidas/total"
              title="Editar páginas lidas/total"
            >
              {read} / {total}
            </button>
          </>
        )}
      </div>

      {/* Modal: novo livro */}
      <ModalMount open={showNewBook}>
        <NewBookModal
          open={showNewBook}
          onClose={() => setShowNewBook(false)}
          onSave={(data) => { addBook(data); setShowNewBook(false); }}
        />
      </ModalMount>

      {/* Modal: editar páginas */}
      <ModalMount open={showPages}>
        <EditPagesModal
          open={showPages}
          book={current?.isNew ? null : current}
          onClose={() => setShowPages(false)}
          onSave={({ pagesRead, pagesTotal }) => {
            if (updateBook && current && !current.isNew) {
              updateBook(current.id, { pagesRead, pagesTotal });
            } else {
              console.warn("Faltou updateBook no useLibrary()");
            }
            setShowPages(false);
          }}
        />
      </ModalMount>
    </section>
  );
}
