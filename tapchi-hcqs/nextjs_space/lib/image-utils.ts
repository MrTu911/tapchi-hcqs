
/**
 * Image utilities for handling S3 images
 */

import { getDownloadUrl } from './s3';

/**
 * Convert S3 key to accessible image URL
 * Uses the /api/images/proxy route for serving images
 */
export function getImageUrl(s3Key: string | null | undefined): string {
  if (!s3Key) {
    return '/images/placeholder.png'; // Fallback placeholder
  }

  // If already a full URL, return as is
  if (s3Key.startsWith('http://') || s3Key.startsWith('https://')) {
    return s3Key;
  }

  // Convert S3 key to proxy URL
  // Encode the key to handle special characters
  const encodedKey = encodeURIComponent(s3Key);
  return `/api/images/proxy?key=${encodedKey}`;
}

/**
 * Get multiple image URLs at once
 */
export function getImageUrls(s3Keys: (string | null | undefined)[]): string[] {
  return s3Keys.map(key => getImageUrl(key));
}

/**
 * Generate a signed URL directly (for API responses)
 * This should be used server-side only
 */
export async function getSignedImageUrl(
  s3Key: string | null | undefined,
  expiresIn: number = 3600
): Promise<string> {
  if (!s3Key) {
    return '/images/placeholder.png';
  }

  // If already a full URL, return as is
  if (s3Key.startsWith('http://') || s3Key.startsWith('https://')) {
    return s3Key;
  }

  // If it's a local path (starts with /), return as is
  if (s3Key.startsWith('/')) {
    return s3Key;
  }

  try {
    return await getDownloadUrl(s3Key, expiresIn);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return '/images/placeholder.png';
  }
}

/**
 * Add signed URLs to objects with image fields
 * Usage: await addSignedUrls(banners, ['imageUrl', 'thumbnailUrl'])
 */
export async function addSignedUrls<T extends Record<string, any>>(
  items: T[],
  imageFields: string[],
  expiresIn: number = 3600
): Promise<T[]> {
  const promises = items.map(async (item) => {
    const signedUrls: Record<string, string> = {};
    
    for (const field of imageFields) {
      const s3Key = item[field];
      if (s3Key) {
        signedUrls[`${field}Signed`] = await getSignedImageUrl(s3Key, expiresIn);
      }
    }
    
    return { ...item, ...signedUrls };
  });

  return Promise.all(promises);
}
