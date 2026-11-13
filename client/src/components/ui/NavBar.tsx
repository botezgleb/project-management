import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useRealtime } from "../../hooks/useRealtime";
import { getInitials } from "../../utils/user";
import logoPng from "../../assets/logo.png";

export const NavBar = () => {
  const { isAuth, user, logout } = useAuth();
  const { incomingCount } = useRealtime();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link ${isActive ? "active" : ""}`;

  return (
    <header className={`nav-wrap ${scrolled ? "scrolled" : ""}`}>
      <nav className="nav glass">
        <Link to="/" className="nav-logo">
          <img src={logoPng} alt="" />
          <span>
            NON<b>SENSE</b>
          </span>
        </Link>

        <button
          className={`nav-burger ${isOpen ? "open" : ""}`}
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Меню"
          aria-expanded={isOpen}
        >
          <span />
          <span />
        </button>

        <div
          className={`nav-menu ${isOpen ? "open" : ""}`}
          // закрываем мобильное меню при переходе по любой ссылке/кнопке
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a, button")) setIsOpen(false);
          }}
        >
          <ul className="nav-links">
            {isAuth ? (
              <>
                <li>
                  <NavLink to="/projects" className={linkClass}>
                    Проекты
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/my-tasks" className={linkClass}>
                    Мои задачи
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/colleagues" className={linkClass}>
                    Коллеги
                    {incomingCount > 0 && (
                      <span className="nav-badge" title="Входящие заявки">
                        {incomingCount}
                      </span>
                    )}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/about" className={linkClass}>
                    О нас
                  </NavLink>
                </li>
              </>
            ) : (
              <li>
                <NavLink to="/about" className={linkClass}>
                  О нас
                </NavLink>
              </li>
            )}
          </ul>

          <div className="nav-actions">
            {isAuth ? (
              <>
                <NavLink
                  to="/profile"
                  className={({ isActive }) => `nav-profile ${isActive ? "active" : ""}`}
                  title="Профиль"
                >
                  <span className="avatar nav-avatar">
                    {getInitials(user?.name || user?.email || "?")}
                  </span>
                  <span className="nav-profile-label">Профиль</span>
                </NavLink>
                <button onClick={handleLogout} className="btn btn-sm nav-logout">
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-sm">
                  Войти
                </Link>
                <Link to="/register" className="btn btn-sm btn-primary">
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};
