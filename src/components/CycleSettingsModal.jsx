import { useEffect, useState } from "react";
import s from "./CycleSettingsModal.module.css";
import ModalMount from "./ModalMount.jsx";

export default function CycleSettingsModal({
  open,
  initialPpc = 10,          // páginas por ciclo
  initialInterval = 5,      // minutos por ciclo
  maxPpc = 999,             // LIMITE: nunca maior que a meta do dia
  onSave,                   // (ppc, interval)
  onClose,
}) {
  const [ppc, setPpc] = useState(initialPpc);
  const [interval, setInterval] = useState(initialInterval);

  useEffect(() => {
    if (open) { setPpc(initialPpc); setInterval(initialInterval); }
  }, [open, initialPpc, initialInterval]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Enter")  onSave?.(ppc, interval);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, ppc, interval, onSave, onClose]);

  if (!open) return null;

  const capPpc = (v) => Math.max(1, Math.min(Math.floor(Number(v)||0), Math.max(1, Number(maxPpc)||1)));
  const capInt = (v) => Math.max(1, Math.min(Math.floor(Number(v)||0), 240));

  return (
    <ModalMount>
      <div className={s.overlay} onPointerDown={(e)=>{ if (e.target === e.currentTarget) onClose?.(); }} />
      <div className={s.sheet} role="dialog" aria-modal="true" aria-labelledby="cycleTitle" onPointerDown={(e)=>e.stopPropagation()}>
        <h3 id="cycleTitle" className={s.sheetTitle}>Ciclo de leitura</h3>

        <div className={s.dual}>
          <div className={s.field}>
            <label className={s.label}>Ciclo (min)</label>
            <div className={s.inputBox}>
              <input className={s.input} type="number" inputMode="numeric" min="1" max="240" step="1"
                value={interval} onChange={(e)=> setInterval(capInt(e.target.value))}/>
              <span className={s.unit}>min</span>
            </div>
            <small>Duração de cada ciclo</small>
          </div>

          <div className={s.field}>
            <label className={s.label}>Páginas por ciclo</label>
            <div className={s.inputBox}>
              <input className={s.input} type="number" inputMode="numeric" min="1" step="1"
                value={ppc} onChange={(e)=> setPpc(capPpc(e.target.value))}/>
              <span className={s.unit}>pág</span>
            </div>
            <small>Máximo permitido: {maxPpc}</small>
          </div>
        </div>

        <div className={s.footer}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={()=> onSave?.(capPpc(ppc), capInt(interval))}>Salvar</button>
        </div>
      </div>
    </ModalMount>
  );
}
