import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  addProjectMemberApi,
  getProjectMembersApi,
  removeProjectMemberApi,
} from "../../services/api/members.api";
import { getFriendsApi } from "../../services/api/friends.api";
import { getOneProjectApi } from "../../services/api/projects.api";
import { useAuth } from "../../hooks/useAuth";
import { socket } from "../../socket/socket";
import type { ProjectMember } from "../../types/member";
import type { Colleague } from "../../types/friends";
import { getErrorMessage, getInitials } from "../../utils/user";
import "../../css/ProjectMembers.css";

interface Props {
  projectId: number;
}

export const ProjectMembers = ({ projectId }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [friends, setFriends] = useState<Colleague[]>([]);
  const [myRole, setMyRole] = useState<"OWNER" | "MEMBER" | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner = myRole === "OWNER";

  const loadMembers = useCallback(async () => {
    const data = await getProjectMembersApi(projectId);
    setMembers(data);
  }, [projectId]);

  useEffect(() => {
    const init = async () => {
      try {
        const [project] = await Promise.all([
          getOneProjectApi(projectId),
          loadMembers(),
        ]);
        setMyRole(project.role ?? null);
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, [projectId, loadMembers]);

  // кто-то добавил/исключил участника — обновляем список
  useEffect(() => {
    const handleUpdated = (payload: { projectId: number }) => {
      if (payload.projectId === projectId) loadMembers().catch(console.error);
    };

    socket.on("members-updated", handleUpdated);
    return () => {
      socket.off("members-updated", handleUpdated);
    };
  }, [projectId, loadMembers]);

  // коллеги нужны только владельцу и только когда окно открыто
  useEffect(() => {
    if (!isOpen || !isOwner) return;

    getFriendsApi()
      .then(setFriends)
      .catch((error) => setError(getErrorMessage(error, "Не удалось загрузить коллег")));
  }, [isOpen, isOwner]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  const candidates = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.id));
    return friends.filter((f) => !memberIds.has(f.id));
  }, [friends, members]);

  const addMember = async (friend: Colleague) => {
    try {
      setBusyId(friend.id);
      setError(null);
      setMembers(await addProjectMemberApi(projectId, friend.id));
    } catch (error) {
      setError(getErrorMessage(error, "Не удалось добавить участника"));
    } finally {
      setBusyId(null);
    }
  };

  const removeMember = async (member: ProjectMember) => {
    const isSelf = member.id === user?.id;
    const question = isSelf
      ? "Покинуть проект? Вы потеряете к нему доступ."
      : `Исключить ${member.name} из проекта? Он(а) будет снят(а) со всех задач.`;

    if (!window.confirm(question)) return;

    try {
      setBusyId(member.id);
      setError(null);
      await removeProjectMemberApi(projectId, member.id);

      if (isSelf) {
        navigate("/projects");
        return;
      }
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch (error) {
      setError(getErrorMessage(error, "Не удалось выполнить действие"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <button className="members-trigger" onClick={() => setIsOpen(true)}>
        <span className="members-avatars">
          {members.slice(0, 3).map((m) => (
            <span key={m.id} className="members-avatar-sm" title={m.name}>
              {getInitials(m.name)}
            </span>
          ))}
        </span>
        Участники · {members.length}
      </button>

      {isOpen && (
        <div className="members-overlay" onClick={() => setIsOpen(false)}>
          <div className="members-panel" onClick={(e) => e.stopPropagation()}>
            <div className="members-panel-header">
              <h2>Участники</h2>
              <button className="members-close" onClick={() => setIsOpen(false)}>
                ×
              </button>
            </div>

            {error && <div className="members-error">{error}</div>}

            <ul className="members-list">
              {members.map((member) => {
                const isSelf = member.id === user?.id;
                const canRemove =
                  member.role !== "OWNER" && (isOwner || isSelf);

                return (
                  <li key={member.id} className="members-row">
                    <Link
                      to={isSelf ? "/profile" : `/users/${member.id}`}
                      className="members-avatar"
                    >
                      {getInitials(member.name)}
                    </Link>
                    <div className="members-info">
                      <Link
                        to={isSelf ? "/profile" : `/users/${member.id}`}
                        className="members-name"
                      >
                        {member.name}
                        {isSelf && <span className="members-you"> (вы)</span>}
                      </Link>
                      <span className="members-username">
                        {member.username ? `@${member.username}` : "—"}
                      </span>
                    </div>
                    <span
                      className={`members-role ${member.role === "OWNER" ? "owner" : ""}`}
                    >
                      {member.role === "OWNER" ? "Владелец" : "Участник"}
                    </span>
                    {canRemove && (
                      <button
                        className="members-btn danger"
                        disabled={busyId !== null}
                        onClick={() => removeMember(member)}
                      >
                        {isSelf ? "Покинуть" : "Исключить"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {isOwner && (
              <div className="members-invite">
                <h3>Добавить коллегу</h3>

                {friends.length === 0 ? (
                  <p className="members-muted">
                    У вас пока нет коллег.{" "}
                    <Link to="/colleagues">Найти коллег →</Link>
                  </p>
                ) : candidates.length === 0 ? (
                  <p className="members-muted">Все ваши коллеги уже в проекте</p>
                ) : (
                  <ul className="members-list">
                    {candidates.map((friend) => (
                      <li key={friend.id} className="members-row">
                        <Link to={`/users/${friend.id}`} className="members-avatar">
                          {getInitials(friend.name)}
                        </Link>
                        <div className="members-info">
                          <Link to={`/users/${friend.id}`} className="members-name">
                            {friend.name}
                          </Link>
                          <span className="members-username">
                            {friend.username ? `@${friend.username}` : "—"}
                          </span>
                        </div>
                        <button
                          className="members-btn"
                          disabled={busyId !== null}
                          onClick={() => addMember(friend)}
                        >
                          {busyId === friend.id ? "..." : "+ Добавить"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
