import { useCallback, useEffect, useState } from "react";
import { getProjectMembersApi } from "../services/api/members.api";
import { socket } from "../socket/socket";
import type { ProjectMember } from "../types/member";

// участники проекта с живым обновлением по сокету
export const useProjectMembers = (projectId: number) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);

  const reload = useCallback(async () => {
    setMembers(await getProjectMembersApi(projectId));
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await getProjectMembersApi(projectId);
      if (!cancelled) setMembers(data);
    };
    load().catch(console.error);

    const onUpdated = (payload: { projectId: number }) => {
      if (payload.projectId === projectId) reload().catch(console.error);
    };
    socket.on("members-updated", onUpdated);
    return () => {
      cancelled = true;
      socket.off("members-updated", onUpdated);
    };
  }, [projectId, reload]);

  return { members, setMembers, reload };
};
