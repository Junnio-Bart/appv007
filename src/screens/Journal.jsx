import { useState, useMemo, useEffect } from "react";
import useLibrary from "../hooks/useLibrary";
import BookDrawer from "../components/library/BookDrawer.jsx";
import JournalCalendar from "../components/journal/JournalCalendar";
import MonthShelf from "../components/journal/MonthShelf";
import GoalBadge from "../components/journal/GoalBadge";
import GoalModal from "../components/journal/GoalModal";
import useGoals, { countFinishedInMonth, countFinishedInYear } from "../hooks/useGoals";

import s from "./Journal.module.css";

export default function Journal(){
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() });

  // marca a aba atual
  useEffect(() => {
    const root = document.querySelector(".app");
    if (root) root.setAttribute("data-tab", "journal");
    return () => root?.removeAttribute("data-tab");
  }, []);

  // biblioteca
  const lib = useLibrary();
  const books = lib?.books ?? lib?.state?.books ?? [];
  const [openId, setOpenId] = useState(null);
  const openBook = useMemo(() => books.find(b => b.id === openId) || null, [books, openId]);

  // metas / contadores
  const { getMonthlyGoal, setMonthlyGoal, getYearlyGoal, setYearlyGoal } = useGoals();
  const monthDone = useMemo(()=> countFinishedInMonth(books, ym.year, ym.month), [books, ym]);
  const yearDone  = useMemo(()=> countFinishedInYear(books, ym.year), [books, ym.year]);
  const monthGoal = getMonthlyGoal(ym.year, ym.month);
  const yearGoal  = getYearlyGoal(ym.year);

  // modais
  const [openMonth, setOpenMonth] = useState(false);
  const [openYear,  setOpenYear]  = useState(false);

  // controla o modo compacto do calendário
  const [calCollapsed, setCalCollapsed] = useState(false);

  return (
    <div className={s.page}>
      {/* CALENDÁRIO (agora só datas) */}
      <div className={`${s.calStick} ${calCollapsed ? s.calCollapsed : ""}`}>
        <div className={s.calBox}>
          <JournalCalendar
            value={ym}
            onChange={setYm}
            compact={calCollapsed}   // aberto/fechado
          />

          {/* knob do canto para expandir/colapsar */}
          <button
            type="button"
            className={s.cornerToggle}
            onClick={() => setCalCollapsed(v => !v)}
            aria-label={calCollapsed ? "Expandir calendário" : "Recolher calendário"}
          >
            <span className={s.cornerIcon} aria-hidden />
          </button>
        </div>
      </div>

      {/* BOX DE METAS (separado do calendário) */}
      <section className={s.goalsPanel}>
        <div className={s.goalsRow}>
          <GoalBadge
            variant="calendar"
            label="Concluídos no ano"
            value={yearDone}
            goal={yearGoal}
            onClick={()=> setOpenYear(true)}
          />
          <GoalBadge
            variant="calendar"
            label="Concluídos no mês"
            value={monthDone}
            goal={monthGoal}
            onClick={()=> setOpenMonth(true)}
          />
        </div>
      </section>

      {/* Estante mensal */}
      <MonthShelf
        year={ym.year}
        month={ym.month}
        books={books}
        onBookClick={(b) => setOpenId(b.id)}
        style={{
          "--shelf-fill-h": calCollapsed ? "calc(100dvh - 210px)" : "calc(100dvh - 260px)",
          "--shelf-bottom-gap": "8px",
        }}
      />

      {/* Modais de metas */}
      <GoalModal
        open={openYear}
        title="Meta do ano"
        scope="year"
        initial={yearGoal}
        cardWidth="300px"
        inputWidth="100px"
        onSave={(v)=> setYearlyGoal(ym.year, v)}
        onClose={()=> setOpenYear(false)}
      />
      <GoalModal
        open={openMonth}
        title="Meta do mês"
        scope="month"
        initial={monthGoal}
        cardWidth="330px"
        inputWidth="100px"
        onSave={(v)=> setMonthlyGoal(ym.year, ym.month, v)}
        onClose={()=> setOpenMonth(false)}
      />
      <BookDrawer
        open={!!openBook}
        book={openBook}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}
