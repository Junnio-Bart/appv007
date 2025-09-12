// src/sync/drive.js
let tokenClient;

function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

export async function initDrive() {
  await loadScript("https://apis.google.com/js/api.js");
  await new Promise((r) => window.gapi.load("client", r));
  await window.gapi.client.init({
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  });
  await loadScript("https://accounts.google.com/gsi/client");
  tokenClient = tokenClient || window.google.accounts.oauth2.initTokenClient({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scope: "https://www.googleapis.com/auth/drive.file",
    callback: () => {},
  });
}

export async function signIn() {
  await initDrive();
  return new Promise((resolve) => {
    tokenClient.callback = resolve;
    tokenClient.requestAccessToken({ prompt: "" }); // pede uma vez
  });
}

export async function ensureFolder(name = "BooK (App)") {
  const q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const r = await gapi.client.drive.files.list({ q, pageSize: 1, fields: "files(id)" });
  if (r.result.files?.length) return r.result.files[0].id;
  const c = await gapi.client.drive.files.create({
    resource: { name, mimeType: "application/vnd.google-apps.folder" },
    fields: "id",
  });
  return c.result.id;
}

export async function ensureJsonFile(folderId, name = "library.json") {
  const q = `name='${name}' and '${folderId}' in parents and trashed=false`;
  const r = await gapi.client.drive.files.list({ q, pageSize: 1, fields: "files(id)" });
  if (r.result.files?.length) return r.result.files[0].id;
  const c = await gapi.client.drive.files.create({
    resource: { name, parents: [folderId], mimeType: "application/json" },
    fields: "id",
  });
  return c.result.id;
}

export async function pull(fileId) {
  const r = await gapi.client.drive.files.get({ fileId, alt: "media" });
  return r.result; // { books, activeId, ... }
}

export async function push(fileId, state) {
  await gapi.client.request({
    path: `/upload/drive/v3/files/${fileId}`,
    method: "PATCH",
    params: { uploadType: "media" },
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
}
