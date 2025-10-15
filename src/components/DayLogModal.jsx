import { useEffect, useState } from "react";
import s from "./DayLogModal.module.css";
import ModalMount from "./ModalMount.jsx";

const CAPTIONS = ["", "péssimo!", "ruim", "médio", "bom!", "ótimo!!"];

function Star({ filled, onClick }) {
  return (
    <button
      type="button"
      className={`${s.star} ${filled ? s.filled : ""}`}
      onClick={onClick}
      aria-pressed={filled}
      aria-label={filled ? "estrela selecionada" : "estrela"}
    >
      ★
    </button>
  );
}

export default function DayLogModal({
  open,
  pages = 0,
  minutes = 0,
  defaultRating = 0,
  defaultNote = "",
  onCancel,
  onSave,
}) {
  const [rating, setRating] = useState(defaultRating || 0);
  const [note, setNote] = useState(defaultNote || "");

  useEffect(() => {
    if (open) {
      setRating(defaultRating || 0);
      setNote(defaultNote || "");
    }
  }, [open, defaultRating, defaultNote]);

  if (!open) return null;

  const caption = CAPTIONS[rating] || "";

  return (
    <div className={s.backdrop} onClick={onCancel}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Gravar leitura?</h3>
        <p className={s.meta}>
          <strong>{pages}</strong> páginas • <strong>{minutes}</strong> min
        </p>

        {/* estrelas */}
        <div className={s.rateWrap}>
          <div className={s.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} filled={rating >= n} onClick={() => setRating(n)} />
            ))}
          </div>
          <div className={s.caption}>
            {rating > 0 ? <em>{caption}</em> : <span>&nbsp;</span>}
          </div>

        </div>

        <textarea
          className={s.note}
          placeholder="Escreva uma nota sobre a leitura de hoje…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          maxLength={10000}
        />

        <div className={s.actions}>
          <button className={s.btnGhost} onClick={onCancel}>Cancelar</button>
          <button className={s.btnPrimary} onClick={() => onSave?.({ rating, note })}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
