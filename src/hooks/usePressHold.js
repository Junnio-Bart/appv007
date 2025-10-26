// src/hooks/usePressHold.js
import { useRef } from "react";

export default function usePressHold(onHold, { ms = 500 } = {}) {
  const tRef = useRef(null);

  function start(e) {
    clear();
    tRef.current = setTimeout(() => onHold?.(e), ms);
  }
  function clear() {
    if (tRef.current) {
      clearTimeout(tRef.current);
      tRef.current = null;
    }
  }
  // handlers para props do elemento
  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onContextMenu: (e) => { // botão direito
      e.preventDefault();
      onHold?.(e);
    }
  };
}
