'use client';

import { useState, useEffect } from 'react';
import { INotification } from '../models/Notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface NotificationUser {
  _id: string;
  fullName: string;
  email: string;
}

interface NotificationProperty {
  _id: string;
  name: string;
}

interface NotificationWithPopulated extends Omit<INotification, 'userId' | 'propertyId'> {
  _id: string;
  userId?: NotificationUser;
  propertyId?: NotificationProperty;
}

interface PaginationInfo {
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
}

export default function NotificationsSection() {
  const [notifications, setNotifications] = useState<NotificationWithPopulated[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<NotificationWithPopulated | null>(null);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    isGlobal: true,
    propertyId: '',
    userIds: [] as string[]
  });
  const [showNewNotificationForm, setShowNewNotificationForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'global' | 'user'>('all');
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 50,
    skip: 0,
    hasMore: false
  });
  const [users, setUsers] = useState<NotificationUser[]>([]);
  const [properties, setProperties] = useState<NotificationProperty[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/notifications?status=${statusFilter}&limit=${pagination.limit}&skip=${pagination.skip}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data.notifications);
      setPagination(data.pagination);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Error fetching notifications');
      setIsLoading(false);
    }
  };

  // Mock fetch users for this demo (in real app, you'd fetch from your API)
  const fetchUsers = async () => {
    try {
      // Replace with actual API endpoint when available
      const response = await fetch('/api/users', {
        cache: 'no-store',
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Mock fetch properties for this demo (in real app, you'd fetch from your API)
  const fetchProperties = async () => {
    try {
      // Replace with actual API endpoint when available
      const response = await fetch('/api/properties', {
        cache: 'no-store',
      });
      
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      setProperties(data);
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
    fetchProperties();
  }, [statusFilter, pagination.skip]);

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNotification),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create notification');
      }

      await fetchNotifications();
      setShowNewNotificationForm(false);
      setNewNotification({
        title: '',
        message: '',
        isGlobal: true,
        propertyId: '',
        userIds: []
      });
      alert('Notification created successfully');
    } catch (error) {
      console.error('Create notification error:', error);
      alert(error instanceof Error ? error.message : 'Failed to create notification');
    }
  };

  const handleUpdateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotification) return;

    try {
      const response = await fetch(`/api/notifications/${selectedNotification._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: selectedNotification.title,
          message: selectedNotification.message
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Update failed');
      }

      await fetchNotifications();
      setIsEditing(false);
      alert('Notification updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      alert(error instanceof Error ? error.message : 'Update failed');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      await fetchNotifications();
      if (selectedNotification && selectedNotification._id === id) {
        setSelectedNotification(null);
      }
      alert('Notification deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const handleSendPushNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send push notification');
      }

      const result = await response.json();
      alert(`Push notification sent to ${result.sent} of ${result.total} recipients`);
    } catch (error) {
      console.error('Send push notification error:', error);
      alert(error instanceof Error ? error.message : 'Failed to send push notification');
    }
  };

  const handleUserSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setNewNotification({
      ...newNotification,
      userIds: selectedOptions
    });
  };

  // Calculate what page we're on for pagination display
  const currentPage = Math.floor(pagination.skip / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Helper function to safely display user information
  const getUserDisplay = (notification: NotificationWithPopulated) => {
    if (notification.isGlobal) return 'Global';
    
    if (
      notification.userId && 
      'fullName' in notification.userId && 
      'email' in notification.userId
    ) {
      return `${notification.userId.fullName} (${notification.userId.email})`;
    }
    return 'User unavailable';
  };

  // Helper function to safely display property information
  const getPropertyDisplay = (notification: NotificationWithPopulated) => {
    if (!notification.propertyId) return 'N/A';
    
    if ('name' in notification.propertyId) {
      return notification.propertyId.name;
    }
    return 'Property unavailable';
  };

  if (isLoading && notifications.length === 0) return <div className="p-4">Loading notifications...</div>;
  if (error && notifications.length === 0) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <select 
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'global' | 'user');
              setPagination({...pagination, skip: 0}); // Reset to first page when filter changes
            }}
            className="border rounded px-2 py-1"
          >
            <option value="all">All Notifications</option>
            <option value="global">Global Only</option>
            <option value="user">User Specific</option>
          </select>
          <button
            onClick={() => setShowNewNotificationForm(true)}
            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
          >
            New Notification
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {notifications.map((notification) => (
              <tr key={notification._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {notification.title.length > 30 
                    ? `${notification.title.substring(0, 30)}...` 
                    : notification.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {notification.message.length > 30 
                    ? `${notification.message.substring(0, 30)}...` 
                    : notification.message}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    notification.isGlobal ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {notification.isGlobal ? 'Global' : 'User Specific'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getUserDisplay(notification)}
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap">
                  {getPropertyDisplay(notification)}
                </td> */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button
                    onClick={() => {
                      setSelectedNotification(notification);
                      setIsEditing(false);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => handleSendPushNotification(notification._id)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Send Push
                  </button>
                  <button
                    onClick={() => handleDeleteNotification(notification._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination controls */}
        {pagination.total > 0 && (
          <div className="flex justify-between items-center px-6 py-3 border-t">
            <div>
              Showing {pagination.skip + 1} to {Math.min(pagination.skip + pagination.limit, pagination.total)} of {pagination.total} notifications
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination({...pagination, skip: Math.max(0, pagination.skip - pagination.limit)})}
                disabled={pagination.skip === 0}
                className={`px-3 py-1 rounded ${pagination.skip === 0 ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({...pagination, skip: pagination.skip + pagination.limit})}
                disabled={!pagination.hasMore}
                className={`px-3 py-1 rounded ${!pagination.hasMore ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Notification Form Modal */}
      {showNewNotificationForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Create New Notification</h3>
            <form onSubmit={handleCreateNotification}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={newNotification.isGlobal ? 'global' : 'user'}
                    onChange={(e) => setNewNotification({
                      ...newNotification,
                      isGlobal: e.target.value === 'global',
                      userIds: e.target.value === 'global' ? [] : newNotification.userIds
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="global">Global (All Users)</option>
                    <option value="user">Specific Users</option>
                  </select>
                </div>

                {!newNotification.isGlobal && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Users</label>
                    <select
                      multiple
                      value={newNotification.userIds}
                      onChange={handleUserSelectionChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-32"
                    >
                      {users.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.fullName} ({user.email})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple users</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Property (Optional)</label>
                  <select
                    value={newNotification.propertyId}
                    onChange={(e) => setNewNotification({
                      ...newNotification,
                      propertyId: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="">None</option>
                    {properties.map(property => (
                      <option key={property._id} value={property._id}>{property.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({
                      ...newNotification,
                      title: e.target.value
                    })}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({
                      ...newNotification,
                      message: e.target.value
                    })}
                    required
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewNotificationForm(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Create Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View/Edit Notification Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              {isEditing ? 'Edit Notification' : 'Notification Details'}
            </h3>
            
            {isEditing ? (
              <form onSubmit={handleUpdateNotification}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      value={selectedNotification.title}
                      onChange={(e) => setSelectedNotification({
                        ...selectedNotification,
                        title: e.target.value
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Message</label>
                    <textarea
                      value={selectedNotification.message}
                      onChange={(e) => setSelectedNotification({
                        ...selectedNotification,
                        message: e.target.value
                      })}
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="space-y-2">
                  <p><strong>Type:</strong> {selectedNotification.isGlobal ? 'Global' : 'User Specific'}</p>
                  <p><strong>Recipient:</strong> {getUserDisplay(selectedNotification)}</p>
                  <p><strong>Property:</strong> {getPropertyDisplay(selectedNotification)}</p>
                  <p><strong>Title:</strong> {selectedNotification.title}</p>
                  <p><strong>Message:</strong> {selectedNotification.message}</p>
                  <p><strong>Created:</strong> {new Date(selectedNotification.createdAt).toLocaleString()}</p>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleSendPushNotification(selectedNotification._id)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Send Push
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