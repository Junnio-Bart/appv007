import css from "./JournalStickyBar.module.css";

const CAL_MONTHS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

export default function JournalStickyBar({
  show,
  month,
  finished,
  onToday,
}) {
  const n = new Date();
  const wd = new Intl.DateTimeFormat("pt-BR",{weekday:"short"}).format(n).replace(".","").toLowerCase();
  const todayStr = `${String(n.getDate()).padStart(2,"0")} - ${wd}`;

  return (
    <div className={`${css.wrap} ${show ? css.on : css.off}`}>
      <div className={css.bar} role="region" aria-label="Atalho do mês">
        <div className={css.center}>
          <div className={css.monthChip}>{CAL_MONTHS[month]}</div>
          <button type="button" className={css.todayBtn} onClick={onToday}>
            {todayStr}
          </button>
        </div>

        <div className={css.counter}>
          <strong>{finished}</strong>
          <span>Concluídos no mês</span>
        </div>
      </div>
    </div>
  );
}
