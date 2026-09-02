import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role }) {
  const user = JSON.parse(localStorage.getItem("user"));

  console.log("ProtectedRoute User:", user);
  console.log("Required Role:", role);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    console.log("Role mismatch:", user.role, role);
    return <Navigate to="/user" replace />;
  }

  return children;
}

export default ProtectedRoute;