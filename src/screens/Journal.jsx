// src/screens/Journal.jsx
import { useState, useMemo, useEffect } from "react";
import useLibrary from "../hooks/useLibrary";

import JournalCalendar from "../components/journal/JournalCalendar";
import MonthShelf from "../components/journal/MonthShelf";
import GoalBadge from "../components/journal/GoalBadge";
import GoalModal from "../components/journal/GoalModal";
import BookDrawer from "../components/library/BookDrawer.jsx";
import NewBookModal from "../components/NewBookModal.jsx";
import useGoals, { countFinishedInMonth, countFinishedInYear } from "../hooks/useGoals";

import SavedNotice from "../components/SavedNotice.jsx";

import s from "./Journal.module.css";

export default function Journal(){
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() });

  // marca a aba atual (classe para estilos globais)
  useEffect(() => {
    const root = document.querySelector(".app");
    if (root) root.setAttribute("data-tab", "journal");
    return () => root?.removeAttribute("data-tab");
  }, []);

  // biblioteca
  const lib   = useLibrary();
  const books = lib?.books ?? [];

  // drawer
  const [openId, setOpenId] = useState(null);
  const openBook = useMemo(() => books.find(b => b.id === openId) || null, [books, openId]);
  

  // metas
  const { getMonthlyGoal, setMonthlyGoal, getYearlyGoal, setYearlyGoal } = useGoals();
  const monthDone = useMemo(() => countFinishedInMonth(books, ym.year, ym.month), [books, ym]);
  const yearDone  = useMemo(() => countFinishedInYear(books, ym.year), [books, ym.year]);
  const monthGoal = getMonthlyGoal(ym.year, ym.month);
  const yearGoal  = getYearlyGoal(ym.year);

  const [openMonth, setOpenMonth] = useState(false);
  const [openYear,  setOpenYear]  = useState(false);

  // calendário começa fechado
  const [calCollapsed, setCalCollapsed] = useState(true);

  const [deletedTitle, setDeletedTitle] = useState(null);

  // ===== Novo livro (controlado por aqui) =====
  const [newOpen, setNewOpen] = useState(false);
  function handleSaveNew({ title, author, pagesTotal, cover }) {
    // cria e já foca no livro criado
    const id = lib.addBook({
      title,
      author,
      pagesTotal: Number(pagesTotal) || 0,
      cover: cover || null,
    });
    setNewOpen(false);
    setOpenId(id);
  }

  return (
    <section className="journal">
      <div className={s.page}>
        {/* CALENDÁRIO */}
        <div className={`${s.calStick} ${calCollapsed ? s.calCollapsed : ""}`}>
          <div className={s.calBox}>
            <JournalCalendar
              value={ym}
              onChange={setYm}
              compact={calCollapsed}
            />
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

        {/* METAS */}
        <section className={s.goalsPanel}>
          <div className={s.goalsRow}>
            <GoalBadge
              variant="calendar"
              label="Livros no ano"
              value={yearDone}
              goal={yearGoal}
              onClick={() => setOpenYear(true)}
            />
            <GoalBadge
              variant="calendar"
              label="Livros no mês"
              value={monthDone}
              goal={monthGoal}
              onClick={() => setOpenMonth(true)}
            />
          </div>
        </section>

        {/* ESTANTE */}
        <MonthShelf
          year={ym.year}
          month={ym.month}
          books={books}
          onBookClick={(b) => setOpenId(b.id)}
          onAddNew={() => setNewOpen(true)}    // ⟵ faz o “+” realmente adicionar
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
          onSave={(v) => setYearlyGoal(ym.year, v)}
          onClose={() => setOpenYear(false)}
        />
        <GoalModal
          open={openMonth}
          title="Meta do mês"
          scope="month"
          initial={monthGoal}
          cardWidth="330px"
          inputWidth="100px"
          onSave={(v) => setMonthlyGoal(ym.year, ym.month, v)}
          onClose={() => setOpenMonth(false)}
        />

        {/* Drawer do livro */}
        <BookDrawer
          open={!!openBook}
          book={openBook}
          onClose={() => setOpenId(null)}
          onDeleted={(title) => setDeletedTitle(title)}   // <- recebe evento do Drawer
        />
      </div>

      {/* Modal NOVO LIVRO */}
      <NewBookModal open={newOpen} onClose={() => setNewOpen(false)} onSave={handleSaveNew} />

      {/* TOAST GLOBAL (fora do Drawer) */}
      <SavedNotice
        open={!!deletedTitle}
        title="Livro excluído!"
        subtitle="Todos os dados foram removidos"
        duration={2500}
        onClose={() => setDeletedTitle(null)}
      />
    </section>
  );
}