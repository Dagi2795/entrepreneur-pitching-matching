import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@epm/ui/globals.css";

export function initWebApp() {
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

initWebApp();
