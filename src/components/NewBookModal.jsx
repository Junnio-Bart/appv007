// src/components/NewBookModal.jsx
import { useState } from "react";
import s from "./NewBookModal.module.css";

// util: File -> dataURL (string)
function fileToDataURL(file){
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);      // string "data:image/png;base64,..."
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

export default function NewBookModal({ open, onClose, onSave }) {
  if (!open) return null;

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pagesTotal, setPagesTotal] = useState("");
  const [coverFile, setCoverFile] = useState(null);

  async function handleSubmit(e){
    e.preventDefault();
    const t = title.trim();
    if (!t) return;

    // se tiver capa, converte para string (data URL)
    let cover = null;
    if (coverFile) {
      try { cover = await fileToDataURL(coverFile); }
      catch { /* se falhar, segue sem capa */ }
    }

    onSave?.({
      title: t,
      author: author.trim(),
      pagesTotal: Number(pagesTotal) || 0,
      cover,                           // << agora é string, <img src> funciona
    });

    onClose?.();
  }

  return (
    <div className={s.backdrop} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={s.title}>Novo Livro</h2>

        <form className={s.form} onSubmit={handleSubmit}>
          <label className={s.label}>
            Título*
            <input className={s.input} value={title}
                   onChange={(e) => setTitle(e.target.value)} required />
          </label>

          <label className={s.label}>
            Autor (opcional)
            <input className={s.input} value={author}
                   onChange={(e) => setAuthor(e.target.value)} />
          </label>

          <label className={s.label}>
            Total de páginas
            <input className={s.input} type="number" inputMode="numeric"
                   value={pagesTotal} onChange={(e) => setPagesTotal(e.target.value)} />
          </label>

          <label className={s.label}>
            Capa (opcional)
            <input className={s.input} type="file" accept="image/*"
                   onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
          </label>

          <div className={s.actions}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
