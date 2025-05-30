'use client';

import { useState, useEffect } from 'react';
import type { IUser } from '../models/User';

export const revalidate = 0;

export default function UsersSection() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [viewingIdUser, setViewingIdUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdatingVerification, setIsUpdatingVerification] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
      setIsLoading(false);
    } catch (err) {
      setError('Error fetching users');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const intervalId = setInterval(fetchUsers, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (updatedUser: IUser) => {
    try {
      const response = await fetch(`/api/users/${updatedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });

      if (!response.ok) throw new Error('Failed to update user');
      
      const data = await response.json();
      setUsers(users.map(user => user._id === data._id ? data : user));
      setEditingUser(null);
    } catch (err) {
      setError('Error updating user');
    }
  };

  const handleVerificationUpdate = async (status: 'verified' | 'rejected' | 'pending') => {
    if (!viewingIdUser) return;
    
    setIsUpdatingVerification(true);
    try {
      const response = await fetch(`/api/verifications/${viewingIdUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          rejectionReason: status === 'rejected' ? 'Verification revoked by administrator' : undefined 
        }),
      });

      if (!response.ok) throw new Error('Failed to update verification');

      const updatedUser = await response.json();
      setUsers(users.map(user => user._id === updatedUser._id ? updatedUser : user));
      setViewingIdUser(updatedUser);
      setIsUpdatingVerification(false);
    } catch (err) {
      setError('Error updating verification');
      setIsUpdatingVerification(false);
    }
  };

  if (isLoading) return <div className="loading-message p-4">Loading users...</div>;
  if (error) return <div className="error-message p-4 text-red-500">{error}</div>;

  return (
    <div className="users-section mt-8">
      <div className="search-container mb-4">
        <input
          type="text"
          placeholder="Search users..."
          className="users-search-input border p-2 w-full rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="users-table-container bg-white shadow overflow-hidden rounded-lg">
        <table className="users-table min-w-full divide-y divide-gray-200">
          <thead className="table-header bg-gray-50">
            <tr>
              <th className="table-header-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="table-header-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="table-header-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="table-header-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
              <th className="table-header-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="table-header-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={String(user._id)} className="table-row">
                <td className="table-cell px-6 py-4 whitespace-nowrap">{user.fullName}</td>
                <td className="table-cell px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="table-cell px-6 py-4 whitespace-nowrap">{user.username}</td>
                <td className="table-cell px-6 py-4 whitespace-nowrap">${typeof user.balance === 'number' ? user.balance.toFixed(2) : '0.00'}</td>
                <td className="table-cell px-6 py-4 whitespace-nowrap capitalize">{user.role}</td>
                <td className="table-cell px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="action-button edit-button text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setViewingIdUser(user)}
                    className="action-button view-button text-green-600 hover:text-green-900"
                  >
                    View ID
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="edit-modal-overlay fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center">
          <div className="edit-modal-content bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="modal-title text-lg font-medium mb-4">Edit User</h3>
            <EditForm
              user={editingUser}
              onClose={() => setEditingUser(null)}
              onSave={handleSave}
            />
          </div>
        </div>
      )}

      {viewingIdUser && (
        <div className="verification-modal-overlay fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center">
          <div className="verification-modal-content bg-white p-6 rounded-lg w-full max-w-3xl">
            <h3 className="modal-title text-lg font-medium mb-4">ID Verification Information</h3>
            <div className="verification-info-grid grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="info-label block text-sm font-medium text-gray-700">Full Name</label>
                <p className="info-value mt-1">{viewingIdUser.fullName}</p>
              </div>
              <div>
                <label className="info-label block text-sm font-medium text-gray-700">National ID</label>
                <p className="info-value mt-1">{viewingIdUser.idVerification?.nationalId || 'Not provided'}</p>
              </div>
              <div>
                <label className="info-label block text-sm font-medium text-gray-700">Phone Number</label>
                <p className="info-value mt-1">{viewingIdUser.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="info-label block text-sm font-medium text-gray-700">Verification Status</label>
                <div className="status-container mt-1 flex items-center gap-2">
                  <span className={`status-text capitalize ${
                    viewingIdUser.idVerification?.status === 'verified' ? 'text-green-600' :
                    viewingIdUser.idVerification?.status === 'rejected' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {viewingIdUser.idVerification?.status || 'Not submitted'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="verification-images-grid flex gap-4 mb-6">
              {viewingIdUser.idVerification?.frontId ? (
                <div className="image-container flex-1">
                  <label className="image-label block text-sm font-medium text-gray-700 mb-1">Front ID</label>
                  <img 
                    src={viewingIdUser.idVerification.frontId?.url.toString()}
                    className="id-image h-48 w-full object-contain border"
                    alt="Front ID"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="empty-image flex-1 border p-4 flex items-center justify-center bg-gray-50">
                  <p className="empty-text text-gray-500">No front ID image</p>
                </div>
              )}
              
              {viewingIdUser.idVerification?.backId ? (
                <div className="image-container flex-1">
                  <label className="image-label block text-sm font-medium text-gray-700 mb-1">Back ID</label>
                  <img 
                    src={viewingIdUser.idVerification.backId?.url.toString()}
                    className="id-image h-48 w-full object-contain border"
                    alt="Back ID"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="empty-image flex-1 border p-4 flex items-center justify-center bg-gray-50">
                  <p className="empty-text text-gray-500">No back ID image</p>
                </div>
              )}
              
              {viewingIdUser.idVerification?.selfie ? (
                <div className="image-container flex-1">
                  <label className="image-label block text-sm font-medium text-gray-700 mb-1">Selfie</label>
                  <img 
                    src={viewingIdUser.idVerification.selfie?.url.toString()}
                    className="id-image h-48 w-full object-contain border"
                    alt="Selfie"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="empty-image flex-1 border p-4 flex items-center justify-center bg-gray-50">
                  <p className="empty-text text-gray-500">No selfie image</p>
                </div>
              )}
            </div>

            <div className="verification-actions mb-6 border-t pt-4">
              <h4 className="actions-title text-md font-medium mb-2">Update Verification Status</h4>
              
              {viewingIdUser.idVerification?.status === 'rejected' && (
                <div className="rejection-reason mb-3">
                  <label className="reason-label block text-sm font-medium text-red-600 mb-1">Rejection Reason</label>
                  <p className="reason-text text-sm text-gray-800">{viewingIdUser.idVerification.rejectionReason || 'No reason provided'}</p>
                </div>
              )}
              
              <div className="action-buttons flex flex-col space-y-3">
                {viewingIdUser.idVerification?.status === 'rejected' && (
                  <button
                    onClick={() => handleVerificationUpdate('pending')}
                    disabled={isUpdatingVerification}
                    className="status-button pending-button px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
                  >
                    Reset to Pending
                  </button>
                )}

                {(viewingIdUser.idVerification?.status === 'pending' || !viewingIdUser.idVerification?.status) && (
                  <button
                    onClick={() => handleVerificationUpdate('verified')}
                    disabled={isUpdatingVerification}
                    className="status-button approve-button px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                  >
                    Approve Verification
                  </button>
                )}

                {viewingIdUser.idVerification?.status === 'verified' && (
                  <button
                    onClick={() => handleVerificationUpdate('rejected')}
                    disabled={isUpdatingVerification}
                    className="status-button reject-button px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                  >
                    Revoke Verification
                  </button>
                )}
              </div>
            </div>

            <div className="modal-actions flex justify-end">
              <button
                onClick={() => setViewingIdUser(null)}
                className="modal-close-button px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={isUpdatingVerification}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditForm({ user, onClose, onSave }: { user: IUser; onClose: () => void; onSave: (user: IUser) => void }) {
  const [formData, setFormData] = useState<IUser>(user);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value } as IUser);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  return (
    <form className="user-edit-form" onSubmit={handleSubmit}>
      <div className="form-fields-container space-y-4">
        <div className="form-field-group">
          <label className="form-label block text-sm font-medium text-gray-700">Full Name</label>
          <input
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="form-input mt-1 block w-full border rounded-md p-2"
          />
        </div>
        <div className="form-field-group">
          <label className="form-label block text-sm font-medium text-gray-700">Email</label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="form-input mt-1 block w-full border rounded-md p-2"
          />
        </div>
        <div className="form-field-group flex items-center">
          <input
            name="verified"
            type="checkbox"
            checked={formData.verified}
            onChange={handleChange}
            className="form-checkbox h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="form-checkbox-label ml-2 block text-sm text-gray-900">
            Verified
          </label>
        </div>
        <div className="form-field-group">
          <label className="form-label block text-sm font-medium text-gray-700">Username</label>
          <input
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="form-input mt-1 block w-full border rounded-md p-2"
          />
        </div>
        <div className="form-field-group">
          <label className="form-label block text-sm font-medium text-gray-700">Phone</label>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="form-input mt-1 block w-full border rounded-md p-2"
          />
        </div>
        <div className="form-field-group">
          <label className="form-label block text-sm font-medium text-gray-700">Balance</label>
          <input
            name="balance"
            type="number"
            value={formData.balance}
            onChange={handleChange}
            className="form-input mt-1 block w-full border rounded-md p-2"
          />
        </div>
        <div className="form-field-group">
          <label className="form-label block text-sm font-medium text-gray-700">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="form-select mt-1 block w-full border rounded-md p-2"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div className="form-actions-container mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="form-button cancel-button px-4 py-2 border rounded-md hover:bg-gray-50"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="form-button submit-button px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}