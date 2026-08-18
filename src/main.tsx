import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { LocaleProvider } from "./i18n/index.tsx";
import { getLocale, getTheme, setLocale, setTheme } from "./lib/storage.ts";
import "./index.css";

setTheme(getTheme());
setLocale(getLocale());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </StrictMode>,
);
