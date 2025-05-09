'use client';

import { useState, useEffect } from 'react';
import type { IProperty } from '../models/Property';
import Image from 'next/image';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function PropertiesSection() {
  const [properties, setProperties] = useState<IProperty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProperty, setEditingProperty] = useState<IProperty | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchProperties = async () => {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/properties?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      setProperties(data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Error fetching properties');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddProperty = async (formData: FormData) => {
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        body: formData,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (!response.ok) throw new Error('Failed to add property');
      
      const newProperty = await response.json();
      setProperties([...properties, newProperty]);
      setShowAddModal(false);
      setImagePreview(null);
      
      // Force a page refresh to ensure we get fresh data
      window.location.reload();
    } catch (err) {
      setError('Error adding property');
    }
  };
  
  const handleDeleteProperty = async (propertyId: string) => {
    if (!propertyId) return;
    
    // Show confirmation dialog
    const confirmDelete = window.confirm("Are you sure you want to delete this property? This action cannot be undone.");
    
    if (!confirmDelete) return;
    
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        cache: 'no-store',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete property');
      }
      
      setProperties(properties.filter(prop => prop._id !== propertyId));
      alert('Property deleted successfully');
      
      // Force a page refresh to ensure we get fresh data
      window.location.reload();
    } catch (error) {
      console.error('Error deleting property:', error);
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('An unknown error occurred');
      }
    }
  };

  const handleUpdateProperty = async (formData: FormData) => {
    if (!editingProperty) return;

    try {
      const response = await fetch(`/api/properties/${editingProperty._id}`, {
        method: 'PUT',
        body: formData,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (!response.ok) throw new Error('Failed to update property');
      
      const data = await response.json();
      setProperties(properties.map(p => p._id === data._id ? data : p));
      setEditingProperty(null);
      setImagePreview(null);
      
      // Force a page refresh to ensure we get fresh data
      window.location.reload();
    } catch (err) {
      setError('Error updating property');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) return <div className="p-4">Loading properties...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="mt-8">
      <div className="flex justify-between mb-4">
        <div className="flex gap-2 w-1/2">
          <input
            type="text"
            placeholder="Search properties..."
            className="border p-2 w-full rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={fetchProperties}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            title="Refresh data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Add Property
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shares</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Share Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProperties.map((property) => (
              <tr key={property._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Image
                    width={64}
                    height={64}
                    src={`/api/properties/image/${property._id}?t=${new Date().getTime()}`}
                    alt={property.name}
                    className="w-16 h-16 object-cover rounded"
                    loading="lazy"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{property.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${property.currentPrice.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {property.numberOfShares.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${property.sharePrice.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {property.availableShares.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => setEditingProperty(property)}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProperty(property._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Add New Property</h3>
            <PropertyForm
              onSubmit={handleAddProperty}
              onClose={() => {
                setShowAddModal(false);
                setImagePreview(null);
              }}
              imagePreview={imagePreview}
              onImageChange={handleImageChange}
            />
          </div>
        </div>
      )}
      {editingProperty && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Edit Property</h3>
            <PropertyForm
              onSubmit={handleUpdateProperty}
              onClose={() => {
                setEditingProperty(null);
                setImagePreview(null);
              }}
              initialData={editingProperty}
              imagePreview={imagePreview}
              onImageChange={handleImageChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PropertyForm({ 
  onSubmit,
  onClose,
  initialData,
  imagePreview,
  onImageChange
}: { 
  onSubmit: (formData: FormData) => void;
  onClose: () => void;
  initialData?: IProperty;
  imagePreview?: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sharePrice, setSharePrice] = useState(
    initialData?.sharePrice || 0
  );

  const calculateSharePrice = (currentPrice: string, shares: string) => {
    const price = parseFloat(currentPrice);
    const shareCount = parseFloat(shares);
    if (!isNaN(price) && !isNaN(shareCount) && shareCount > 0) {
      setSharePrice(price / shareCount);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    if (initialData) {
      formData.append('_id', initialData._id as string);
    }
    
    await onSubmit(formData);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
          <label className="block text-sm font-medium text-gray-700">Image</label>
            <input
              type="file"
              name="image"
              onChange={onImageChange}
              accept="image/*"
              className="mt-1 block w-full"
              required={!initialData}
            />
            {imagePreview && (
              <Image 
                src={imagePreview} 
                alt="Preview"
                width={200}
                height={200}
                className="mt-2 w-32 h-32 object-cover rounded"
                loading="lazy"
              />
            )}
            {initialData && !imagePreview && (
              <Image 
                src={`/api/properties/image/${initialData._id}?t=${new Date().getTime()}`} 
                alt="Current" 
                width={200}
                height={200}
                className="mt-2 w-32 h-32 object-cover rounded"
                loading="lazy"
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              name="name"
              defaultValue={initialData?.name || ''}
              className="mt-1 block w-full border rounded-md p-2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Price ($) *</label>
              <input
                name="currentPrice"
                type="number"
                defaultValue={initialData?.currentPrice || ''}
                className="mt-1 block w-full border rounded-md p-2"
                required
                onChange={(e) => calculateSharePrice(
                  e.target.value, 
                  (document.querySelector('input[name="numberOfShares"]') as HTMLInputElement)?.value
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Total Shares *</label>
              <input
                name="numberOfShares"
                type="number"
                defaultValue={initialData?.numberOfShares || ''}
                className="mt-1 block w-full border rounded-md p-2"
                required
                onChange={(e) => calculateSharePrice(
                  (document.querySelector('input[name="currentPrice"]') as HTMLInputElement)?.value,
                  e.target.value
                )}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Share Price</label>
            <input
              value={sharePrice.toFixed(2)}
              className="mt-1 block w-full border rounded-md p-2 bg-gray-100"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location *</label>
            <input
              name="location"
              defaultValue={initialData?.location || ''}
              className="mt-1 block w-full border rounded-md p-2"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Area (M&sup2;) *</label>
              <input
                name="area"
                type="number"
                defaultValue={initialData?.area || ''}
                className="mt-1 block w-full border rounded-md p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Floors *</label>
              <input
                name="floors"
                type="number"
                defaultValue={initialData?.floors || ''}
                className="mt-1 block w-full border rounded-md p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Rooms *</label>
              <input
                name="rooms"
                type="number"
                defaultValue={initialData?.rooms || ''}
                className="mt-1 block w-full border rounded-md p-2"
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}