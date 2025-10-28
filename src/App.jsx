// src/App.jsx
import { useState } from "react";
import BottomNav from "./components/BottomNav.jsx";
import Library from "./screens/Library.jsx";
import Progress from "./screens/Progress.jsx";
import Timer from "./screens/Timer.jsx";
import Journal from "./screens/Journal.jsx";
import LogoButton from "./components/LogoButton.jsx";
import DriveConnectButton from "./components/DriveConnectButton.jsx";

import bookLogo from "./assets/icons/logo.svg";
import "./styles/buttons.css";

export default function App(){
  const [tab, setTab] = useState("library");

  function handleLogoClick(){
    setTab(t => (t === "library" ? "progress" : "library"));
  }

  return (
    <div className="app">
      <main className="app-main" data-tab={tab}>
        <header className="app-header">
          <LogoButton
            onClick={handleLogoClick}
            ariaLabel={tab === "library" ? "Ir para Progresso" : "Ir para Biblioteca"}
            src={bookLogo}
            height="64px"
          />
          {/* <DriveConnectButton /> */}
        </header>

        {tab === "library"  && <Library onGoProgress={() => setTab("progress")} />}
        {tab === "progress" && <Progress onGoLibrary={() => setTab("library")} />}
        {tab === "timer"    && <Timer />}
        {tab === "journal"  && <Journal />}
      </main>

      {tab !== "library" && (
        <BottomNav current={tab} onChange={setTab} />
      )}
    </div>
  );
}
