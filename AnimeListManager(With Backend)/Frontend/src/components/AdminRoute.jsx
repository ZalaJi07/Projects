import { Navigate } from 'react-router-dom';

// Protects /admin — only renders children if the stored profile has isAdmin: true.
// All real security is enforced server-side; this is purely a UX guard.
const AdminRoute = ({ children }) => {
    const profile = JSON.parse(localStorage.getItem('profile'));
    const isAdmin = profile?.result?.isAdmin === true;

    if (!profile) return <Navigate to="/auth" replace />;
    if (!isAdmin) return <Navigate to="/" replace />;

    return children;
};

export default AdminRoute;
