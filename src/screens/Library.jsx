// src/screens/Library.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import useLibrary from "../hooks/useLibrary.js";
import NewBookModal from "../components/NewBookModal.jsx";
import EditPagesModal from "../components/EditPagesModal.jsx";
import ModalMount from "../components/ModalMount.jsx";
import s from "./Library.module.css";

// helpers fora do componente (não são hooks)
function cssNum(varName, fallback = 0) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName);
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}
function clientXof(e) {
  return e?.clientX ?? e?.touches?.[0]?.clientX ?? e?.changedTouches?.[0]?.clientX ?? 0;
}

export default function Library({ onGoProgress }) {
  const { books, activeId, setActiveId, addBook, updateBook } = useLibrary();

  // -------- estado local --------
  const [showNewBook, setShowNewBook] = useState(false);
  const [showPages, setShowPages] = useState(false);

  // fila real: livros + card “novo” no fim
  const items = useMemo(() => [...books, { id: "__NEW__", isNew: true }], [books]);

  // índice atual baseado no activeId
  const [index, setIndex] = useState(() => {
    const i = items.findIndex((it) => it.id === activeId);
    return i >= 0 ? i : 0;
  });

  // quando activeId mudar (ex.: depois de salvar), sincroniza índice
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
    else {
      setActiveId(current.id);
      onGoProgress?.();
    }
  }

  // clicar em um slide lateral leva ao centro (ou abre se já for o centro)
  const didDragRef = useRef(false);
  function handleSlideClick(i) {
    if (didDragRef.current) return; // ignorar tap depois de um drag
    if (i === index) {
      handleCenterClick();
    } else {
      setIndex(i);
      const it = items[i];
      if (it && !it.isNew) setActiveId(it.id);
    }
  }

  // ---------- swipe/drag unificado (pointer) ----------
  const viewportRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [dx, setDx] = useState(0);

  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);

  function onPointerDown(e) {
    const x = clientXof(e);
    startXRef.current = x;
    lastXRef.current = x;
    lastTRef.current = performance.now();
    didDragRef.current = false;
    setDragging(true);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const x = clientXof(e);
    const now = performance.now();
    const dist = x - startXRef.current;

    // considera como drag se passou do limiar
    if (Math.abs(dist) > 6) didDragRef.current = true;
    e.preventDefault();

    setDx(dist);
    lastXRef.current = x;
    lastTRef.current = now;
  }

  function finishGesture() {
    setDragging(false);
    setDx(0);
  }

  function onPointerUp(e) {
    if (!dragging) return;

    const x = clientXof(e);
    const dt = Math.max(1, performance.now() - lastTRef.current);
    const vx = (x - lastXRef.current) / dt; // px/ms
    const dist = x - startXRef.current;

    const cardW   = cssNum("--card-w", 200);
    const DIST_TH = cardW * 0.28;   // ~28% do card
    const SPEED_TH = 0.45;          // 0.45 px/ms
    const TAP_TH   = 8;

    // TAP (terços laterais navegam, centro deixa o click do botão agir)
    if (Math.abs(dist) <= TAP_TH && !didDragRef.current) {
      const vp = viewportRef.current?.getBoundingClientRect();
      if (vp) {
        const rel = e.clientX - vp.left;
        if (rel < vp.width * 0.33 && prevIndex != null) {
          didDragRef.current = true;
          goPrev();
        } else if (rel > vp.width * 0.67 && nextIndex != null) {
          didDragRef.current = true;
          goNext();
        }
      }
      finishGesture();
      return;
    }

    // SWIPE → distância/velocidade
    if ((dist < -DIST_TH) || (vx < -SPEED_TH)) {
      didDragRef.current = true;
      goNext();
    } else if ((dist > DIST_TH) || (vx > SPEED_TH)) {
      didDragRef.current = true;
      goPrev();
    }
    finishGesture();
  }

  function onPointerCancel() { finishGesture(); }
  function onPointerLeave()  { if (dragging) finishGesture(); }

  // ---------- render de 1 slide ----------
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

  // ---------- chip de progresso ----------
  const read = Number(current?.pagesRead || 0);
  const total = Number(current?.pagesTotal || 0);
  const pct = total > 0 ? Math.round((read / total) * 100) : 0;
  const bandClass =
    pct < 40 ? s.pRed : pct < 65 ? s.pYellow : pct < 85 ? s.pGreen : s.pBlue;

  return (
    <section
      className={`section ${s.lib}`}
      aria-label="Biblioteca"
      style={{
        "--panel-h": "min(480px, calc(100dvh - var(--header-h) - 16px))",
        "--shelf-h": "min(280px, calc(var(--panel-h) - 140px))",
        "--card-w": "200px",
        "--gap": "12px",
        "--peek": "64px",
      }}
    >
      <div className={s.libBox}>
        {/* viewport + trilha */}
        <div
          ref={viewportRef}
          className={[s.viewport, dragging ? s.dragging : ""].join(" ")}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerLeave}
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

          <button
            className={`${s.nav} ${s.left}`}
            onClick={goPrev}
            disabled={prevIndex == null}
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            className={`${s.nav} ${s.right}`}
            onClick={goNext}
            disabled={nextIndex == null}
            aria-label="Próximo"
          >
            ›
          </button>
        </div>

        {/* título / autor / chip */}
        {current?.isNew || isEmpty ? (
          <>
            <h2 className={`${s.libTitle} ${s.titleAdd}`}>Adicione um livro</h2>
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

      {/* Modais */}
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

      <ModalMount open={showPages}>
        <EditPagesModal
          open={showPages}
          book={current?.isNew ? null : current}
          onClose={() => setShowPages(false)}
          onSave={({ pagesRead, pagesTotal }) => {
            if (updateBook && current && !current.isNew) {
              updateBook(current.id, { pagesRead, pagesTotal });
            }
            setShowPages(false);
          }}
        />
      </ModalMount>
    </section>
  );
}


