import { useState } from "react";
import { registerApi } from "../services/api/auth.api";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../css/Register.css"

export const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();

  const handleClick = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await registerApi(email, password, name);
      const accessToken = response.accessToken;
      const user = response.user;
      login(accessToken, user);
    } catch (error) {
      throw new Error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register">
      <div className="register-container">
        <h1>Регистрация</h1>
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
        <input
          type="text"
          placeholder="Введите ваше имя"
          onChange={(e) => setName(e.target.value)}
          value={name}
        />
        <button onClick={handleClick} disabled={loading}>
          Зарегистрироваться
        </button>
        <p>
          Есть аккаунт? <Link to="/login">Авторизуйтесь!</Link>
        </p>
      </div>
      {loading && <h1>Загрузка...</h1>}
      {error && <p>Ошибка: {error}</p>}
    </div>
  );
};
