// src/components/library/NoteDetailModal.jsx
import { useEffect, useState } from "react";
import ModalMount from "../ModalMount.jsx";
import css from "./NoteDetailModal.module.css";

const CAPTIONS = ["", "péssimo", "ruim", "médio", "bom", "ótimo"];

function fmtDateTime(s){
  try {
    const d = new Date(s);
    return d.toLocaleDateString() + " • " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return s; }
}

function StarsEditable({ value=0, onChange }) {
  const v = Math.max(0, Math.min(5, Number(value)||0));
  return (
    <div className={css.noteStars}>
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          className={`${css.starBtn} ${v >= n ? css.filled : ""}`}
          onClick={() => onChange?.(n)}
          aria-label={`${n} estrelas`}
        >★</button>
      ))}
    </div>
  );
}

export default function NoteDetailModal({ open, entry, onClose, onSaved, onSave }) {
  const [rating, setRating] = useState(entry?.rating || 0);
  const [note, setNote]     = useState(entry?.note || "");
  const caption = CAPTIONS[rating] || "";

  useEffect(() => {
    if (!open || !entry) return;
    setRating(entry.rating || 0);
    setNote(entry.note || "");
  }, [open, entry]);

  if (!open || !entry) return null;

  const handleSave = async () => {
    // salva usando a instância do hook do PAI (BookDrawer)
    await onSave?.({ rating, note, id: entry.id });
    onSaved?.();   // opcional: sinaliza “salvei”
    onClose?.();
  };

  return (
    <ModalMount>
      <div className={css.backdrop} onClick={onClose}/>
      <div className={css.panel} onClick={(e)=>e.stopPropagation()}>
        <h3 className={css.title}>Leitura de {fmtDateTime(entry.dateISO)}</h3>
        <div className={css.sub}>
          <span className={css.badge}>{entry.pages} págs</span>
          {!!entry.minutes && <span className={css.badge}>{entry.minutes} min</span>}
        </div>

        <div className={css.rateWrap}>
          <StarsEditable value={rating} onChange={setRating} />
          <div className={css.starCaption}><em>{caption}</em></div>
        </div>

        <textarea
          className={css.note}
          rows={10}
          value={note}
          onChange={(e)=> setNote(e.target.value)}
          placeholder="Escreva/edite sua nota desta leitura…"
        />

        <div className={css.actions}>
          <button className={css.btnGhost} onClick={onClose}>Cancelar</button>
          <button className={css.btnPrimary} onClick={handleSave}>Salvar</button>
        </div>
      </div>
    </ModalMount>
  );
}
