import { useParams } from "react-router-dom";
import { Board } from "../components/board/Board";
import "../css/ProjectPage.css";

export default function ProjectPage() {
  const { projectId } = useParams();

  if (!projectId) {
    return (
      <div className="project-error">
        <h2>Проект не найден</h2>
        <p>Такого проекта не существует</p>
      </div>
    );
  }

  return (
    <div className="project-page">
      <Board projectId={Number(projectId)} />
    </div>
  );
}