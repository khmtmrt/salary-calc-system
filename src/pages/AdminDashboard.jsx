import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    fixedSalary: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [passwordChangeId, setPasswordChangeId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Маппінг ролей для відображення
  const roleNames = {
    admin: 'Адміністратор',
    manager: 'Керівник',
    accountant: 'Бухгалтер',
    user: 'Користувач'
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: getAuthHeaders()
      });
      
      if (response.status === 401 || response.status === 403) {
        navigate('/login');
        return;
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setError('Не вдалося завантажити список користувачів');
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message);
      }

      await fetchUsers();
      setNewUser({ name: '', email: '', password: '', role: 'user', fixedSalary: '' });
      alert('Користувача успішно створено!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цього користувача?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Помилка видалення');

      setUsers(users.filter(user => user._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const startEditing = (user) => {
    setEditingId(user._id);
    setEditFormData({ 
        name: user.name, 
        email: user.email, 
        role: user.role,
        fixedSalary: user.fixedSalary || 0 
    });
    setPasswordChangeId(null);
  };

  const saveEdit = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${editingId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editFormData)
      });

      if (!response.ok) throw new Error('Помилка оновлення');

      const updatedUser = await response.json();
      setUsers(users.map(u => (u._id === editingId ? updatedUser : u)));
      setEditingId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangePassword = async (userId) => {
    if (!newPassword) return alert("Введіть новий пароль");
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ password: newPassword })
      });

      if (!response.ok) throw new Error('Помилка зміни пароля');

      alert('Пароль змінено успішно');
      setPasswordChangeId(null);
      setNewPassword('');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="center-wrapper">Завантаження...</div>;

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <h2>Адмін Панель</h2>
        <button className="btn btn-primary" onClick={() => navigate('/profile')} style={{ width: 'auto' }}>
          Мій Профіль
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* --- БЛОК 1: СТВОРЕННЯ КОРИСТУВАЧА --- */}
      <div className="card create-user-card">
        <h3 className="card-title" style={{ textAlign: 'left' }}>Додати нового користувача</h3>
        <form onSubmit={handleCreateUser} className="create-user-form">
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Ім'я</label>
            <input 
              className="form-input" 
              value={newUser.name} 
              onChange={e => setNewUser({...newUser, name: e.target.value})}
              required 
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email</label>
            <input 
              className="form-input" 
              type="email"
              value={newUser.email} 
              onChange={e => setNewUser({...newUser, email: e.target.value})}
              required 
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Пароль</label>
            <input 
              className="form-input" 
              type="password"
              value={newUser.password} 
              onChange={e => setNewUser({...newUser, password: e.target.value})}
              required 
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Ставка (Gross)</label>
            <input 
              className="form-input" 
              type="number"
              value={newUser.fixedSalary} 
              onChange={e => setNewUser({...newUser, fixedSalary: e.target.value})}
              placeholder="0"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Роль</label>
            <select 
              className="form-input" 
              value={newUser.role} 
              onChange={e => setNewUser({...newUser, role: e.target.value})}
            >
                <option value="user">Користувач</option>
                <option value="admin">Адміністратор</option>
                <option value="manager">Керівник</option>
                <option value="accountant">Бухгалтер</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">Створити</button>
        </form>
      </div>

      {/* --- БЛОК 2: ТАБЛИЦЯ КОРИСТУВАЧІВ --- */}
      <div className="card table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ім'я</th>
              <th>Email</th>
              <th>Ставка</th>
              <th>Роль</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                
                {/* РЕЖИМ РЕДАГУВАННЯ */}
                {editingId === user._id ? (
                  <>
                    <td>
                      <input 
                        className="form-input" 
                        value={editFormData.name} 
                        onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                      />
                    </td>
                    <td>
                      <input 
                        className="form-input" 
                        value={editFormData.email} 
                        onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                      />
                    </td>
                    <td>
                      <input 
                        className="form-input" 
                        type="number"
                        value={editFormData.fixedSalary} 
                        onChange={e => setEditFormData({...editFormData, fixedSalary: e.target.value})}
                        style={{width: '80px'}}
                      />
                    </td>
                    <td>
                      <select 
                        className="form-input" 
                        value={editFormData.role} 
                        onChange={e => setEditFormData({...editFormData, role: e.target.value})}
                      >
                        <option value="user">Користувач</option>
                        <option value="admin">Адміністратор</option>
                        <option value="manager">Керівник</option>
                        <option value="accountant">Бухгалтер</option>
                      </select>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={saveEdit} className="btn action-btn btn-save">OK</button>
                        <button onClick={() => setEditingId(null)} className="btn action-btn btn-cancel">Скас</button>
                      </div>
                    </td>
                  </>
                ) : (
                  /* ЗВИЧАЙНИЙ РЕЖИМ */
                  <>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.fixedSalary} ₴</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {roleNames[user.role] || user.role}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => startEditing(user)} className="btn action-btn btn-edit">Редагувати</button>
                        <button onClick={() => setPasswordChangeId(passwordChangeId === user._id ? null : user._id)} className="btn action-btn btn-password">Пароль</button>
                        <button onClick={() => handleDeleteUser(user._id)} className="btn action-btn btn-delete">Видалити</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- МОДАЛКА ЗМІНИ ПАРОЛЯ --- */}
      {passwordChangeId && (
        <div className="password-popup">
          <h4 style={{ marginBottom: '1rem' }}>Зміна пароля</h4>
          <input 
            type="text" 
            placeholder="Новий пароль" 
            className="form-input"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            style={{ marginBottom: '10px' }}
          />
          <div className="popup-actions">
            <button onClick={() => handleChangePassword(passwordChangeId)} className="btn btn-primary">Зберегти</button>
            <button onClick={() => {setPasswordChangeId(null); setNewPassword('')}} className="btn btn-cancel">Скасувати</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;