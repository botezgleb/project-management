import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../css/About.css";
import walter from "../assets/walter-white.jpg";
import jesse from "../assets/jesse.jpg";
import saul from "../assets/saulgoodman.jfif";
import barsuk from "../assets/barsuk.jpg";
import { Footer } from "../components/ui/Footer";

export const About = () => {
  const { isAuth } = useAuth();

  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>
          О <span>нас</span>
        </h1>
        <p>
          Мы создаем инструменты, которые помогают командам воплощать идеи в
          реальность
        </p>
      </div>

      <div className="about-mission">
        <div className="mission-content">
          <h2>
            Наша <span>миссия</span>
          </h2>
          <p>
            NON SENSE родился из простой идеи: управление проектами не должно
            быть сложным. Мы верим, что лучшие результаты достигаются, когда
            технологии работают на вас, а не против вас.
          </p>
          <p>
            Наша платформа создана для тех, кто ценит простоту, эффективность и
            гибкость. Без лишних наворотов, только то, что действительно нужно
            для работы.
          </p>
        </div>
        <div className="mission-stats">
          <div className="stat-item">
            <div className="stat-number">2026</div>
            <div className="stat-label">Год основания</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">1M+</div>
            <div className="stat-label">Пользователей</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">42к+</div>
            <div className="stat-label">Команд</div>
          </div>
        </div>
      </div>

      <div className="about-team">
        <h2>
          Команда <span>мечты</span>
        </h2>
        <p className="team-description">
          За каждым продуктом стоят люди. Мы - небольшая, но страстная команда
          разработчиков, дизайнеров и энтузиастов, объединенных общей целью.
        </p>
        <div className="team-grid">
          <div className="team-member">
            <div className="member-photo">
              <img src={walter} alt="" />
            </div>
            <h3>Владимир Белый</h3>
            <p>Основатель, Lead Developer</p>
          </div>
          <div className="team-member">
            <div className="member-photo">
              <img src={jesse} alt="" />
            </div>
            <h3>Евгений Розов</h3>
            <p>UX/UI Дизайнер</p>
          </div>
          <div className="team-member">
            <div className="member-photo">
              <img src={saul} alt="" />
            </div>
            <h3>Александр Добрый</h3>
            <p>Backend Developer</p>
          </div>
          <div className="team-member">
            <div className="member-photo">
              <img src={barsuk} alt="" />
            </div>
            <h3>Алексей Барсуков</h3>
            <p>Frontend Developer</p>
          </div>
        </div>
      </div>

      <div className="about-cta">
        <h2>Готовы начать?</h2>
        <p>
          Присоединяйтесь к сообществу NONSENSE и управляйте проектами с
          удовольствием
        </p>
        <Link to={isAuth ? "/projects" : "/register"} className="cta-button">
          <span className="top-key"></span>
          <span className="text">
            {isAuth ? "К проектам" : "Зарегистрироваться"}
          </span>
          <span className="bottom-key-1"></span>
          <span className="bottom-key-2"></span>
        </Link>
      </div>
      <Footer />
    </div>
  );
};
