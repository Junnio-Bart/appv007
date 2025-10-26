import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import YearPickerModal from "./YearPickerModal";
import css from "../../screens/JournalCalendar.module.css";

/* ===== Constantes ===== */
const CAL_MONTHS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const WINDOW_SIZE = 3;
const HALF = Math.floor(WINDOW_SIZE / 2);

const clampStart = (s) => Math.max(0, Math.min(s, 11 - (WINDOW_SIZE - 1)));
const isFuture = (y, m) => {
  const n = new Date();
  if (y > n.getFullYear()) return true;
  if (y < n.getFullYear()) return false;
  return m > n.getMonth();
};
const lastAllowedMonth = (y) => {
  const n = new Date();
  if (y < n.getFullYear()) return 11;
  if (y > n.getFullYear()) return -1;
  return n.getMonth();
};

export default function JournalCalendar({ value, onChange, compact = false }) {
  const { year, month } = value;
  const [yearOpen, setYearOpen] = useState(false);

  // centraliza a janela no mês selecionado
  const [winStart, setWinStart] = useState(() => clampStart(month - HALF));
  useEffect(() => setWinStart(clampStart(month - HALF)), [month]);
  const start = clampStart(winStart);

  // “hoje”
  const today = useMemo(() => {
    const n = new Date();
    const dd = String(n.getDate()).padStart(2,"0");
    const wdFull = new Intl.DateTimeFormat("pt-BR",{ weekday:"short" })
      .format(n).replace(".","").toLowerCase(); // ex: "seg"
    return { dd, wdFull, y:n.getFullYear(), m:n.getMonth() };
  }, []);

  const viewingCurrent = (() => {
    const n = new Date();
    return year === n.getFullYear() && month === n.getMonth();
  })();

  // navegação
  function goMonth(y, m){ if (!isFuture(y, m)) onChange?.({ year:y, month:m }); }
  function prevMonth(){
    let y = year, m = month - 1;
    if (m < 0){ m = 11; y--; }
    if (lastAllowedMonth(y) === -1) return;
    goMonth(y, m);
  }
  function nextMonth(){
    let y = year, m = month + 1;
    if (m > 11){ m = 0; y++; }
    if (isFuture(y, m)) return;
    goMonth(y, m);
  }
  function goToday(){
    onChange?.({ year: today.y, month: today.m });
    setWinStart(clampStart(today.m - HALF));
  }
  function setYearSafe(nextY){
    const last = lastAllowedMonth(nextY);
    let m = month;
    if (last >= 0 && m > last) m = last;
    if (last < 0) m = 0;
    onChange?.({ year: nextY, month: m });
  }

  // swipe no trilho (modo aberto)
  const drag = useRef({ active:false, x0:0, dx:0 });
  const TH = 40;
  const onDown = (e)=>{
    drag.current.active = true;
    drag.current.x0 = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    drag.current.dx = 0;
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
  };
  const onMove = (e)=>{
    if (!drag.current.active) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? drag.current.x0;
    drag.current.dx = x - drag.current.x0;
  };
  const onUp = ()=>{
    if (!drag.current.active) return;
    const dx = drag.current.dx || 0;
    drag.current.active = false;
    if (dx <= -TH) nextMonth();
    if (dx >=  TH) prevMonth();
  };

  // trilhos
  const FullTrack = () => (
    <div className={css.mWrap}>
      <button className={`${css.ghostArrow} ${css.playLeft}`} onClick={prevMonth} aria-label="Mês anterior" />
      <div className={css.mViewport} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
        <div className={css.mRow}>
          {Array.from({ length: WINDOW_SIZE }).map((_, i) => {
            const idx = start + i;
            const disabled = isFuture(year, idx);
            const active = idx === month;
            return (
              <button
                key={idx}
                type="button"
                className={[
                  css.mChip,
                  active ? css.isCenter : css.isSide,
                  disabled ? css.disabled : ""
                ].join(" ")}
                onClick={()=> !disabled && goMonth(year, idx)}
                disabled={disabled}
              >
                {CAL_MONTHS[idx]}
              </button>
            );
          })}
        </div>
      </div>
      <button className={css.ghostArrow} onClick={nextMonth} aria-label="Próximo mês" />
    </div>
  );

  const MiniTrack = () => (
    <div className={css.mWrap}>
      <button className={`${css.ghostArrow} ${css.playLeft}`} onClick={prevMonth} aria-label="Mês anterior" />
      <div className={css.mViewport}>
        <div className={css.mRow}>
          <button type="button" className={`${css.mChip} ${css.isCenter}`} disabled>
            {CAL_MONTHS[month]}
          </button>
        </div>
      </div>
      <button className={css.ghostArrow} onClick={nextMonth} aria-label="Próximo mês" />
    </div>
  );

  return (
    <section className={css.box}>
      {/* ABERTO */}
      {!compact && (
        <>
          <div className={css.head}>
            <button
              className={css.yearPill}
              onMouseDown={(e)=>{ e.preventDefault(); e.stopPropagation(); setYearOpen(true); }}
              onClick={(e)=> e.stopPropagation()}
              aria-haspopup="dialog"
            >
              {year}
            </button>
            <FullTrack />
          </div>

          <div className={css.todayRow}>
            <button
              className={[css.todayBtn, viewingCurrent ? css.tActive : css.tInactive].join(" ")}
              onClick={goToday}
            >
              {today.dd} - {today.wdFull}
            </button>
          </div>
        </>
      )}

      {/* FECHADO */}
      {compact && (
        <div className={css.miniHeader}>
          <button
            className={css.yearPill}
            onMouseDown={(e)=>{ e.preventDefault(); e.stopPropagation(); setYearOpen(true); }}
            onClick={(e)=> e.stopPropagation()}
            aria-haspopup="dialog"
          >
            {year}
          </button>

          <button
            className={[css.todayBtn, css.miniToday, viewingCurrent ? css.tActive : css.tInactive].join(" ")}
            onClick={goToday}
          >
            {today.dd} - {today.wdFull}
          </button>

          <div className={css.miniRight}>
            <MiniTrack />
          </div>
        </div>
      )}

      {/* Modal de ano */}
      {yearOpen && createPortal(
        <YearPickerModal
          open={yearOpen}
          year={year}
          onSelect={(y) => { setYearOpen(false); setYearSafe(y); }}
          onClose={() => setYearOpen(false)}
        />,
        document.getElementById("modal-root") || document.body
      )}
    </section>
  );
}
