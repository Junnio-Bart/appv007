// /src/screens/Progress.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useLibrary from "../hooks/useLibrary";
import s from "./Progress.module.css";
import CycleSettingsModal from "../components/CycleSettingsModal";
import GoalModal from "../components/GoalModal";
import SmartNumberInput from "../components/SmartNumberInput";
import DayLogModal from "../components/DayLogModal";
import SavedNotice from "../components/SavedNotice";

/* ===================== Utils ===================== */
const num   = (v, d=0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtMin = (n) => {
  n = Math.max(0, Math.ceil(n || 0));
  return (n < 10 ? "0" : "") + n + " min";
};
const parseIntLike = (v) => {
  if (v === "" || v == null) return 0;
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? n : 0;
};
const parseGoal = parseIntLike;

/* === persistência por livro (localStorage) === */
const makeKey = (book) => `book-settings:${book?.id || book?.title || "unknown"}`;
const loadBookSettings = (book) => {
  try { const raw = localStorage.getItem(makeKey(book)); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
};
const saveBookSettings = (book, patch) => {
  try {
    const k = makeKey(book);
    const cur = loadBookSettings(book) || {};
    localStorage.setItem(k, JSON.stringify({ ...cur, ...patch }));
  } catch {}
};

/* ===================== Componente ===================== */
export default function Progress(){
  const nav = useNavigate();
  const lib = useLibrary();

  // Livros / seleção
  const books = Array.isArray(lib?.books) ? lib.books : [];  
  const activeBook = lib?.activeBook || lib?.current || lib?.selectedBook || null;
  const [noticeOpen, setNoticeOpen] = useState(false);

  if (!activeBook) {
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

  /* ---------- Estado global atual ---------- */
  const st       = lib?.state || {};
  const goal     = num(st.goal, 50);           // meta do dia (global)
  const ppm      = Math.max(0, num(st.ppm, 1));          // páginas / minuto (global)
  const interval = Math.max(0, num(st.interval, 5));     // minutos / ciclo (global)
  const pagesToday = Math.max(0, num(st.progressDraft?.pagesToday, 0));

  /* ---------- Espelhos locais do livro (total e lidas) ---------- */
  const initialTotal = Math.max(1, num(activeBook.pagesTotal ?? activeBook.pages, 1));
  const initialRead  = Math.max(0, num(activeBook.pagesRead, 0));
  const [localTotal, setLocalTotal] = useState(initialTotal);
  const [localRead,  setLocalRead]  = useState(initialRead);
  useEffect(() => { setLocalTotal(initialTotal); setLocalRead(initialRead); }, [initialTotal, initialRead]);

  /* ---------- Meta local (capada ao restante do livro) ---------- */
  const restantesLivro = Math.max(0, localTotal - localRead);
  const initialGoal = clamp(goal, 0, restantesLivro);
  const [localGoal, setLocalGoal] = useState(initialGoal);
  useEffect(() => { setLocalGoal(initialGoal); }, [initialGoal]);

  /* ---------- Ciclo (ppc/min) – espelhos locais ---------- */
  const initialInterval = Math.max(0, interval);
  const initialPpc      = Math.max(0, Math.floor(ppm * initialInterval));
  const [localInterval, setLocalInterval] = useState(initialInterval);
  const [localPpc,      setLocalPpc]      = useState(initialPpc);
  useEffect(() => { setLocalInterval(initialInterval); }, [initialInterval]);
  useEffect(() => { setLocalPpc(initialPpc);           }, [initialPpc]);
  // Se a meta diminuir, garanta ppc <= meta
  useEffect(() => { setLocalPpc(prev => Math.min(prev, Math.max(0, localGoal || 0))); }, [localGoal]);

  const pagesTodayGlobal = Math.max(0, num(st.progressDraft?.pagesToday, 0));
  const [todayLocal, setTodayLocal] = useState(pagesTodayGlobal);
  // sempre que vier algo novo do provider (ou meta mudar), sincroniza o local
  useEffect(() => {
    setTodayLocal(Math.max(0, num(lib?.state?.progressDraft?.pagesToday, 0)));
  }, [lib?.state?.progressDraft?.pagesToday]);

  // se a meta mudar e o local estiver acima dela, capa
  useEffect(() => {
    setTodayLocal((t) => clamp(t, 0, Math.max(0, localGoal)));
  }, [localGoal]);

   // === estados do modal de diário (DENTRO do componente) ===
  const [logOpen, setLogOpen] = useState(false);
  const [savedToday, setSavedToday] = useState({ pages: 0, minutes: 0 });

  /* ---------- Derivados ---------- */
  const effPpm    = localInterval > 0 ? (localPpc / localInterval) : 0;
  const ppcEff    = Math.max(0, Math.min(localPpc, localGoal || localPpc));
  const faltaHoje = Math.max(0, localGoal - Math.min(todayLocal, localGoal));
  const estMin    = (faltaHoje > 0 && effPpm > 0) ? Math.ceil(faltaHoje / effPpm) : 0;
  const pctGeral  = Math.min(100, Math.floor(((localRead + Math.min(todayLocal, localGoal)) / localTotal) * 100));
  const lidasGerais = Math.min(localTotal, localRead + Math.min(todayLocal, localGoal));

  /* ---------- Hidratar do localStorage quando trocar de livro ---------- */
  useEffect(() => {
    const saved = loadBookSettings(activeBook);
    if (!saved) return;
  
    const savedGoal     = Number.isFinite(saved.goal)        ? saved.goal        : undefined;
    const savedInterval = Number.isFinite(saved.interval)    ? saved.interval    : undefined;
    const savedPpm      = Number.isFinite(saved.ppm)         ? saved.ppm         : undefined;
    const savedTotal    = Number.isFinite(saved.pagesTotal)  ? saved.pagesTotal  : undefined;
    const savedRead     = Number.isFinite(saved.pagesRead)   ? saved.pagesRead   : undefined;
    const savedToday    = Number.isFinite(saved.pagesToday)  ? saved.pagesToday  : undefined;
  
    // clamps seguros com base no livro atual
    const capTotal    = Math.max(1, num(savedTotal, initialTotal));
    const capRead     = Math.max(0, Math.min(num(savedRead, initialRead), capTotal));
    const capGoal     = clamp(num(savedGoal, goal), 0, Math.max(0, capTotal - capRead));
    const capInterval = Math.max(0, num(savedInterval, interval));
    const capPpm      = Math.max(0, num(savedPpm, ppm));
    const capToday    = clamp(num(savedToday, 0), 0, Math.max(0, capGoal));
  
    // UI imediata
    setLocalTotal(capTotal);
    setLocalRead(capRead);
    setLocalGoal(capGoal);
    setLocalInterval(capInterval);
    setLocalPpc(Math.max(0, Math.floor(capPpm * capInterval)));
  
    // provider (inclui pagesToday)
    lib?.setState?.(s0 => ({
      ...s0,
      goal: capGoal,
      ppm: capPpm,
      interval: capInterval,
      state: {
        ...(s0.state || {}),
        goal: capGoal,
        ppm: capPpm,
        interval: capInterval,
        progressDraft: { ...(s0.state?.progressDraft || {}), pagesToday: capToday }
      }
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBook?.id]);

  /* ---------- Dropdown do título ---------- */
  const [menuOpen, setMenuOpen] = useState(false);
  const pillRef = useRef(null); const menuRef = useRef(null);
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
    return () => { document.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  /* ---------- Edição inline / overlay ---------- */
  const [editing, setEditing]   = useState(null);     // 'goal' | 'ppc' | 'interval' | 'bookTotal' | 'bookRead' | null
  useEffect(() => { setEditing(null); }, []);         // evita ficar "preso" editando em HMR

  // drafts + animação "pulinho"
  const [goalDraft, setGoalDraft]       = useState("");
  const [goalJump,  setGoalJump]        = useState(false);
  const [ppcDraft,  setPpcDraft]        = useState("");
  const [ppcJump,   setPpcJump]         = useState(false);
  const [intDraft,  setIntDraft]        = useState("");
  const [intJump,   setIntJump]         = useState(false);
  const [bookTotalDraft, setBookTotalDraft] = useState("");
  const [bookReadDraft,  setBookReadDraft]  = useState("");
  const [bookTotalJump,  setBookTotalJump]  = useState(false);
  const [bookReadJump,   setBookReadJump]   = useState(false);

  // abrir edições
  const startEditGoal = () => {
     setMenuOpen(false);
     setGoalDraft("");
     setEditing("goal"); 
     setGoalJump(true); 
     setTimeout(()=>setGoalJump(false),180); 
    };
  const startEditPpc  = () => { 
    setMenuOpen(false);
    setPpcDraft(""); 
    setEditing("ppc");  
    setPpcJump(true);  
    setTimeout(()=>setPpcJump(false),180); 
  };
  const startEditInterval = () => { 
    setMenuOpen(false);
    setIntDraft("");
    setEditing("interval"); 
    setIntJump(true); 
    setTimeout(()=>setIntJump(false),180); 
  };
  const startEditBookTotal= () => { 
    setMenuOpen(false);
    setBookTotalDraft("");
    setEditing("bookTotal"); 
    setBookTotalJump(true); 
    setTimeout(()=>setBookTotalJump(false),180); 
  };
  const startEditBookRead = () => { 
    setMenuOpen(false);
    setBookReadDraft("");
    setEditing("bookRead");  
    setBookReadJump(true);  
    setTimeout(()=>setBookReadJump(false),180); 
  };

  // commits
  const commitGoal = () => {
    const wanted = parseGoal(goalDraft);
    const final  = clamp(wanted, 0, restantesLivro);
    setLocalGoal(final);
    lib?.setState?.(s0 => ({ ...s0, goal: final, state: { ...(s0.state || {}), goal: final } }));
    saveBookSettings(activeBook, { goal: final });
    setEditing(null);
  };
  const commitPpc = () => {
    const wanted   = parseIntLike(ppcDraft);
    const finalPpc = clamp(wanted, 0, Math.max(0, localGoal || 0));
    setLocalPpc(finalPpc);
    const nextPPM  = (localInterval > 0) ? (finalPpc / localInterval) : 0;
    lib?.setState?.(s0 => ({ ...s0, ppm: nextPPM, interval: localInterval, state: { ...(s0.state||{}), ppm: nextPPM, interval: localInterval } }));
    saveBookSettings(activeBook, { ppm: nextPPM, interval: localInterval });
    setEditing(null);
  };
  const commitInterval = () => {
    const wantedInt  = Math.max(0, parseIntLike(intDraft));
    setLocalInterval(wantedInt);
    const nextPPM    = (wantedInt > 0) ? (localPpc / wantedInt) : 0;
    lib?.setState?.(s0 => ({ ...s0, ppm: nextPPM, interval: wantedInt, state: { ...(s0.state||{}), ppm: nextPPM, interval: wantedInt } }));
    saveBookSettings(activeBook, { ppm: nextPPM, interval: wantedInt });
    setEditing(null);
  };
  const commitBookTotal = () => {
    const wantedTotal = Math.max(0, parseIntLike(bookTotalDraft));
    const finalTotal  = Math.max(1, wantedTotal);
    setLocalTotal(finalTotal);
    if (localRead > finalTotal) setLocalRead(finalTotal);
    lib?.setState?.(s0 => {
      const books = Array.isArray(s0?.books)
        ? s0.books.map(b => b.id === activeBook.id
            ? { ...b, pagesTotal: finalTotal, pages: finalTotal, pagesRead: Math.min(num(b.pagesRead, 0), finalTotal) }
            : b)
        : s0?.books;
      const ab = s0?.activeBook && s0.activeBook.id === activeBook.id
        ? { ...s0.activeBook, pagesTotal: finalTotal, pages: finalTotal, pagesRead: Math.min(num(s0.activeBook.pagesRead, 0), finalTotal) }
        : s0?.activeBook;
      return { ...s0, books, activeBook: ab };
    });
    saveBookSettings(activeBook, { pagesTotal: finalTotal });
    setEditing(null);
  };
  const commitBookRead = () => {
    const wantedRead = Math.max(0, parseIntLike(bookReadDraft));
    const finalRead  = Math.min(Math.max(0, wantedRead), localTotal);
  
    setLocalRead(finalRead);
  
    // >>> escreve na biblioteca
    if (lib?.updateBook) {
      const patch = { pagesRead: finalRead };
      if (localTotal > 0 && finalRead >= localTotal) {
        patch.status = "lido";
        if (!activeBook.finishedAt) patch.finishedAt = new Date().toISOString();
      }
      lib.updateBook(activeBook.id, patch);
    }
  
    saveBookSettings(activeBook, { pagesRead: finalRead });
    setEditing(null);
  };

  // controla apenas o "lidas hoje" (sem tocar no pagesRead do livro)
// o total exibido usa o derivado `lidasGerais`
  const setPagesToday = (updater) => {
    setTodayLocal((prev) => {
      const want   = typeof updater === "function" ? updater(prev) : updater;
      const capped = clamp(want, 0, Math.max(0, localGoal));

      // atualiza somente o draft no provider
      lib?.setState?.(s0 => ({
        ...s0,
        state: {
          ...(s0.state || {}),
          progressDraft: { ...(s0.state?.progressDraft || {}), pagesToday: capped }
        }
      }));

      // persiste por livro
      saveBookSettings(activeBook, { pagesToday: capped });
      return capped;
    });
  };


  const incOnePage = () => setPagesToday(p => p + 1);
  const decOnePage = () => setPagesToday(p => p - 1);


  // atalhos de teclado
  useEffect(() => {
    if (!editing) return;
    const onKey = (e) => {
      if (e.key === "Enter") {
        if (editing === "goal")      commitGoal();
        if (editing === "ppc")       commitPpc();
        if (editing === "interval")  commitInterval();
        if (editing === "bookTotal") commitBookTotal();
        if (editing === "bookRead")  commitBookRead();
      }
      if (e.key === "Escape") setEditing(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, goalDraft, ppcDraft, intDraft, bookTotalDraft, bookReadDraft, restantesLivro, localGoal, localInterval, localPpc, localTotal]);

  // incrementa/diminui 1 página (capando em 0..localGoal)
const incPage = (delta) => {
  setPagesToday((p) => {
    const next = p + delta;
    return clamp(next, 0, Math.max(0, localGoal));
  });
};

// adiciona 1 ciclo (usa págs/ciclo atual)
const addCycle   = () => setPagesToday(p => p + Math.max(0, localPpc));

const commitDayRead = () => {
  const today = Math.max(0, todayLocal);
  if (today <= 0) {
    setTodayLocal(0);
    saveBookSettings(activeBook, { pagesToday: 0 });
    return;
  }

  const add     = Math.min(today, Math.max(0, localTotal - localRead));
  const readNew = Math.min(localTotal, localRead + add);

 // ⏱️ estimativa em minutos usando ppc e intervalo
 const ppc = Math.max(1, Number(localPpc) || 1);
 const iv  = Math.max(1, Number(localInterval) || 1);
 
 // minutos por página = minutosPorCiclo / páginasPorCiclo
 const minPerPage = iv / ppc;
 const minutes = Math.ceil(add * minPerPage);


  setSavedToday({ pages: add, minutes });
  setLogOpen(true);

  // NÃO atualiza pagesRead ainda — isso será feito no onSave do modal
};


  // limpa o progresso do dia (zera today)
  const clearToday = () => setPagesToday(0);


  /* ---------- Modais (mantidos) e colapso da barra ---------- */
  const [goalOpen,  setGoalOpen]  = useState(false);
  const [cycleOpen, setCycleOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true); // abre fechado por padrão

  // marca a aba atual no elemento raiz .app (usado pelo CSS global)
  useEffect(() => {
    const root = document.querySelector('.app');
    if (root) root.setAttribute('data-tab', 'progress');
    return () => root?.removeAttribute('data-tab');
  }, []);

  function applyProgressUpdate(book, nextPagesRead){
    const pages = Number(book.pages) || 0;
    const full   = pages > 0 && nextPagesRead >= pages;
  
    const patch = { pagesRead: Math.min(nextPagesRead, pages) };
  
    if (full){
      patch.status = "lido";
      patch.pagesRead = pages;
      if (!book.finishedAt) patch.finishedAt = new Date().toISOString();
    }
    return { ...book, ...patch };
  }
  

  /* ===================== JSX ===================== */
  return (
    <section aria-label="Progresso" className={`${s.wrap} ${editing ? s.isEditing : ""}`}>
      <div className={s.stickyTop}>
      {/* topo */}
      <header className={`${s.top} ${menuOpen ? s.topRaise : ""}`}>
        <div className={s.titleWrap}>
          <button
            ref={pillRef}
            className={`${s.titlePill} ${menuOpen ? s.open : ""}`}
            onClick={() => {
              setEditing(null);           // <- fecha overlay/edição
              setMenuOpen(v => !v);       // abre/fecha menu
            }}
            aria-expanded={menuOpen}
            aria-controls="bookMenu"
          >
            {activeBook.title || "Livro"}
            <span className={s.caret} aria-hidden>▾</span>
          </button>
          <div
            id="bookMenu"
            ref={menuRef}
            className={`${s.menu} ${menuOpen ? s.menuOpen : ""}`}
            role="menu"
          >
            {books.filter(b => b.id !== activeBook.id).map(b => {
              const t = num(b.pagesTotal ?? b.pages, 0), r = num(b.pagesRead, 0);
              const pctB = t ? Math.floor((r / t) * 100) : 0;
              return (
                <button
                  key={b.id}
                  className={s.menuItem}
                  role="menuitem"
                  onClick={() => { lib.setActiveId?.(b.id); setMenuOpen(false); }}
                >
                  <span className={s.menuTitle}>{b.title}</span>
                  <span className={s.menuPct}>{pctB}%</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className={s.subInfo}>
          <span className={pctGeral >= 100 ? s.badgeDone : s.badgeReading}>
            {pctGeral >= 100 ? "Concluído" : "Lendo"} • {pctGeral}%
          </span>
        </div>
      </header>
      {/* O overlay continua fora; ele cobre tudo, a barra preta fica por cima */}
      {editing && (
        <div
          className={s.dim}
          onPointerDown={(e) => {
            e.preventDefault();
            if (editing === "goal")      commitGoal();
            if (editing === "ppc")       commitPpc();
            if (editing === "interval")  commitInterval();
            if (editing === "bookTotal") commitBookTotal();
            if (editing === "bookRead")  commitBookRead();
          }}
        />
      )}
      {/* ===== BARRA PRETA — KNOBS c/ EXPANDIR/RECOLHER ===== */}
      <div className={`${s.knobBoard} ${collapsed ? s.isCollapsed : ""}`}>
        {/* botão do cantinho */}
        <button
          type="button"
          className={s.cornerToggle}
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? "Expandir" : "Recolher"}
          aria-expanded={!collapsed}
        >
          <span className={s.cornerIcon} aria-hidden />
        </button>

        {/* Linha de cima */}
        <div className={s.knobRow}>
          {/* Meta do dia (editável) */}
          <div className={s.knob}>
            {editing === "goal" ? (
              <>
                <input
                  className={s.kEditInput}
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={goalDraft}
                  onChange={(e) => {
                    const v = e.target.value;
                    setGoalDraft(v);
                    const live = clamp(parseGoal(v), 0, restantesLivro);
                    setLocalGoal(live);
                    saveBookSettings(activeBook, { goal: live });
                  }}
                  onBlur={commitGoal}
                />
                <div className={s.knobLabel}>Meta do dia</div>
              </>

            ) : (
              <button type="button" className={s.kBtn} onClick={startEditGoal}>
                <div className={`${s.knobValue} ${goalJump ? s.jump : ""}`}>{localGoal}</div>
                <div className={s.knobLabel}>Meta do dia</div>
              </button>
            )}
          </div>

          {/* Tempo estimado (derivado) */}
          <div className={s.knob}>
            <div className={s.knobValue}>{fmtMin(estMin)}</div>
            <div className={s.knobLabel}>Tempo estimado</div>
          </div>

          {/* Pág / ciclo (editável) */}
          <div className={s.knob}>
            {editing === "ppc" ? (
              <>
                <input
                  className={s.kEditInput}
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={ppcDraft}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPpcDraft(v);
                    setLocalPpc(clamp(parseIntLike(v), 0, Math.max(0, localGoal || 0)));
                  }}
                  onBlur={commitPpc}
                />
                <div className={s.knobLabel}>Pág / ciclo</div>
              </>
            ) : (
              <button type="button" className={s.kBtn} onClick={startEditPpc}>
                <div className={`${s.knobValue} ${ppcJump ? s.jump : ""}`}>{localPpc}</div>
                <div className={s.knobLabel}>Pág / ciclo</div>
              </button>
            )}
          </div>
        </div>

        {/* Linha de baixo */}
        <div className={s.knobRowExtra} aria-hidden={collapsed}>
          {/* Total de páginas do livro (EDITÁVEL) */}
          <div className={s.knob}>
            {editing === "bookTotal" ? (
              <>
                <input
                  className={s.kEditInput}
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={bookTotalDraft}
                  onChange={(e) => {
                    const v = e.target.value;
                    setBookTotalDraft(v);
                    const live = Math.max(1, parseIntLike(v));
                    setLocalTotal(live);
                    if (localRead > live) setLocalRead(live);
                    saveBookSettings(activeBook, { pagesTotal: live });
                  }}
                  onBlur={commitBookTotal}
                />
                <div className={s.knobLabel}>Págs do livro</div>
              </>
            ) : (
              <button type="button" className={s.kBtn} onClick={startEditBookTotal}>
                <div className={`${s.knobValue} ${bookTotalJump ? s.jump : ""}`}>{localTotal}</div>
                <div className={s.knobLabel}>Págs do livro</div>
              </button>
            )}
          </div>

          {/* Páginas lidas (GERAL) — EDITÁVEL */}
          <div className={s.knob}>
            {editing === "bookRead" ? (
              <>
                <input
                  className={s.kEditInput}
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={bookReadDraft}
                  onChange={(e) => {
                    const v = e.target.value;
                    setBookReadDraft(v);
                    const live = Math.min(Math.max(0, parseIntLike(v)), localTotal);
                    setLocalRead(live);
                    saveBookSettings(activeBook, { pagesRead: live });
                  }}
                  onBlur={commitBookRead}
                />
                <div className={s.knobLabel}>Págs lidas</div>
              </>
            ) : (
              <button type="button" className={s.kBtn} onClick={startEditBookRead}>
                <div className={`${s.knobValue} ${bookReadJump ? s.jump : ""}`}>{lidasGerais}</div>

                <div className={s.knobLabel}>Págs lidas</div>
              </button>
            )}
          </div>

          {/* Ciclo (min) — EDITÁVEL */}
          <div className={s.knob}>
            {editing === "interval" ? (
              <>
                <input
                  className={s.kEditInput}
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={intDraft}
                  onChange={(e) => {
                    const v = e.target.value;
                    setIntDraft(v);
                    setLocalInterval(Math.max(0, parseIntLike(v)));
                  }}
                  onBlur={commitInterval}
                />
                <div className={s.knobLabel}>Ciclo (min)</div>
              </>
            ) : (
              <button type="button" className={s.kBtn} onClick={startEditInterval}>
                <div className={`${s.knobValue} ${intJump ? s.jump : ""}`}>{localInterval}</div>
                <div className={s.knobLabel}>Ciclo (min)</div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
      {/* ===== Grade (páginas por ciclos) ===== */}
      {(() => {
        const ppcView = Math.max(1, Number.isFinite(localPpc) ? localPpc : 1);
        const rows = Math.max(1, Math.ceil((localGoal || ppcView) / ppcView));
        const MAX_COLS = 6;

        // ⏱️ minutos por página (intervalo / págs por ciclo)
        const minPerPage = (Number(localInterval) > 0 && ppcView > 0)
          ? (Number(localInterval) / ppcView)
          : 0;

        return (
          <div className={s.grid} role="grid" aria-label="Grade de páginas do dia">
            {Array.from({ length: rows }).map((_, r) => {
              const start = r * ppcView;
              const remainingForGoal = Math.max(0, (localGoal || 0) - start);

              // páginas “visíveis” nesta linha (pode ser parcial na última)
              const cells = (localGoal > 0)
                ? Math.min(ppcView, remainingForGoal)
                : ppcView;

              const cols = Math.min(Math.max(1, ppcView), MAX_COLS);
              const rowsNeeded = Math.max(1, Math.ceil(cells / cols));
              const hasWrap = rowsNeeded > 1;
              const doneHere = (localGoal > 0) ? Math.max(0, Math.min(todayLocal - start, cells)) : 0;
              const isEmpty = cells === 0;

              // ⏱️ tempo proporcional às páginas dessa linha
              // se quiser arredondar para múltiplos de 5, use Math.ceil((cells*minPerPage)/5)*5
              const rowMinutes = Math.max(1, Math.ceil(cells * minPerPage));

              return (
                <div
                  key={r}
                  className={`${s.row} ${hasWrap ? s.hasWrap : ""} ${isEmpty ? s.rowEmpty : ""}`}
                  role="row"
                >
                  <div className={s.rowIdx}>{r + 1}</div>

                  <div
                    className={`${s.blocks} ${isEmpty ? s.blocksEmpty : ""}`}
                    style={{ '--cols': cols, '--rows': rowsNeeded }}
                    role="gridcell"
                    aria-label={`Linha ${r + 1}`}
                  >
                    {Array.from({ length: cells }).map((__, i) => {
                      const filled = i < doneHere;
                      return (
                        <div
                          key={i}
                          className={`${s.block} ${filled ? s.blockDone : ""}`}
                        />
                      );
                    })}
                  </div>

                  <div className={s.rowTime}>{rowMinutes}m</div>
                </div>
              );
            })}
          </div>
        );
      })()}



      {/* ===== Painel de Ações ===== */}
      <div className={s.actionsDock}>
        <div className={s.actionsPanel}>
          {/* primeira linha: 3 botões (mesma forma) */}
          <div className={s.actionsRow}>
            <button 
                type="button"
                className={`${s.actBtn} ${s.triBtn} ${s.actGreen}`}
                onClick={() => incPage(+1)}
            >
              + 1 pág
              </button>

            <button
              type="button"
              className={`${s.actBtn} ${s.triBtn} ${s.actBlue}`}
              onClick={() => setPagesToday(p => p + Math.max(0, localPpc))}
            >
              + 1 ciclo
            </button>
            <button 
              type="button" 
              className={`${s.actBtn} ${s.triBtn} ${s.actGreen}`}
              onClick={() => incPage(-1)}
            >
              - 1 pág
            </button>
          </div>
          {/* segunda linha: 2 botões largos (mesma forma) */}
          <div className={s.actionsRowWide}>
            <button
              type="button"
              className={`${s.actBtn} ${s.wideBtn} ${s.actYellow}`}
              onClick={commitDayRead}
            >
              Gravar dia
            </button>
            <button
              type="button"
              className={`${s.actBtn} ${s.wideBtn} ${s.actRed}`}
              onClick={clearToday}
            >
              Limpar tudo
            </button>
          </div>
        </div>
      </div> 

      <div style={{textAlign:'center', marginTop:10, opacity:.9}}>
        <small style={{display:'block'}}>Lidas hoje</small>
        <strong style={{fontSize:20}}>
          {todayLocal} / {localGoal}
        </strong>
      </div>

     {/* Modais (ainda úteis para futuras funções) */}
     <GoalModal
     open={goalOpen}
     initialGoal={localGoal}
     maxGoal={restantesLivro}
     onClose={() => setGoalOpen(false)}
     onSave={(g) => {
       const final = clamp(num(g, 0), 0, restantesLivro);
       setLocalGoal(final);
       // mantém em memória e provider (se quiser)
       lib?.setState?.(s0 => ({
         ...s0,
         goal: final,
         state: { ...(s0.state || {}), goal: final }
       }));
       saveBookSettings(activeBook, { goal: final });
     }}
   />

   <CycleSettingsModal
     open={cycleOpen}
     initialPpc={ppcEff}
     initialInterval={localInterval}
     maxPpc={Math.max(1, localGoal || 1)}
     onClose={() => setCycleOpen(false)}
     onSave={(ppcIn, intervalIn) => {
       const safeInterval = Math.max(1, num(intervalIn, 1));
       const capPpc       = clamp(num(ppcIn, 1), 1, Math.max(1, localGoal || 1));
       const nextPPM      = Math.max(0.1, capPpc / safeInterval);

       setLocalInterval(safeInterval);
       setLocalPpc(capPpc);

       lib?.setState?.(s0 => ({
         ...s0,
         ppm: nextPPM,
         interval: safeInterval,
         state: { ...(s0.state || {}), ppm: nextPPM, interval: safeInterval }
       }));
       saveBookSettings(activeBook, { ppm: nextPPM, interval: safeInterval });
     }}
   />
   <DayLogModal
      open={logOpen}
      pages={savedToday.pages}
      minutes={savedToday.minutes}
      onCancel={() => setLogOpen(false)}
      onSave={({ rating, note }) => {
        // 1) fecha o modal imediatamente
        setLogOpen(false);

        // 2) mostra o aviso
        setNoticeOpen(true);

        // 3) aplica as páginas e grava a entrada
        const add     = savedToday.pages;
        const readNew = Math.min(localTotal, localRead + add);

        setLocalRead(readNew);
        setTodayLocal(0);

        if (lib?.updateBook) {
          const patch = { pagesRead: readNew };
          if (localTotal > 0 && readNew >= localTotal) {
            patch.status = "lido";
            if (!activeBook.finishedAt) patch.finishedAt = new Date().toISOString();
          }
          lib.updateBook(activeBook.id, patch);
        }
        saveBookSettings(activeBook, { pagesToday: 0, pagesRead: readNew });

        lib.addDailyEntry(activeBook.id, {
          pages: savedToday.pages,
          minutes: savedToday.minutes,
          rating,
          note,
          dateISO: new Date().toISOString(),
        });
      }}
    />
  <SavedNotice
    open={noticeOpen}
    title="Leitura salva!"
    subtitle="Entrada adicionada ao diário"
    duration={1500}                 // ajuste se quiser mais/menos tempo
    onClose={() => setNoticeOpen(false)}
  />
 </section>
);
}