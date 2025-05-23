'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface User {
  _id: string;
  fullName: string;
  username: string;
  email: string;
}

interface Property {
  _id: string;
  name: string;
  sharePrice: number;
}

interface ShareSale {
  _id: string;
  user: User;
  property: Property;
  shares: number;
  totalValue: number;
  createdAt: string;
  status: string;
}

export default function ShareSalesApproval() {
  const [sales, setSales] = useState<ShareSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string[]>([]);

  const fetchSales = async () => {
    try {
      const res = await fetch('/api/ShareSale');
      const data = await res.json();
      setSales(data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleApproval = async (saleId: string) => {
    setProcessing(prev => [...prev, saleId]);
    try {
      const res = await fetch(`/api/ShareSale/${saleId}`, { method: 'POST' });
      if (!res.ok) throw new Error('Approval failed');
      setSales(prev => prev.filter(s => s._id !== saleId));
      toast.success('Sale approved successfully');
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve sale');
    } finally {
      setProcessing(prev => prev.filter(id => id !== saleId));
    }
  };

  const handleRejection = async (saleId: string) => {
    setProcessing(prev => [...prev, saleId]);
    try {
      const res = await fetch(`/api/ShareSale/${saleId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Rejection failed');
      setSales(prev => prev.filter(s => s._id !== saleId));
      toast.success('Sale rejected successfully');
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject sale');
    } finally {
      setProcessing(prev => prev.filter(id => id !== saleId));
    }
  };

  if (loading) return <div className="p-4 text-center">Loading share sales...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      
      {sales.length === 0 ? (
        <div className="text-center text-gray-500">No pending share sales</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Property</th>
                <th className="text-left p-3">Shares</th>
                <th className="text-left p-3">Value</th>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{sale.user.fullName}</td>
                  <td className="p-3">{sale.property.name}</td>
                  <td className="p-3">{sale.shares.toLocaleString()}</td>
                  <td className="p-3">${sale.totalValue.toLocaleString()}</td>
                  <td className="p-3">
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 space-x-2">
                    {processing.includes(sale._id) ? (
                      <span className="text-gray-500">Processing...</span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApproval(sale._id)}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejection(sale._id)}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
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
      )}
    </div>
  );
}