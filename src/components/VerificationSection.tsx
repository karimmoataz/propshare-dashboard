'use client';

import { useState, useEffect } from 'react';
import type { IUser } from '../models/User';

export default function VerificationSection() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const fetchPendingVerifications = async () => {
      try {
        const response = await fetch('/api/verifications');
        if (!response.ok) throw new Error('Failed to fetch verifications');
        const data = await response.json();
        setUsers(data);
        setIsLoading(false);
      } catch (err) {
        setError('Error fetching verifications');
        setIsLoading(false);
      }
    };
    fetchPendingVerifications();
  }, []);

  const handleVerification = async (status: 'verified' | 'rejected') => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/verifications/${selectedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          rejectionReason: status === 'rejected' ? rejectionReason : undefined 
        }),
      });

      if (!response.ok) throw new Error('Failed to update verification');

      const updatedUser = await response.json();
      setUsers(users.map(user => user._id === updatedUser._id ? updatedUser : user));
      setSelectedUser(null);
      setRejectionReason('');
    } catch (err) {
      setError('Error updating verification');
    }
  };

  if (isLoading) return <div className="p-4">Loading verifications...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="mt-8">
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">National ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={String(user._id)}>
                <td className="px-6 py-4">
                  <div className="font-medium">{user.fullName}</div>
                  <div className="text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4">{user.idVerification?.nationalId}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-4">
                    {user.idVerification?.frontId && (
                      <img 
                        src={`data:${user.idVerification.frontId.contentType};base64,${user.idVerification.frontId.data}`}
                        className="h-20 w-32 object-cover border"
                        alt="Front ID"
                      />
                    )}
                    {user.idVerification?.backId && (
                      <img 
                        src={`data:${user.idVerification.backId.contentType};base64,${user.idVerification.backId.data}`}
                        className="h-20 w-32 object-cover border"
                        alt="Back ID"
                      />
                    )}
                    {user.idVerification?.selfie && (
                      <img 
                        src={`data:${user.idVerification.selfie.contentType};base64,${user.idVerification.selfie.data}`}
                        className="h-20 w-32 object-cover border"
                        alt="Selfie"
                      />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full m-96">
            <h3 className="text-lg font-medium mb-4">Verify Identity</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">National ID</label>
                <p className="mt-1">{selectedUser.idVerification?.nationalId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 capitalize">{selectedUser.idVerification?.status}</p>
              </div>
            </div>
            
            <div className="flex gap-4 mb-6">
              {selectedUser.idVerification?.frontId && (
                <img 
                  src={`data:${selectedUser.idVerification.frontId.contentType};base64,${selectedUser.idVerification.frontId.data}`}
                  className="h-48 w-full object-contain border"
                  alt="Front ID"
                />
              )}
              {selectedUser.idVerification?.backId && (
                <img 
                  src={`data:${selectedUser.idVerification.backId.contentType};base64,${selectedUser.idVerification.backId.data}`}
                  className="h-48 w-full object-contain border"
                  alt="Back ID"
                />
              )}
              {selectedUser.idVerification?.selfie && (
                <img 
                  src={`data:${selectedUser.idVerification.selfie.contentType};base64,${selectedUser.idVerification.selfie.data}`}
                  className="h-48 w-full object-contain border"
                  alt="Selfie"
                />
              )}
            </div>

            {selectedUser.idVerification?.status === 'pending' && (
              <div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleVerification('rejected')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleVerification('verified')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}