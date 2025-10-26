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

// helpers de capa (cache-bust quando coverVer muda)
const coverSrc = (b) => {
  if (!b?.cover) return "";
  if (/^https?:\/\//i.test(b.cover)) {
    const sep = b.cover.includes("?") ? "&" : "?";
    return `${b.cover}${sep}v=${b.coverVer || 0}`;
  }
  return b.cover; // dataURL já muda sozinho
};
const imgKey = (b) => `${b.id}:${b.coverVer || 0}:${(b.cover || "").length}`;

// --- apaga caches/rascunhos locais relacionados ao livro ---
function eraseBookLocalCaches(book) {
  try {
    // capas salvas
    localStorage.removeItem(`cover-gallery:${book.id}`);
  } catch {}

  try {
    // settings por livro (o seu makeKey usa id OU título)
    localStorage.removeItem(`book-settings:${book.id}`);
    if (book.title) localStorage.removeItem(`book-settings:${book.title}`);
  } catch {}

  try {
    // rascunhos do dia (progress:draft:YYYY-MM-DD:<bookId>)
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("progress:draft:") && k.endsWith(`:${book.id}`)) {
        localStorage.removeItem(k);
        i--; // ajusta índice pois o storage diminuiu
      }
    }
  } catch {}
}


export default function BookDrawer({ open, book, onClose }){
  // ===== Hooks DEVEM vir antes de qualquer return =====
  const lib = useLibrary();

  // livro “vivo” (lê do store quando ele mudar)
  const liveBook = useMemo(() => {
    const arr = Array.isArray(lib?.books) ? lib.books
             : Array.isArray(lib?.state?.books) ? lib.state.books
             : [];
    return (book && arr.find(b => b.id === book.id)) || book || {};
  }, [lib?.books, lib?.state?.books, book]);

  // entradas e agregados
  const entries = useMemo(
    () => (liveBook?.id ? (lib.getEntries?.(liveBook.id) || []) : []),
    [lib, liveBook?.id]
  );
  const avg = useMemo(() => (liveBook?.id ? lib.getAverageRating(liveBook.id) : 0), [lib, liveBook?.id]);
  const totalMinutes = useMemo(
    () => entries.reduce((acc, e) => acc + (Number(e.minutes)||0), 0),
    [entries]
  );

  // ==== TÍTULO editável ====
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft]     = useState(liveBook.title || "");
  useEffect(()=> setTitleDraft(liveBook.title || ""), [liveBook.title]);
  const titleInputRef = useRef(null);
  useEffect(()=> { if (editingTitle) titleInputRef.current?.focus(); }, [editingTitle]);
  useEffect(() => {
    if (!editingTitle) return;
    const v = (titleDraft || "").trim();
    if ((liveBook.title || "") === v) return;
    const t = setTimeout(() => { lib.updateBook?.(liveBook.id, { title: v }); }, 400);
    return () => clearTimeout(t);
  }, [editingTitle, titleDraft, liveBook.id, liveBook.title, lib]);

  // ==== AUTOR editável ====
  const [editingAuthor, setEditingAuthor] = useState(false);
  const [authorDraft, setAuthorDraft] = useState(liveBook.author || "");
  useEffect(()=> setAuthorDraft(liveBook.author || ""), [liveBook.author]);
  const authorInputRef = useRef(null);
  useEffect(()=> { if (editingAuthor) authorInputRef.current?.focus(); }, [editingAuthor]);
  useEffect(() => {
    if (!editingAuthor) return;
    const value = authorDraft.trim();
    if ((book?.author || "") === value) return;
    const t = setTimeout(() => { lib.updateBook?.(liveBook.id, { author: value }); }, 400);
    return () => clearTimeout(t);
  }, [authorDraft, editingAuthor, book?.author, liveBook.id, lib]);

  // ==== CAPA ====
  const [coverOpen, setCoverOpen] = useState(false);

  // ==== NOTAS expand/editar ====
  const [expanded, setExpanded] = useState(()=> new Set());
  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const [detail, setDetail] = useState(null);

  // ==== Edição inline: Páginas ====
  const [editingPages, setEditingPages] = useState(false);
  const [pagesDraft, setPagesDraft] = useState({
    read: liveBook.pagesRead || 0,
    total: liveBook.pagesTotal || 0,
  });
  useEffect(() => {
    setPagesDraft({ read: liveBook.pagesRead || 0, total: liveBook.pagesTotal || 0 });
  }, [liveBook.pagesRead, liveBook.pagesTotal]);

  function commitPages() {
    const read  = Math.max(0, Math.floor(Number(pagesDraft.read)||0));
    const total = Math.max(0, Math.floor(Number(pagesDraft.total)||0));
    lib.updateBook?.(liveBook.id, { pagesRead: Math.min(read, total), pagesTotal: total });
    setEditingPages(false);
  }

  // ==== Edição inline: Minutos (ajuste manual) ====
  const baseMinutes = useMemo(
    () => entries.reduce((acc, e) => acc + (Number(e.minutes)||0), 0),
    [entries]
  );
  const manualAdj = Number(liveBook.minutesManual || 0);
  const shownMinutes = baseMinutes + manualAdj;

  const [editingMin, setEditingMin] = useState(false);
  const [minDraft, setMinDraft] = useState(shownMinutes);
  useEffect(() => setMinDraft(shownMinutes), [shownMinutes]);
  function commitMinutes() {
    const desired = Math.max(0, Math.floor(Number(minDraft)||0));
    const adj = desired - baseMinutes; // diferencial salvo no livro
    lib.updateBook?.(liveBook.id, { minutesManual: adj });
    setEditingMin(false);
  }

  const [delOpen, setDelOpen] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState("");


  // ✅ Só agora podemos retornar condicionalmente
  if (!open || !book) return null;

  // ======= EXCLUIR LIVRO (e tudo relacionado) =======
  async function handleConfirmDelete() {
    if (!liveBook?.id) return;
    setDelBusy(true);
    setDelErr("");

    try {
      // 1) apaga notas/entradas se o hook tiver removeEntry
      try {
        const all = lib.getEntries?.(liveBook.id) || [];
        for (const e of all) {
          await lib.removeEntry?.(liveBook.id, e.id);
        }
      } catch {}

      // 2) remove o livro da biblioteca
      if (lib.removeBook) {
        await lib.removeBook(liveBook.id);
      } else if (lib.updateBook) {
        // fallback — marca como removido
        await lib.updateBook(liveBook.id, { __deleted: true });
      }

      // 3) limpa caches locais (capas, settings, rascunhos)
      eraseBookLocalCaches(liveBook);

      // 4) fecha modal e drawer
      setDelOpen(false);
      onClose?.();
    } catch (err) {
      console.error(err);
      setDelErr("Não foi possível excluir. Tente novamente.");
    } finally {
      setDelBusy(false);
    }
  }


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
                onBlur={() => {
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
              <img
                key={imgKey(liveBook)}
                className={s.cover}
                src={coverSrc(liveBook)}
                alt={liveBook.title}
              />
            </button>

            <div className={s.metaBox}>
              {/* Autor */}
              <div className={s.authorLine}>
                {editingAuthor ? (
                  <input
                    ref={authorInputRef}
                    className={s.authorInput}
                    value={authorDraft}
                    onChange={(e)=> setAuthorDraft(e.target.value)}
                    onBlur={() => {
                      const v = authorDraft.trim();
                      if ((liveBook.author || "") !== v) lib.updateBook?.(liveBook.id, { author: v });
                      setEditingAuthor(false);
                    }}
                    onKeyDown={(e)=> {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const v = authorDraft.trim();
                        if ((liveBook.author || "") !== v) lib.updateBook?.(liveBook.id, { author: v });
                        e.currentTarget.blur();
                      }
                      if (e.key === "Escape") {
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

              {/* Média de estrelas */}
              <div className={s.metaLine}>
                <StarMeter value={avg} />
                <span className={s.avgNum}>{Number(avg||0).toFixed(1)}</span>
              </div>

              {/* Páginas – clique para editar */}
              <div className={`${s.metaLine} ${s.pagesLine} ${editingPages ? s.editing : ""}`}>
                {editingPages ? (
                  <>
                    <input
                      className={s.inlineNumber}
                      type="number"
                      min="0"
                      value={pagesDraft.read}
                      onChange={(e)=> setPagesDraft(p => ({ ...p, read: e.target.value }))}
                      onKeyDown={(e)=> { if(e.key==='Enter') commitPages(); if(e.key==='Escape'){ setEditingPages(false); setPagesDraft({ read: liveBook.pagesRead||0, total: liveBook.pagesTotal||0 }); } }}
                      onBlur={commitPages}
                    />
                    <span className={s.sep}>/</span>
                    <input
                      className={s.inlineNumber}
                      type="number"
                      min="0"
                      value={pagesDraft.total}
                      onChange={(e)=> setPagesDraft(p => ({ ...p, total: e.target.value }))}
                      onKeyDown={(e)=> { if(e.key==='Enter') commitPages(); if(e.key==='Escape'){ setEditingPages(false); setPagesDraft({ read: liveBook.pagesRead||0, total: liveBook.pagesTotal||0 }); } }}
                      onBlur={commitPages}
                    />
                    <span className={s.label}>páginas</span>
                  </>
                ) : (
                  <>
                    <button
                      className={s.valueBtn}
                      onClick={()=> setEditingPages(true)}
                      title="Editar páginas lidas/total"
                    >
                      <span className={s.value}>{liveBook.pagesRead}</span>
                      <span className={s.sep}>/</span>
                      <span className={s.total}>{liveBook.pagesTotal}</span>
                    </button>
                    <span className={s.label}>páginas</span>
                  </>
                )}
              </div>


              {/* Minutos – clique para editar (ajuste manual) */}
              <div className={`${s.metaLine} ${s.timeLine}`}>
                {editingMin ? (
                  <>
                    <input
                      className={s.inlineNumber}
                      type="number"
                      min="0"
                      value={minDraft}
                      onChange={(e)=> setMinDraft(e.target.value)}
                      onKeyDown={(e)=> {
                        if(e.key==='Enter') commitMinutes();
                        if(e.key==='Escape'){ setEditingMin(false); setMinDraft(shownMinutes); }
                      }}
                      onBlur={commitMinutes}
                    />
                    <span className={s.label}>min lidos</span>
                  </>
                ) : (
                  <>
                    <button className={s.valueBtn} onClick={()=> setEditingMin(true)} title="Editar minutos lidos">
                      <span className={s.value}>{shownMinutes}</span>
                    </button>
                    <span className={s.label}>min lidos</span>
                  </>
                )}
              </div>

              {/* (se quiser manter o total calculado com texto "64 min lidos") */}
              {/* <div className={`${s.metaLine} ${s.timeLine}`}>
                <span className={s.value}>{fmtMin(totalMinutes)}</span>
                <span className={s.label}>lidos</span>
              </div> */}
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

                <p
                  className={`${s.text} ${!isExpanded ? s.clamp2 : ""}`}
                  onClick={() => toggleExpand(e.id)}
                  title={!isExpanded ? "Clique para expandir" : "Clique para recolher"}
                >
                  {e.note || <i>Sem observações.</i>}
                </p>

                <div className={s.row}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setDetail({ ...e, bookId: liveBook.id })}
                  >
                    Editar nota
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
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
          <button
            className="btn btn-danger"
            onClick={() => setDelOpen(true)}
            title="Excluir este livro e todos os dados"
          >
            Excluir livro
          </button>

          <button className="btn btn-ghost" onClick={onClose}>
            Fechar
          </button>
        </footer>

      </aside>

      {/* Picker de capas */}
      <CoverPicker
        open={coverOpen}
        bookId={liveBook.id}
        current={liveBook.cover || ""}
        title={liveBook.title}
        onClose={()=> setCoverOpen(false)}
        onPick={(url) => {
          lib.updateBook(liveBook.id, { cover: url }); // atualiza + coverVer
          setCoverOpen(false);
        }}
      />

      {/* Detalhe de nota */}
      <NoteDetailModal
        open={!!detail}
        entry={detail}
        onClose={() => setDetail(null)}
        onSave={async ({ id, rating, note }) => {
          await lib.updateEntry(liveBook.id, id, { rating, note });
        }}
      />

      {/* Modal de confirmação de exclusão */}
      <ModalMount open={delOpen}>
        <div className={s.confirmBackdrop} onClick={()=>!delBusy && setDelOpen(false)} />
        <div className={s.confirmCard} onClick={(e)=>e.stopPropagation()}>
          <h3 className={s.confirmTitle}>Excluir livro?</h3>
          <p className={s.confirmText}>
            Isso vai apagar <strong>todas as notas, progresso, capas salvas e rascunhos do dia</strong> deste livro.
            Essa ação não pode ser desfeita.
          </p>

          {delErr && <div className={s.error}>{delErr}</div>}

          <div className={s.rowEnd}>
            <button className="btn btn-ghost" disabled={delBusy} onClick={()=>setDelOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-danger" disabled={delBusy} onClick={handleConfirmDelete}>
              {delBusy ? "Excluindo…" : "Excluir"}
            </button>
          </div>
        </div>
      </ModalMount>

    </ModalMount>
  );
}
