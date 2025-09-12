import { createPortal } from "react-dom";

export default function ModalMount({ open, children }) {
  if (!open) return null;
  return createPortal(children, document.body);
}
