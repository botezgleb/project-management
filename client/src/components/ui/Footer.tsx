import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import "../../css/Footer.css";
import twitterLogo from "../../assets/twitter.png";
import telegramLogo from "../../assets/telegram.png";
import instagramLogo from "../../assets/instagram.png";
import linkedInLogo from "../../assets/linkedin.svg";

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <Link to="/">
            <img src={logo} alt="Logo" />
            <h3>
              NON<span>SENSE</span>
            </h3>
          </Link>
          <p>Управляйте проектами с комфортом</p>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h4>Продукт</h4>
            <ul>
              <li>
                <Link to="/projects">Проекты</Link>
              </li>
              <li>
                <Link to="/features">Возможности</Link>
              </li>
              <li>
                <Link to="/pricing">Цены</Link>
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Ресурсы</h4>
            <ul>
              <li>
                <Link to="/blog">Блог</Link>
              </li>
              <li>
                <Link to="/help">Помощь</Link>
              </li>
              <li>
                <Link to="/api">API</Link>
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Компания</h4>
            <ul>
              <li>
                <Link to="/about">О нас</Link>
              </li>
              <li>
                <Link to="/contact">Контакты</Link>
              </li>
              <li>
                <Link to="/careers">Вакансии</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-social">
          <a href="https://www.telegram.org/" className="social-link">
            <img src={telegramLogo} alt="Telegram" />
          </a>
          <a href="https://www.x.com/" className="social-link">
            <img src={twitterLogo} alt="Twitter" />
          </a>
          <a href="https://www.instagram.com/" className="social-link">
            <img src={instagramLogo} alt="Instagram" />
          </a>
          <a href="https://www.linkedin.com/" className="social-link">
            <img src={linkedInLogo} alt="LinkedIn" />
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Nonsense. Все права защищены.</p>
        <div className="footer-bottom-links">
          <Link to="/privacy">Политика конфиденциальности</Link>
          <Link to="/terms">Условия использования</Link>
        </div>
      </div>
    </footer>
  );
};
