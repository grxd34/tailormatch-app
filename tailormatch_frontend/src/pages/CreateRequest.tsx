import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestsAPI, shopsAPI } from '../services/api';
import { Measurements, TailorProfile, TailoringRequest } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';
import BodyScan from '../components/BodyScan';
import ManualMeasurements from '../components/ManualMeasurements';
import PortfolioViewer from '../components/PortfolioViewer';
import toast from 'react-hot-toast';

const CreateRequest: React.FC = () => {
  const [step, setStep] = useState(1);
  const [measurements, setMeasurements] = useState<Measurements>({});
  const [notes, setNotes] = useState('');
  const [selectedTailor, setSelectedTailor] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nearbyTailors, setNearbyTailors] = useState<TailorProfile[]>([]);
  const [isLoadingTailors, setIsLoadingTailors] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>([]);
  const [selectedTailorForPortfolio, setSelectedTailorForPortfolio] = useState<TailorProfile | null>(null);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const [existingRequests, setExistingRequests] = useState<TailoringRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const { latitude, longitude } = useGeolocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 2) {
      loadExistingRequests();
    }
  }, [step]);

  useEffect(() => {
    if (latitude && longitude && step === 2 && existingRequests.length >= 0) {
      loadNearbyTailors();
    }
  }, [latitude, longitude, step, existingRequests]);

  const loadExistingRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const requests = await requestsAPI.getMy();
      setExistingRequests(requests);
    } catch (error: any) {
      console.error('Error loading existing requests:', error);
      toast.error('Failed to load existing requests');
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const loadNearbyTailors = async () => {
    if (!latitude || !longitude) {
      toast.error('Location not available. Please enable location permissions.');
      return;
    }

    setIsLoadingTailors(true);
    try {
      const tailors = await shopsAPI.getNearby(latitude, longitude, 10);
      setNearbyTailors(tailors);
      if (tailors.length === 0) {
        toast('No tailors found in your area. Try expanding your search radius.', {
          icon: 'ℹ️',
          duration: 4000,
        });
      }
    } catch (error: any) {
      console.error('Error loading tailors:', error);
      toast.error(`Failed to load nearby tailors: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoadingTailors(false);
    }
  };

  // Helper function to check if user has pending request with a tailor
  const hasPendingRequestWithTailor = (tailorId: number) => {
    return existingRequests.some(request => 
      request.tailor === tailorId && 
      ['pending', 'accepted', 'in_progress'].includes(request.status)
    );
  };

  // Helper function to get existing request with tailor
  const getExistingRequestWithTailor = (tailorId: number) => {
    return existingRequests.find(request => 
      request.tailor === tailorId && 
      ['pending', 'accepted', 'in_progress'].includes(request.status)
    );
  };

  const handleMeasurements = (newMeasurements: Measurements) => {
    setMeasurements(newMeasurements);
    setStep(2);
  };

  const handleManualInput = () => {
    setStep(1.5); // Show manual input form
  };

  const handleManualMeasurements = (newMeasurements: Measurements) => {
    setMeasurements(newMeasurements);
    setStep(2);
  };

  const handleBackToScan = () => {
    setStep(1);
  };

  const handleViewPortfolio = async (tailor: TailorProfile) => {
    setIsLoadingPortfolio(true);
    setSelectedTailorForPortfolio(tailor);
    try {
      const portfolioData = await shopsAPI.getPortfolio(tailor.id);
      setPortfolioPhotos(portfolioData.portfolio_photos || []);
      setShowPortfolio(true);
    } catch (error) {
      console.error('Error loading portfolio:', error);
      toast.error('Failed to load portfolio photos');
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTailor) {
      toast.error('Please select a tailor');
      return;
    }

    if (Object.keys(measurements).length === 0) {
      toast.error('Please provide measurements');
      return;
    }

    // Check for existing request with selected tailor
    if (hasPendingRequestWithTailor(selectedTailor)) {
      const existingRequest = getExistingRequestWithTailor(selectedTailor);
      const tailorName = nearbyTailors.find(t => t.id === selectedTailor)?.shop_name || 'this tailor';
      toast.error(`❌ You already have a ${existingRequest?.status.replace('_', ' ')} request with ${tailorName}. Please wait for it to be completed or select a different tailor.`);
      return;
    }

    console.log('Creating request with:', { measurements, notes, tailor: selectedTailor });
    console.log('Measurements type:', typeof measurements, 'Keys:', Object.keys(measurements));
    console.log('Tailor ID type:', typeof selectedTailor, 'Value:', selectedTailor);
    console.log('Notes:', notes);
    
    setIsSubmitting(true);
    try {
      const requestData = {
        measurements,
        notes,
        tailor: selectedTailor,
      };
      console.log('Sending request data:', requestData);
      const result = await requestsAPI.create(requestData);
      toast.success('Request created successfully!');
      navigate('/requests');
    } catch (error: any) {
      console.error('Error creating request:', error);
      console.error('Error response:', error.response?.data);
      
      // Handle specific error cases with user-friendly messages
      const errorData = error.response?.data;
      
      if (errorData?.tailor && Array.isArray(errorData.tailor)) {
        // This is a duplicate request error
        const tailorName = nearbyTailors.find(t => t.id === selectedTailor)?.shop_name || 'this tailor';
        toast.error(`❌ You already have a pending request with ${tailorName}. Please wait for it to be completed or select a different tailor.`);
      } else if (errorData?.measurements) {
        // Measurements validation error
        toast.error(`❌ Invalid measurements: ${errorData.measurements[0] || 'Please provide valid measurements'}`);
      } else if (errorData?.detail) {
        // General error with detail
        toast.error(`❌ ${errorData.detail}`);
      } else if (errorData?.error) {
        // General error
        toast.error(`❌ ${errorData.error}`);
      } else if (error.response?.status === 401) {
        // Authentication error
        toast.error('❌ You need to log in to create a request. Please log in and try again.');
      } else if (error.response?.status === 400) {
        // Bad request - show more details
        toast.error('❌ Invalid request data. Please check your measurements and try again.');
      } else {
        // Generic error
        toast.error('❌ Failed to create request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Create Tailoring Request
        </h1>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center">
            {[1, 2, 3].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step >= stepNumber
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > stepNumber ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Measurements</span>
            <span>Select Tailor</span>
            <span>Details</span>
          </div>
        </div>

        {/* Step 1: Body Scan */}
        {step === 1 && (
          <BodyScan
            onMeasurements={handleMeasurements}
            onManualInput={handleManualInput}
          />
        )}

        {/* Step 1.5: Manual Measurements */}
        {step === 1.5 && (
          <ManualMeasurements
            onMeasurements={handleManualMeasurements}
            initialMeasurements={measurements}
            onBack={handleBackToScan}
          />
        )}

        {/* Step 2: Select Tailor */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select a Tailor
              </h3>
              <p className="text-gray-600 mb-6">
                Choose from nearby tailoring shops based on your measurements.
              </p>
              
              {/* Show existing requests if any */}
              {existingRequests.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    📋 Your Current Requests ({existingRequests.length})
                  </h4>
                  <div className="space-y-1">
                    {existingRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="text-xs text-blue-800">
                        • {request.tailor_details?.shop_name || 'Unknown Tailor'} - {request.status.replace('_', ' ')}
                        <span className="text-blue-600 ml-2">
                          ({new Date(request.created_at).toLocaleDateString()})
                        </span>
                      </div>
                    ))}
                    {existingRequests.length > 3 && (
                      <div className="text-xs text-blue-600">
                        +{existingRequests.length - 3} more requests
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    💡 You cannot create new requests with tailors you already have pending requests with.
                  </p>
                </div>
              )}
            </div>

            {isLoadingRequests || isLoadingTailors ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600">
                  {isLoadingRequests ? 'Loading your requests...' : 'Loading nearby tailors...'}
                </span>
              </div>
            ) : nearbyTailors.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No tailors found in your area.</p>
                <p className="text-sm text-gray-500">Try expanding your search radius or check your location settings.</p>
                <button 
                  onClick={loadNearbyTailors}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Retry Search
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {nearbyTailors.map((tailor) => {
                  const hasExistingRequest = hasPendingRequestWithTailor(tailor.id);
                  const existingRequest = getExistingRequestWithTailor(tailor.id);
                  
                  return (
                    <div
                      key={tailor.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        hasExistingRequest
                          ? 'border-orange-200 bg-orange-50 opacity-75'
                          : selectedTailor === tailor.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                    <div className="flex items-start space-x-4">
                      {/* Store Picture */}
                      {tailor.store_picture && (
                        <div className="flex-shrink-0">
                          <img
                            src={tailor.store_picture.startsWith('http') ? tailor.store_picture : `http://localhost:8000${tailor.store_picture}`}
                            alt={`${tailor.shop_name} store`}
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=';
                            }}
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div 
                            className={`flex-1 ${hasExistingRequest ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            onClick={() => !hasExistingRequest && setSelectedTailor(tailor.id)}
                          >
                            <h4 className="font-semibold text-gray-900">{tailor.shop_name}</h4>
                            <p className="text-sm text-gray-600">
                              ⭐ {tailor.rating.toFixed(1)} ({tailor.total_reviews} reviews) • {tailor.distance?.toFixed(1)} km away
                            </p>
                            {hasExistingRequest && existingRequest && (
                              <div className="mt-2 p-2 bg-orange-100 border border-orange-200 rounded">
                                <p className="text-sm text-orange-800 font-medium">
                                  ⚠️ You already have a {existingRequest.status.replace('_', ' ')} request with this tailor
                                </p>
                                <p className="text-xs text-orange-700 mt-1">
                                  Created: {new Date(existingRequest.created_at).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-orange-700">
                                  Please wait for it to be completed or select a different tailor.
                                </p>
                              </div>
                            )}
                            {tailor.bio && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tailor.bio}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewPortfolio(tailor);
                              }}
                              disabled={isLoadingPortfolio}
                              className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                              {isLoadingPortfolio ? 'Loading...' : 'View Portfolio'}
                            </button>
                            <input
                              type="radio"
                              checked={selectedTailor === tailor.id}
                              onChange={() => !hasExistingRequest && setSelectedTailor(tailor.id)}
                              disabled={hasExistingRequest}
                              className={`h-4 w-4 text-primary-600 ${hasExistingRequest ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedTailor}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Final Details */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Request Details
              </h3>
            </div>

            {/* Measurements Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Your Measurements:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(measurements).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                    <span className="font-medium">{value} cm</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific requirements, style preferences, or additional information..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Request...' : 'Create Request'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Portfolio Viewer Modal */}
      <PortfolioViewer
        isOpen={showPortfolio}
        onClose={() => setShowPortfolio(false)}
        portfolioPhotos={portfolioPhotos}
        tailorName={selectedTailorForPortfolio?.shop_name || ''}
      />
    </div>
  );
};

export default CreateRequest;