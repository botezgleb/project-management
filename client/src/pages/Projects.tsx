import { useEffect, useState } from "react";
import { 
  getProjectsApi, 
  createProjectApi, 
  deleteProjectApi,
  updateProjectApi 
} from "../services/api/projects.api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Project } from "../types/project";
import "../css/Projects.css";
import { socket } from "../socket/socket";
import { CrownIcon, PencilIcon, PlusIcon, TrashIcon, UsersIcon } from "../components/ui/Icons";

const pluralize = (n: number, forms: [string, string, string]) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
};

export const Projects = () => {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const data = await getProjectsApi();
        setProjects(data);
        setError(null);
      } catch (error) {
        console.error(error);
        setError("Не удалось загрузить проекты");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();

    // нас добавили в проект или исключили из него — обновляем список
    const reload = () => {
      getProjectsApi().then(setProjects).catch(console.error);
    };
    socket.on("project:added", reload);
    socket.on("project:removed", reload);

    return () => {
      socket.off("project:added", reload);
      socket.off("project:removed", reload);
    };
  }, []);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;

    try {
      setCreating(true);
      setError(null);
      const newProject = await createProjectApi(projectName, projectDescription);
      setProjects([...projects, newProject]);
      setShowCreateModal(false);
      setProjectName("");
      setProjectDescription("");
    } catch (error) {
      console.error(error);
      setError("Не удалось создать проект");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    
    if (!window.confirm("Вы уверены, что хотите удалить этот проект?")) {
      return;
    }

    try {
      setError(null);
      setProjects(prev => prev.filter(p => p.id !== id));
      await deleteProjectApi(id);
    } catch (error) {
      console.error(error);
      setError("Не удалось удалить проект");
      const data = await getProjectsApi();
      setProjects(data);
    }
  };

  const handleEditProject = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description || "");
    setShowEditModal(true);
    setError(null);
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !projectName.trim()) return;

    try {
      setUpdating(true);
      setError(null);
      
      await updateProjectApi(editingProject.id, {
        name: projectName,
        description: projectDescription || undefined
      });
      
      setProjects(prev => prev.map(p => 
        p.id === editingProject.id 
          ? { 
              ...p,
              name: projectName,
              description: projectDescription || null
            } 
          : p
      ));
      
      setShowEditModal(false);
      setEditingProject(null);
      setProjectName("");
      setProjectDescription("");
    } catch (error) {
      console.error(error);
      setError("Не удалось обновить проект");
    } finally {
      setUpdating(false);
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    setProjectName("");
    setProjectDescription("");
    setError(null);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingProject(null);
    setProjectName("");
    setProjectDescription("");
    setError(null);
  };

  const canManageProject = (project: Project) => {
    return project.role === 'OWNER' || user?.role === 'ADMIN';
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Загрузка проектов...</p>
      </div>
    );
  }

  const isModalOpen = showCreateModal || (showEditModal && editingProject);
  const isEdit = showEditModal && !!editingProject;

  return (
    <div className="page projects-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Your <span>Projects</span>
          </h1>
          <p className="page-subtitle">
            {projects.length > 0
              ? `${projects.length} ${pluralize(projects.length, ["проект", "проекта", "проектов"])}`
              : "Здесь появятся ваши проекты"}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <PlusIcon /> Новый проект
        </button>
      </div>

      {error && !isModalOpen && (
        <div className="alert projects-alert">
          <span>{error}</span>
          <button onClick={() => window.location.reload()}>Обновить</button>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="empty-state glass projects-empty">
          <h2>У вас пока нет проектов</h2>
          <p>Создайте первый проект, чтобы начать работу</p>
          <button className="btn btn-primary btn-lg" onClick={openCreateModal}>
            <PlusIcon /> Создать проект
          </button>
        </div>
      ) : (
        <div className="projects-grid stagger">
          {projects.map((project) => {
            const ownerName = project.owner?.name || "Неизвестно";
            const membersCount = project.membersCount || 1;

            return (
              <div
                key={project.id}
                className="project-card glass"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="project-card-header">
                  <div className="project-card-icon">
                    {project.name.trim().charAt(0).toUpperCase() || "P"}
                  </div>
                  <div className="project-card-header-right">
                    {canManageProject(project) && (
                      <div className="project-actions">
                        <button
                          className="icon-btn"
                          title="Редактировать"
                          onClick={(e) => handleEditProject(e, project)}
                        >
                          <PencilIcon />
                        </button>
                        <button
                          className="icon-btn danger"
                          title="Удалить"
                          onClick={(e) => handleDeleteProject(e, project.id)}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                    {project.role === "OWNER" ? (
                      <span className="badge badge-accent">Владелец</span>
                    ) : (
                      <span className="badge">Участник</span>
                    )}
                  </div>
                </div>

                <h3 className="project-card-title">{project.name}</h3>
                <p className={`project-description ${project.description ? "" : "is-empty"}`}>
                  {project.description || "Без описания"}
                </p>

                <div className="project-card-footer">
                  <span title={`Владелец: ${ownerName}`}>
                    <CrownIcon /> {ownerName}
                  </span>
                  <span title={`Участников: ${membersCount}`}>
                    <UsersIcon /> {membersCount}
                  </span>
                  <span className="project-date">
                    {new Date(project.createdAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-backdrop" onClick={closeModals}>
          <form
            className="modal-sheet glass"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (isEdit) handleUpdateProject();
              else handleCreateProject();
            }}
          >
            <h2>{isEdit ? "Редактировать проект" : "Новый проект"}</h2>

            <div className="projects-form">
              <div className="field">
                <label htmlFor="project-name">Название</label>
                <input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Например: Разработка сайта"
                  autoFocus
                />
              </div>

              <div className="field">
                <label htmlFor="project-description">Описание</label>
                <textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Краткое описание проекта (необязательно)"
                  rows={4}
                />
              </div>

              {error && <div className="alert">{error}</div>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn" onClick={closeModals}>
                Отмена
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!projectName.trim() || creating || updating}
              >
                {isEdit
                  ? updating
                    ? "Сохранение..."
                    : "Сохранить"
                  : creating
                    ? "Создание..."
                    : "Создать"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};