/**
 * Utility function to get the full image URL
 * Handles both relative and absolute URLs
 */
export const getImageUrl = (imagePath: string): string => {
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it starts with /media/, it's a relative path from the Django server
  if (imagePath.startsWith('/media/')) {
    return `http://localhost:8000${imagePath}`;
  }
  
  // If it doesn't start with /, add /media/ prefix
  if (!imagePath.startsWith('/')) {
    return `http://localhost:8000/media/${imagePath}`;
  }
  
  // Default case: prepend localhost:8000
  return `http://localhost:8000${imagePath}`;
};

/**
 * Debug function to log image URL resolution
 */
export const debugImageUrl = (imagePath: string): void => {
  console.log('Image URL Debug:', {
    original: imagePath,
    resolved: getImageUrl(imagePath)
  });
};
