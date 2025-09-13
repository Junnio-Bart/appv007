import { useEffect, useState } from "react";
import s from "./EditPagesModal.module.css";

export default function EditPagesModal({ open, onClose, book, onSave }) {
  if (!open) return null;

  const [read, setRead] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setRead(Number(book?.pagesRead || 0));
    setTotal(Number(book?.pagesTotal || 0));
  }, [book, open]);

  const pct = total > 0 ? Math.round((Math.min(read, total) / total) * 100) : 0;
  const band = pct < 40 ? "r" : pct < 65 ? "y" : pct < 85 ? "g" : "b";

  function submit(e) {
    e.preventDefault();
    const t = Math.max(0, Number(total || 0));
    const r = Math.max(0, Math.min(Number(read || 0), t || 0));
    onSave?.({ pagesRead: r, pagesTotal: t });
  }

  return (
    <div className={s.backdrop} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Páginas</h2>

        <form className={s.form} onSubmit={submit}>
          <div className={s.grid}>
            <label className={s.box}>
              <span className={s.label}>Lidas</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max={total || undefined}
                value={read}
                onChange={(e) => setRead(e.target.value)}
              />
            </label>

            <label className={s.box}>
              <span className={s.label}>Totais</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
              />
            </label>
          </div>

          <div className={`${s.progress} ${s[band]}`}>
            {Math.min(read, total)} / {total || 0}
          </div>

          <div className={s.actions}>
            <button type="button" className={s.btnGhost} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={s.btnPrimary}>
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
