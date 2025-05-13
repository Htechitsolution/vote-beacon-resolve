
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, profile } = useAuth();
  
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
  
  // If not a super admin, redirect to projects page
  if (profile?.role !== 'super_admin') {
    return <Navigate to="/projects" replace />;
  }
  
  // If super admin, show the protected content
  return <>{children}</>;
};

export default SuperAdminRoute;
