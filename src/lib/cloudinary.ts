import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image to Cloudinary
 * @param imageBuffer - The image buffer to upload
 * @param contentType - The content type of the image
 * @returns The URL of the uploaded image
 */
export async function uploadToCloudinary(
  buffer: Buffer, 
  contentType: string
): Promise<string> {
  // Create a base64 data URI for the image
  const dataUri = `data:${contentType};base64,${buffer.toString('base64')}`;
  
  // Upload to Cloudinary
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'properties',
    resource_type: 'auto', // Handle images and other file types
  });
  
  return result.secure_url;
}

/**
 * Upload a document to Cloudinary
 * @param fileBuffer - The document buffer to upload
 * @param contentType - The content type of the document
 * @param filename - Original filename
 * @returns Object containing URL and public ID of the uploaded document
 */
export async function uploadDocumentToCloudinary(
  fileBuffer: Buffer,
  contentType: string,
  filename: string
): Promise<{ url: string; publicId: string }> {
  // Create a base64 data URI for the document
  const dataUri = `data:${contentType};base64,${fileBuffer.toString('base64')}`;
  
  // Upload to Cloudinary with document options
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'property_documents',
    resource_type: 'auto', // Automatically detects file type
    public_id: `doc_${Date.now()}`, // Unique ID based on timestamp
  });
  
  return {
    url: result.secure_url,
    publicId: result.public_id
  };
}

/**
 * Delete an asset from Cloudinary
 * @param publicId - The public ID of the asset to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Delete a document from Cloudinary
 * @param publicId - The public ID of the document to delete
 */
export async function deleteDocumentFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
}