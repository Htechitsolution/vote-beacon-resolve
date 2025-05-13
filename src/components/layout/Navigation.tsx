import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X, LogOut, User } from "lucide-react";
import { toast } from "sonner";

interface NavLink {
  label: string;
  href: string;
}

const Navigation = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };
  
  const navLinks: NavLink[] = [
    {
      label: "Projects",
      href: "/projects",
    },
    {
      label: "Contact",
      href: "/contact-us",
    },
  ];

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        <div>
          <Link to="/" className="text-xl font-bold">
            eVoting Platform
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              {navLinks.map((link, index) => (
                <Button key={index} asChild variant="ghost">
                  <Link to={link.href}>{link.label}</Link>
                </Button>
              ))}
              {isAdmin && (
                <Button asChild variant="ghost">
                  <Link to="/profile">Profile</Link>
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/voter-login">Voter Login</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/login">Admin Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMenu}>
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden p-4 border-t bg-white">
          <div className="flex flex-col space-y-3">
            {user ? (
              <>
                {navLinks.map((link, index) => (
                  <Button
                    key={index}
                    asChild
                    variant="ghost"
                    className="justify-start"
                    onClick={() => setIsOpen(false)}
                  >
                    <Link to={link.href}>{link.label}</Link>
                  </Button>
                ))}
                {isAdmin && (
                  <Button
                    asChild
                    variant="ghost"
                    className="justify-start"
                    onClick={() => setIsOpen(false)}
                  >
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="justify-start"
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/voter-login">Voter Login</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="justify-start"
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/login">Admin Login</Link>
                </Button>
                <Button
                  asChild
                  className="justify-start"
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navigation;
