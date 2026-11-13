import "./css/theme.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/auth/AuthProvider.tsx";
import { RealtimeProvider } from "./contexts/realtime/RealtimeProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <RealtimeProvider>
        <StrictMode>
          <App />
        </StrictMode>
      </RealtimeProvider>
    </AuthProvider>
  </BrowserRouter>,
);
