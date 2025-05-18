import React from 'react';
import LogoutButton from './LogoutButton';
import Image from 'next/image';

interface HeaderProps {
  userName: string;
}

function Header({ userName }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={200}
            height={50}
            className="logo"
          />
          <div className="user-info">
            <p className="welcome-text">Welcome, {userName}</p>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;