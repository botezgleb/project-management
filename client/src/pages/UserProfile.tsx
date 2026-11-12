import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { getPublicProfileApi } from "../services/api/users.api";
import { RelationActions } from "../components/friends/RelationActions";
import { socket } from "../socket/socket";
import type { PublicProfile } from "../types/profile";
import type { Relation } from "../types/friends";
import { getErrorMessage, getInitials } from "../utils/user";
import "../css/Profile.css";
import "../css/Colleagues.css";

const RELATION_LABEL: Record<Relation["status"], string | null> = {
  FRIEND: "Ваш коллега",
  OUTGOING: "Заявка отправлена",
  INCOMING: "Хочет добавить вас в коллеги",
  NONE: null,
};

export const UserProfile = () => {
  const { userId } = useParams();
  const id = Number(userId);
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    const data = await getPublicProfileApi(id);
    setProfile(data);
  }, [id]);

  useEffect(() => {
    if (!Number.isInteger(id) || id <= 0) {
      setError("Пользователь не найден");
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        await loadProfile();
      } catch (error) {
        console.error(error);
        setError(getErrorMessage(error, "Не удалось загрузить профиль"));
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, loadProfile]);

  // если этот человек принял/отклонил заявку — сразу показываем новый статус
  useEffect(() => {
    const handleChanged = (event: { user: { id: number } | null }) => {
      if (event.user?.id === id) loadProfile().catch(console.error);
    };

    socket.on("friends:changed", handleChanged);
    return () => {
      socket.off("friends:changed", handleChanged);
    };
  }, [id, loadProfile]);

  const handleRelationChange = (relation: Relation) => {
    setActionError(null);
    setProfile((prev) => (prev ? { ...prev, relation } : prev));
    // после добавления/удаления меняется видимость email и счётчик коллег
    loadProfile().catch(console.error);
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
          <p>{error ?? "Пользователь не найден"}</p>
          <button onClick={() => navigate(-1)}>Назад</button>
        </div>
      </div>
    );
  }

  if (profile.isSelf) {
    return <Navigate to="/profile" replace />;
  }

  const relation = profile.relation ?? { status: "NONE", requestId: null };
  const relationLabel = RELATION_LABEL[relation.status];

  const statItems = [
    { label: "Проектов", value: profile.stats.projects },
    { label: "Создано задач", value: profile.stats.createdTasks },
    { label: "Назначено задач", value: profile.stats.assignedTasks },
    { label: "Коллег", value: profile.stats.friends },
  ];

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>
          User <span>Profile</span>
        </h1>
      </div>

      <div className="profile-layout">
        <section className="profile-card">
          <div className="profile-avatar">{getInitials(profile.name)}</div>

          <div className="profile-identity">
            <h2>{profile.name}</h2>
            <p className="profile-username">
              {profile.username ? (
                `@${profile.username}`
              ) : (
                <span className="profile-muted">username не задан</span>
              )}
            </p>
            {relationLabel && (
              <span className="profile-relation-badge">{relationLabel}</span>
            )}
          </div>

          <dl className="profile-details">
            <div>
              <dt>Email</dt>
              <dd>
                {profile.email ?? (
                  <span className="profile-muted">виден только коллегам</span>
                )}
              </dd>
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
          </dl>

          {actionError && <div className="profile-form-error">{actionError}</div>}

          <div className="profile-relation-actions">
            <RelationActions
              userId={profile.id}
              userName={profile.name}
              relation={relation}
              onChange={handleRelationChange}
              onError={setActionError}
              allowRemove
            />
          </div>
        </section>

        <div className="profile-main">
          <section className="profile-section">
            <h3>Статистика</h3>
            <div className="profile-stats profile-stats-4">
              {statItems.map((item) => (
                <div className="profile-stat" key={item.label}>
                  <span className="profile-stat-value">{item.value}</span>
                  <span className="profile-stat-label">{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="profile-section">
            <h3>Общие проекты</h3>
            {profile.mutualProjects.length === 0 ? (
              <p className="profile-muted">
                У вас нет общих проектов
                {relation.status === "FRIEND" &&
                  " — пригласите коллегу в свой проект на странице доски"}
              </p>
            ) : (
              <ul className="profile-projects">
                {profile.mutualProjects.map((project) => (
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
