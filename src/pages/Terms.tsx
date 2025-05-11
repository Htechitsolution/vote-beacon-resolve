
import React from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Terms = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
        
        <div className="prose prose-blue max-w-none">
          <p className="text-lg mb-6">
            Last Updated: May 11, 2025
          </p>
          
          <p className="mb-4">
            Welcome to The-Evoting. These Terms and Conditions ("Terms") govern your use of our platform and services. By accessing or using The-Evoting, you agree to be bound by these Terms.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use our services.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Services</h2>
          <p className="mb-4">
            The-Evoting provides an electronic voting platform designed for resolution professionals, organizations, clubs, societies, educational institutions, and other entities to conduct secure, efficient voting processes.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
          <p className="mb-4">
            To access certain features of our platform, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
          </p>
          <p className="mb-4">
            You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. User Roles and Responsibilities</h2>
          <p className="mb-4">
            Our platform offers three primary user roles:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2"><strong>Super Admin:</strong> Has complete administrative access to all platform features, user management, and subscription controls.</li>
            <li className="mb-2"><strong>Admin:</strong> Can create and manage voting projects, agendas, and voters within their authorized scope.</li>
            <li className="mb-2"><strong>Voter:</strong> Can participate in voting processes to which they have been granted access.</li>
          </ul>
          <p className="mb-4">
            Users must operate within their designated role permissions and not attempt to access features or data beyond their authorization level.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Compliance with Laws</h2>
          <p className="mb-4">
            You agree to use our services in compliance with all applicable laws and regulations, including the Insolvency and Bankruptcy Code where applicable. You are responsible for ensuring that your use of our platform meets all legal requirements for your specific voting processes.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Privacy</h2>
          <p className="mb-4">
            Your privacy is important to us. Our <Link to="/privacy" className="text-evoting-600 hover:underline">Privacy Policy</Link> describes how we collect, use, and share your personal information.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Modifications to Terms</h2>
          <p className="mb-4">
            We reserve the right to modify these Terms at any time. We will provide notice of significant changes by updating the date at the top of these Terms and by maintaining a current version of the Terms on our website. Your continued use of our services after any such changes constitutes your acceptance of the new Terms.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Contact Information</h2>
          <p className="mb-4">
            If you have any questions about these Terms, please contact us at:
          </p>
          <p>
            Email: support@the-evoting.com<br />
            Address: The-Evoting Headquarters, 123 Voting Lane, Democracy City, 12345
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;
