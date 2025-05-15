
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ArrowDown, CheckCheck, ShieldCheck, Users, FileText, Vote, Check } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Vote as VoteIcon } from "lucide-react";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="hero-gradient text-white">
          <div className="container mx-auto px-4 py-20 md:py-32">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                 <VoteIcon className="text-white h-20 w-20 animate-fade-in" />
                <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
                  Secure E-Voting Solutions for Resolution Professionals
                </h1>
                <p className="text-xl mb-8 opacity-90 animate-fade-up">
                  Streamline voting processes for CoC members under IBC, clubs, societies, and more with our trusted platform
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                 
                 
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 shadow-xl">
                  <AspectRatio ratio={16 / 9}>
                    <img 
                      src="/evoting-demo.jpg" 
                      alt="E-Voting Platform Demo" 
                      className="rounded-md object-cover w-full h-full"
                    />
                  </AspectRatio>
                </div>
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
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start">
                    <Check className="text-evoting-600 mr-2 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Advanced encryption protocols</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-evoting-600 mr-2 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">IBC regulatory compliance</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-evoting-600 mr-2 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Audit trails for complete transparency</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="bg-evoting-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <Users className="text-evoting-600" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Role-Based Access</h3>
                <p className="text-gray-600">
                  Specialized access controls for super admins, admins, and voters with tailored permissions.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start">
                    <Check className="text-evoting-600 mr-2 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Super admin oversight capabilities</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-evoting-600 mr-2 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Meeting management for administrators</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-evoting-600 mr-2 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Intuitive voter interface</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="bg-evoting-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <CheckCheck className="text-evoting-600" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Versatile Application</h3>
                <p className="text-gray-600">
                  Perfect for CoC meetings, club elections, society votes, student polls, and more.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start">
                    <Check className="text-evoting-600 mr-2 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Committee of Creditors (CoC) meetings</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-evoting-600 mr-2 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Society and club elections</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-evoting-600 mr-2 h-5 w-5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Educational institution voting</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              How It Works
            </h2>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="bg-evoting-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Create Project</h3>
                <p className="text-gray-600 text-sm">Admin creates a new project for voting</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="bg-evoting-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Set Up Meeting</h3>
                <p className="text-gray-600 text-sm">Configure agenda items and invite voters</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="bg-evoting-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Secure Voting</h3>
                <p className="text-gray-600 text-sm">Voters login and cast their votes securely</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="bg-evoting-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold">4</span>
                </div>
                <h3 className="font-semibold mb-2">View Results</h3>
                <p className="text-gray-600 text-sm">Review detailed results and analytics</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Use Cases Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              Use Cases
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <div className="mb-4">
                  <FileText className="text-evoting-600 h-10 w-10" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Resolution Professionals</h3>
                <p className="text-gray-600">
                  Streamline Committee of Creditors (CoC) voting under IBC regulations with secure, compliant electronic voting.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <div className="mb-4">
                  <Users className="text-evoting-600 h-10 w-10" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Societies & Clubs</h3>
                <p className="text-gray-600">
                  Simplify board elections, budget approvals, and bylaw amendments with transparent voting processes.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <div className="mb-4">
                  <Vote className="text-evoting-600 h-10 w-10" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Educational Institutions</h3>
                <p className="text-gray-600">
                  Facilitate student council elections, faculty votes, and institutional decisions securely and efficiently.
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
              <div className="flex flex-col sm:flex-row justify-center gap-4">
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
