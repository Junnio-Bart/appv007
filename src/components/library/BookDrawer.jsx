// src/components/library/BookDrawer.jsx
import { useMemo, useState, useRef, useEffect } from "react";
import useLibrary from "../../hooks/useLibrary";
import s from "./BookDrawer.module.css";
import ModalMount from "../ModalMount.jsx";
import CoverPicker from "./CoverPicker.jsx";
import NoteDetailModal from "./NoteDetailModal.jsx";

function fmtDate(s){ try { return new Date(s).toLocaleDateString(); } catch { return s; } }
function fmtMin(n){ const m = Math.max(0, Math.floor(Number(n)||0)); return `${m} min`; }

// ★★★ meia-estrela
function StarMeter({ value = 0 }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className={s.starRow} aria-label={`média ${v} estrelas`}>
      {[1,2,3,4,5].map((n) => {
        const fill = Math.max(0, Math.min(1, v - (n-1))); // 0..1
        const pct  = Math.round(fill * 100);
        return (
          <span key={n} className={s.starWrap}>
            <span className={`${s.star} ${s.base}`}>★</span>
            <span className={`${s.star} ${s.fill}`} style={{ width: `${pct}%` }}>★</span>
          </span>
        );
      })}
    </span>
  );
}

export default function BookDrawer({ open, book, onClose }){
  if (!open || !book) return null;

  const [refreshTick, setRefreshTick] = useState(0);
  const [version, setVersion] = useState(0);

  const lib = useLibrary();
  const liveBook = useMemo(() => {
    const arr = Array.isArray(lib?.books) ? lib.books
             : Array.isArray(lib?.state?.books) ? lib.state.books
             : [];
    return arr.find(b => b.id === book.id) || book;
  }, [lib?.books, lib?.state?.books, book]);

  const entries = useMemo(
    () => lib.getEntries(liveBook.id),
    [lib.books, liveBook.id] // re-renderiza quando o setBooks mudar
  );

   const avg     = useMemo(() => lib.getAverageRating(liveBook.id), [lib, liveBook.id]);
  const totalMinutes = useMemo(
    () => entries.reduce((acc, e) => acc + (Number(e.minutes)||0), 0),
    [entries]
  );


  // ==== TÍTULO editável ====
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft]     = useState(liveBook.title || "");

  useEffect(()=> setTitleDraft(liveBook.title || ""), [liveBook.title]);

  // foco ao entrar no modo de edição
  const titleInputRef = useRef(null);
  useEffect(()=> { if (editingTitle) titleInputRef.current?.focus(); }, [editingTitle]);

  // auto-save enquanto digita (400ms)
  useEffect(() => {
    if (!editingTitle) return;
    const v = (titleDraft || "").trim();
    if ((liveBook.title || "") === v) return;
    const t = setTimeout(() => {
      lib.updateBook?.(liveBook.id, { title: v });
    }, 400);
    return () => clearTimeout(t);
  }, [editingTitle, titleDraft, liveBook.id, liveBook.title, lib]);


  // autor editável
  const [editingAuthor, setEditingAuthor] = useState(false);
   const [authorDraft, setAuthorDraft] = useState(liveBook.author || "");
   useEffect(()=> setAuthorDraft(liveBook.author || ""), [liveBook.author]);

  const authorInputRef = useRef(null);
  useEffect(()=> { if (editingAuthor) authorInputRef.current?.focus(); }, [editingAuthor]);

  // ⏱️ debounce para auto-save enquanto digita
  useEffect(() => {
    if (!editingAuthor) return;                 // só debounce quando está editando
    const value = authorDraft.trim();
    // se não mudou, não salva
    if ((book.author || "") === value) return;

    const t = setTimeout(() => {
      lib.updateBook?.(liveBook.id, { author: value });
    }, 400);                                    // ajuste fino do debounce

    return () => clearTimeout(t);
  }, [authorDraft, editingAuthor, book.id, book.author, lib]);

  // capa – picker
  const [coverOpen, setCoverOpen] = useState(false);

  // nota expandida / modal de detalhe
  const [expanded, setExpanded] = useState(()=> new Set());
  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const [detail, setDetail] = useState(null); // entry inteira


  return (
    <ModalMount>
      <div className={s.backdrop} onClick={onClose}/>
      <aside className={s.drawer} onClick={(e)=>e.stopPropagation()}>
        {/* ===== HEADER ===== */}
        <header className={s.header}>
        <div className={s.titleLine}>
          {editingTitle ? (
            <input
              ref={titleInputRef}
              className={s.titleInput}
              value={titleDraft}
              onChange={(e)=> setTitleDraft(e.target.value)}
              onBlur={() => { // salva ao sair
                const v = (titleDraft || "").trim();
                if ((liveBook.title || "") !== v) lib.updateBook?.(liveBook.id, { title: v });
                setEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (titleDraft || "").trim();
                  if ((liveBook.title || "") !== v) lib.updateBook?.(liveBook.id, { title: v });
                  e.currentTarget.blur();
                }
                if (e.key === "Escape") {
                  setTitleDraft(liveBook.title || "");
                  setEditingTitle(false);
                }
              }}
              placeholder="Título do livro"
            />
          ) : (
            <>
              <h2 className={s.bookTitle}>{liveBook.title}</h2>
              <button className={s.smallLink} onClick={()=> setEditingTitle(true)}>editar</button>
            </>
          )}
        </div>
          <div className={s.headRow}>
            <button className={s.coverBtn} onClick={()=> setCoverOpen(true)} aria-label="Alterar capa">
              <img className={s.cover} src={liveBook.cover || ""} alt={liveBook.title}/>
            </button>

            <div className={s.metaBox}>
              {/* Autor em itálico + editável */}
              <div className={s.authorLine}>
                {editingAuthor ? (
                  <input
                    ref={authorInputRef}
                    className={s.authorInput}
                    value={authorDraft}
                    onChange={(e)=> setAuthorDraft(e.target.value)}     // ← digitar já agenda save (debounce)
                    onBlur={() => {                                     // ← salvar ao clicar fora
                      const v = authorDraft.trim();
                      if ((liveBook.author || "") !== v) lib.updateBook?.(liveBook.id, { author: v });
                      setEditingAuthor(false);
                    }}
                    onKeyDown={(e)=> {
                      if (e.key === "Enter") {                          // ← salvar no Enter
                        e.preventDefault();
                        const v = authorDraft.trim();
                        if ((liveBook.author || "") !== v) lib.updateBook?.(liveBook.id, { author: v });
                        e.currentTarget.blur();
                      }
                      if (e.key === "Escape") {                         // ← cancelar edição
                        setAuthorDraft(book.author || "");
                        setEditingAuthor(false);
                      }
                    }}
                    placeholder="Autor"
                  />
                ) : (
                  <em
                    className={s.author}
                    onDoubleClick={()=> setEditingAuthor(true)}
                    title="Duplo clique para editar"
                  >
                    {liveBook.author || "Autor desconhecido"} 
                  </em>
                )}
                {!editingAuthor && (
                  <button className={s.smallLink} onClick={()=> setEditingAuthor(true)}>editar</button>
                )}
              </div>

              <div className={s.metaLine}>
              <strong>{liveBook.pagesTotal}</strong> 
                /
              <strong>{liveBook.pagesRead}</strong> 
                páginas
              </div>

              <div className={s.metaLine}>
                {fmtMin(totalMinutes)} lidos
              </div>

              <div className={s.metaLine}>
                <StarMeter value={avg} />
                <span className={s.avgNum}>{Number(avg||0).toFixed(1)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ===== LISTA DE ENTRADAS ===== */}
        <div className={s.list}>
          {entries.length === 0 && <p className={s.empty}>Sem entradas ainda.</p>}

          {entries.map(e => {
            const isExpanded = expanded.has(e.id);
            return (
              <div key={e.id} className={s.item}>
              {/* cabeçalho da nota – layout antigo */}
              <div className={s.itemHead}>
                <div className={s.dateBlock}>
                  <div className={s.dateTop}>{fmtDate(e.dateISO)}</div>
                </div>

                <span className={s.badge}>{e.pages} págs</span>
                {!!e.minutes && <span className={s.badge}>{e.minutes} min</span>}

                <span className={s.starsLine} style={{ marginLeft: "auto" }}>
                  {"★".repeat(e.rating)}{"☆".repeat(5 - e.rating)}
                </span>
              </div>

              {/* corpo da nota – só expandir/contrair */}
              <p
                className={`${s.text} ${!expanded.has(e.id) ? s.clamp2 : ""}`}
                onClick={() => toggleExpand(e.id)}
                title={!expanded.has(e.id) ? "Clique para expandir" : "Clique para recolher"}
              >
                {e.note || <i>Sem observações.</i>}
              </p>

              <div className={s.row}>
              <button
                className={s.btnGhost}
                onClick={() => setDetail({ ...e, bookId: liveBook.id })}
              >
                Editar nota
              </button>
                <button
                  className={s.btnDanger}
                  onClick={() => lib.removeEntry(liveBook.id, e.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
            );
          })}
        </div>

        <footer className={s.footer}>
          <button className={s.btnClose} onClick={onClose}>Fechar</button>
        </footer>
      </aside>

      {/* Picker de capas */}
      <CoverPicker
        open={coverOpen}
        current={liveBook.cover || ""}
        title={liveBook.title}
        title={liveBook.title}
        onClose={()=> setCoverOpen(false)}
        onSelect={(url, persist)=> {
          lib.updateBook?.(liveBook.id, { cover: url });
          if (persist) CoverPicker.saveToGallery(book.id, url);
          setCoverOpen(false);
        }}
      />

      {/* Detalhe de nota */}
      <NoteDetailModal
        open={!!detail}
        entry={detail}
        onClose={() => setDetail(null)}
        onSave={async ({ id, rating, note }) => {
          // usa a MESMA instância do hook daqui:
          await lib.updateEntry(liveBook.id, id, { rating, note });
          // nada de ticks: como este `lib` é o mesmo do Drawer,
          // setBooks() vai re-renderizar o Drawer automaticamente.
        }}
      />
    </ModalMount>
  );
}
