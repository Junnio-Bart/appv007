import css from "./GoalBadge.module.css";

export default function GoalBadge({
  label = "Concluídos",
  value = 0,         // lidos
  goal  = 0,         // meta
  onClick,
  variant = "full",  // "full" (padrão) ou "calendar"
  size = "md",       // "md" (padrão) ou "mini" (para o calendário fechado)
  className = "",
  style,
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;

  // mapa de “tom” (classes já existentes no seu CSS: neutral, bad, warn, good, done)
  let tone = "neutral";
  if (goal > 0) {
    if (pct >= 100)      tone = "done";
    else if (pct >= 70)  tone = "good";
    else if (pct >= 40)  tone = "warn";
    else                 tone = "bad";
  }

  // tons específicos do calendário (faixas de cor)
  const calTone =
       !goal || goal <= 0 ? css.calGray
     : pct === 0          ? css.calGray
     : pct >= 90          ? css.calBlue
     : pct >= 70          ? css.calGreen
     : pct >= 40          ? css.calYellow
                          : css.calRed;

  // classes base + variant + size
  const root = [
    css.badge,
    variant === "calendar" ? css.cal : css[tone],
    size === "mini" ? css.sz_mini : "",
    className
  ].filter(Boolean).join(" ");

  if (variant === "calendar") {
    return (
      <button type="button" className={`${root} ${calTone}`} onClick={onClick} style={style}>
        <div className={css.calValue}>{value}</div>
        <div className={css.calLabel}>{label}</div>
      </button>
    );
  }

  return (
    <button type="button" className={root} onClick={onClick} style={style}>
      <div className={css.row}>
        <div className={css.value}>
          {value}
          <span className={css.sep}>/{goal || 0}</span>
        </div>
        <div className={css.label}>{label}</div>
      </div>
      <div className={css.bar}><span style={{ width: `${pct}%` }} /></div>
    </button>
  );
}
