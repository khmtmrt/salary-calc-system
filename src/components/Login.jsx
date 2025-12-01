import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"; // <--- 1. Імпортуємо бібліотеку

// Стилі підтягуються автоматично з index.css, імпортувати їх тут не обов'язково,
// якщо вони глобальні.

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 2. Запит на сервер
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      setLoading(false)

      if (!response.ok) {
        throw new Error(data.message || 'Помилка входу');
      }

      // 3. Отримуємо токен
      const token = data.token;
      
      // 4. Розкодовуємо токен, щоб дізнатись, хто це
      const decodedUser = jwtDecode(token);
      
      // decodedUser тепер виглядає як: { userId: "...", role: "admin", exp: 173... }
      console.log("Дані з токена:", decodedUser);

      // 5. Зберігаємо токен
      localStorage.setItem('token', token);
      
      // (Опціонально) Можна зберегти роль окремо для зручності, 
      // але краще завжди брати з токена
      localStorage.setItem('role', decodedUser.role);

      navigate('/profile');

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="center-wrapper">
      <div className="card">
        <h2 className="card-title">Вхід у систему</h2>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="youremail@mail.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Завантаження...' : 'Увійти'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;