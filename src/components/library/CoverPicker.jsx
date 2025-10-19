// src/components/library/CoverPicker.jsx
import { useEffect, useRef, useState } from "react";
import ModalMount from "../ModalMount.jsx";
import css from "./CoverPicker.module.css";

/* ----------------- Storage utils ----------------- */
const key = (bookId) => `cover-gallery:${bookId}`;

function safeGetItem(k, def = "[]"){ try { return localStorage.getItem(k) ?? def; } catch { return def; } }
function safeSetItem(k, v){ try { localStorage.setItem(k, v); return true; } catch { return false; } }

function loadGallery(bookId){
  try { return JSON.parse(safeGetItem(key(bookId)) || "[]"); } catch { return []; }
}
function saveGallery(bookId, list){ return safeSetItem(key(bookId), JSON.stringify(list)); }
function addToGallery(bookId, url){
  const list = loadGallery(bookId);
  if (!list.includes(url)) list.unshift(url);
  saveGallery(bookId, list);
  return list;
}
function removeFromGallery(bookId, url){
  const list = loadGallery(bookId).filter(u => u !== url);
  saveGallery(bookId, list);
  return list;
}

/* ----------------- Image helpers ----------------- */
function fileToImage(file){
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = fr.result;
    };
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

async function compressImage(file, { maxW = 1024, maxH = 1365, quality = 0.82 } = {}){
  const img = await fileToImage(file);
  const scale = Math.min(1, maxW / img.width, maxH / img.height);
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

function dataURLBytes(dataURL){
  const base64 = dataURL.split(",")[1] ?? "";
  return Math.floor((base64.length * 3) / 4);
}

/* ------- CORS helpers (para imagens de pesquisa) ------- */
function proxify(url){
  try {
    const u = new URL(url);
    return `https://images.weserv.nl/?url=${encodeURIComponent(`${u.host}${u.pathname}${u.search}`)}`;
  } catch { return url; }
}

async function urlToDataURL(url){
  try {
    const r1 = await fetch(url, { mode: "cors" });
    const b1 = await r1.blob();
    return await new Promise((ok, err) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = err; fr.readAsDataURL(b1); });
  } catch {
    const p = proxify(url);
    const r2 = await fetch(p, { mode: "cors" });
    const b2 = await r2.blob();
    return await new Promise((ok, err) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = err; fr.readAsDataURL(b2); });
  }
}

/* ----------------- Fontes de busca ----------------- */
async function searchGoogleBooks(q){
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=20&printType=books&fields=items(volumeInfo/imageLinks)`;
    const res = await fetch(url);
    const json = await res.json();
    const items = Array.isArray(json.items) ? json.items : [];
    return items
      .map(v => v.volumeInfo?.imageLinks)
      .filter(Boolean)
      .map(links => links.extraLarge || links.large || links.medium || links.thumbnail || links.smallThumbnail)
      .filter(Boolean);
  } catch { return []; }
}

async function searchOpenLibrary(title, author){
  try {
    const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author||"")}&limit=20`;
    const res = await fetch(url);
    const json = await res.json();
    const docs = Array.isArray(json.docs) ? json.docs : [];
    return docs.filter(d => d.cover_i).map(d => `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`);
  } catch { return []; }
}

/* ----------------- Component ----------------- */
export default function CoverPicker({ open, onClose, bookId, current = "", title = "", onPick }){
  const isOpen = !!open && !!bookId;

  const fileRef = useRef(null);
  const [gallery, setGallery]   = useState([]);
  const [selected, setSelected] = useState(current || "");
  const [error, setError]       = useState("");

  // pesquisa
  const [showSearch, setShowSearch] = useState(false);
  const [q, setQ] = useState(title || "");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searchErr, setSearchErr] = useState("");

  // carregar galeria ao abrir
  useEffect(() => {
    if (!isOpen) return;
    const list = loadGallery(bookId);
    const withCurrent = current && !list.includes(current) ? [current, ...list] : list;
    setGallery(withCurrent);
    setSelected(current || withCurrent[0] || "");
    setError("");
    setResults([]); setSearchErr(""); setShowSearch(false);
    setQ(title || "");
  }, [isOpen, bookId, current, title]);

  if (!isOpen) return null;

  /* ---------- upload local ---------- */
  async function handleUpload(e){
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    try {
      const dataURL = await compressImage(f, { maxW: 1024, maxH: 1365, quality: 0.82 });
      const bytes = dataURLBytes(dataURL);
      const MAX_BYTES = 1.8 * 1024 * 1024;
      if (bytes > MAX_BYTES) {
        setError("Imagem muito grande após compressão. Tente uma menor.");
        e.target.value = "";
        return;
      }
      const list = addToGallery(bookId, dataURL);
      setGallery(list);
      setSelected(dataURL);
    } catch (err) {
      console.error("[CoverPicker] erro upload:", err);
      setError("Falha ao processar a imagem.");
    } finally {
      e.target.value = "";
    }
  }

  /* ---------- pesquisa online ---------- */
  async function handleSearch(e){
    e?.preventDefault();
    setLoading(true); setResults([]); setSearchErr("");
    try {
      const gb = await searchGoogleBooks(q);
      const [t, a] = (q || "").split(" - ");
      const ol = await searchOpenLibrary(t || q, a || "");
      const urls = Array.from(new Set([...(gb||[]), ...(ol||[])]));
      if (urls.length === 0) setSearchErr("Nada encontrado para esta busca.");
      setResults(urls);
    } catch (err) {
      console.error(err);
      setSearchErr("Falha ao buscar capas.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------- galeria ops ---------- */
  function handleRemove(url){
    const list = removeFromGallery(bookId, url);
    setGallery(list);
    if (selected === url) setSelected(list[0] || "");
  }
  function handleUse(){
    if (selected) {
      onPick?.(selected);
      onClose?.();
    }
  }

  return (
    <ModalMount>
      <div className={css.backdrop} onClick={onClose}/>
      <div className={css.panel} onClick={(e)=>e.stopPropagation()}>
        <h3 className={css.title}>Capas</h3>
        <div className={css.subtitle}><em>Livro: {title || "—"}</em></div>

        {/* toolbar: Upload primeiro, depois Pesquisa */}
        <div className={css.toolbar}>
          <button className="btn btn-primary" onClick={()=> fileRef.current?.click()}>
            Adicionar do dispositivo
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />

          <button
            className={`btn btn-ghost${showSearch ? " active" : ""}`}
            onClick={()=> setShowSearch(v => !v)}
          >
            Pesquisar
          </button>
        </div>

        {/* Caixa de pesquisa (expansível) */}
        {showSearch && (
          <div className={css.searchBox}>
            <form className={css.searchForm} onSubmit={handleSearch}>
              <input
                className={css.searchInput}
                value={q}
                onChange={(e)=> setQ(e.target.value)}
                placeholder="Título — opcionalmente 'Título - Autor'"
              />
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Buscando…" : "Buscar"}
              </button>
            </form>

            {searchErr && <div className={css.error}>{searchErr}</div>}

            {results.length > 0 && (
              <div className={css.grid}>
                {results.map((url) => (
                  <div key={url} className={css.item}>
                    <button
                      type="button"
                      className={css.coverBtn}
                      onClick={()=> {/* preview apenas */}}
                      title="Pré-visualização"
                    >
                      <img className={css.cover} src={proxify(url)} alt="Resultado" />
                    </button>
                    <div className={css.row}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={async ()=> {
                          try {
                            const dataURL = await urlToDataURL(url);
                            const list = addToGallery(bookId, dataURL);
                            setGallery(list);
                            setSelected(dataURL);
                          } catch {
                            const list = addToGallery(bookId, url);
                            setGallery(list);
                            setSelected(url);
                            setSearchErr("Não deu para incorporar a imagem; usando a URL externa.");
                          }
                          setShowSearch(false);
                        }}
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Erro de upload/local */}
        {error && <div className={css.error}>{error}</div>}

        {/* GALERIA (padrão). Clique só seleciona (borda azul). */}
        <div className={css.grid}>
          {gallery.length === 0 && (
            <div className={css.empty}>Nenhuma capa ainda. Adicione do dispositivo ou pesquise.</div>
          )}
          {gallery.map((url) => {
            const isSel = selected === url;
            return (
              <div key={url} className={`${css.item} ${isSel ? css.selected : ""}`}>
                <button
                  type="button"
                  className={css.coverBtn}
                  onClick={()=> setSelected(url)}
                  title={isSel ? "Selecionada" : "Selecionar"}
                >
                  <img className={css.cover} src={url.startsWith("http") ? proxify(url) : url} alt="Capa" />
                </button>
                <div className={`${css.row} ${css.rowCenter}`}>
                  <button className="btn btn-ghost btn-sm" onClick={()=> handleRemove(url)}>Remover</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className={css.actions}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!selected} onClick={handleUse}>Definir capa</button>
        </div>
      </div>
    </ModalMount>
  );
}
