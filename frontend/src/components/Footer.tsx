
import React from 'react';
import { FaHeart } from 'react-icons/fa';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-6 px-8 mt-auto border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Copyright & Brand */}
        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          &copy; {currentYear} <a href="" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">BMS </a>. All rights reserved.
        </div>

        {/* Developer / Love note */}
        <div className="hidden md:flex items-center text-xs text-gray-400 dark:text-gray-500">
          <span>Designed & Developed by</span>
          <FaHeart className="mx-1 text-red-500 animate-pulse" />
          <span> Software Dev't Team</span>
        </div>

        {/* Quick Links */}
        <div className="flex items-center space-x-6 text-sm">
          <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Support</a>
          <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Docs</a>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">v1</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;