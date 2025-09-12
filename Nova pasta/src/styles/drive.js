// src/sync/drive.js  (rascunho)
let gapiLoaded = false;
export async function initDrive({ apiKey, clientId }) {
  if (!gapiLoaded) {
    await new Promise((r) => {
      const s = document.createElement("script");
      s.src = "https://apis.google.com/js/api.js";
      s.onload = r;
      document.head.appendChild(s);
    });
    await new Promise((r) => window.gapi.load("client", r));
    gapiLoaded = true;
  }
  await gapi.client.init({
    apiKey,
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  });
  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: "https://www.googleapis.com/auth/drive.file",
    callback: () => {},
  });
  return {
    async signIn() {
      return new Promise((resolve) => {
        tokenClient.callback = resolve;
        tokenClient.requestAccessToken();
      });
    },
    async ensureFile(name = "book-library.json") {
      const q = encodeURIComponent(`name='${name}' and trashed=false`);
      const res = await gapi.client.drive.files.list({ q, pageSize: 1 });
      if (res.result.files?.length) return res.result.files[0].id;
      const create = await gapi.client.drive.files.create({
        resource: { name, mimeType: "application/json" },
        fields: "id",
      });
      return create.result.id;
    },
    async pull(fileId) {
      const res = await gapi.client.drive.files.get({ fileId, alt: "media" });
      return res.result; // objeto {books, activeId, ...}
    },
    async push(fileId, stateObj) {
      const body = JSON.stringify(stateObj);
      await gapi.client.request({
        path: `/upload/drive/v3/files/${fileId}`,
        method: "PATCH",
        params: { uploadType: "media" },
        headers: { "Content-Type": "application/json" },
        body,
      });
    },
  };
}
