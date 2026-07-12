import React, { useState, useRef } from 'react';
import { tailorAPI } from '../services/api';
import { getImageUrl, debugImageUrl } from '../utils/imageUtils';
import toast from 'react-hot-toast';

interface PortfolioUploadProps {
  portfolioPhotos: string[];
  onPhotosUpdate: (photos: string[]) => void;
}

const PortfolioUpload: React.FC<PortfolioUploadProps> = ({
  portfolioPhotos,
  onPhotosUpdate
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      const response = await tailorAPI.uploadPortfolioPhoto(file);
      console.log('Upload response:', response);
      onPhotosUpdate(response.portfolio_photos);
      toast.success('Photo uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error(error.response?.data?.error || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async (photoIndex: number) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    setIsDeleting(photoIndex);
    try {
      const response = await tailorAPI.deletePortfolioPhoto(photoIndex);
      onPhotosUpdate(response.portfolio_photos);
      toast.success('Photo deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      toast.error(error.response?.data?.error || 'Failed to delete photo');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Portfolio Photos</h3>
        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Upload Photo'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="text-sm text-gray-600">
        <p>Upload photos of your work to showcase your skills to customers.</p>
        <p>Supported formats: JPEG, PNG, WebP. Maximum file size: 5MB.</p>
      </div>

      {portfolioPhotos.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolio photos</h3>
          <p className="text-gray-600 mb-4">Upload photos to showcase your work to customers.</p>
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload Your First Photo'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {portfolioPhotos.map((photo, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={getImageUrl(photo)}
                  alt={`Portfolio ${index + 1}`}
                  className="w-full h-full object-cover"
                  onLoad={() => debugImageUrl(photo)}
                  onError={(e) => {
                    console.error('Image failed to load:', photo, 'Resolved URL:', getImageUrl(photo));
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                  }}
                />
              </div>
              
              {/* Delete button overlay */}
              <button
                onClick={() => handleDeletePhoto(index)}
                disabled={isDeleting === index}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting === index ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
              
              {/* Photo number */}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {portfolioPhotos.length > 0 && (
        <div className="text-center">
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Add More Photos'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PortfolioUpload;
