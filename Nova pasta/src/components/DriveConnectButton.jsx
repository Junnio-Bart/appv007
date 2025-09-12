// src/components/DriveConnectButton.jsx
import { useState } from "react";
import { initDrive, signIn, ensureFolder, ensureJsonFile, pull, push } from "../sync/drive";
import useLibrary from "../hooks/useLibrary";

export default function DriveConnectButton() {
  const { books, activeId, setBooks, setActiveId } = useLibrary();
  const [status, setStatus] = useState("desconectado");
  const [fileId, setFileId] = useState(null);

  async function handleConnect() {
    try {
      setStatus("conectando…");
      await initDrive();
      await signIn();
      const folderId = await ensureFolder("BooK (App)");
      const fid = await ensureJsonFile(folderId, "library.json");
      setFileId(fid);
      setStatus("conectado ✔");
    } catch (e) {
      console.error(e);
      setStatus("erro");
    }
  }

  async function handleUpload() {
    if (!fileId) return;
    await push(fileId, { books, activeId, updatedAt: Date.now() });
    setStatus("enviado ☁️");
  }

  async function handleDownload() {
    if (!fileId) return;
    const cloud = await pull(fileId);
    if (cloud?.books) {
      setBooks(cloud.books);
      setActiveId(cloud.activeId ?? cloud.books[0]?.id ?? null);
      setStatus("baixado ⬇️");
    } else {
      setStatus("vazio no drive");
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button onClick={handleConnect}>Conectar Drive</button>
      <button onClick={handleUpload} disabled={!fileId}>Enviar</button>
      <button onClick={handleDownload} disabled={!fileId}>Baixar</button>
      <small>{status}</small>
    </div>
  );
}
