import { useState } from "react";

function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

export default function NewBookModal({ open, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pagesTotal, setPagesTotal] = useState("");
  const [status, setStatus] = useState("lendo");
  const [cover, setCover] = useState(null);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    let coverData = cover;
    // ok se usuário não escolheu capa
    await onSave({ title, author, pagesTotal, status, cover: coverData });
    onClose();
    setTitle(""); setAuthor(""); setPagesTotal(""); setStatus("lendo"); setCover(null);
  }

  async function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const data = await fileToDataURL(f);
    setCover(data);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Novo Livro</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Título*
            <input value={title} onChange={e => setTitle(e.target.value)} required />
          </label>

          <label>Autor (opcional)
            <input value={author} onChange={e => setAuthor(e.target.value)} />
          </label>

          <label>Total de páginas
            <input type="number" min="1" inputMode="numeric" value={pagesTotal}
                   onChange={e => setPagesTotal(e.target.value)} />
          </label>

          <label>Capa (opcional)
            <input type="file" accept="image/*" onChange={onPickFile} />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
