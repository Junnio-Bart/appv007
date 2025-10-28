import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";

import "./styles/globals.css";
import "./styles/buttons.css";

import { registerSW } from "virtual:pwa-register";
import { LibraryProvider } from "./hooks/useLibrary.js";


registerSW({ immediate: true });

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LibraryProvider>         {/* 👈 um único estado global da biblioteca */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LibraryProvider>
  </React.StrictMode>
);
