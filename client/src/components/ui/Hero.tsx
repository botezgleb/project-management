import heroImage1 from "../../assets/hero-img-1.jpg";
import heroImage2 from "../../assets/hero-img-2.jpg";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/projects");
  };

  return (
    <div className="hero">
      <div className="hero-text">
        <h1>
          Your projects. <span>Your rules</span>
        </h1>
      </div>

      <div className="hero-main">
        <img src={heroImage1} alt="hero-main" className="hero-image-1" />
        <div className="hero-main-text">
          <h3>ДЛЯ СОЗДАТЕЛЕЙ</h3>
          <p>
            Твори как профи с гибкими инструментами и умными процессами. 
            Будь то соло или команда — мы помогаем превратить идеи в реальность.
          </p>
          <button className="hero-main-btn" onClick={handleClick}>
            <span className="top-key"></span>
            <span className="text">К проектам</span>
            <span className="bottom-key-1"></span>
            <span className="bottom-key-2"></span>
          </button>
        </div>
      </div>

      <div className="hero-info">
        <div className="hero-info-content">
          <h2>ДЛЯ КОМАНД</h2>
          <p>
            Работайте вместе эффективно с мощными инструментами 
            для совместной работы и синхронизации задач.
            Работайте синхронно с командой над любыми проектами. 
            Прозрачность процессов и полный контроль на каждом этапе.
          </p>
        </div>
        <div className="hero-info-content">
          <h2>ДЛЯ СТАРТАПОВ</h2>
          <p>
            От идеи до запуска — управляйте развитием продукта. 
            Быстро, гибко, без бюрократии.
            Масштабируйтесь без боли: от маленькой команды до большой компании. 
            Инструменты, которые растут вместе с вами.
          </p>
        </div>
        <div className="hero-info-image-right">
          <img src={heroImage2} alt="hero-info-right" />
        </div>
      </div>
      <div className="start-now">
        <h1>Start now. <span>Join now</span></h1>
      </div>
    </div>
  );
};