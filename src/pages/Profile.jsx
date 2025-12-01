import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [salaries, setSalaries] = useState([]);
  const [averageSalary, setAverageSalary] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      // 1. Отримуємо дані користувача з токена
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        handleLogout();
        return;
      }

      // Формуємо об'єкт користувача
      const userData = {
        id: decoded.userId || decoded.id,
        email: decoded.email || 'Не вказано',
        role: decoded.role,
        name: decoded.name || 'Користувач',
        fixedSalary: decoded.fixedSalary || 0, // Додали фіксовану зарплату
        avatarColor: getAvatarColor(decoded.role)
      };

      setUser(userData);
      
      // 2. Завантажуємо історію зарплат
      fetchSalaryHistory(userData.id, token);

    } catch (error) {
      console.error("Помилка токена:", error);
      handleLogout();
    }
  }, [navigate]);

  const fetchSalaryHistory = async (userId, token) => {
    try {
      const response = await fetch(`http://localhost:5000/api/salary/history/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSalaries(data);
        calculateAverage(data);
      }
    } catch (err) {
      console.error("Не вдалося завантажити історію зарплат", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverage = (data) => {
    if (!data || data.length === 0) return;
    
    // Враховуємо тільки затверджені виплати для статистики
    const approvedSalaries = data.filter(item => item.status === 'approved');
    
    if (approvedSalaries.length === 0) return;

    const total = approvedSalaries.reduce((sum, item) => sum + item.netAmount, 0);
    setAverageSalary(total / approvedSalaries.length);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  // --- Хелпери ---
  
  const getAvatarColor = (role) => {
    switch(role) {
      case 'admin': return '#dc3545';
      case 'manager': return '#fd7e14';
      case 'accountant': return '#6610f2';
      default: return '#007bff';
    }
  };

  const getRoleName = (role) => {
    const roles = {
      'admin': 'Адміністратор',
      'manager': 'Керівник',
      'accountant': 'Бухгалтер',
      'user': 'Співробітник'
    };
    return roles[role] || role;
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  // Функція для розрахунку відхилення (по Gross сумі)
  const getDeviation = (grossAmount) => {
    if (!user || !user.fixedSalary) return 0;
    return grossAmount - user.fixedSalary;
  };

  if (loading) return <div className="center-wrapper">Завантаження профілю...</div>;

  return (
    <div className="profile-container">
      
      {/* КАРТКА КОРИСТУВАЧА */}
      <div className="card profile-card">
        <div className="profile-avatar" style={{ backgroundColor: user.avatarColor }}>
          {user.name.charAt(0).toUpperCase()}
        </div>

        <h2 className="card-title" style={{ marginBottom: '0.5rem' }}>{user.name}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{user.email}</p>
        
        <div style={{ marginBottom: '1rem' }}>
          <span className="profile-role-badge">
            {getRoleName(user.role)}
          </span>
        </div>

        {/* Відображення ставки */}
        <div className="profile-salary-info">
           Ставка (Gross): <strong>{formatMoney(user.fixedSalary)}</strong>
        </div>

        <button onClick={handleLogout} className="btn profile-btn-logout">
          Вийти з профілю
        </button>
      </div>

      {/* СТАТИСТИКА */}
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-label">Всього виплат</div>
          <div className="stat-value">
            {salaries.filter(s => s.status === 'approved').length}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Середня ЗП (Net)</div>
          <div className="stat-value green">
            {formatMoney(averageSalary)}
          </div>
        </div>
      </div>

      {/* ІСТОРІЯ ЗАРПЛАТ */}
      <div className="card profile-history-card">
        <h3 className="profile-history-header">
          Історія нарахувань
        </h3>
        
        {salaries.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
            Історія виплат поки що порожня.
          </div>
        ) : (
          <table className="profile-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Сума (Net)</th>
                <th>ПДФО (18%)</th>
                <th>Військовий (5%)</th>
                <th>Відхилення</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map((item) => {
                const deviation = getDeviation(item.grossAmount);
                const devClass = deviation > 0 ? 'deviation-pos' : deviation < 0 ? 'deviation-neg' : 'deviation-neutral';
                
                return (
                  <tr key={item._id}>
                    <td>
                        {formatDate(item.accrualDate)}
                        <div style={{ fontSize: '0.75rem', color: '#999' }}>{item.comment}</div>
                    </td>
                    <td style={{ fontWeight: 'bold', color: '#28a745', fontSize: '1.1rem' }}>
                      {formatMoney(item.netAmount)}
                    </td>
                    <td className="tax-value">
                      {item.taxes ? formatMoney(item.taxes.pdfo) : '-'}
                    </td>
                    <td className="tax-value">
                      {item.taxes ? formatMoney(item.taxes.military) : '-'}
                    </td>
                    <td className={`deviation-value ${devClass}`}>
                      {deviation > 0 ? '+' : ''}{formatMoney(deviation)}
                    </td>
                    <td>
                      <span className={`status-badge ${item.status}`}>
                        {item.status === 'approved' ? 'Зараховано' : 'Очікує'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Кнопки навігації для спец. ролей */}
      {['admin', 'manager', 'accountant'].includes(user.role) && (
        <div className="nav-buttons-container">
          <p>Панелі керування:</p>
          <div className="nav-buttons-group">
            {user.role === 'admin' && (
              <button onClick={() => navigate('/admin-dashboard')} className="btn btn-primary nav-btn">
                Адмін Панель
              </button>
            )}
            {(user.role === 'manager') && (
              <button onClick={() => navigate('/manager-dashboard')} className="btn btn-primary nav-btn nav-btn-manager">
                Кабінет Керівника
              </button>
            )}
            {(user.role === 'accountant') && (
              <button onClick={() => navigate('/accountant-dashboard')} className="btn btn-primary nav-btn nav-btn-accountant">
                Кабінет Бухгалтера
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;