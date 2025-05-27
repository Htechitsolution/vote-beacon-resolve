
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  // Show loading state if we're still determining auth status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600"></div>
      </div>
    );
  }
  
  // If not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If logged in, show the protected content
  // This supports both direct children and Outlet usage
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
