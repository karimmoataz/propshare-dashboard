'use client';

import { useState, useEffect } from 'react';
import { IWithdrawal } from '../models/Withdrawal';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function WithdrawalsSection() {
  const [withdrawals, setWithdrawals] = useState<IWithdrawal[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<IWithdrawal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch('/api/withdrawals', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch withdrawals');
      const data = await response.json();
      setWithdrawals(data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
      setError('Error fetching withdrawals');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/withdrawals/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Approval failed');
      }

      await fetchWithdrawals();
      alert('Withdrawal approved successfully');
    } catch (error) {
      console.error('Approval error:', error);
      alert(error instanceof Error ? error.message : 'Approval failed');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/withdrawals/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Rejection failed');
      }

      await fetchWithdrawals();
      alert('Withdrawal rejected successfully');
    } catch (error) {
      console.error('Rejection error:', error);
      alert(error instanceof Error ? error.message : 'Rejection failed');
    }
  };

  // Helper function to safely display user information
  const getUserDisplay = (withdrawal: IWithdrawal) => {
    // Check if user exists and has valid properties
    if (
      withdrawal.userId && 
      typeof withdrawal.userId === 'object' && 
      withdrawal.userId !== null &&
      'fullName' in withdrawal.userId && 
      'email' in withdrawal.userId &&
      withdrawal.userId.fullName && 
      withdrawal.userId.email
    ) {
      return `${withdrawal.userId.fullName} (${withdrawal.userId.email})`;
    }
    return 'User account deleted';
  };

  if (isLoading) return <div className="p-4">Loading withdrawals...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="mt-8">
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {withdrawals.map((withdrawal) => (
              <tr key={(withdrawal._id as string).toString()}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getUserDisplay(withdrawal)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${withdrawal.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {withdrawal.method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    withdrawal.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {withdrawal.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button
                    onClick={() => setSelectedWithdrawal(withdrawal)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Details
                  </button>
                  {withdrawal.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove((withdrawal._id as string).toString())}
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject((withdrawal._id as string).toString())}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Withdrawal Details</h3>
            <div className="space-y-2">
              <p><strong>User:</strong> {getUserDisplay(selectedWithdrawal)}</p>
              <p><strong>Amount:</strong> ${selectedWithdrawal.amount.toFixed(2)}</p>
              <p><strong>Method:</strong> {selectedWithdrawal.method}</p>
              {selectedWithdrawal.method === 'Local Bank Transfer' && (
                <>
                  <p><strong>Bank Name:</strong> {selectedWithdrawal.details?.bankName || 'N/A'}</p>
                  <p><strong>Account Number:</strong> {selectedWithdrawal.details?.accountNumber || 'N/A'}</p>
                  <p><strong>Receiver Name:</strong> {selectedWithdrawal.details?.receiverName || 'N/A'}</p>
                </>
              )}
              {selectedWithdrawal.method === 'E-Wallet' && (
                <>
                  <p><strong>Provider:</strong> {selectedWithdrawal.details?.provider || 'N/A'}</p>
                  <p><strong>Mobile Number:</strong> {selectedWithdrawal.details?.accountNumber || 'N/A'}</p>
                </>
              )}
              {selectedWithdrawal.method === 'InstaPay' && (
                <p><strong>InstaPay ID:</strong> {selectedWithdrawal.details?.instapayId || 'N/A'}</p>
              )}
              <p><strong>Requested At:</strong> {new Date(selectedWithdrawal.createdAt).toLocaleString()}</p>
              {selectedWithdrawal.status !== 'pending' && (
                <p><strong>Processed At:</strong> {selectedWithdrawal.processedAt ? new Date(selectedWithdrawal.processedAt).toLocaleString() : 'N/A'}</p>
              )}
              {selectedWithdrawal.notes && (
                <p><strong>Notes:</strong> {selectedWithdrawal.notes}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedWithdrawal(null)}
              className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}