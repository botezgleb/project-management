import React, { useEffect, useState } from "react";
import { matchPath, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RealtimeContext } from "./RealtimeContext";
import { useAuth } from "../../hooks/useAuth";
import { socket } from "../../socket/socket";
import { getAccessToken, setAccessToken } from "../../services/auth/tokenStorage";
import { refreshApi } from "../../services/api/auth.api";
import { getFriendRequestsApi } from "../../services/api/friends.api";
import type { FriendsChangedEvent } from "../../types/friends";
import type { ProjectEvent } from "../../types/member";

const displayName = (user: { name: string; username: string | null } | null) =>
  user ? (user.username ? `${user.name} (@${user.username})` : user.name) : "Кто-то";

export const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuth, user } = useAuth();
  const navigate = useNavigate();
  const [incomingCount, setIncomingCount] = useState(0);

  // привязываем сокет к пользователю (личная комната user-<id>)
  useEffect(() => {
    if (!isAuth) {
      socket.emit("authenticate", null);
      return;
    }

    let retried = false;
    const authenticate = () => socket.emit("authenticate", getAccessToken());

    // access токен мог протухнуть, пока сокет был отключён
    const handleAuthError = async () => {
      if (retried) return;
      retried = true;
      try {
        const { accessToken } = await refreshApi();
        setAccessToken(accessToken);
        authenticate();
      } catch (error) {
        console.error(error);
      }
    };

    authenticate();
    socket.on("connect", authenticate);
    socket.on("auth-error", handleAuthError);

    return () => {
      socket.off("connect", authenticate);
      socket.off("auth-error", handleAuthError);
    };
  }, [isAuth, user?.id]);

  // счётчик входящих заявок для навбара
  useEffect(() => {
    if (!isAuth) return;

    let cancelled = false;
    const loadCount = async () => {
      try {
        const { incoming } = await getFriendRequestsApi();
        if (!cancelled) setIncomingCount(incoming.length);
      } catch (error) {
        console.error(error);
      }
    };

    loadCount();
    socket.on("friends:changed", loadCount);

    return () => {
      cancelled = true;
      socket.off("friends:changed", loadCount);
    };
  }, [isAuth, user?.id]);

  // всплывающие уведомления
  useEffect(() => {
    if (!isAuth) return;

    const handleFriends = ({ type, user }: FriendsChangedEvent) => {
      const name = displayName(user);
      if (type === "request-received") {
        toast(`${name} хочет добавить вас в коллеги`, {
          action: { label: "Открыть", onClick: () => navigate("/colleagues") },
        });
      } else if (type === "request-accepted") {
        toast.success(`${name} теперь ваш коллега`, {
          action: user
            ? { label: "Профиль", onClick: () => navigate(`/users/${user.id}`) }
            : undefined,
        });
      }
    };

    const handleProjectAdded = ({ project, by }: ProjectEvent) => {
      toast.success(
        `${displayName(by)} добавил(а) вас в проект «${project?.name ?? ""}»`,
        {
          action: project
            ? { label: "Открыть", onClick: () => navigate(`/projects/${project.id}`) }
            : undefined,
        },
      );
    };

    const handleProjectRemoved = ({ project }: ProjectEvent) => {
      toast(`Вас исключили из проекта «${project?.name ?? ""}»`);
      const match = matchPath("/projects/:projectId", window.location.pathname);
      if (project && match && Number(match.params.projectId) === project.id) {
        navigate("/projects");
      }
    };

    type Brief = { id: number; name?: string; title?: string } | null;
    const openTask = (project: Brief, taskId?: number) => () =>
      project && navigate(`/projects/${project.id}${taskId ? `?task=${taskId}` : ""}`);

    const handleTaskAssigned = ({ task, project }: { task: Brief; project: Brief }) =>
      toast(`Вам назначена задача «${task?.title ?? ""}»`, {
        description: project?.name,
        action: { label: "Открыть", onClick: openTask(project, task?.id) },
      });

    const handleSubtaskAssigned = ({ subtask, task, project }: { subtask: Brief; task: Brief; project: Brief }) =>
      toast(`Вам назначена подзадача «${subtask?.title ?? ""}»`, {
        description: `${project?.name ?? ""} · ${task?.title ?? ""}`,
        action: { label: "Открыть", onClick: openTask(project, task?.id) },
      });

    const handleResponsible = ({ column, project }: { column: Brief; project: Brief }) =>
      toast(`Вы ответственный за колонку «${column?.name ?? ""}»`, {
        description: project?.name,
        action: { label: "Открыть", onClick: openTask(project) },
      });

    const handleBulk = ({ count, column, project }: { count: number; column: Brief; project: Brief }) =>
      toast(`Вам назначено задач: ${count}`, {
        description: `${project?.name ?? ""} · ${column?.name ?? ""}`,
        action: { label: "Мои задачи", onClick: () => navigate("/my-tasks") },
      });

    socket.on("task:assigned", handleTaskAssigned);
    socket.on("subtask:assigned", handleSubtaskAssigned);
    socket.on("column:responsible", handleResponsible);
    socket.on("tasks:assigned-bulk", handleBulk);
    socket.on("friends:changed", handleFriends);
    socket.on("project:added", handleProjectAdded);
    socket.on("project:removed", handleProjectRemoved);

    return () => {
      socket.off("task:assigned", handleTaskAssigned);
      socket.off("subtask:assigned", handleSubtaskAssigned);
      socket.off("column:responsible", handleResponsible);
      socket.off("tasks:assigned-bulk", handleBulk);
      socket.off("friends:changed", handleFriends);
      socket.off("project:added", handleProjectAdded);
      socket.off("project:removed", handleProjectRemoved);
    };
  }, [isAuth, navigate]);

  return (
    <RealtimeContext.Provider
      value={{ incomingCount: isAuth ? incomingCount : 0, setIncomingCount }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};
