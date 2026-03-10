import { useState } from "react";
import { loginApi } from "../services/api/auth.api";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../css/Login.css";
import { AxiosError } from "axios";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();

  const handleClick = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      const response = await loginApi(email, password);
      const user = response.user;
      const accessToken = response.accessToken;
      login(accessToken, user);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Ошибка авторизации");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Произошла неизвестная ошибка");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="login-container">
        <h1>Авторизация</h1>
        <input
          type="email"
          placeholder="Введите email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
        <input
          type="password"
          placeholder="Введите пароль"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />
        <button onClick={handleClick} disabled={loading}>
          {loading ? "Загрузка..." : "Войти"}
        </button>
        <p>
          Нет аккаунта? <Link to="/register">Зарегистрируйтесь!</Link>
        </p>
        {error && <div className="error-message">Ошибка! {error}</div>}
      </div>
    </div>
  );
};
