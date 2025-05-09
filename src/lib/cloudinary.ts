// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Helper function to upload images to Cloudinary
export async function uploadToCloudinary(file: Buffer, contentType: string) {
  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: 'image',
          folder: 'properties',
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result?.secure_url || '');
        }
      )
      .end(file);
  });
}

// Helper function to delete images from Cloudinary
export async function deleteFromCloudinary(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}

// Extract public ID from Cloudinary URL
export function getPublicIdFromUrl(url: string): string {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const publicId = `properties/${filename.split('.')[0]}`;
  return publicId;
}