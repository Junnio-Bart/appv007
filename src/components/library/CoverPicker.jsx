// src/components/library/CoverPicker.jsx
import { useEffect, useRef, useState } from "react";
import css from "./CoverPicker.module.css";
import ModalMount from "../ModalMount.jsx";

function readFile(file){
  return new Promise((res, rej)=>{
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

// persistir mini-galeria por livro (localStorage)
const key = (id) => `book-covers:${id}`;
CoverPicker.saveToGallery = (bookId, url) => {
  try {
    const arr = JSON.parse(localStorage.getItem(key(bookId)) || "[]");
    const next = [url, ...arr.filter(u => u !== url)].slice(0, 12);
    localStorage.setItem(key(bookId), JSON.stringify(next));
  } catch {}
};
function loadGallery(bookId){
  try { return JSON.parse(localStorage.getItem(key(bookId)) || "[]"); } catch { return []; }
}

export default function CoverPicker({ open, current, title, bookId, onClose, onSelect }){
  const fileRef = useRef(null);
  const [urls, setUrls] = useState([]);

  useEffect(()=> {
    if (open && bookId) setUrls(loadGallery(bookId));
  }, [open, bookId]);

  if (!open) return null;

  return (
    <ModalMount>
      <div className={css.backdrop} onClick={onClose}/>
      <div className={css.panel} onClick={(e)=>e.stopPropagation()}>
        <h3 className={css.title}>Capas para <em>{title}</em></h3>

        <div className={css.grid}>
          {/* atual */}
          {current && (
            <button className={`${css.card} ${css.active}`} onClick={()=> onSelect?.(current, false)} aria-label="Usar capa atual">
              <img src={current} alt="Capa atual"/>
            </button>
          )}

          {/* upload do dispositivo */}
          <button className={`${css.card} ${css.add}`} onClick={()=> fileRef.current?.click()}>
            <span>+ Adicionar do dispositivo</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={async (e)=> {
                const f = e.target.files?.[0];
                if (!f) return;
                const dataUrl = await readFile(f);
                onSelect?.(dataUrl, true); // salva na galeria
              }}
            />
          </button>

          {/* colar URL */}
          <button
            className={`${css.card} ${css.url}`}
            onClick={async()=> {
              const url = prompt("Cole a URL da imagem da capa:");
              if (url && /^https?:\/\//i.test(url)) onSelect?.(url, true);
            }}
          >
            <span>🔗 Colar URL</span>
          </button>

          {/* capas salvas previamente */}
          {urls.map(u => (
            <button key={u} className={css.card} onClick={()=> onSelect?.(u, false)}>
              <img src={u} alt="Capa salva"/>
            </button>
          ))}
        </div>

        <div className={css.actions}>
          <button className={css.btn} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </ModalMount>
  );
}
