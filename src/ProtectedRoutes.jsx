import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  // Replace with your actual user role retrieval logic
  const userRoles = ['admin', 'manager', 'accountant']; // Example: get roles from context, Redux, etc.

  const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

  if (hasRequiredRole) {
    return <Outlet />;
  } else {
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;