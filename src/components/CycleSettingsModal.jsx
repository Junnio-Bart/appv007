// src/components/CycleSettingsModal.jsx
import { useEffect, useState } from "react";
import s from "./CycleSettingsModal.module.css";
import ModalMount from "./ModalMount.jsx";

export default function CycleSettingsModal({
  open,
  initialPpm = 6,
  initialInterval = 5,
  onClose,          // fecha no overlay / ESC
  onChange,         // chamado a cada edição (ppm, interval)
  onDiscoverPPM,
}) {
  const [ppm, setPpm] = useState(initialPpm);
  const [interval, setInterval] = useState(initialInterval);

  // hidrata quando abre
  useEffect(() => {
    if (!open) return;
    setPpm(initialPpm);
    setInterval(initialInterval);
  }, [open, initialPpm, initialInterval]);

  // ESC fecha
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const sanitizeInt = (v) => Math.max(1, Math.min(240, Math.floor(Number(v) || 0)));
  const sanitizePpm = (v) => Math.max(0, Math.min(999, Math.floor(Number(v) || 0)));

  // commit imediato no pai
  const changeInterval = (v) => {
    const n = sanitizeInt(v);
    setInterval(n);
    onChange?.(ppm, n);
  };
  const changePpm = (v) => {
    const n = sanitizePpm(v);
    setPpm(n);
    onChange?.(n, interval);
  };

  if (!open) return null;

  return (
    <ModalMount>
      {/* clique fora fecha */}
      <div className={s.overlay} onMouseDown={onClose} onClick={onClose} />

      {/* clique dentro NÃO fecha */}
      <div
        className={s.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cycleTitle"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="cycleTitle" className={s.sheetTitle}>Páginas por ciclo</h3>

        <div className={s.dual}>
          <div className={s.field}>
            <div className={s.inputBox}>
              <input
                className={s.input}
                type="number" inputMode="numeric" min="1" max="240" step="1"
                value={interval}
                onChange={(e) => changeInterval(e.target.value)}
              />
              <span className={s.unit}>min</span>
            </div>
            <small>ciclo (min)</small>
          </div>

          <div className={s.field}>
            <div className={s.inputBox}>
              <input
                className={s.input}
                type="number" inputMode="numeric" min="0" max="999" step="1"
                value={ppm}
                onChange={(e) => changePpm(e.target.value)}
              />
              <span className={s.unit}>pág</span>
            </div>
            <small>pág por ciclo</small>
          </div>
        </div>

        <button
          type="button"
          className={s.ppmBtn}
          onClick={() => { onClose?.(); onDiscoverPPM?.(); }}
        >
          Descobrir meu PPM
        </button>
      </div>
    </ModalMount>
  );
}
