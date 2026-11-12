import { useContext } from "react";
import { RealtimeContext } from "../contexts/realtime/RealtimeContext";

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime должен использоваться внутри RealtimeProvider");
  }

  return context;
};
