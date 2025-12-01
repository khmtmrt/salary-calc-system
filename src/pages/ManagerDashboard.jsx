import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Фільтри
  const [filterPeriod, setFilterPeriod] = useState('month'); // default: поточний місяць
  const [filterStatus, setFilterStatus] = useState('all');   // all, pending, approved

  const navigate = useNavigate();

  useEffect(() => {
    fetchSalaries();
  }, [filterPeriod, filterStatus]); // Перезавантажуємо при зміні фільтрів

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchSalaries = async () => {
    setLoading(true);
    setError('');
    try {
      // Формуємо URL з параметрами
      // Наприклад: /api/salary/all?period=month&status=pending
      let url = `http://localhost:5000/api/salary/all?period=${filterPeriod}`;
      if (filterStatus !== 'all') {
        url += `&status=${filterStatus}`;
      }

      const response = await fetch(url, { headers: getAuthHeaders() });

      if (response.status === 401 || response.status === 403) {
        navigate('/login');
        return;
      }

      if (!response.ok) throw new Error('Помилка завантаження даних');

      const data = await response.json();
      setSalaries(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Затвердити цю виплату?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/salary/approve/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Помилка затвердження');
      }

      // Оновлюємо список локально (змінюємо статус на approved)
      setSalaries(prev => prev.map(item => 
        item._id === id ? { ...item, status: 'approved', approvedBy: { name: 'Ви (щойно)' } } : item
      ));
      
      alert('Успішно затверджено!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  // Форматування грошей
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(amount);
  };

  // Форматування дати
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading && salaries.length === 0) return <div className="center-wrapper">Завантаження...</div>;

  return (
    <div className="manager-dashboard-container">
      
      {/* HEADER */}
      <div className="manager-header">
        <div>
          <h2>Кабінет Керівника</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Контроль та затвердження виплат</p>
        </div>
        <div className="header-controls">
          <button className="btn btn-primary" onClick={() => navigate('/profile')} style={{ width: 'auto' }}>
            Мій Профіль
          </button>
          <button 
            className="btn header-btn-logout" 
            onClick={handleLogout} 
          >
            Вийти
          </button>
        </div>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* --- ФІЛЬТРИ --- */}
      <div className="card filters-card">
        
        <div className="form-group filter-group">
          <label className="form-label">Період</label>
          <select 
            className="form-input" 
            value={filterPeriod} 
            onChange={(e) => setFilterPeriod(e.target.value)}
          >
            <option value="week">Останній тиждень</option>
            <option value="month">Поточний місяць</option>
            <option value="quarter">Поточний квартал</option>
            <option value="">Вся історія</option>
          </select>
        </div>

        <div className="form-group filter-group">
          <label className="form-label">Статус</label>
          <select 
            className="form-input" 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Всі статуси</option>
            <option value="pending">Очікують затвердження</option>
            <option value="approved">Затверджені</option>
          </select>
        </div>

        <button 
          className="btn update-btn" 
          onClick={fetchSalaries}
        >
          Оновити
        </button>
      </div>

      {/* --- ТАБЛИЦЯ --- */}
      <div className="card manager-table-card">
        {salaries.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
            Записів не знайдено за вибраними фільтрами.
          </div>
        ) : (
          <table className="manager-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Співробітник</th>
                <th>Нараховано (Gross)</th>
                <th>До виплати (Net)</th>
                <th>Статус</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map(salary => (
                <tr key={salary._id}>
                  <td>
                    {formatDate(salary.accrualDate)}
                    {salary.comment && <div className="manager-table-comment">{salary.comment}</div>}
                  </td>
                  <td>
                    <strong>{salary.user?.name || 'Невідомий'}</strong>
                    <div className="manager-table-email">{salary.user?.email}</div>
                  </td>
                  <td>{formatMoney(salary.grossAmount)}</td>
                  <td className="net-amount">
                    {formatMoney(salary.netAmount)}
                  </td>
                  <td>
                    <span className={`status-badge ${salary.status}`}>
                      {salary.status === 'pending' ? 'Очікує' : 
                       salary.status === 'approved' ? 'Затверджено' : salary.status}
                    </span>
                    {salary.approvedBy && (
                      <div className="approver-info">
                        ✓ {salary.approvedBy.name}
                      </div>
                    )}
                  </td>
                  <td>
                    {salary.status === 'pending' && (
                      <button 
                        onClick={() => handleApprove(salary._id)} 
                        className="btn approve-btn" 
                      >
                        Затвердити
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;