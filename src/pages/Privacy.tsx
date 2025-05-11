
import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Privacy = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="prose prose-blue max-w-none">
          <p className="text-lg mb-6">
            Last Updated: May 11, 2025
          </p>
          
          <p className="mb-4">
            At The-Evoting, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            We collect several types of information from and about users of our platform, including:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2"><strong>Personal Information:</strong> Name, email address, company name, and contact details provided during registration or account updates.</li>
            <li className="mb-2"><strong>Account Information:</strong> Login credentials, account settings, user role, and permissions.</li>
            <li className="mb-2"><strong>Usage Data:</strong> Information about how you use our platform, including voting patterns (in aggregate, non-identifiable form), features accessed, and time spent on the platform.</li>
            <li className="mb-2"><strong>Technical Data:</strong> IP address, browser type, device information, operating system, and cookies.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">
            We use the information we collect for various purposes, including:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">Providing, maintaining, and improving our services.</li>
            <li className="mb-2">Processing and facilitating voting activities.</li>
            <li className="mb-2">Managing user accounts and authenticating users.</li>
            <li className="mb-2">Communicating with you about our services, updates, and security alerts.</li>
            <li className="mb-2">Analyzing usage patterns to enhance platform functionality.</li>
            <li className="mb-2">Detecting and preventing fraudulent or unauthorized access.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Data Security</h2>
          <p className="mb-4">
            We implement appropriate technical and organizational measures to protect the security, integrity, and confidentiality of your personal information. However, no electronic transmission or storage system is 100% secure, and we cannot guarantee absolute security.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Retention</h2>
          <p className="mb-4">
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Voting records may be retained according to legal requirements applicable to your jurisdiction or organization.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Disclosure of Your Information</h2>
          <p className="mb-4">
            We may disclose your personal information in the following circumstances:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">To comply with legal obligations.</li>
            <li className="mb-2">To protect and defend our rights and property.</li>
            <li className="mb-2">With your consent or at your direction.</li>
            <li className="mb-2">To service providers who perform services on our behalf.</li>
          </ul>
          <p className="mb-4">
            We do not sell your personal information to third parties.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights and Choices</h2>
          <p className="mb-4">
            Depending on your location, you may have certain rights regarding your personal information, including:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">Accessing your personal information.</li>
            <li className="mb-2">Correcting inaccurate information.</li>
            <li className="mb-2">Deleting your personal information.</li>
            <li className="mb-2">Restricting or objecting to processing.</li>
            <li className="mb-2">Data portability.</li>
          </ul>
          <p className="mb-4">
            To exercise these rights, please contact us using the information provided below.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Changes to Our Privacy Policy</h2>
          <p className="mb-4">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Contact Information</h2>
          <p className="mb-4">
            If you have any questions or concerns about this Privacy Policy, please contact us at:
          </p>
          <p>
            Email: privacy@the-evoting.com<br />
            Address: The-Evoting Headquarters, 123 Voting Lane, Democracy City, 12345
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Privacy;
