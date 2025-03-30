import React from 'react';
import LogoutButton from './LogoutButton';
import Image from 'next/image';

interface HeaderProps {
  userName: string;
}

function Header({ userName }: HeaderProps) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
            {/* <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1> */}
            <Image  
                src="/logo.png" 
                alt="Logo" 
                width={200}
                height={50}/>
            <div>
            <div className='flex flex-row items-center'>
                <p className="text-lg font-bold text-gray-500 mx-5">Welcome, {userName}</p>
                <LogoutButton />
            </div>
            </div>
        </div>
      </div>
    </header>
  );
}

export default Header;