
import { useState } from "react";
import useLibrary from "../hooks/useLibrary.js";
import s from "./Progress.module.css";   // <= CSS Module

export default function Progress({ onGoLibrary }) {
  const { activeBook, updateBook } = useLibrary();
  const [delta, setDelta] = useState(1);

  if (!activeBook) {
    return (
      <section aria-label="Progresso" className="section">
        <h1>Progresso</h1>
        <p>Nenhum livro ativo. Selecione um na Biblioteca.</p>
        {onGoLibrary && <button className="btn-primary" onClick={onGoLibrary}>Abrir Biblioteca</button>}
      </section>
    );
  }

  const { id, title, author, pagesRead = 0, pagesTotal = 0 } = activeBook;
  const pct = pagesTotal ? Math.round((pagesRead / pagesTotal) * 100) : 0;
  const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
  const setRead = v => updateBook(id, { pagesRead: clamp(Number(v)||0, 0, pagesTotal || 9e9) });

  return (
    <section aria-label="Progresso" className="section">
      <h1>Progresso</h1>

      <div className={s.card}>
        <h2 className="book-title">{title}</h2>
        {author && <p className="book-author">por {author}</p>}
        <p className="book-progress">{pagesRead} / {pagesTotal || "?"} páginas · {pct}%</p>

        <div className={s.controls}>
          <button className="btn-secondary" onClick={() => setRead(pagesRead - delta)}>-{delta}</button>
          <input className={s.num} type="number" min="1" value={delta}
                 onChange={e => setDelta(Math.max(1, Number(e.target.value) || 1))}/>
          <button className="btn-primary" onClick={() => setRead(pagesRead + delta)}>+{delta}</button>
        </div>

        <div className={s.set}>
          <label>Definir páginas lidas:
            <input type="number" min="0" defaultValue={pagesRead} onBlur={e => setRead(e.target.value)} />
          </label>
        </div>
      </div>
    </section>
  );
}
