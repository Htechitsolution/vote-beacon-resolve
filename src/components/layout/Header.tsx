
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Vote as VoteIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
           <VoteIcon className="text-evoting-600 h-19 w-19" />
          <span className="text-2xl font-bold bg-clip-text text-evoting-800">
            The-Evoting
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-3">
          {user && profile ? (
            // Logged in user - show logout button
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            // Not logged in - show login buttons
            <>
              <Button
                variant="outline"
                onClick={() => navigate('/voter-login')}
              >
                Voter Login
              </Button>
              <Button
                size="lg"
                className="bg-evoting-600 hover:bg-evoting-700 text-white"
                asChild
              >
                <Link to="/login">Admin Login</Link>
              </Button>
            </>
          )}
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
              {user && profile ? (
                // Logged in user - show logout button
                <Button 
                  variant="outline"
                  className="w-full flex items-center gap-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              ) : (
                // Not logged in - show login buttons
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button 
                    variant="outline"
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
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
