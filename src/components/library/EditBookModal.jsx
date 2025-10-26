// src/components/library/EditBookModal.jsx
import { useEffect, useRef, useState } from "react";
import ModalMount from "../ModalMount.jsx";
import CoverPicker from "./CoverPicker.jsx";
import s from "./EditBookModal.module.css";

export default function EditBookModal({ open, book, onClose, onSave, onPickCover }) {
  const [title, setTitle]     = useState(book?.title || "");
  const [author, setAuthor]   = useState(book?.author || "");
  const [pagesTotal, setTotal]= useState(Number(book?.pagesTotal ?? book?.pages ?? 0));
  const [pagesRead, setRead]  = useState(Number(book?.pagesRead || 0));
  const [minutes, setMinutes] = useState( // soma guardada; se não tiver, mostra 0
    Number(book?.minutesTotal || 0)
  );
  const [avg, setAvg]         = useState(Number(book?.avgRating || 0));
  const [coverOpen, setCoverOpen] = useState(false);

  useEffect(()=> {
    if (!open) return;
    setTitle(book?.title || "");
    setAuthor(book?.author || "");
    setTotal(Number(book?.pagesTotal ?? book?.pages ?? 0));
    setRead(Number(book?.pagesRead || 0));
    setMinutes(Number(book?.minutesTotal || 0));
    setAvg(Number(book?.avgRating || 0));
  }, [open, book]);

  if (!open || !book) return null;

  function handleSave(){
    onSave?.({
      title: title.trim() || "Sem título",
      author: author.trim(),
      pagesTotal: Math.max(0, Number(pagesTotal)||0),
      pagesRead:  Math.min(Math.max(0, Number(pagesRead)||0), Math.max(0, Number(pagesTotal)||0)),
      minutesTotal: Math.max(0, Number(minutes)||0),
      avgRating: Math.max(0, Math.min(5, Number(avg)||0)),
    });
    onClose?.();
  }

  return (
    <ModalMount>
      <div className={s.backdrop} onClick={onClose}/>
      <div className={s.panel} onClick={(e)=>e.stopPropagation()}>
        <h3 className={s.title}>Editar livro</h3>

        <div className={s.row}>
          <label className={s.label}>Título</label>
          <input className={s.input} value={title} onChange={(e)=>setTitle(e.target.value)} />
        </div>

        <div className={s.row}>
          <label className={s.label}>Autor</label>
          <input className={s.input} value={author} onChange={(e)=>setAuthor(e.target.value)} />
        </div>

        <div className={s.rowGrid}>
          <div>
            <label className={s.label}>Total de páginas</label>
            <input className={s.input} inputMode="numeric" value={pagesTotal}
                   onChange={(e)=>setTotal(e.target.value.replace(/\D+/g,""))}/>
          </div>
          <div>
            <label className={s.label}>Páginas lidas</label>
            <input className={s.input} inputMode="numeric" value={pagesRead}
                   onChange={(e)=>setRead(e.target.value.replace(/\D+/g,""))}/>
          </div>
        </div>

        <div className={s.rowGrid}>
          <div>
            <label className={s.label}>Tempo total lido (min)</label>
            <input className={s.input} inputMode="numeric" value={minutes}
                   onChange={(e)=>setMinutes(e.target.value.replace(/\D+/g,""))}/>
          </div>
          <div>
            <label className={s.label}>Média (0–5)</label>
            <input className={s.input} inputMode="decimal" value={avg}
                   onChange={(e)=>setAvg(e.target.value)}/>
          </div>
        </div>

        <div className={s.row}>
          <button className="btn btn-primary" onClick={()=> setCoverOpen(true)}>Alterar capa…</button>
        </div>

        <div className={s.actions}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>Salvar</button>
        </div>

        <CoverPicker
          open={coverOpen}
          bookId={book.id}
          current={book.cover || ""}
          title={title}
          onClose={()=> setCoverOpen(false)}
          onPick={(url)=> { onPickCover?.(url); setCoverOpen(false); }}
        />
      </div>
    </ModalMount>
  );
}
