import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./app/App";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    storageKey="wolent-admin-theme"
    themes={["light", "dark", "system"]}
  >
    <App />
  </ThemeProvider>
);
  