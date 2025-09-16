import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

export default function ModalMount({ children }) {
  // cria um nó único para este modal
  const el = useMemo(() => document.createElement("div"), []);

  useEffect(() => {
    // procura o root de modais; cria se não existir
    let root = document.getElementById("modal-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "modal-root";
      document.body.appendChild(root);
    }
    root.appendChild(el);
    return () => { try { root.removeChild(el); } catch {} };
  }, [el]);

  return createPortal(children, el);
}
