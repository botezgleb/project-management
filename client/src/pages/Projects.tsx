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
import userIcon from "../assets/user-icon.png";
import ownerIcon from "../assets/owner-icon.svg";

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
      <div className="projects-loading">
        <div className="loader"></div>
        <p>Загрузка проектов...</p>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h1>Your <span>Projects</span></h1>
        <button className="create-project-btn" onClick={openCreateModal}>
          <span className="plus-icon">+</span>
          Создать проект
        </button>
      </div>

      {error && !showCreateModal && !showEditModal && (
        <div className="projects-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Попробовать снова
          </button>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="projects-empty">
          <h2>У вас пока нет проектов</h2>
          <p>Создайте свой первый проект, чтобы начать работу</p>
          <button className="create-first-project" onClick={openCreateModal}>
            Создать проект
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => {
            const ownerName = project.owner?.name || 'Неизвестно';
            const membersCount = project.membersCount || 1;
            const projectRole = project.role;
            
            return (
              <div
                key={project.id}
                className="project-card"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="project-card-header">
                  <h3>{project.name}</h3>
                  <div className="project-badges">
                    {projectRole === 'OWNER' && (
                      <span className="owner-badge">Владелец</span>
                    )}
                    {projectRole === 'MEMBER' && (
                      <span className="member-badge">Участник</span>
                    )}
                  </div>
                </div>
                
                {project.description && (
                  <p className="project-description">{project.description}</p>
                )}
                
                <div className="project-card-footer">
                  <span className="project-date">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  <div className="project-footer-right">
                    <span className="project-owner" title={`Владелец: ${ownerName}`}>
                      <img src={ownerIcon} className="icon" /> {ownerName}
                    </span>
                    <span className="project-members-count" title={`Участников: ${membersCount}`}>
                      <img src={userIcon} className="icon" /> {membersCount}
                    </span>
                  </div>
                </div>

                {canManageProject(project) && (
                  <div className="project-actions">
                    <button 
                      className="edit-btn"
                      onClick={(e) => handleEditProject(e, project)}
                    >
                      ✎
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={(e) => handleDeleteProject(e, project.id)}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Создать новый проект</h2>
            
            <div className="modal-form">
              <div className="form-group">
                <label htmlFor="project-name">Название проекта *</label>
                <input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Например: Разработка сайта"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="project-description">Описание</label>
                <textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Краткое описание проекта (необязательно)"
                  rows={4}
                />
              </div>

              {error && (
                <div className="modal-error">
                  {error}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeModals}>
                Отмена
              </button>
              <button 
                className="create-btn"
                onClick={handleCreateProject}
                disabled={!projectName.trim() || creating}
              >
                {creating ? "Создание..." : "Создать проект"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingProject && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Редактировать проект</h2>
            
            <div className="modal-form">
              <div className="form-group">
                <label htmlFor="edit-project-name">Название проекта *</label>
                <input
                  id="edit-project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Название проекта"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-project-description">Описание</label>
                <textarea
                  id="edit-project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Описание проекта"
                  rows={4}
                />
              </div>

              {error && (
                <div className="modal-error">
                  {error}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeModals}>
                Отмена
              </button>
              <button 
                className="update-btn"
                onClick={handleUpdateProject}
                disabled={!projectName.trim() || updating}
              >
                {updating ? "Сохранение..." : "Сохранить изменения"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};