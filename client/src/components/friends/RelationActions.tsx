import { useState } from "react";
import {
  acceptFriendRequestApi,
  cancelFriendRequestApi,
  rejectFriendRequestApi,
  removeFriendApi,
  sendFriendRequestApi,
} from "../../services/api/friends.api";
import type { Relation } from "../../types/friends";
import { getErrorMessage } from "../../utils/user";

interface Props {
  userId: number;
  userName: string;
  relation: Relation;
  onChange: (relation: Relation) => void;
  onError?: (message: string) => void;
  // в поиске не показываем «Удалить из коллег», только метку
  allowRemove?: boolean;
  buttonClassName?: string;
}

const NONE: Relation = { status: "NONE", requestId: null };

export const RelationActions = ({
  userId,
  userName,
  relation,
  onChange,
  onError,
  allowRemove = false,
  buttonClassName = "colleague-btn",
}: Props) => {
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<Relation>) => {
    try {
      setBusy(true);
      onChange(await action());
    } catch (error) {
      console.error(error);
      onError?.(getErrorMessage(error, "Не удалось выполнить действие"));
    } finally {
      setBusy(false);
    }
  };

  const { status, requestId } = relation;

  if (status === "FRIEND") {
    if (!allowRemove) return <span className="colleague-tag">В коллегах</span>;

    return (
      <button
        className={`${buttonClassName} danger`}
        disabled={busy}
        onClick={() => {
          if (!window.confirm(`Удалить ${userName} из коллег?`)) return;
          run(async () => {
            await removeFriendApi(userId);
            return NONE;
          });
        }}
      >
        Удалить из коллег
      </button>
    );
  }

  if (status === "OUTGOING" && requestId) {
    return (
      <button
        className={`${buttonClassName} secondary`}
        disabled={busy}
        onClick={() =>
          run(async () => {
            await cancelFriendRequestApi(requestId);
            return NONE;
          })
        }
      >
        Отменить заявку
      </button>
    );
  }

  if (status === "INCOMING" && requestId) {
    return (
      <>
        <button
          className={buttonClassName}
          disabled={busy}
          onClick={() =>
            run(async () => {
              await acceptFriendRequestApi(requestId);
              return { status: "FRIEND", requestId: null };
            })
          }
        >
          Принять
        </button>
        <button
          className={`${buttonClassName} secondary`}
          disabled={busy}
          onClick={() =>
            run(async () => {
              await rejectFriendRequestApi(requestId);
              return NONE;
            })
          }
        >
          Отклонить
        </button>
      </>
    );
  }

  return (
    <button
      className={buttonClassName}
      disabled={busy}
      onClick={() => run(() => sendFriendRequestApi(userId))}
    >
      {busy ? "Отправка..." : "+ Добавить в коллеги"}
    </button>
  );
};
