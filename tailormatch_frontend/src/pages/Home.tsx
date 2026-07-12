import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { shopsAPI } from '../services/api';
import { TailorProfile } from '../types';
import MapView from '../components/MapView';
import toast from 'react-hot-toast';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { latitude, longitude, error: locationError } = useGeolocation();
  const [nearbyTailors, setNearbyTailors] = useState<TailorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTailor, setSelectedTailor] = useState<TailorProfile | null>(null);

  useEffect(() => {
    if (latitude && longitude) {
      loadNearbyTailors();
    }
  }, [latitude, longitude]);

  const loadNearbyTailors = async () => {
    if (!latitude || !longitude) return;

    setIsLoading(true);
    try {
      const tailors = await shopsAPI.getNearby(latitude, longitude, 10);
      setNearbyTailors(tailors);
    } catch (error) {
      toast.error('Failed to load nearby tailors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTailorSelect = (tailor: TailorProfile) => {
    setSelectedTailor(tailor);
  };

  if (user?.is_tailor) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600 mb-6">
            Manage your tailoring business and serve your customers.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                New Requests
              </h3>
              <p className="text-blue-700">
                Check for new tailoring requests from customers
              </p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Active Orders
              </h3>
              <p className="text-green-700">
                Manage your current tailoring projects
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Profile
              </h3>
              <p className="text-blue-700">
                Update your shop information and portfolio
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Welcome to TailorMatch, {user?.name}!
        </h1>
        <p className="text-gray-600 mb-6">
          Find nearby tailoring shops and get custom clothing made just for you.
        </p>
      </div>

      {locationError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Location Access Required</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{locationError}</p>
                <p className="mt-1">Please enable location access to find nearby tailors.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              Nearby Tailoring Shops
            </h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <MapView
                tailors={nearbyTailors}
                onTailorSelect={handleTailorSelect}
                center={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
                showUserLocation={!!(latitude && longitude)}
                userLocation={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
                className="h-64 w-full"
              />
            )}
          </div>
        </div>

        <div className="card-mobile mobile-card-hover">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            
            <div className="space-y-3 sm:space-y-4">
              <Link 
                to="/create-request"
                className="btn-mobile block w-full bg-blue-600 text-white hover:bg-blue-700 text-center mobile-focus"
              >
                Create New Request
              </Link>
              
              <Link 
                to="/tailors"
                className="btn-mobile block w-full bg-blue-600 text-white hover:bg-blue-700 text-center mobile-focus"
              >
                Find Tailors
              </Link>
              
              <Link 
                to="/requests"
                className="btn-mobile block w-full bg-gray-600 text-white hover:bg-gray-700 text-center mobile-focus"
              >
                View My Requests
              </Link>
              
              <Link 
                to="/notifications"
                className="btn-mobile block w-full bg-green-600 text-white hover:bg-green-700 text-center mobile-focus"
              >
                Notifications
              </Link>
            </div>
          </div>
        </div>
      </div>

      {selectedTailor && (
        <div className="card-mobile mobile-card-hover mobile-slide-up">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            Selected Tailor: {selectedTailor.shop_name}
          </h3>
          
          {/* Store Picture */}
          {selectedTailor.store_picture && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Store Picture</h4>
              <div className="relative">
                <img
                  src={selectedTailor.store_picture.startsWith('http') ? selectedTailor.store_picture : `http://localhost:8000${selectedTailor.store_picture}`}
                  alt={`${selectedTailor.shop_name} store`}
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">About</h4>
              <p className="text-gray-600 mb-4">{selectedTailor.bio}</p>
              
              <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTailor.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Rating</h4>
              <div className="flex items-center mb-4">
                <span className="text-2xl font-bold text-gray-900">
                  {selectedTailor.rating.toFixed(1)}
                </span>
                <span className="ml-2 text-gray-600">
                  ({selectedTailor.total_reviews} reviews)
                </span>
              </div>
              
              <h4 className="font-medium text-gray-900 mb-2">Address</h4>
              <p className="text-gray-600">{selectedTailor.address}</p>
              
              {selectedTailor.distance && (
                <p className="text-sm text-gray-500 mt-2">
                  {selectedTailor.distance.toFixed(1)} km away
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
