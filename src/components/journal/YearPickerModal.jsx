// src/components/journal/YearPickerModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import css from "./YearPickerModal.module.css";

export default function YearPickerModal({
  open,
  year,                 // ano atualmente selecionado (vem do calendário)
  onSelect,             // (y:number) => void   | selecionar ano
  onClose,              // () => void           | fechar modal
}) {
  const nowYear = useMemo(() => new Date().getFullYear(), []);
  const [center, setCenter] = useState(year || nowYear);

  // sempre que abrir ou o ano mudar externamente, centraliza nele
  useEffect(() => {
    if (open) setCenter(Number.isFinite(year) ? year : nowYear);
  }, 
  [open, year, nowYear]);

  const isFuture = (y) => y > nowYear;

  // navegação pelas setas
  const canGoRight = center < nowYear;         // se centro == ano atual, direita trava
  const goLeft  = () => setCenter((c) => c - 1);
  const goRight = () => { if (canGoRight) setCenter((c) => c + 1); };

  // selecionar
  const handlePick = (y) => {
    if (isFuture(y)) return;
    onSelect?.(y);
    onClose?.();
  };

  // arrastar para trocar centro (swipe)
  const rowRef = useRef(null);
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    let startX = 0;
    let movedX = 0;
    let dragging = false;

    const onDown = (e) => {
      dragging = true;
      startX = (e.touches?.[0]?.clientX ?? e.clientX);
      movedX = 0;
    };
    const onMove = (e) => {
      if (!dragging) return;
      const x = (e.touches?.[0]?.clientX ?? e.clientX);
      movedX = x - startX;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      const TH = 40; // px
      if (movedX <= -TH) { goRight(); }   // arrastou para a esquerda → próximo
      if (movedX >=  TH) { goLeft();  }   // arrastou para a direita → anterior
    };

    el.addEventListener("pointerdown", onDown, { passive: true });
    el.addEventListener("pointermove", onMove,  { passive: true });
    el.addEventListener("pointerup",   onUp,    { passive: true });
    el.addEventListener("pointercancel", onUp,  { passive: true });
    el.addEventListener("touchstart", onDown, { passive: true });
    el.addEventListener("touchmove",  onMove,  { passive: true });
    el.addEventListener("touchend",   onUp,    { passive: true });

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("touchstart", onDown);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onUp);
    };
  }, [canGoRight]);

  if (!open) return null;

  const years = [center - 1, center, center + 1];

  return (
    <div className={css.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={css.card} onClick={(e) => e.stopPropagation()}>
        <h3 className={css.title}>Ano</h3>

        <div className={css.dial}>
          <button
            type="button"
            className={`${css.arrow} ${css.playLeft}`}
            onClick={goLeft}
            aria-label="Ano anterior"
          />
          <div className={css.yearsRow} ref={rowRef}>
            {years.map((y, idx) => {
              const isCenter = idx === 1;
              const disabled = isFuture(y);
              return (
                <button
                  key={y}
                  type="button"
                  className={[
                    css.yearBtn,
                    isCenter ? css.isCenter : css.isSide,
                    disabled ? css.disabled : "",
                  ].join(" ")}
                  onClick={() => handlePick(y)}
                  disabled={disabled}
                >
                  {y}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={[
              css.arrow,
              css.playRight,
              !canGoRight ? css.arrowDisabled : "",
            ].join(" ")}
            onClick={goRight}
            aria-label="Próximo ano"
            disabled={!canGoRight}
          />
        </div>
      </div>
    </div>
  );
}
