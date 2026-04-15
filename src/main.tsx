import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { capturePaidClickIds } from "./lib/dataLayer";
import "./index.css";

// Capture paid-ad click IDs (fbclid, gclid, ttclid, _fbc cookie, etc.) as early
// as possible so later SPA navigations can't strip them from the URL before the
// user submits the first form.
capturePaidClickIds();

createRoot(document.getElementById("root")!).render(<App />);
