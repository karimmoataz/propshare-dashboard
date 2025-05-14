'use client';

import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface User {
  _id: string;
  fullName: string;
  email: string;
  username: string;
}

interface Property {
  _id: string;
  name: string;
  sharePrice: number;
}

interface PendingShare {
  _id: string;
  user: User | string;
  property: Property | string;
  shares: number;
  totalCost: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function PendingSharesProcessor() {
  const [pendingShares, setPendingShares] = useState<PendingShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<{[key: string]: string}>({});
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPendingShares();
  }, []);

  const fetchPendingShares = async () => {
    try {
      setIsLoading(true);
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/pendingShares?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending shares');
      }
      
      const data = await response.json();
      setPendingShares(data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching pending shares:', err);
      setError('Error fetching pending shares');
      setIsLoading(false);
    }
  };

  const refuseShare = async (pendingShareId: string) => {
  try {
    setProcessingStatus(prev => ({ ...prev, [pendingShareId]: 'refusing' }));
    
    const response = await fetch(`/api/pendingShares/${pendingShareId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to refuse share');
    }
    
    setProcessingStatus(prev => ({ ...prev, [pendingShareId]: 'refused' }));
    
    setTimeout(() => {
      setPendingShares(prev => prev.filter(share => share._id !== pendingShareId));
      setProcessingStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[pendingShareId];
        return newStatus;
      });
    }, 2000);
    
  } catch (err) {
    console.error('Error refusing share:', err);
    setProcessingStatus(prev => ({ ...prev, [pendingShareId]: 'refuse-error' }));
    if (err instanceof Error) {
      alert(`Error: ${err.message}`);
    } else {
      alert('An unknown error occurred');
    }
  }
};

  // Helper function to safely display user information
  const displayUser = (user: User | string) => {
    if (typeof user === 'string') {
      return user;
    }
    // If it's an object, display the username or fullName
    return user.username || user.fullName || user.email || 'Unknown User';
  };

  // Helper function to safely display property information
  const displayProperty = (property: Property | string) => {
    if (typeof property === 'string') {
      return property;
    }
    // If it's an object, display the property name
    return property.name || 'Unknown Property';
  };

  const processShare = async (pendingShareId: string) => {
    try {
      setProcessingStatus(prev => ({ ...prev, [pendingShareId]: 'processing' }));
      
      const response = await fetch(`/api/pendingShares/${pendingShareId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process share');
      }
      
      setProcessingStatus(prev => ({ ...prev, [pendingShareId]: 'completed' }));
      
      // Remove the processed share from the list after a delay
      setTimeout(() => {
        setPendingShares(prev => prev.filter(share => share._id !== pendingShareId));
        setProcessingStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[pendingShareId];
          return newStatus;
        });
      }, 2000);
      
    } catch (err) {
      console.error('Error processing share:', err);
      setProcessingStatus(prev => ({ ...prev, [pendingShareId]: 'error' }));
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      } else {
        alert('An unknown error occurred');
      }
    }
  };

  // Filter pending shares based on search term
  const filteredShares = pendingShares.filter(share => {
    const userName = typeof share.user === 'string' 
      ? share.user.toLowerCase() 
      : (share.user.username || share.user.fullName || '').toLowerCase();
    
    const propertyName = typeof share.property === 'string' 
      ? share.property.toLowerCase() 
      : (share.property.name || '').toLowerCase();
    
    return userName.includes(searchTerm.toLowerCase()) || 
           propertyName.includes(searchTerm.toLowerCase());
  });

  if (isLoading) return <div className="p-4 text-center">Loading pending shares...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;

  return (
    <div className="mt-8">
      <div className="flex justify-between mb-4">
        <div className="flex gap-2 w-1/2">
          <input
            type="text"
            placeholder="Search by user or property..."
            className="border p-2 w-full rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={fetchPendingShares}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            title="Refresh data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {filteredShares.length === 0 ? (
        <div className="p-4 text-center bg-gray-50 rounded-lg">
          No pending share requests found
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shares</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredShares.map((share) => (
                <tr key={share._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{displayUser(share.user)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{displayProperty(share.property)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{share.shares.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">${share.totalCost.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(share.createdAt).toLocaleDateString()}
                  </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                    {processingStatus[share._id] === 'processing' ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Processing...
                        </span>
                    ) : processingStatus[share._id] === 'refusing' ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Refunding...
                        </span>
                    ) : processingStatus[share._id] === 'completed' ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Completed
                        </span>
                    ) : processingStatus[share._id] === 'refused' ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Refunded
                        </span>
                    ) : processingStatus[share._id] === 'error' ? (
                        <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Error
                        </span>
                        <button
                            onClick={() => processShare(share._id)}
                            className="text-blue-600 hover:text-blue-900"
                        >
                            Retry
                        </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                        <button
                            onClick={() => processShare(share._id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                        >
                            Approve
                        </button>
                        <button
                            onClick={() => refuseShare(share._id)}
                            className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                        >
                            Refuse
                        </button>
                        </div>
                    )}
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}