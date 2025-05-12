
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ArrowDown, CheckCheck, ShieldCheck, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="hero-gradient text-white">
          <div className="container mx-auto px-4 py-20 md:py-32">
            <div className="max-w-3xl mx-auto text-center">
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              
                Secure E-Voting Solutions for Resolution Professionals
              </h1>
              <p className="text-xl mb-8 opacity-90 animate-fade-up">
                Streamline voting processes for CoC members under IBC, clubs, societies, and more with our trusted platform
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-white text-evoting-800 hover:bg-gray-100"
                  asChild
                >
                  <Link to="/register">Get Started</Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white text-white hover:bg-white/10"
                  asChild
                >
                  <Link to="/login">Login</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-center pb-8">
            <ArrowDown className="animate-bounce text-white/70" size={32} />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              Why Choose <span className="text-evoting-600">The-Evoting</span>?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="bg-evoting-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <ShieldCheck className="text-evoting-600" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure & Compliant</h3>
                <p className="text-gray-600">
                  End-to-end encryption and full compliance with IBC regulations for resolution processes.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="bg-evoting-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <Users className="text-evoting-600" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Role-Based Access</h3>
                <p className="text-gray-600">
                  Specialized access controls for super admins, admins, and voters with tailored permissions.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="bg-evoting-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <CheckCheck className="text-evoting-600" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Versatile Application</h3>
                <p className="text-gray-600">
                  Perfect for CoC meetings, club elections, society votes, student polls, and more.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="bg-evoting-50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to modernize your voting process?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of resolution professionals and organizations who trust The-Evoting
              </p>
              <Button 
                size="lg" 
                className="bg-evoting-600 hover:bg-evoting-700 text-white"
                asChild
              >
                <Link to="/register">Create Your Account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
