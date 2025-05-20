import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Vote as VoteIcon, User, ChevronDown, Menu, X } from "lucide-react";
import { useMobile } from "@/hooks/useMobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const Navigation = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node) &&
        userButtonRef.current && !userButtonRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 z-50 shadow-sm">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center">
          {/* Mobile menu button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}

          <Link to="/" className="flex items-center gap-2">
            <VoteIcon className="text-evoting-600 h-19 w-19" />
            <span className="text-lg md:text-xl font-bold text-evoting-800">
              The-eVoting
            </span>
          </Link>
        </div>

        {/* Desktop navigation */}
        {!isMobile && (
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-evoting-600 transition-colors"
            >
              Home
            </Link>
            {user && (
              <>
                <Link
                  to="/projects"
                  className="text-gray-700 hover:text-evoting-600 transition-colors"
                >
                  Projects
                </Link>
                {profile?.role === 'super_admin' && (
                  <>
                    <Link
                      to="/admin-dashboard"
                      className="text-gray-700 hover:text-evoting-600 transition-colors"
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      to="/voter-meetings"
                      className="text-gray-700 hover:text-evoting-600 transition-colors"
                    >
                      Voter Meetings
                    </Link>
                  </>
                )}
              </>
            )}
            <Link
              to="/contact-us"
              className="text-gray-700 hover:text-evoting-600 transition-colors"
            >
              Contact
            </Link>
          </div>
        )}

        {/* User menu or login button */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <Button
                ref={userButtonRef}
                variant="ghost"
                className="flex items-center gap-2"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <User className="h-5 w-5" />
                <span className="hidden md:block">
                  {profile?.name || user.email}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div
                    className="py-1"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <div className="px-4 py-2 text-xs text-gray-500 border-b">
                      {user.email}
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      to="/projects"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Your Projects
                    </Link>
                    {profile?.role === 'super_admin' && (
                      <>
                        <Link
                          to="/admin-dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Admin Dashboard
                        </Link>
                        <Link
                          to="/voter-meetings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Voter Meetings
                        </Link>
                      </>
                    )}
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={handleSignOut}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={() => navigate("/login")}
              className="bg-evoting-600 hover:bg-evoting-700 text-white"
            >
              Sign in
            </Button>
          )}
        </div>
      </div>

      {/* Mobile menu drawer */}
      {isMobile && isOpen && (
        <div className="border-b">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link
              to="/"
              className="text-gray-700 hover:text-evoting-600 transition-colors block"
            >
              Home
            </Link>
            {user && (
              <>
                <Link
                  to="/projects"
                  className="text-gray-700 hover:text-evoting-600 transition-colors block"
                >
                  Projects
                </Link>
                {profile?.role === 'super_admin' && (
                  <>
                    <Link
                      to="/admin-dashboard"
                      className="text-gray-700 hover:text-evoting-600 transition-colors block"
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      to="/voter-meetings"
                      className="text-gray-700 hover:text-evoting-600 transition-colors block"
                    >
                      Voter Meetings
                    </Link>
                  </>
                )}
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-evoting-600 transition-colors block"
                >
                  Profile
                </Link>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </>
            )}
            <Link
              to="/contact-us"
              className="text-gray-700 hover:text-evoting-600 transition-colors block"
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
