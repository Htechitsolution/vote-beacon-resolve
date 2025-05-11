
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, Menu, ChevronDown, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 py-3 px-4 shadow-sm">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Vote className="h-8 w-8 text-evoting-800" />
            <span className="text-xl font-bold bg-clip-text text-evoting-800">
              The-Evoting
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/projects" className="text-gray-600 hover:text-evoting-600 font-medium">
              Projects
            </Link>
            {profile?.role === "super_admin" && (
              <Link to="/admin/dashboard" className="text-gray-600 hover:text-evoting-600 font-medium">
                Admin Dashboard
              </Link>
            )}
            <Link to="/contact" className="text-gray-600 hover:text-evoting-600 font-medium">
              Contact
            </Link>
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <User size={16} />
                  <span className="hidden md:inline-block">{profile?.name || user.email}</span>
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu size={20} />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button className="bg-evoting-600 hover:bg-evoting-700 text-white" asChild>
              <Link to="/register">Register</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Mobile menu drawer */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-2/3 bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Menu</span>
                <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                  <Menu size={20} />
                </Button>
              </div>
              <Link 
                to="/projects" 
                className="text-gray-600 hover:text-evoting-600 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Projects
              </Link>
              {profile?.role === "super_admin" && (
                <Link 
                  to="/admin/dashboard" 
                  className="text-gray-600 hover:text-evoting-600 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
              <Link 
                to="/contact" 
                className="text-gray-600 hover:text-evoting-600 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <Link 
                to="/profile" 
                className="text-gray-600 hover:text-evoting-600 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
              <Button 
                variant="outline" 
                className="mt-2 w-full"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
