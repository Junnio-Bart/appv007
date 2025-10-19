// /src/components/GoalModal.jsx
import { useEffect, useState } from "react";
import s from "./GoalModal.module.css";
import ModalMount from "./ModalMount.jsx";
import SmartNumberInput from "./SmartNumberInput.jsx";

export default function GoalModal({ open, initialGoal=0, maxGoal=1, onSave, onClose }){
  const [value, setValue] = useState(initialGoal);

  useEffect(() => { if (open) setValue(initialGoal); }, [open, initialGoal]);

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
          <SmartNumberInput
              className={s.input}
              currentValue={value}
              min={0}
              max={maxGoal}
              // Live = prévia no visor do modal
              onLiveChange={(n) => { if (Number.isFinite(n)) setValue(cap(n)); }}
              // Commit em Enter OU blur → salva e fecha
              onCommit={(n) => {
                const final = cap(Number.isFinite(n) ? n : value);
                setValue(final);
                onSave?.(final);
              }}
            />
            <span className={s.unit}>pág</span>
          </div>
          <small>Define o quanto você quer ler hoje</small>
        </div>

        <div className={s.footer}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={()=> onSave?.(cap(value))}>Salvar</button>
        </div>
      </div>
    </ModalMount>
  );
}
