import { NavLink } from "react-router-dom";
import { BoardIcon, ChartIcon } from "../ui/Icons";

// сегментированный переключатель «Доска / Статистика»
export const ProjectTabs = ({ projectId }: { projectId: number }) => (
  <nav className="segmented" aria-label="Разделы проекта">
    <NavLink
      end
      to={`/projects/${projectId}`}
      className={({ isActive }) => `segmented-item ${isActive ? "active" : ""}`}
    >
      <BoardIcon /> Доска
    </NavLink>
    <NavLink
      to={`/projects/${projectId}/stats`}
      className={({ isActive }) => `segmented-item ${isActive ? "active" : ""}`}
    >
      <ChartIcon /> Статистика
    </NavLink>
  </nav>
);
