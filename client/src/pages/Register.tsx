import { useState } from "react";
import { Link } from "react-router-dom";
import { registerApi } from "../services/api/auth.api";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/user";
import logoPng from "../assets/logo.png";
import "../css/Auth.css";

export const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      const { accessToken, user } = await registerApi(email, password, name);
      login(accessToken, user);
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось зарегистрироваться"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card glass" onSubmit={handleSubmit}>
        <img src={logoPng} alt="" className="auth-logo" />
        <h1>Создать аккаунт</h1>
        <p className="auth-subtitle">Пара секунд — и можно начинать</p>

        <div className="field">
          <label htmlFor="register-name">Имя</label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="Как вас зовут"
            onChange={(e) => setName(e.target.value)}
            value={name}
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />
        </div>
        <div className="field">
          <label htmlFor="register-password">Пароль</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
        </div>

        {error && <div className="alert">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary btn-lg auth-submit"
          disabled={loading || !email || !password || !name}
        >
          {loading ? "Создание..." : "Зарегистрироваться"}
        </button>

        <p className="auth-switch">
          Есть аккаунт? <Link to="/login">Войдите</Link>
        </p>
      </form>
    </div>
  );
};
