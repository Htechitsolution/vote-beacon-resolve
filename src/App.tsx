
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import ProfilePage from './pages/Profile';
import ContactUsPage from './pages/ContactUs';
import IndexPage from './pages/Index';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ForgotPasswordPage from './pages/ForgotPassword';
import NotFoundPage from './pages/NotFound';
import TermsPage from './pages/Terms';
import PrivacyPage from './pages/Privacy';
import AdminDashboardPage from './pages/AdminDashboard';
import ProjectsPage from './pages/Projects';
import ProjectDetailPage from './pages/ProjectDetail';
import AgendaDetailPage from './pages/AgendaDetail';
import AgendaResultsPage from './pages/AgendaResults';
import VoterManagementPage from './pages/VoterManagement';
import VoterLoginPage from './pages/VoterLogin';
import VoterDashboardPage from './pages/VoterDashboard';
import VoterMeetingPage from './pages/VoterMeeting';
import CheckoutPage from './pages/Checkout';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/contact-us" element={<ContactUsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/projects/:projectId/agenda/:agendaId" element={<AgendaDetailPage />} />
          <Route path="/projects/:projectId/agenda/:agendaId/results" element={<AgendaResultsPage />} />
          <Route path="/projects/:projectId/voters" element={<VoterManagementPage />} />
        </Route>
        
        {/* Super admin routes */}
        <Route element={<SuperAdminRoute />}>
          <Route path="/super-admin" element={<AdminDashboardPage />} />
          <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
        </Route>
        
        {/* Voter routes */}
        <Route path="/voter-login" element={<VoterLoginPage />} />
        <Route path="/voter-dashboard" element={<VoterDashboardPage />} />
        <Route path="/voter/meeting/:projectId/:agendaId" element={<VoterMeetingPage />} />
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
