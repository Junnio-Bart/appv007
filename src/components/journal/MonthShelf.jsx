// src/components/journal/MonthShelf.jsx
import { useMemo, useState } from "react";
import css from "./MonthShelf.module.css";
import NewBookModal from "../NewBookModal";

// helpers para capa (quebra cache quando coverVer muda)
const coverSrc = (b) => {
  if (!b?.cover) return "";
  if (/^https?:\/\//i.test(b.cover)) {
    const sep = b.cover.includes("?") ? "&" : "?";
    return `${b.cover}${sep}v=${b.coverVer || 0}`; // anexa ?v=versão
  }
  // dataURL já muda quando trocada
  return b.cover;
};
const imgKey = (b) => `${b.id}:${b.coverVer || 0}:${(b.cover || "").length}`;

// === filtros/formatos existentes ===
function sameYm(dateISO, y, m){
  if (!dateISO) return false;
  const d = new Date(dateISO);
  return d.getFullYear() === y && d.getMonth() === m;
}
function visibleBooksForMonth(books, year, month){
  const now = new Date();
  return (books||[]).filter(b=>{
    if (!b) return false;
    const total = Math.max(0, Number(b.pages||0));
    const read  = Math.max(0, Number(b.pagesRead||0));
    const finished = Boolean(b.finishedAt) || (total>0 && read>=total);
    if (finished) return sameYm(b.finishedAt, year, month); // finalizados no mês/ano do término
    return (year === now.getFullYear() && month === now.getMonth()); // em andamento só no mês vigente
  });
}
function pctRead(book){
  const total = Math.max(1, Number(book.pages||1));
  const read  = Math.max(0, Number(book.pagesRead||0));
  return Math.min(100, Math.round((read/total)*100));
}

export default function MonthShelf({ year, month, books = [], onBookClick, style }){
  const [openAdd, setOpenAdd] = useState(false);
  const visible = useMemo(() => visibleBooksForMonth(books, year, month), [books, year, month]);

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
              onClick={() => setOpenAdd(true)}
              aria-label="Adicionar livro"
            >
              +
            </button>
          </div>
        ) : (
          <div className={css.grid}>
            {visible.map((b) => (
              <button
                key={imgKey(b)}               // 🔸 muda quando a capa muda
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
                  <div className={css.title} title={b.title}>
                    {b.title || "— sem título —"}
                  </div>
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

      <NewBookModal open={openAdd} onClose={() => setOpenAdd(false)} />
    </section>
  );
}
