import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AccountantDashboard.css';

const AccountantDashboard = () => {
    // ... Ваш код компонента залишається незмінним,
    // оскільки ви додаєте стилі до .users-list в CSS.
    // ...
    // ... (весь код, який ви надали, тут)

    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userHistory, setUserHistory] = useState([]);
    
    // Форма нарахування
    const [formData, setFormData] = useState({
        grossAmount: '',
        comment: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Завантажуємо список користувачів при старті
    useEffect(() => {
        fetchUsers();
    }, []);

    // Коли вибрали юзера - завантажуємо його історію
    useEffect(() => {
        if (selectedUser) {
            fetchHistory(selectedUser._id);
            setFormData({ grossAmount: '', comment: '' });
        }
    }, [selectedUser]);

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
        } catch (err) {
            console.error(err);
            setError('Не вдалося завантажити список працівників');
        }
    };

    const fetchHistory = async (userId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/salary/history/${userId}`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setUserHistory(data);
            }
        } catch (err) {
            console.error("Помилка історії:", err);
        }
    };

    const handleAccrue = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        if (!formData.grossAmount) return alert("Вкажіть суму");

        if (!window.confirm(`Нарахувати ${formData.grossAmount} грн для ${selectedUser.name}?`)) return;

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/salary/accrue', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    userId: selectedUser._id,
                    grossAmount: Number(formData.grossAmount),
                    comment: formData.comment
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Помилка нарахування');
            }

            alert('Успішно нараховано! Очікує затвердження.');
            fetchHistory(selectedUser._id);
            setFormData({ grossAmount: '', comment: '' });
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    // --- Utility ---
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('uk-UA');
    };

    // Попередній розрахунок податків для інтерфейсу
    const calculatePreview = () => {
        const gross = Number(formData.grossAmount) || 0;
        const pdfo = gross * 0.18;
        const military = gross * 0.05;
        const net = gross - pdfo - military;
        return { pdfo, military, net };
    };

    const preview = calculatePreview();

    return (
        <div className="accountant-dashboard-container">
            
            {/* HEADER */}
            <div className="dashboard-header">
                <div>
                    <h2>Робоче місце Бухгалтера</h2>
                    <p>Нарахування заробітної плати</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary header-btn-profile" onClick={() => navigate('/profile')}>
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

            <div className="dashboard-content">
                
                {/* ЛІВА КОЛОНКА: СПИСОК СПІВРОБІТНИКІВ */}
                <div className="card users-list-card">
                    <h3 className="card-title" style={{ textAlign: 'left', fontSize: '1.2rem' }}>Співробітники</h3>
                    {error && <div className="error-msg">{error}</div>}
                    
                    {/* ЦЕЙ ЕЛЕМЕНТ (users-list) БУДЕ ПРОКРУЧУВАТИСЯ */}
                    <div className="users-list"> 
                        {users.map(user => (
                            <div 
                                key={user._id}
                                onClick={() => setSelectedUser(user)}
                                className={`user-item ${selectedUser?._id === user._id ? 'selected' : ''}`}
                            >
                                <div className="user-name">{user.name}</div>
                                <div className="user-email">{user.email}</div>
                                {/* Відображення ставки у списку */}
                                {user.fixedSalary > 0 && (
                                    <div className="user-fixed-salary">
                                        Ставка: {formatMoney(user.fixedSalary)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ПРАВА КОЛОНКА: РОБОЧА ОБЛАСТЬ */}
                <div className="workspace-area">
                    {!selectedUser ? (
                        <div className="card empty-state">
                            <h3>Виберіть співробітника зі списку зліва</h3>
                            <p>Щоб переглянути історію виплат або нарахувати нову зарплату</p>
                        </div>
                    ) : (
                        <div className="workspace-grid">
                            
                            {/* ФОРМА НАРАХУВАННЯ */}
                            <div className="card accrual-card">
                                <h3 className="card-title accrual-header">
                                    Нарахування для: <span className="user-name-highlight">{selectedUser.name}</span>
                                </h3>
                                
                                {/* ВІДОБРАЖЕННЯ ФІКСОВАНОЇ СТАВКИ */}
                                <div className="fixed-salary-block">
                                    Фіксована ставка працівника: <strong>{selectedUser.fixedSalary ? formatMoney(selectedUser.fixedSalary) : '0,00 ₴'}</strong>
                                    {selectedUser.fixedSalary > 0 && (
                                        <button 
                                            type="button" 
                                            onClick={() => setFormData({...formData, grossAmount: selectedUser.fixedSalary})}
                                            className="use-salary-btn"
                                        >
                                            Підставити
                                        </button>
                                    )}
                                </div>
                                
                                <form onSubmit={handleAccrue}>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Брудна сума (Gross, грн)</label>
                                            <input 
                                                type="number" 
                                                className="form-input"
                                                value={formData.grossAmount}
                                                onChange={e => setFormData({...formData, grossAmount: e.target.value})}
                                                placeholder="0.00"
                                                min="0"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Коментар</label>
                                            <input 
                                                type="text" 
                                                className="form-input"
                                                value={formData.comment}
                                                onChange={e => setFormData({...formData, comment: e.target.value})}
                                                placeholder="Напр: ЗП за Жовтень"
                                            />
                                        </div>
                                    </div>

                                    {/* PREVIEW BLOCK */}
                                    {formData.grossAmount > 0 && (
                                        <div className="preview-block">
                                            <div className="preview-item">
                                                <div className="preview-label">Gross</div>
                                                <div className="preview-value">{formatMoney(formData.grossAmount)}</div>
                                            </div>
                                            <div className="preview-item">
                                                <div className="preview-label">ПДФО (18%)</div>
                                                <div className="preview-value deduction">-{formatMoney(preview.pdfo)}</div>
                                            </div>
                                            <div className="preview-item">
                                                <div className="preview-label">Військовий (5%)</div>
                                                <div className="preview-value deduction">-{formatMoney(preview.military)}</div>
                                            </div>
                                            <div className="preview-item">
                                                <div className="preview-label">На руки (Net)</div>
                                                <div className="preview-value net">{formatMoney(preview.net)}</div>
                                            </div>
                                        </div>
                                    )}

                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Обробка...' : 'Нарахувати Зарплату'}
                                    </button>
                                </form>
                            </div>

                            {/* ІСТОРІЯ ВИПЛАТ */}
                            <div className="card history-card">
                                <h4 className="history-title">Історія виплат</h4>
                                {userHistory.length === 0 ? (
                                    <p className="history-empty">Історія порожня</p>
                                ) : (
                                    <table className="history-table">
                                        <thead>
                                            <tr>
                                                <th>Дата</th>
                                                <th>Сума (Net)</th>
                                                <th>Статус</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {userHistory.map(salary => (
                                                <tr key={salary._id}>
                                                    <td>
                                                        {formatDate(salary.accrualDate)}
                                                        {salary.comment && <div className="history-comment">{salary.comment}</div>}
                                                    </td>
                                                    <td className="amount-net">{formatMoney(salary.netAmount)}</td>
                                                    <td>
                                                        <span className={`status-badge ${salary.status}`}>
                                                            {salary.status === 'pending' ? 'Очікує' : 'OK'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountantDashboard;