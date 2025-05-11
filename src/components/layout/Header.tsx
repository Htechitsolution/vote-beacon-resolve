
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Vote className="h-6 w-6 text-evoting-800" />
          <span className="text-2xl font-bold bg-clip-text text-evoting-800">
            The-Evoting
          </span>
        </Link>

        {/* Desktop Navigation - simplified */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/contact" className="text-gray-600 hover:text-evoting-600 font-medium">
            Contact
          </Link>
          <Button 
            variant="outline"
            className="ml-4"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
          <Button 
            className="bg-evoting-600 hover:bg-evoting-700 text-white"
            onClick={() => navigate("/register")}
          >
            Register
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

        {/* Mobile Navigation - simplified */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-lg md:hidden">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <Link 
                to="/contact" 
                className="text-gray-600 hover:text-evoting-600 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigate("/login");
                    setIsMenuOpen(false);
                  }}
                >
                  Login
                </Button>
                <Button 
                  className="w-full bg-evoting-600 hover:bg-evoting-700 text-white"
                  onClick={() => {
                    navigate("/register");
                    setIsMenuOpen(false);
                  }}
                >
                  Register
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
