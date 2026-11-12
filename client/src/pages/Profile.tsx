import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfileApi, updateProfileApi } from "../services/api/users.api";
import { useAuth } from "../hooks/useAuth";
import type { Profile as ProfileData } from "../types/profile";
import { getErrorMessage, getInitials } from "../utils/user";
import "../css/Profile.css";

export const Profile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { updateUser } = useAuth();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await getProfileApi();
        setProfile(data);
        setError(null);
      } catch (error) {
        console.error(error);
        setError(getErrorMessage(error, "Не удалось загрузить профиль"));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const startEditing = () => {
    if (!profile) return;
    setName(profile.name);
    setUsername(profile.username ?? "");
    setFormError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setFormError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !name.trim()) return;

    try {
      setSaving(true);
      setFormError(null);
      const updated = await updateProfileApi({
        name: name.trim(),
        username: username.trim(),
      });
      setProfile(updated);
      updateUser({ name: updated.name, username: updated.username });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      setFormError(getErrorMessage(error, "Не удалось сохранить изменения"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loader"></div>
        <p>Загрузка профиля...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <p>{error ?? "Профиль не найден"}</p>
          <button onClick={() => window.location.reload()}>
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const { stats } = profile;

  const statItems = [
    { label: "Проектов", value: stats.projects },
    { label: "Владелец в", value: stats.ownedProjects },
    { label: "Создано задач", value: stats.createdTasks },
    { label: "Назначено задач", value: stats.assignedTasks },
    { label: "Коллег", value: stats.friends },
    { label: "Входящих заявок", value: stats.incomingRequests },
  ];

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>
          Your <span>Profile</span>
        </h1>
      </div>

      <div className="profile-layout">
        <section className="profile-card">
          <div className="profile-avatar">{getInitials(profile.name)}</div>

          {!isEditing ? (
            <>
              <div className="profile-identity">
                <h2>{profile.name}</h2>
                <p className="profile-username">
                  {profile.username ? (
                    `@${profile.username}`
                  ) : (
                    <span className="profile-muted">username не задан</span>
                  )}
                </p>
              </div>

              <dl className="profile-details">
                <div>
                  <dt>Email</dt>
                  <dd>{profile.email}</dd>
                </div>
                <div>
                  <dt>Роль</dt>
                  <dd>
                    <span
                      className={`profile-role-badge ${profile.role === "ADMIN" ? "admin" : ""}`}
                    >
                      {profile.role === "ADMIN" ? "Администратор" : "Пользователь"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>С нами с</dt>
                  <dd>
                    {new Date(profile.createdAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
                <div>
                  <dt>ID</dt>
                  <dd>#{profile.id}</dd>
                </div>
              </dl>

              {!profile.username && (
                <p className="profile-hint">
                  Задайте username — по нему коллеги смогут найти вас и
                  отправить заявку.
                </p>
              )}

              <button className="profile-btn" onClick={startEditing}>
                ✎ Редактировать
              </button>
            </>
          ) : (
            <form className="profile-form" onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="profile-name">Имя *</label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="profile-username">Username</label>
                <div className="profile-username-input">
                  <span>@</span>
                  <input
                    id="profile-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="например, walter_white"
                    maxLength={20}
                  />
                </div>
                <small>3–20 символов: латиница, цифры, «_»</small>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" value={profile.email} disabled />
              </div>

              {formError && <div className="profile-form-error">{formError}</div>}

              <div className="profile-form-actions">
                <button
                  type="button"
                  className="profile-btn secondary"
                  onClick={cancelEditing}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="profile-btn"
                  disabled={!name.trim() || saving}
                >
                  {saving ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          )}
        </section>

        <div className="profile-main">
          <section className="profile-section">
            <h3>Статистика</h3>
            <div className="profile-stats">
              {statItems.map((item) => (
                <div className="profile-stat" key={item.label}>
                  <span className="profile-stat-value">{item.value}</span>
                  <span className="profile-stat-label">{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="profile-section">
            <div className="profile-section-header">
              <h3>Мои проекты</h3>
              <button
                className="profile-link-btn"
                onClick={() => navigate("/projects")}
              >
                Все проекты →
              </button>
            </div>

            {profile.projects.length === 0 ? (
              <p className="profile-muted">Вы пока не состоите ни в одном проекте</p>
            ) : (
              <ul className="profile-projects">
                {profile.projects.map((project) => (
                  <li
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div>
                      <span className="profile-project-name">{project.name}</span>
                      {project.description && (
                        <span className="profile-project-desc">
                          {project.description}
                        </span>
                      )}
                    </div>
                    <span
                      className={`profile-project-role ${project.role === "MEMBER" ? "member" : ""}`}
                    >
                      {project.role === "OWNER" ? "Владелец" : "Участник"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
