// /src/components/GoalModal.jsx
import { useEffect, useState } from "react";
import s from "./GoalModal.module.css";
import ModalMount from "./ModalMount.jsx";

export default function GoalModal({ open, initialGoal=0, maxGoal=1, onSave, onClose }){
  const [value, setValue] = useState(initialGoal);

  useEffect(() => { if (open) setValue(initialGoal); }, [open, initialGoal]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Enter")  onSave?.(value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, value, onSave, onClose]);

  if (!open) return null;

  const cap = (v) => Math.max(0, Math.min(Number(v||0), Math.max(0, Number(maxGoal||0))));

  return (
    <ModalMount>
      <div className={s.overlay} onPointerDown={(e)=>{ if (e.target === e.currentTarget) onClose?.(); }} />
      <div className={s.sheet} role="dialog" aria-modal="true" aria-labelledby="goalTitle" onPointerDown={(e)=>e.stopPropagation()}>
        <h3 id="goalTitle" className={s.sheetTitle}>Meta do dia</h3>

        <div className={s.field}>
          <label className={s.label}>Páginas (máx {maxGoal})</label>
          <div className={s.inputBox}>
            <input
              className={s.input}
              type="number" inputMode="numeric" min="0" step="1"
              value={value}
              onChange={(e)=> setValue(cap(e.target.value))}
            />
            <span className={s.unit}>pág</span>
          </div>
          <small>Define o quanto você quer ler hoje</small>
        </div>

        <div className={s.footer}>
          <button type="button" className={s.btnGhost} onClick={onClose}>Cancelar</button>
          <button type="button" className={s.btnPrimary} onClick={()=> onSave?.(cap(value))}>Salvar</button>
        </div>
      </div>
    </ModalMount>
  );
}
