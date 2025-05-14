
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {  Vote } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
           <Vote className="text-evoting-600 h-10 w-10" />
          <img src="/logo.png" alt="The-Evoting Logo" className="h-8 w-auto" />
          <span className="text-2xl font-bold bg-clip-text text-evoting-800">
            The-Evoting
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Button 
            variant="ghost"
            onClick={() => navigate("/voter-login")}
          >
            Voter Login
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate("/login")}
          >
            Admin Login
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-gray-600"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-lg md:hidden">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    navigate("/voter-login");
                    setIsMenuOpen(false);
                  }}
                >
                  Voter Login
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigate("/login");
                    setIsMenuOpen(false);
                  }}
                >
                  Admin Login
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
