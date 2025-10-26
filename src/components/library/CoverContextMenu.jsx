// src/components/library/CoverContextMenu.jsx
import ModalMount from "../ModalMount.jsx";
import s from "./CoverContextMenu.module.css";

export default function CoverContextMenu({ open, onClose, onEdit, onDelete, bookTitle }) {
  if (!open) return null;
  return (
    <ModalMount>
      <div className={s.backdrop} onClick={onClose} />
      <div className={s.panel} onClick={(e)=>e.stopPropagation()}>
        <div className={s.title}>{bookTitle || "Livro"}</div>
        <div className={s.actions}>
          <button className="btn btn-primary" onClick={onEdit}>Editar</button>
          <button className="btn btn-danger" onClick={onDelete}>Excluir</button>
        </div>
      </div>
    </ModalMount>
  );
}
