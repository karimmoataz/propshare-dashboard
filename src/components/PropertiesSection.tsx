'use client';

import { useState, useEffect } from 'react';
import type { IProperty } from '../models/Property';
import Image from 'next/image';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Updated interface to include images array
interface IPropertyWithImages extends IProperty {
  images: { url: string; publicId: string }[];
}

export default function PropertiesSection() {
  const [properties, setProperties] = useState<IPropertyWithImages[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProperty, setEditingProperty] = useState<IPropertyWithImages | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [replaceImages, setReplaceImages] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
      // Remove any existing images field (we'll append multiple files)
      formData.delete('images');
      
      // Append each image file individually
      for (const file of imageFiles) {
        formData.append('images', file);
      }
      
      const response = await fetch('/api/properties', {
        method: 'POST',
        body: formData,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add property');
      }
      
      const newProperty = await response.json();
      setProperties([...properties, newProperty]);
      setShowAddModal(false);
      setImageFiles([]);
      setImagePreviews([]);
      
      // Force a page refresh to ensure we get fresh data
      window.location.reload();
    } catch (err) {
      console.error('Error adding property:', err);
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      } else {
        setError('Error adding property');
      }
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
      // Add replace images flag
      formData.append('replaceImages', replaceImages.toString());
      
      // Remove any existing images field (we'll append multiple files)
      formData.delete('images');
      
      // Append each image file individually
      for (const file of imageFiles) {
        formData.append('images', file);
      }
      
      const response = await fetch(`/api/properties/${editingProperty._id}`, {
        method: 'PUT',
        body: formData,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update property');
      }
      
      const data = await response.json();
      setProperties(properties.map(p => p._id === data._id ? data : p));
      setEditingProperty(null);
      setImageFiles([]);
      setImagePreviews([]);
      setReplaceImages(false);
      
      // Force a page refresh to ensure we get fresh data
      window.location.reload();
    } catch (err) {
      console.error('Error updating property:', err);
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      } else {
        setError('Error updating property');
      }
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Store the files
    const newFiles = Array.from(files);
    setImageFiles(prevFiles => [...prevFiles, ...newFiles]);
    
    // Create previews for each file
    for (const file of newFiles) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemovePreview = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  const nextImage = (property: IPropertyWithImages) => {
    if (property.images && property.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = (property: IPropertyWithImages) => {
    if (property.images && property.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
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
                  {property.images && property.images.length > 0 ? (
                    <div className="relative">
                      <Image
                        width={64}
                        height={64}
                        src={property.images[currentImageIndex]?.url || '/placeholder.jpg'}
                        alt={property.name}
                        className="w-16 h-16 object-cover rounded"
                        loading="lazy"
                      />
                      {property.images.length > 1 && (
                        <div className="absolute -bottom-2 left-0 right-0 flex justify-center space-x-1">
                          <span className="text-xs bg-black bg-opacity-60 text-white px-1 rounded">
                            {currentImageIndex + 1}/{property.images.length}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded">
                      <span className="text-gray-400 text-xs">No image</span>
                    </div>
                  )}
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
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Add New Property</h3>
            <PropertyForm
              onSubmit={handleAddProperty}
              onClose={() => {
                setShowAddModal(false);
                setImageFiles([]);
                setImagePreviews([]);
              }}
              imagePreviews={imagePreviews}
              onImagesChange={handleImagesChange}
              onRemovePreview={handleRemovePreview}
              replaceImages={replaceImages}
              setReplaceImages={setReplaceImages}
            />
          </div>
        </div>
      )}
      {editingProperty && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Edit Property</h3>
            <PropertyForm
              onSubmit={handleUpdateProperty}
              onClose={() => {
                setEditingProperty(null);
                setImageFiles([]);
                setImagePreviews([]);
                setReplaceImages(false);
              }}
              initialData={editingProperty}
              imagePreviews={imagePreviews}
              onImagesChange={handleImagesChange}
              onRemovePreview={handleRemovePreview}
              existingImages={editingProperty.images}
              replaceImages={replaceImages}
              setReplaceImages={setReplaceImages}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface PropertyFormProps {
  onSubmit: (formData: FormData) => void;
  onClose: () => void;
  initialData?: IPropertyWithImages;
  imagePreviews: string[];
  onImagesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePreview: (index: number) => void;
  existingImages?: { url: string; publicId: string }[];
  replaceImages: boolean;
  setReplaceImages: (value: boolean) => void;
}

function PropertyForm({ 
  onSubmit,
  onClose,
  initialData,
  imagePreviews,
  onImagesChange,
  onRemovePreview,
  existingImages = [],
  replaceImages,
  setReplaceImages
}: PropertyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sharePrice, setSharePrice] = useState(
    initialData?.sharePrice || 0
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const nextImage = () => {
    if (existingImages && existingImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % existingImages.length);
    }
  };

  const prevImage = () => {
    if (existingImages && existingImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + existingImages.length) % existingImages.length);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4 order-2 md:order-1">
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
            <label className="block text-sm font-medium text-gray-700">Monthly Rent ($) *</label>
            <input
              name="monthlyRent"
              type="number"
              defaultValue={initialData?.monthlyRent || ''}
              className="mt-1 block w-full border rounded-md p-2"
              required
            />
          </div>

          {initialData && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Balance</label>
                <input
                  value={initialData.balance.toFixed(2)}
                  className="mt-1 block w-full border rounded-md p-2 bg-gray-100"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Add to Balance ($)</label>
                <input
                  name="addToBalance"
                  type="number"
                  defaultValue="0"
                  className="mt-1 block w-full border rounded-md p-2"
                />
              </div>
            </>
          )}

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

        <div className="space-y-4 order-1 md:order-2 mb-6 md:mb-0">
          <div>
            <label className="block text-sm font-medium text-gray-700">Image(s)</label>
            <input
              type="file"
              name="images"
              onChange={onImagesChange}
              accept="image/*"
              className="mt-1 block w-full"
              required={!initialData && imagePreviews.length === 0}
              multiple
            />
            
            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 mb-1">New Images:</p>
                <div className="flex flex-wrap gap-2">
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative">
                      <Image 
                        src={preview} 
                        alt="Preview"
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => onRemovePreview(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Existing Images */}
            {initialData && existingImages.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium text-gray-700">Current Images:</p>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={replaceImages}
                      onChange={(e) => setReplaceImages(e.target.checked)}
                      className="mr-2"
                    />
                    Replace all current images
                  </label>
                </div>
                
                <div className="relative border rounded-md p-2">
                  {existingImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white w-6 h-6 flex items-center justify-center rounded-full"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white w-6 h-6 flex items-center justify-center rounded-full"
                      >
                        →
                      </button>
                    </>
                  )}
                  
                  <div className="flex justify-center">
                    <Image 
                      src={existingImages[currentImageIndex]?.url || '/placeholder.jpg'}
                      alt="Current"
                      width={300}
                      height={200} 
                      className="h-40 object-contain"
                    />
                  </div>
                  
                  {existingImages.length > 1 && (
                    <div className="text-center mt-1 text-sm text-gray-500">
                      Image {currentImageIndex + 1} of {existingImages.length}
                    </div>
                  )}
                </div>
              </div>
            )}
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