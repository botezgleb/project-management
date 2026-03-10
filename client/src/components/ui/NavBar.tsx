import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import logoPng from "../../assets/logo.png";

export const NavBar = () => {
  const { isAuth, logout } = useAuth();

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav>
      <div className="logo">
        <Link to="/">
          <img src={logoPng} alt="" />
        </Link>
        <Link to="/">
          <h3>NON<span>SENSE</span></h3>
        </Link>
      </div>
      <ul>
        {isAuth && (
          <>
            <li>
              <Link to="/projects">Проекты</Link>
            </li>
            <li>
              <Link to="/about">О нас</Link>
            </li>
            <li>
              <button onClick={handleLogout} className="logout-btn">
                Выйти
              </button>
            </li>
          </>
        )}
        {!isAuth && (
          <>
            <li>
              <Link to="/about">О нас</Link>
            </li>
            <li>
              <Link to="/login">Войти</Link>
            </li>
            <li>
              <Link to="/register">Зарегистрироваться</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};
