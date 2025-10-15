// /src/components/EditPagesModal.jsx
import { useEffect, useState } from "react";
import s from "./EditPagesModal.module.css";
import SmartNumberInput from "./SmartNumberInput.jsx";

export default function EditPagesModal({ open, onClose, book, onSave }) {
  if (!open) return null;

  const [read, setRead]   = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setRead(Number(book?.pagesRead  || 0));
    setTotal(Number(book?.pagesTotal || 0));
  }, [book, open]);

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
            {/* Pág totais */}
            <label className={s.box}>
              <div className={s.inputBox}>
              <SmartNumberInput
                  className={s.input}
                  currentValue={total}
                  min={0}
                  data-smart-commit="manual"
                  onCommit={(n) => {
                    const t = Number.isFinite(n) ? Math.max(0, n) : total;
                    setTotal(t);
                    // se reduzir total, cape "read"
                    setRead((r) => Math.max(0, Math.min(r, t)));
                  }}
                />
              </div>
              <span className={s.label}>Pág totais</span>
            </label>

            {/* Pág lidas */}
            <label className={s.box}>
              <div className={s.inputBox}>
              <SmartNumberInput
                  className={s.input}
                  currentValue={read}
                  min={0}
                  max={total || Infinity}
                  data-smart-commit="manual"     // não disparar Enter global no blur
                  // sem onLiveChange → nada durante digitação
                  onCommit={(n) => {
                    // aplica ao sair do campo ou Enter
                    const num = Number.isFinite(n) ? n : read;
                    const capped = Math.max(0, Math.min(num, total || 0));
                    setRead(capped);
                  }}
                />
              </div>
              <span className={s.label}>Pág lidas</span>
            </label>

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
