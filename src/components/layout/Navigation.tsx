
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X, LogOut, User, LayoutDashboard, IndianRupee, FolderOpen } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Vote as VoteIcon } from "lucide-react";

interface NavLink {
  label: string;
  href: string;
  icon: React.ElementType;
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
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive"
      });
    }
  };
  
  const navLinks: NavLink[] = [];

  // Add Projects link for all logged-in users
  if (user) {
    navLinks.push({
      label: "Projects",
      href: "/projects",
      icon: FolderOpen
    });
  }

  // Add Admin Dashboard link for super admins
  if (profile?.role === "super_admin") {
    navLinks.unshift({
      label: "Admin Dashboard",
      href: "/admin-dashboard",
      icon: LayoutDashboard
    });
  }

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
          <VoteIcon className="text-evoting-600 h-19 w-19" />
            <span className="text-xl font-bold">The-eVoting</span>
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              {navLinks.map((link, index) => (
                <Button key={index} asChild variant="ghost">
                  <Link to={link.href} className="flex items-center gap-2">
                    <link.icon className="mr-1 h-4 w-4" />
                    {link.label}
                  </Link>
                </Button>
              ))}
              {isAdmin && (
                <Button asChild variant="ghost">
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="mr-1 h-4 w-4" />
                    Profile
                  </Link>
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={() => navigate('/checkout')}
                className="flex items-center gap-2 border-amber-500 text-amber-700 hover:bg-amber-50"
              >
                <IndianRupee className="mr-1 h-4 w-4" />
                Buy Credits
              </Button>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="mr-1 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link to="/login">Admin Login</Link>
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
                    <Link to={link.href}>
                      <link.icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </Link>
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
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    navigate('/checkout');
                    setIsOpen(false);
                  }}
                >
                  <IndianRupee className="mr-2 h-4 w-4" />
                  Buy Credits
                </Button>
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
                  <Link to="/login">Admin Login</Link>
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
