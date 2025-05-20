import React from 'react';
import LogoutButton from './LogoutButton';
import Image from 'next/image';

interface HeaderProps {
  userName: string;
}

function Header({ userName }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Image  
              src="/logo.png" 
              alt="Logo" 
              width={160}
              height={40}
              className="h-10 w-auto"
            />
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex space-x-6">
              <a 
                href="/admin/dashboard" 
                className="text-gray-600 hover:text-indigo-600 px-1 py-2 text-sm font-medium transition-colors"
              >
                Dashboard
              </a>
              <a 
                href="/admin/users" 
                className="text-gray-600 hover:text-indigo-600 px-1 py-2 text-sm font-medium transition-colors"
              >
                Users
              </a>
              <a 
                href="/admin/properties" 
                className="text-gray-600 hover:text-indigo-600 px-1 py-2 text-sm font-medium transition-colors"
              >
                Properties
              </a>
            </nav>
            
            <div className="flex items-center border-l pl-6 ml-6 border-gray-200">
              <span className="text-sm font-medium text-gray-600">Welcome, {userName}</span>
              <div className="ml-4">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;