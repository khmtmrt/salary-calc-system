import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Стилі підтягуються автоматично з index.css, імпортувати їх тут не обов'язково,
// якщо вони глобальні.

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userData = await mockAuthService(email, password);
      
      localStorage.setItem('token', userData.token);
      localStorage.setItem('role', userData.role);

      if (userData.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/user-profile');
      }
    } catch (err) {
      setError('Невірний логін або пароль');
    } finally {
      setLoading(false);
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
              placeholder="admin@test.com"
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

// Mock API виніс униз, щоб не заважав читати код компонента.
// В ідеалі це має бути в окремому файлі services/authService.js
const mockAuthService = (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === 'admin@test.com' && password === 'admin') {
        resolve({ token: 'abc-123-admin', role: 'admin' });
      } else if (email === 'user@test.com' && password === 'user') {
        resolve({ token: 'xyz-789-user', role: 'user' });
      } else {
        reject(new Error('Invalid credentials'));
      }
    }, 1000);
  });
};

export default Login;