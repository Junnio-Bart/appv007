import { useEffect } from "react";
import s from "./SavedNotice.module.css";

export default function SavedNotice({
  open,
  title = "Leitura salva!",
  subtitle = "Entrada adicionada ao diário",
  duration = 2000,         // ms (auto-fecha)
  onClose
}) {
  if (!open) return null;

  useEffect(() => {
    if (!duration) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  return (
    <div className={s.backdrop} onClick={onClose}>
      <div className={s.card} onClick={(e)=>e.stopPropagation()}>
        <div className={s.check} aria-hidden>✓</div>
        <div className={s.texts}>
          <div className={s.title}>{title}</div>
          {subtitle ? <div className={s.subtitle}>{subtitle}</div> : null}
        </div>
      </div>
    </div>
  );
}
