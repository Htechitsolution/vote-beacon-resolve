
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-evoting-800">
                The-Evoting
              </span>
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              Secure e-voting solutions for resolutions & more
            </p>
          </div>

          <div className="flex flex-wrap gap-4 md:gap-8">
            <Link to="/terms" className="text-sm text-gray-600 hover:text-evoting-600">
              Terms & Conditions
            </Link>
            <Link to="/privacy" className="text-sm text-gray-600 hover:text-evoting-600">
              Privacy Policy
            </Link>
            <Link to="/contact" className="text-sm text-gray-600 hover:text-evoting-600">
              Contact Us
            </Link>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} The-Evoting. All rights reserved.
          </p>
          <div className="mt-3 sm:mt-0">
            <p className="text-xs text-gray-500">
              Designed for Resolution Professionals under IBC
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
