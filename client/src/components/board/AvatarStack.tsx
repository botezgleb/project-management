import type { PublicUser } from "../../types/friends";
import { getInitials } from "../../utils/user";

export const AvatarStack = ({ users, max = 3, size = 22 }: { users: PublicUser[]; max?: number; size?: number }) => {
  if (users.length === 0) return null;
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;

  return (
    <span className="avatar-stack" title={users.map((u) => u.name).join(", ")}>
      {shown.map((u) => (
        <span
          key={u.id}
          className="avatar avatar-stack-item"
          style={{ width: size, height: size, fontSize: size * 0.42 }}
        >
          {getInitials(u.name)}
        </span>
      ))}
      {rest > 0 && (
        <span className="avatar-stack-more" style={{ height: size }}>
          +{rest}
        </span>
      )}
    </span>
  );
};
