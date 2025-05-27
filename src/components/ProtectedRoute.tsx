import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, profile, isLoading } = useAuth();
  
  // Show loading state if we're still determining auth status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600"></div>
      </div>
    );
  }
  
  // If not logged in, redirect based on context
  if (!user || !profile) {
    // If we're on a voter-related route, redirect to voter login
    if (window.location.pathname.includes('voter')) {
      return <Navigate to="/voter-login" replace />;
    }
    // Otherwise redirect to admin login
    return <Navigate to="/login" replace />;
  }
  
  // If voter is trying to access admin routes, redirect to voter dashboard
  if (profile.role === 'voter' && !window.location.pathname.includes('voter')) {
    return <Navigate to="/voter-dashboard" replace />;
  }
  
  // If admin is trying to access voter routes, redirect to projects
  if (profile.role !== 'voter' && window.location.pathname.includes('voter-dashboard')) {
    return <Navigate to="/projects" replace />;
  }
  
  // If logged in, show the protected content
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
