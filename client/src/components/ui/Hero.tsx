import { useRef, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import heroImage1 from "../../assets/hero-img-1.jpg";
import heroImage2 from "../../assets/hero-img-2.jpg";
import heroImage3 from "../../assets/hero-img-3.jpg";
import { useLandingMotion } from "../../hooks/useLandingMotion";
import { ArrowRightIcon, UsersIcon } from "./Icons";

const audiences = [
  {
    kicker: "Для создателей",
    title: "Твори как профи",
    text: "Гибкие инструменты и умные процессы. Будь то соло или команда — мы помогаем превратить идеи в реальность.",
  },
  {
    kicker: "Для команд",
    title: "Работайте синхронно",
    text: "Мощные инструменты для совместной работы и синхронизации задач. Прозрачность процессов и полный контроль на каждом этапе.",
  },
  {
    kicker: "Для стартапов",
    title: "От идеи до запуска",
    text: "Быстро, гибко, без бюрократии. Инструменты, которые растут вместе с вами — от маленькой команды до большой компании.",
  },
];

const features = [
  {
    title: "Канбан-доски",
    text: "Визуализируйте рабочий процесс с настраиваемыми колонками и карточками",
  },
  {
    title: "Командная работа",
    text: "Приглашайте участников, назначайте задачи и работайте вместе",
  },
  {
    title: "Реальное время",
    text: "Мгновенная синхронизация изменений между всеми участниками",
  },
];

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

export const Hero = () => {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  useLandingMotion(rootRef);

  const goToProjects = () => navigate("/projects");

  return (
    <div className="landing" ref={rootRef}>
      <section className="hero">
        <span className="hero-eyebrow badge badge-accent">
          <UsersIcon width={14} height={14} /> Для команд любого размера
        </span>

        <h1 className="hero-title">
          <span className="hero-line">Your projects.</span>
          <span className="hero-line hero-line-accent">
            <span className="gradient-text gradient-animated">Your rules.</span>
          </span>
        </h1>

        <p className="hero-lead">
          Канбан-доски, коллеги и синхронизация в реальном времени — всё, что нужно,
          чтобы идеи становились результатом.
        </p>

        <div className="hero-cta">
          <button className="btn btn-primary btn-lg btn-shine" onClick={goToProjects}>
            К проектам <ArrowRightIcon />
          </button>
        </div>

        <div className="hero-scroll-hint" aria-hidden>
          <span />
        </div>

        {/* картинка «выпрямляется» из наклона по мере прокрутки */}
        <div className="hero-stage" data-progress>
          <div className="hero-visual">
            <img src={heroImage1} alt="" />
          </div>
        </div>
      </section>

      <section className="landing-split">
        {audiences.map((a, i) => (
          <div
            key={a.kicker}
            className="landing-card glass"
            data-reveal="up"
            data-spotlight
            style={delay(i * 110)}
          >
            <span className="landing-kicker">{a.kicker}</span>
            <h2>{a.title}</h2>
            <p>{a.text}</p>
          </div>
        ))}
      </section>

      {/* картинка раскрывается из «окна» и слегка отъезжает зумом */}
      <section className="landing-media" data-progress>
        <img src={heroImage2} alt="" />
      </section>

      <section className="landing-features">
        <div className="landing-features-head" data-reveal="up">
          <h2>
            Start now. <span className="gradient-text gradient-animated">Join now.</span>
          </h2>
          <p className="hero-lead">Все инструменты управления задачами в одном месте.</p>
        </div>

        <div className="landing-features-grid">
          <div className="landing-features-list">
            {features.map((f, i) => (
              <div
                className="landing-feature glass"
                key={f.title}
                data-reveal="left"
                data-spotlight
                style={delay(i * 120)}
              >
                <span className="landing-feature-index">0{i + 1}</span>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="landing-features-img" data-reveal="right" style={delay(150)}>
            <img src={heroImage3} alt="" />
          </div>
        </div>
      </section>

      <section className="landing-believe glass" data-reveal="scale">
        <span className="landing-believe-glow" aria-hidden />
        <span className="landing-kicker">We believe that</span>
        <h2>
          Your project will change the world{" "}
          <span className="gradient-text gradient-animated">for the better tomorrow.</span>
        </h2>
        <button className="btn btn-primary btn-lg btn-shine" onClick={goToProjects}>
          Начать <ArrowRightIcon />
        </button>
      </section>
    </div>
  );
};
