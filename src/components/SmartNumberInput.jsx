// src/components/SmartNumberInput.jsx
import { useState, useCallback, useEffect, forwardRef } from "react";

const clampNum = (v, min = -Infinity, max = Infinity) =>
  Math.max(min, Math.min(max, v));

/**
 * SmartNumberInput
 * - Mostra o valor atual como placeholder (não como value)
 * - Primeiro dígito substitui tudo (em vez de “concatenar”)
 * - Backspace/Delete como primeira tecla → zera
 * - Cola (paste) só números
 * - onLiveChange: atualiza “ao digitar” (para pré-visualização)
 * - onCommit: confirma no blur/Enter
 * - replaceOnFirstKey pode ser desativado (exceção por campo)
 */
 const SmartNumberInput = forwardRef(function SmartNumberInput(
  {
    className,
    // “valor atual” só para placeholder; o draft é controlado internamente
    currentValue = 0,
    min = 0,
    max = Infinity,
    autoFocus = false,
    inputMode = "numeric",
    pattern = "[0-9]*",

    replaceOnFirstKey = true,   // <<< regra global (liga/desliga por campo)
    onLiveChange,               // (n: number) => void
    onCommit,                   // (n: number) => void

    // transformar texto → número (se quiser tratar vazios/NaN diferente)
    parse = (txt) => (txt === "" ? NaN : Math.floor(Number(txt))),
    ...rest
  },
  ref
) {
  const [touched, setTouched] = useState(false);
  const [draft, setDraft] = useState("");

  // sempre que o “campo” for reaberto, limpamos o draft/touched
  useEffect(() => { setDraft(""); setTouched(false); }, []);

  const applyLive = useCallback((txt) => {
    const n = parse(txt);
    if (Number.isFinite(n)) {
      const capped = clampNum(n, min, max);
      onLiveChange?.(capped);
    } else {
      // vazio/NaN → pode querer mandar 0 ou ignorar
      onLiveChange?.(clampNum(NaN, min, max)); // noop
    }
  }, [min, max, onLiveChange, parse]);

  const handleKeyDown = (e) => {
    if (!replaceOnFirstKey || touched) return;

    const k = e.key;
    if (/^[0-9]$/.test(k)) {
      e.preventDefault();
      setTouched(true);
      setDraft(k);
      applyLive(k);
    } else if (k === "Backspace" || k === "Delete") {
      e.preventDefault();
      setTouched(true);
      setDraft("");
      applyLive("");
    }
  };

  const handleChange = (e) => {
    const v = e.target.value.replace(/[^\d]/g, "");
    setTouched(true);
    setDraft(v);
    applyLive(v);
  };

  const handlePaste = (e) => {
    const t = (e.clipboardData.getData("text") || "").replace(/[^\d]/g, "");
    if (t) {
      e.preventDefault();
      setTouched(true);
      setDraft(t);
      applyLive(t);
    }
  };

  const commit = () => {
    const n = parse(draft);
    const finalNum = Number.isFinite(n) ? clampNum(n, min, max) : clampNum(currentValue, min, max);
    onCommit?.(finalNum);
  };

  const handleKeyUp = (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") onCommit?.(clampNum(currentValue, min, max)); // cancela
  };

  return (
    <input
      ref={ref}
      className={className}
      autoFocus={autoFocus}
      inputMode={inputMode}
      pattern={pattern}
      placeholder={String(currentValue ?? 0)}
      value={draft}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onChange={handleChange}
      onBlur={commit}
      onPaste={handlePaste}
      {...rest}
    />
  );
});

export default SmartNumberInput;
