import { createRoot } from "react-dom/client";
import "./lib/fetchPatch";
import App from "./App";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[sw] Registration failed:", err);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
