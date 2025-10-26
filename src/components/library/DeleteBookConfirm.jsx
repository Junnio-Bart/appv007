// src/components/library/DeleteBookConfirm.jsx
import ModalMount from "../ModalMount.jsx";
import s from "./DeleteBookConfirm.module.css";

export default function DeleteBookConfirm({ open, onClose, onConfirm, bookTitle }) {
  if (!open) return null;
  return (
    <ModalMount>
      <div className={s.backdrop} onClick={onClose}/>
      <div className={s.panel} onClick={(e)=>e.stopPropagation()}>
        <h3 className={s.title}>Excluir livro?</h3>
        <p className={s.text}>
          Tem certeza que deseja excluir <strong>{bookTitle || "este livro"}</strong>?<br/>
          <em>Isso apagará todo o progresso, notas e capas salvas.</em>
        </p>
        <div className={s.row}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm}>Excluir definitivamente</button>
        </div>
      </div>
    </ModalMount>
  );
}
