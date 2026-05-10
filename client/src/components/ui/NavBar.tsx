import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import logoPng from "../../assets/logo.png";

export const NavBar = () => {
  const { isAuth, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsOpen(false);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <nav>
      <div className="logo">
        <Link to="/" onClick={handleLinkClick}>
          <img src={logoPng} alt="" />
        </Link>
        <Link to="/" onClick={handleLinkClick}>
          <h3>NON<span>SENSE</span></h3>
        </Link>
      </div>

      {isMobile && (
        <button 
          className={`burger-menu ${isOpen ? 'open' : ''}`} 
          onClick={() => setIsOpen(!isOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      )}

      <div className={`nav-menu ${isOpen ? 'open' : ''}`}>
        <ul>
          {isAuth && (
            <>
              <li>
                <Link to="/projects" onClick={handleLinkClick}>Проекты</Link>
              </li>
              <li>
                <Link to="/about" onClick={handleLinkClick}>О нас</Link>
              </li>
              <li>
                <Link to="/colleagues" onClick={handleLinkClick}>Коллеги</Link>
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
                <Link to="/about" onClick={handleLinkClick}>О нас</Link>
              </li>
              <li>
                <Link to="/login" onClick={handleLinkClick}>Войти</Link>
              </li>
              <li>
                <Link to="/register" onClick={handleLinkClick}>Зарегистрироваться</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};