import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  acceptFriendRequestApi,
  cancelFriendRequestApi,
  getFriendRequestsApi,
  getFriendsApi,
  rejectFriendRequestApi,
  removeFriendApi,
  searchUsersApi,
} from "../services/api/friends.api";
import type {
  Colleague,
  FriendRequests,
  PublicUser,
  Relation,
  UserSearchResult,
} from "../types/friends";
import { RelationActions } from "../components/friends/RelationActions";
import { useRealtime } from "../hooks/useRealtime";
import { socket } from "../socket/socket";
import { CloseIcon, SearchIcon } from "../components/ui/Icons";
import { getErrorMessage, getInitials } from "../utils/user";
import "../css/Colleagues.css";

type Tab = "friends" | "incoming" | "outgoing";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const UserRow = ({
  user,
  meta,
  children,
}: {
  user: PublicUser;
  meta?: string;
  children?: React.ReactNode;
}) => (
  <li className="colleague-row">
    <Link to={`/users/${user.id}`} className="avatar colleague-avatar">
      {getInitials(user.name)}
    </Link>
    <div className="colleague-info">
      <Link to={`/users/${user.id}`} className="colleague-name">
        {user.name}
      </Link>
      <span className="colleague-username">
        {user.username ? `@${user.username}` : "—"}
        {meta && <span className="colleague-meta"> · {meta}</span>}
      </span>
    </div>
    <div className="colleague-actions">{children}</div>
  </li>
);

export const Colleagues = () => {
  const [friends, setFriends] = useState<Colleague[]>([]);
  const [requests, setRequests] = useState<FriendRequests>({
    incoming: [],
    outgoing: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("friends");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchNonce, setSearchNonce] = useState(0);

  const { setIncomingCount } = useRealtime();

  const loadAll = useCallback(async () => {
    const [friendsData, requestsData] = await Promise.all([
      getFriendsApi(),
      getFriendRequestsApi(),
    ]);
    setFriends(friendsData);
    setRequests(requestsData);
    setIncomingCount(requestsData.incoming.length);
  }, [setIncomingCount]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await loadAll();
        setError(null);
      } catch (error) {
        console.error(error);
        setError(getErrorMessage(error, "Не удалось загрузить коллег"));
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [loadAll]);

  // другая сторона приняла/отправила/отменила заявку — обновляем списки и поиск
  useEffect(() => {
    const handleChanged = () => {
      loadAll().catch(console.error);
      setSearchNonce((n) => n + 1);
    };

    socket.on("friends:changed", handleChanged);
    return () => {
      socket.off("friends:changed", handleChanged);
    };
  }, [loadAll]);

  // поиск с задержкой, чтобы не дёргать API на каждый символ
  useEffect(() => {
    const q = query.trim().replace(/^@/, "");

    if (q.length < 2) {
      setResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const data = await searchUsersApi(q);
        if (!cancelled) {
          setResults(data);
          setSearchError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setSearchError(getErrorMessage(error, "Ошибка поиска"));
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, searchNonce]);

  const runAction = async (
    key: string,
    action: () => Promise<unknown>,
    updateResult?: (r: UserSearchResult) => UserSearchResult,
    userId?: number,
  ) => {
    try {
      setBusyKey(key);
      setError(null);
      await action();
      if (updateResult && userId !== undefined) {
        setResults((prev) =>
          prev.map((r) => (r.id === userId ? updateResult(r) : r)),
        );
      }
      await loadAll();
    } catch (error) {
      console.error(error);
      setError(getErrorMessage(error, "Не удалось выполнить действие"));
    } finally {
      setBusyKey(null);
    }
  };

  const acceptRequest = (requestId: number, userId: number) =>
    runAction(
      `accept-${requestId}`,
      () => acceptFriendRequestApi(requestId),
      (r) => ({ ...r, status: "FRIEND", requestId: null }),
      userId,
    );

  const rejectRequest = (requestId: number, userId: number) =>
    runAction(
      `reject-${requestId}`,
      () => rejectFriendRequestApi(requestId),
      (r) => ({ ...r, status: "NONE", requestId: null }),
      userId,
    );

  const cancelRequest = (requestId: number, userId: number) =>
    runAction(
      `cancel-${requestId}`,
      () => cancelFriendRequestApi(requestId),
      (r) => ({ ...r, status: "NONE", requestId: null }),
      userId,
    );

  const removeFriend = (friend: PublicUser) => {
    if (!window.confirm(`Удалить ${friend.name} из коллег?`)) return;

    runAction(
      `remove-${friend.id}`,
      () => removeFriendApi(friend.id),
      (r) => ({ ...r, status: "NONE", requestId: null }),
      friend.id,
    );
  };

  const handleSearchRelationChange = (userId: number, relation: Relation) => {
    setResults((prev) =>
      prev.map((r) => (r.id === userId ? { ...r, ...relation } : r)),
    );
    loadAll().catch(console.error);
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Загрузка коллег...</p>
      </div>
    );
  }

  const trimmedQuery = query.trim().replace(/^@/, "");

  return (
    <div className="page colleagues-page">
      <div className="page-header">
        <h1 className="page-title">
          Your <span>Colleagues</span>
        </h1>
      </div>

      {error && (
        <div className="alert colleagues-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Закрыть">
            <CloseIcon width={16} height={16} />
          </button>
        </div>
      )}

      <div className="colleagues-layout">
        <section className="colleagues-card glass">
          <h3>Найти коллегу</h3>
          <div className="colleagues-search">
            <SearchIcon />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по @username"
              autoFocus
            />
          </div>

          {trimmedQuery.length > 0 && trimmedQuery.length < 2 && (
            <p className="colleagues-muted">Введите минимум 2 символа</p>
          )}
          {searching && <p className="colleagues-muted">Поиск...</p>}
          {searchError && <p className="colleagues-search-error">{searchError}</p>}
          {!searching &&
            !searchError &&
            trimmedQuery.length >= 2 &&
            results.length === 0 && (
              <p className="colleagues-muted">Никого не нашли</p>
            )}

          {results.length > 0 && !searching && (
            <ul className="colleagues-list stagger">
              {results.map((user) => (
                <UserRow key={user.id} user={user}>
                  <RelationActions
                    userId={user.id}
                    userName={user.name}
                    relation={{ status: user.status, requestId: user.requestId }}
                    onChange={(relation) =>
                      handleSearchRelationChange(user.id, relation)
                    }
                    onError={setError}
                  />
                </UserRow>
              ))}
            </ul>
          )}
        </section>

        <section className="colleagues-card glass">
          <div className="colleagues-tabs" role="tablist">
            {/* «капсула» сегментированного контрола, плавно едет к активной вкладке */}
            <span
              className="colleagues-tabs-indicator"
              style={{
                transform: `translateX(${["friends", "incoming", "outgoing"].indexOf(tab) * 100}%)`,
              }}
            />
            <button
              className={tab === "friends" ? "active" : ""}
              onClick={() => setTab("friends")}
            >
              Коллеги <span>{friends.length}</span>
            </button>
            <button
              className={tab === "incoming" ? "active" : ""}
              onClick={() => setTab("incoming")}
            >
              Входящие
              <span className={requests.incoming.length > 0 ? "highlight" : ""}>
                {requests.incoming.length}
              </span>
            </button>
            <button
              className={tab === "outgoing" ? "active" : ""}
              onClick={() => setTab("outgoing")}
            >
              Исходящие <span>{requests.outgoing.length}</span>
            </button>
          </div>

          {tab === "friends" &&
            (friends.length === 0 ? (
              <p className="colleagues-empty">
                У вас пока нет коллег. Найдите их по username через поиск.
              </p>
            ) : (
              <ul className="colleagues-list stagger">
                {friends.map((friend) => (
                  <UserRow
                    key={friend.id}
                    user={friend}
                    meta={`с ${formatDate(friend.since)}`}
                  >
                    <button
                      className="colleague-btn danger"
                      disabled={busyKey !== null}
                      onClick={() => removeFriend(friend)}
                    >
                      Удалить
                    </button>
                  </UserRow>
                ))}
              </ul>
            ))}

          {tab === "incoming" &&
            (requests.incoming.length === 0 ? (
              <p className="colleagues-empty">Новых заявок нет</p>
            ) : (
              <ul className="colleagues-list stagger">
                {requests.incoming.map((request) => (
                  <UserRow
                    key={request.id}
                    user={request.user}
                    meta={formatDate(request.createdAt)}
                  >
                    <button
                      className="colleague-btn"
                      disabled={busyKey !== null}
                      onClick={() => acceptRequest(request.id, request.user.id)}
                    >
                      Принять
                    </button>
                    <button
                      className="colleague-btn secondary"
                      disabled={busyKey !== null}
                      onClick={() => rejectRequest(request.id, request.user.id)}
                    >
                      Отклонить
                    </button>
                  </UserRow>
                ))}
              </ul>
            ))}

          {tab === "outgoing" &&
            (requests.outgoing.length === 0 ? (
              <p className="colleagues-empty">Вы никому не отправляли заявок</p>
            ) : (
              <ul className="colleagues-list stagger">
                {requests.outgoing.map((request) => (
                  <UserRow
                    key={request.id}
                    user={request.user}
                    meta={formatDate(request.createdAt)}
                  >
                    <button
                      className="colleague-btn secondary"
                      disabled={busyKey !== null}
                      onClick={() => cancelRequest(request.id, request.user.id)}
                    >
                      Отменить
                    </button>
                  </UserRow>
                ))}
              </ul>
            ))}
        </section>
      </div>
    </div>
  );
};
