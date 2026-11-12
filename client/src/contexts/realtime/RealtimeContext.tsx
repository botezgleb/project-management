import { createContext } from "react";

interface RealtimeContextType {
  incomingCount: number;
  setIncomingCount: (count: number) => void;
}

export const RealtimeContext = createContext<RealtimeContextType | null>(null);
