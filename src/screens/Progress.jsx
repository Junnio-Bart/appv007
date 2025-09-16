// /src/screens/Progress.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useLibrary from "../hooks/useLibrary";
import s from "./Progress.module.css";
import CycleSettingsModal from "../components/CycleSettingsModal";

function fmtMin(n){ n = Math.max(0, Math.floor(n||0)); return (n<10 ? "0" : "") + n + " min"; }

export default function Progress(){
  const nav = useNavigate();
  const lib = useLibrary();

  // compat: pegue o livro ativo independente do nome usado no hook
  const activeBook = lib?.activeBook || lib?.current || lib?.selectedBook || null;
  const goal       = lib?.state?.goal ?? lib?.goal ?? 50;        // meta diária (fallback)
  const ppm        = lib?.state?.ppm  ?? lib?.ppm  ?? 6;         // páginas por ciclo (fallback)
  const interval   = lib?.state?.interval ?? lib?.interval ?? 5; // minutos por ciclo (fallback)

  // === EMPTY STATE (nenhum livro selecionado) ===
  if (!activeBook){
    return (
      <section className="section">
        <div className={s.emptyCard}>
          <h3>Progresso</h3>
          <p>Nenhum livro ativo. Selecione um na Biblioteca.</p>
          <button className="btn" onClick={() => nav("/")}>Abrir Biblioteca</button>
        </div>
      </section>
    );
  }

  // === DADOS DO LIVRO ===
  const id         = activeBook.id;
  const title      = activeBook.title || "Livro";
  const pagesTotal = Number(activeBook.pagesTotal ?? activeBook.pages ?? 0);
  const pagesRead  = Number(activeBook.pagesRead  ?? 0);

  const [cycleOpen, setCycleOpen] = useState(false);
  const openCycle  = () => setCycleOpen(true);
  const closeCycle = () => setCycleOpen(false);

  // chamado pelo modal a cada mudança de valor
  const handleCycleChange = (newPpm, newInterval) => {
    if (lib?.setPpm) lib.setPpm(newPpm);
    else if (lib?.setState) lib.setState(s => ({ ...s, ppm: newPpm }));

    if (lib?.setInterval) lib.setInterval(newInterval);
    else if (lib?.setState) lib.setState(s => ({ ...s, interval: newInterval }));
  };
  
  // --- cálculos topo/rodapé (agora usando pagesToday) ---
  const pagesToday = lib?.state?.progressDraft?.pagesToday ?? 0;

  const total = Math.max(1, pagesTotal);
  const pct   = Math.floor(((pagesRead + pagesToday) / total) * 100);

  // estimativa p/ terminar a meta do dia
  const faltaHoje = Math.max(0, Number(goal) - pagesToday);
  const ciclos    = ppm ? Math.ceil(faltaHoje / ppm) : 0;
  const estMin    = ciclos * Math.max(1, Number(interval));

  // restantes do LIVRO (contando o que já leu + o que marcou hoje)
  const restantes = Math.max(0, total - (pagesRead + pagesToday));

  const [menuOpen, setMenuOpen] = useState(false);
  const pillRef = useRef(null);
  const menuRef = useRef(null);

// fecha ao clicar fora ou apertar ESC
useEffect(() => {
  if (!menuOpen) return;
  const onClick = (e) => {
    if (pillRef.current?.contains(e.target)) return;
    if (menuRef.current?.contains(e.target)) return;
    setMenuOpen(false);
  };
  const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };

  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  return () => {
    document.removeEventListener("click", onClick);
    document.removeEventListener("keydown", onKey);
  };
}, [menuOpen]);

  return (
    <section aria-label="Progresso" className={s.wrap}>

    {/*/ topo: título + % + status + dropdown /*/}
    <header className={s.top}>
      <div className={s.titleWrap}>
      <button
        ref={pillRef}
        className={`${s.titlePill} ${menuOpen ? s.open : ""}`}
        onClick={() => setMenuOpen(v => !v)}
        aria-expanded={menuOpen}
        aria-controls="bookMenu"
      >
        {title}
        <span className={s.caret} aria-hidden>▾</span>
      </button>
        <div
          id="bookMenu"
          ref={menuRef}
          className={`${s.menu} ${menuOpen ? s.menuOpen : ""}`}
          role="menu"
        >
          {lib.books.length === 0 && <div className={s.menuEmpty}>Sem outros livros</div>}
          {lib.books
            .filter(b => b.id !== id)
            .map(b => {
              const t = Number(b.pagesTotal ?? b.pages ?? 0) || 0;
              const r = Number(b.pagesRead ?? 0);
              const pctB = t ? Math.floor((r / t) * 100) : 0;
              return (
                <button
                  key={b.id}
                  className={s.menuItem}
                  role="menuitem"
                  onClick={() => { lib.setActiveId(b.id); setMenuOpen(false); }}
                >
                  <span className={s.menuTitle}>{b.title}</span>
                  <span className={s.menuPct}>{pctB}%</span>
                </button>
              );
            })}
        </div>
      </div>
      <div className={s.subInfo}>
        <span className={pct >= 100 ? s.badgeDone : s.badgeReading}>
          {pct >= 100 ? "Concluído" : "Lendo"} • {pct}%
        </span>
      </div>
    </header>

      {/* retângulo preto com 3 mostradores */}
      <div className={s.statsBar}>
        <div className={s.stat}>
          <strong className={s.kpi}>{pagesToday}</strong>
          <span className={s.kpiLabel}>Pág lidas</span>
        </div>

        <div className={s.stat}>
          <strong className={s.kpi}>{fmtMin(estMin)}</strong>
          <span className={s.kpiLabel}>Tempo estimado</span>
        </div>

        <button 
          type="button" 
          className={`${s.stat} ${s.statBtn}`}
          onClick={openCycle} 
          title="Ajustar páginas e minutos por ciclo"
        >
          <strong className={s.kpi}>{ppm}</strong>
          <span className={s.kpiLabel}>Pág / ciclo</span>
        </button>
      </div>

      {/* grade de ciclos (agora usa ppm e abre o modal pelo tempo) */}
      <div className={s.grid}>
      {[...Array(9)].map((_, i) => (
          <div key={i} className={s.row}>
            <div className={s.rowIdx}>{i + 1}</div>

            <div className={s.blocks}>
            {[...Array(Math.max(0, Number(ppm) || 0))].map((_, j) => (
                <span key={j} className={s.block} />
              ))}
            </div>
            <div className={s.rowTime}>
            <button type="button" className={s.timeBtn} onClick={openCycle}>{interval}m</button>
            </div>
          </div>
        ))}
      </div>
      {/* agora o mostrador inferior é "Restantes" */}
      <div className={s.bottomStat}>
        <span className={s.bottomLabel}>Restantes</span>
        <strong className={s.bottomValue}>{restantes}</strong>
      </div>
      <CycleSettingsModal
        open={cycleOpen}
        initialPpm={ppm}
        initialInterval={interval}
        onClose={closeCycle}                // <— aqui!
        onChange={handleCycleChange}
        onDiscoverPPM={() => { setCycleOpen(false); nav("/ppm"); }}
      />
    </section>
  );
}
