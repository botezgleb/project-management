import "./App.css";
import { NavBar } from "./components/ui/NavBar";
import { AppRouter } from "./services/AppRouter";
import { Toaster } from "sonner";
import { useLocation } from "react-router-dom";
import { AmbientBackground } from "./components/ui/AmbientBackground";

function App() {
  const location = useLocation();

  return (
    <>
      <AmbientBackground />
      <NavBar />
      <div className="route-transition" key={location.pathname}>
        <AppRouter />
      </div>
      <Toaster position="bottom-right" theme="system" closeButton />
    </>
  );
}

export default App;
