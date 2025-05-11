
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Projects from "./pages/Projects";
import Profile from "./pages/Profile";
import ProjectDetail from "./pages/ProjectDetail";
import AgendaDetail from "./pages/AgendaDetail";
import SuperAdmin from "./pages/SuperAdmin";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import VoterManagement from "./pages/VoterManagement";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminRoute from "./components/SuperAdminRoute";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route 
      path="/profile" 
      element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/projects" 
      element={
        <ProtectedRoute>
          <Projects />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/projects/:projectId" 
      element={
        <ProtectedRoute>
          <ProjectDetail />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/projects/:projectId/agenda/:agendaId" 
      element={
        <ProtectedRoute>
          <AgendaDetail />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/projects/:projectId/agenda/:agendaId/voters" 
      element={
        <ProtectedRoute>
          <VoterManagement />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/projects/:projectId/voters" 
      element={
        <ProtectedRoute>
          <VoterManagement />
        </ProtectedRoute>
      } 
    />
    <Route 
      path="/admin/dashboard" 
      element={
        <SuperAdminRoute>
          <SuperAdmin />
        </SuperAdminRoute>
      }
    />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
