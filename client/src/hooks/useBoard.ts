import { useContext } from "react";
import { BoardContext } from "../contexts/board/BoardContext";

export const useBoard = () => {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard должен использоваться внутри доски");
  return ctx;
};
