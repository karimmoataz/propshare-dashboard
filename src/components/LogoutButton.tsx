'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LogoutButtonProps {
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
}

export default function LogoutButton({ 
  className = "", 
  variant = "primary" 
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      
      // Make a request to your custom logout endpoint
      const response = await fetch('/api/custom-logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Force a refresh of all data after successful logout
        router.refresh(); 
        // Redirect to login page
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Base styles for all variants
  let baseStyles = "px-4 py-2 rounded-md font-medium transition-colors";
  
  // Variant-specific styles
  let variantStyles = "";
  
  switch (variant) {
    case "primary":
      variantStyles = "bg-blue-600 text-white hover:bg-blue-700";
      break;
    case "secondary":
      variantStyles = "bg-gray-200 text-gray-800 hover:bg-gray-300";
      break;
    case "outline":
      variantStyles = "border border-gray-300 text-gray-700 hover:bg-gray-100";
      break;
    case "ghost":
      variantStyles = "text-gray-700 hover:bg-gray-100";
      break;
  }

  return (
    <button
      onClick={handleSignOut}
      className={`${baseStyles} ${variantStyles} ${className}`}
      type="button"
      disabled={isLoading}
    >
      {isLoading ? 'logout...' : 'logout'}
    </button>
  );
}