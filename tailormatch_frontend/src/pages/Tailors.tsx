import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useGeolocation } from '../hooks/useGeolocation';
import { shopsAPI, reviewsAPI } from '../services/api';
import { TailorProfile, Review } from '../types';
import MapView from '../components/MapView';
import PortfolioViewer from '../components/PortfolioViewer';
import ReviewsDisplay from '../components/ReviewsDisplay';
import toast from 'react-hot-toast';

const Tailors: React.FC = () => {
  const { latitude, longitude, error: locationError } = useGeolocation();
  const [nearbyTailors, setNearbyTailors] = useState<TailorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTailor, setSelectedTailor] = useState<TailorProfile | null>(null);
  const [searchRadius, setSearchRadius] = useState(10);
  const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance');
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (latitude && longitude) {
      loadNearbyTailors();
    }
  }, [latitude, longitude, searchRadius]);

  const loadNearbyTailors = async () => {
    if (!latitude || !longitude) return;

    setIsLoading(true);
    try {
      const tailors = await shopsAPI.getNearby(latitude, longitude, searchRadius);
      setNearbyTailors(tailors);
    } catch (error) {
      toast.error('Failed to load nearby tailors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTailorSelect = (tailor: TailorProfile) => {
    setSelectedTailor(tailor);
    loadReviews(tailor.id);
  };

  const loadReviews = async (tailorId: number) => {
    setIsLoadingReviews(true);
    try {
      const reviewsData = await reviewsAPI.getByTailor(tailorId);
      console.log('Reviews API response:', reviewsData);
      // Ensure we always set an array
      const safeReviews = Array.isArray(reviewsData) ? reviewsData : [];
      console.log('Setting reviews to:', safeReviews);
      setReviews(safeReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
      setReviews([]); // Set empty array on error
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleViewPortfolio = async () => {
    if (!selectedTailor) return;

    setIsLoadingPortfolio(true);
    try {
      const portfolioData = await shopsAPI.getPortfolio(selectedTailor.id);
      setPortfolioPhotos(portfolioData.portfolio_photos || []);
      setShowPortfolio(true);
    } catch (error) {
      console.error('Error loading portfolio:', error);
      toast.error('Failed to load portfolio photos');
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  const sortedTailors = [...nearbyTailors].sort((a, b) => {
    if (sortBy === 'distance') {
      return (a.distance || 0) - (b.distance || 0);
    } else {
      return b.rating - a.rating;
    }
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Find Nearby Tailors
        </h1>
        <p className="text-gray-600 mb-6">
          Discover tailoring shops in your area and choose the perfect one for your needs.
        </p>

        {/* Search Controls */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <label className="text-sm font-medium text-gray-700">Search Radius:</label>
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
              <option value={50}>50 km</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'distance' | 'rating')}
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="distance">Distance</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          <button
            onClick={loadNearbyTailors}
            disabled={isLoading}
            className="btn-mobile w-full sm:w-auto bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Refresh'}
          </button>
        </div>

        {locationError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Map View */}
        <div className="card-mobile mobile-card-hover">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              Map View
            </h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <MapView
                tailors={nearbyTailors}
                onTailorSelect={handleTailorSelect}
                center={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
                showUserLocation={!!(latitude && longitude)}
                userLocation={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
                className="h-96 w-full"
              />
            )}
          </div>
        </div>

        {/* Tailors List */}
        <div className="card-mobile mobile-card-hover">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              Available Tailors ({nearbyTailors.length})
            </h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : nearbyTailors.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tailors found</h3>
                <p className="text-gray-600">Try increasing your search radius or check back later.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 max-h-96 mobile-scroll-container">
                {sortedTailors.map((tailor) => (
                  <div
                    key={tailor.id}
                    className={`border rounded-lg p-3 sm:p-4 cursor-pointer mobile-transition mobile-card-hover ${
                      selectedTailor?.id === tailor.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTailorSelect(tailor)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{tailor.shop_name}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{tailor.bio}</p>
                          </div>
                          {tailor.is_verified && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2 flex items-center space-x-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-1">⭐</span>
                            <span className="font-medium">{tailor.rating.toFixed(1)}</span>
                            <span className="ml-1">({tailor.total_reviews} reviews)</span>
                          </div>
                          
                          {tailor.distance && (
                            <div className="text-sm text-gray-600">
                              📍 {tailor.distance.toFixed(1)} km away
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {tailor.skills.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                            {tailor.skills.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                +{tailor.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="btn-mobile bg-primary-600 text-white px-3 py-2 rounded text-sm hover:bg-primary-700">
                          Select
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Tailor Details */}
      {selectedTailor && (
        <div className="card-mobile mobile-card-hover mobile-slide-up">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            {selectedTailor.shop_name}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">About</h4>
              <p className="text-gray-600 mb-4">{selectedTailor.bio}</p>
              
              <h4 className="font-medium text-gray-900 mb-2">Skills & Services</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTailor.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
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
              
              <h4 className="font-medium text-gray-900 mb-2">Rating & Reviews</h4>
              <div className="flex items-center mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  {selectedTailor.rating.toFixed(1)}
                </span>
                <div className="ml-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(selectedTailor.rating)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Based on {selectedTailor.total_reviews} reviews
                  </p>
                </div>
              </div>
              
              <h4 className="font-medium text-gray-900 mb-2">Location</h4>
              <p className="text-gray-600 mb-2">{selectedTailor.address}</p>
              {selectedTailor.distance && (
                <p className="text-sm text-gray-500">
                  {selectedTailor.distance.toFixed(1)} km from your location
                </p>
              )}
              
              <h4 className="font-medium text-gray-900 mb-2 mt-4">Availability</h4>
              <div className="text-sm text-gray-600">
                {Object.entries(selectedTailor.availability).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="capitalize">{day}:</span>
                    <span>{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Reviews Section */}
          <div className="mt-6">
            {isLoadingReviews ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600">Loading reviews...</span>
              </div>
            ) : (
              <ReviewsDisplay 
                reviews={reviews || []} 
                tailorName={selectedTailor.shop_name} 
              />
            )}
          </div>
          
          <div className="mt-6 mobile-button-group">
            <button 
              onClick={() => navigate('/create-request')}
              className="btn-mobile bg-primary-600 text-white hover:bg-primary-700 mobile-focus"
            >
              Create Request with This Tailor
            </button>
            <button 
              onClick={handleViewPortfolio}
              disabled={isLoadingPortfolio}
              className="btn-mobile bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 mobile-focus"
            >
              {isLoadingPortfolio ? 'Loading...' : 'View Portfolio'}
            </button>
          </div>
        </div>
      )}

      {/* Portfolio Viewer Modal */}
      <PortfolioViewer
        isOpen={showPortfolio}
        onClose={() => setShowPortfolio(false)}
        portfolioPhotos={portfolioPhotos}
        tailorName={selectedTailor?.shop_name || ''}
      />
    </div>
  );
};

export default Tailors;
