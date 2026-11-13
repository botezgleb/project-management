import type { ProjectMember } from "../../types/member";
import { getInitials } from "../../utils/user";
import { CheckIcon } from "../ui/Icons";

interface Props {
  members: ProjectMember[];
  selectedIds: number[];
  onToggle: (userId: number) => void;
  // одиночный выбор: показываем пункт «Не назначен»
  onClear?: () => void;
  myId?: number | null;
}

export const MemberPicker = ({ members, selectedIds, onToggle, onClear, myId }: Props) => (
  <ul className="member-picker" role="listbox">
    {onClear && (
      <li>
        <button
          type="button"
          className={`member-picker-item ${selectedIds.length === 0 ? "selected" : ""}`}
          onClick={onClear}
        >
          <span className="member-picker-none">—</span>
          <span className="member-picker-name">Не назначен</span>
          {selectedIds.length === 0 && <CheckIcon className="member-picker-check" />}
        </button>
      </li>
    )}
    {members.map((m) => {
      const selected = selectedIds.includes(m.id);
      return (
        <li key={m.id}>
          <button
            type="button"
            className={`member-picker-item ${selected ? "selected" : ""}`}
            onClick={() => onToggle(m.id)}
            role="option"
            aria-selected={selected}
          >
            <span className="avatar" style={{ width: 26, height: 26, fontSize: 11 }}>
              {getInitials(m.name)}
            </span>
            <span className="member-picker-name">
              {m.name}
              {m.id === myId && <span className="muted"> (вы)</span>}
            </span>
            {selected && <CheckIcon className="member-picker-check" />}
          </button>
        </li>
      );
    })}
  </ul>
);
