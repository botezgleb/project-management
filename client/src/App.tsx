import "./App.css";
import { NavBar } from "./components/ui/NavBar";
import { AppRouter } from "./services/AppRouter";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <NavBar />
      <AppRouter />
      <Toaster position="bottom-right" richColors closeButton />
    </>
  );
}

export default App;
