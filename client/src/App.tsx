import "./App.css";
import { NavBar } from "./components/ui/NavBar";
import { AppRouter } from "./services/AppRouter";

function App() {
  return (
    <>
      <NavBar />
      <AppRouter />
    </>
  );
}

export default App;
