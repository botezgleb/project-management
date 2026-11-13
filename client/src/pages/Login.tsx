import { useState } from "react";
import { Link } from "react-router-dom";
import { loginApi } from "../services/api/auth.api";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/user";
import logoPng from "../assets/logo.png";
import "../css/Auth.css";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      const { accessToken, user } = await loginApi(email, password);
      login(accessToken, user);
    } catch (err) {
      setError(getErrorMessage(err, "Ошибка авторизации"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card glass" onSubmit={handleSubmit}>
        <img src={logoPng} alt="" className="auth-logo" />
        <h1>С возвращением</h1>
        <p className="auth-subtitle">Войдите, чтобы продолжить работу</p>

        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Пароль</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
        </div>

        {error && <div className="alert">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary btn-lg auth-submit"
          disabled={loading || !email || !password}
        >
          {loading ? "Вход..." : "Войти"}
        </button>

        <p className="auth-switch">
          Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
        </p>
      </form>
    </div>
  );
};
