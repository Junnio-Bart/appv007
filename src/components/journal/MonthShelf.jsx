// src/components/journal/MonthShelf.jsx
import { useMemo, useState } from "react";
import css from "./MonthShelf.module.css";
import NewBookModal from "../NewBookModal";
import useLibrary from "../../hooks/useLibrary"; // ⟵ importa o hook

// helpers p/ cache-bust
function coverSrc(b){
  if (!b?.cover) return "";
  if (/^https?:\/\//i.test(b.cover)) {
    const sep = b.cover.includes("?") ? "&" : "?";
    return `${b.cover}${sep}v=${b.coverVer || 0}`;
  }
  return b.cover;
}
function imgKey(b){
  return `${b.id}:${b.coverVer || 0}:${(b.cover || "").length}`;
}

function sameYm(dateISO, y, m){
  if (!dateISO) return false;
  const d = new Date(dateISO);
  return d.getFullYear() === y && d.getMonth() === m;
}
function visibleBooksForMonth(books, year, month){
  const now = new Date();
  return (books||[]).filter(b=>{
    if (!b) return false;
    const total = Math.max(0, Number(b.pages||b.pagesTotal||0));
    const read  = Math.max(0, Number(b.pagesRead||0));
    const finished = Boolean(b.finishedAt) || (total>0 && read>=total);
    if (finished) return sameYm(b.finishedAt, year, month);
    return (year === now.getFullYear() && month === now.getMonth());
  });
}
function pctRead(book){
  const total = Math.max(1, Number(book.pages||book.pagesTotal||1));
  const read  = Math.max(0, Number(book.pagesRead||0));
  return Math.min(100, Math.round((read/total)*100));
}

export default function MonthShelf({ 
  year, month, books=[], 
  onBookClick, 
  onAddNew,    // opcional: se vier de cima, usamos; senão, abrimos modal interno
  style 
}){
  const lib = useLibrary();                 // ⟵ hook da biblioteca
  const [openAdd, setOpenAdd] = useState(false);
  const visible = useMemo(()=>visibleBooksForMonth(books, year, month), [books, year, month]);

  // quando salvar no modal: cria o livro de verdade
  function handleSaveNew({ title, author, pagesTotal, cover }) {
    const id = lib.addBook({
      title,
      author,
      pagesTotal: Number(pagesTotal) || 0,
      cover: cover || null,
    });
    setOpenAdd(false);
    // opcional: já abrir o card recém-criado
    if (onBookClick) {
      const created = (lib.books || []).find(b => b.id === id);
      if (created) onBookClick(created);
    }
  }

  // decide como abrir: usa callback externo se existir
  const openAdder = () => {
    if (typeof onAddNew === "function") onAddNew();
    else setOpenAdd(true);
  };

  return (
    <section className={css.box} style={style}>
      <div className={css.head}>
        <h3>Biblioteca</h3>
      </div>

      <div className={css.scroll}>
        {visible.length === 0 ? (
          <div className={css.empty}>
            <p>Tá meio vazio por aqui....</p>
            <button
              type="button"
              className={css.addSlot}
              onClick={openAdder}              // ⟵ agora chama o criador
              aria-label="Adicionar livro"
            >+</button>
          </div>
        ) : (
          <div className={css.grid}>
            {/* === CARD “ADICIONAR UM LIVRO” (primeiro) === */}
            <button
              type="button"
              className={`${css.card} ${css.addCard}`}
              onClick={openAdder}              // ⟵ idem
              aria-label="Adicionar um livro"
            >
              <div className={css.cover}>
                <div className={css.plus}>+</div>
              </div>
              <div className={css.meta}>
                <div className={`${css.title} ${css.addTitle}`}>Adicione um livro</div>
                <div className={css.author}>&nbsp;</div>
              </div>
            </button>

            {visible.map((b) => (
              <button
                key={b.id + ':' + (b.coverVer || 0)}
                type="button"
                className={css.card}
                onClick={() => onBookClick?.(b)}
                aria-label={`Abrir detalhes de ${b.title || "Livro"}`}
              >
                <div className={css.cover}>
                  {b.cover
                    ? <img key={imgKey(b)} src={coverSrc(b)} alt={b.title || "Capa do livro"} />
                    : <div className={css.ph}>+</div>}
                </div>

                <div className={css.meta}>
                  <div className={css.title} title={b.title}>{b.title || "— sem título —"}</div>
                  <div className={css.author}>{b.author || "Autor"}</div>
                </div>

                <div className={css.bar}>
                  <span style={{ width: `${pctRead(b)}%` }} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal interno só quando não veio onAddNew de cima */}
      {(!onAddNew) && (
        <NewBookModal
          open={openAdd}
          onClose={()=>setOpenAdd(false)}
          onSave={handleSaveNew}             // ⟵ cria o livro no salvar
        />
      )}
    </section>
  );
}
