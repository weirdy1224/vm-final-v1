import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  // Since user is now an object, check if it exists
  if (!user || !user.email) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
