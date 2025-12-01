import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from './components/Login';
import Profile from './pages/Profile';
import ProtectedRoute from './ProtectedRoutes';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AccountantDashboard from './pages/AccountantDashboard';

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        {/* <Route path="/counter" element={<Counter />} /> */}
        
        <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
          <Route path="/profile" element={<Profile />} />
        </Route>


        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['accountant']} />}>
          <Route path="/accountant-dashboard" element={<AccountantDashboard />} />
        </Route>        

      </Routes>
    </BrowserRouter>
  )
}

export default App
