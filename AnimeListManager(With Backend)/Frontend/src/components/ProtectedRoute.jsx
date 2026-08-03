import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const profile = localStorage.getItem('profile');

    if (!profile) {
        return <Navigate to="/auth" replace />;
    }

    return children;
};

export default ProtectedRoute;
