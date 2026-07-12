import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { tailorAPI } from '../services/api';
import { TailorProfile as TailorProfileType } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';
import MapView from '../components/MapView';
import PortfolioUpload from '../components/PortfolioUpload';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorHandler';

const TailorProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'edit'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const queryClient = useQueryClient();
  const { latitude, longitude, error: locationError } = useGeolocation();

  const { data: profile, isLoading } = useQuery(
    'tailor-profile',
    tailorAPI.getProfile
  );

  const updateProfileMutation = useMutation(
    (data: Partial<TailorProfileType>) => tailorAPI.updateProfile(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tailor-profile');
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      },
      onError: (error: any) => {
        console.error('Profile update error:', error);
        const errorMessage = getErrorMessage(error);
        toast.error(errorMessage);
      },
    }
  );

  const updateLocationMutation = useMutation(
    ({ lat, lng }: { lat: number; lng: number }) => tailorAPI.updateLocation(lat, lng),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tailor-profile');
        toast.success('Location updated successfully!');
        setShowLocationModal(false);
        setSelectedLocation(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to update location');
      },
    }
  );

  const [formData, setFormData] = useState({
    shop_name: '',
    bio: '',
    address: '',
    skills: [] as string[],
    availability: {} as Record<string, string>,
    pricing: {} as Record<string, string>,
    portfolio_photos: [] as string[],
    store_picture: null as string | null,
    location_lat: null as number | null,
    location_lng: null as number | null,
  });

  const [newSkill, setNewSkill] = useState('');
  const [newAvailabilityDay, setNewAvailabilityDay] = useState('');
  const [newAvailabilityTime, setNewAvailabilityTime] = useState('');
  const [newPricingItem, setNewPricingItem] = useState('');
  const [newPricingPrice, setNewPricingPrice] = useState('');

  React.useEffect(() => {
    if (profile) {
      setFormData({
        shop_name: profile.shop_name || '',
        bio: profile.bio || '',
        address: profile.address || '',
        skills: profile.skills || [],
        availability: profile.availability || {},
        pricing: profile.pricing || {},
        portfolio_photos: profile.portfolio_photos || [],
        store_picture: profile.store_picture,
        location_lat: profile.location_lat,
        location_lng: profile.location_lng,
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
    }));
  };

  const handleAddAvailability = () => {
    if (newAvailabilityDay && newAvailabilityTime) {
      setFormData(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          [newAvailabilityDay]: newAvailabilityTime,
        },
      }));
      setNewAvailabilityDay('');
      setNewAvailabilityTime('');
    }
  };

  const handleRemoveAvailability = (day: string) => {
    setFormData(prev => {
      const newAvailability = { ...prev.availability };
      delete newAvailability[day];
      return {
        ...prev,
        availability: newAvailability,
      };
    });
  };

  const handleAddPricing = () => {
    if (newPricingItem && newPricingPrice) {
      setFormData(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          [newPricingItem]: newPricingPrice,
        },
      }));
      setNewPricingItem('');
      setNewPricingPrice('');
    }
  };

  const handleRemovePricing = (item: string) => {
    setFormData(prev => {
      const newPricing = { ...prev.pricing };
      delete newPricing[item];
      return {
        ...prev,
        pricing: newPricing,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.shop_name.trim()) {
      toast.error('Shop name is required!');
      return;
    }
    
    // Filter out read-only fields that shouldn't be sent in the update request
    const { location_lat, location_lng, ...updateData } = formData;
    
    // Debug: Log what we're sending to the backend
    console.log('Sending profile update data:', updateData);
    console.log('Shop name value:', updateData.shop_name);
    console.log('Shop name length:', updateData.shop_name?.length);
    
    updateProfileMutation.mutate(updateData);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  };

  const handleUseCurrentLocation = () => {
    if (latitude && longitude) {
      setSelectedLocation({ lat: latitude, lng: longitude });
    } else {
      toast.error('Unable to get your current location. Please enable location permissions.');
    }
  };

  const handleUpdateLocation = () => {
    if (selectedLocation) {
      updateLocationMutation.mutate(selectedLocation);
    }
  };

  const handlePortfolioPhotosUpdate = (photos: string[]) => {
    setFormData(prev => ({
      ...prev,
      portfolio_photos: photos,
    }));
  };

  const handleStorePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

    console.log('Uploading store picture:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    try {
      const response = await tailorAPI.uploadStorePicture(file);
      console.log('Store picture upload response:', response);
      
      setFormData(prev => ({
        ...prev,
        store_picture: response.store_picture,
      }));
      toast.success('Store picture uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading store picture:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.response?.data?.message ||
                          'Failed to upload store picture';
      toast.error(errorMessage);
    }
  };

  const handleOpenLocationModal = () => {
    setSelectedLocation({
      lat: formData.location_lat || latitude || 40.7128,
      lng: formData.location_lng || longitude || -74.0060
    });
    setShowLocationModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h2>
        <p className="text-gray-600">Unable to load your tailor profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tailor Profile</h1>
            <p className="text-gray-600">Manage your shop profile and business information</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'edit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Profile Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{profile.shop_name}</h2>
                <p className="text-gray-600 mb-4">{profile.bio}</p>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-lg font-semibold">{profile.rating.toFixed(1)}</span>
                    <span className="text-gray-500 ml-1">({profile.total_reviews} reviews)</span>
                  </div>
                  {profile.is_verified && (
                    <div className="flex items-center text-green-600">
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Photos */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Photos</h3>
            <PortfolioUpload
              portfolioPhotos={profile.portfolio_photos || []}
              onPhotosUpdate={handlePortfolioPhotosUpdate}
            />
          </div>

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Availability */}
          {Object.keys(profile.availability || {}).length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(profile.availability).map(([day, time]) => (
                  <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900 capitalize">{day}</span>
                    <span className="text-gray-600">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing */}
          {Object.keys(profile.pricing || {}).length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
              <div className="space-y-3">
                {Object.entries(profile.pricing).map(([item, price]) => (
                  <div key={item} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{item}</span>
                    <span className="text-gray-600">{price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Shop Name</span>
                <p className="text-gray-900">{profile.shop_name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Address</span>
                <p className="text-gray-900">{profile.address}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Email</span>
                <p className="text-gray-900">{profile.user.email}</p>
              </div>
              {profile.user.phone && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Phone</span>
                  <p className="text-gray-900">{profile.user.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shop Location */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Shop Location</h3>
              <button
                onClick={handleOpenLocationModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Location
              </button>
            </div>
            {profile.location_lat && profile.location_lng ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Current Location</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Latitude: {profile.location_lat.toFixed(6)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Longitude: {profile.location_lng.toFixed(6)}
                  </p>
                </div>
                <div className="h-64 rounded-lg overflow-hidden">
                  <MapView
                    tailors={[{
                      id: profile.id,
                      shop_name: profile.shop_name,
                      location_lat: profile.location_lat,
                      location_lng: profile.location_lng,
                      rating: profile.rating,
                      total_reviews: profile.total_reviews,
                      bio: profile.bio,
                      skills: profile.skills,
                      portfolio_photos: profile.portfolio_photos,
                      store_picture: profile.store_picture,
                      availability: profile.availability,
                      pricing: profile.pricing,
                      address: profile.address,
                      is_verified: profile.is_verified,
                      user: profile.user,
                      created_at: profile.created_at,
                    }]}
                    center={{ lat: profile.location_lat, lng: profile.location_lng }}
                    zoom={15}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No location set</h3>
                <p className="text-gray-600 mb-4">Set your shop location to help customers find you.</p>
                <button
                  onClick={handleOpenLocationModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Set Location
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'edit' && (
        <form onSubmit={handleSubmit} className="space-mobile">
          {/* Basic Information */}
          <div className="card-mobile">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="shop_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="shop_name"
                  id="shop_name"
                  value={formData.shop_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                />
              </div>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  id="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                  placeholder="Tell customers about your tailoring services..."
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                />
              </div>
            </div>
          </div>

          {/* Store Picture Upload */}
          <div className="card-mobile">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Store Picture</h3>
            <div className="space-y-4">
              {formData.store_picture && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Store Picture
                  </label>
                  <div className="relative">
                    <img
                      src={formData.store_picture.startsWith('http') ? formData.store_picture : `http://localhost:8000${formData.store_picture}`}
                      alt="Store picture"
                      className="w-full h-48 object-cover rounded-lg shadow-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                      }}
                    />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, store_picture: null }))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="store_picture" className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.store_picture ? 'Change Store Picture' : 'Upload Store Picture'}
                </label>
                <input
                  type="file"
                  id="store_picture"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleStorePictureChange}
                  className="block w-full text-base text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Upload a picture of your store/shop (JPEG, PNG, WebP - max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Portfolio Management */}
          <div className="card-mobile">
            <PortfolioUpload
              portfolioPhotos={formData.portfolio_photos}
              onPhotosUpdate={handlePortfolioPhotosUpdate}
            />
          </div>

          {/* Skills Management */}
          <div className="card-mobile">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Skills & Specialties</h3>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill (e.g., Wedding Dresses, Men's Suits)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="btn-mobile bg-blue-600 text-white hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Availability Management */}
          <div className="card-mobile">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Availability</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={newAvailabilityDay}
                  onChange={(e) => setNewAvailabilityDay(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                >
                  <option value="">Select Day</option>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
                <input
                  type="text"
                  value={newAvailabilityTime}
                  onChange={(e) => setNewAvailabilityTime(e.target.value)}
                  placeholder="e.g., 9:00 AM - 5:00 PM"
                  className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                />
                <button
                  type="button"
                  onClick={handleAddAvailability}
                  className="btn-mobile bg-blue-600 text-white hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {Object.entries(formData.availability).map(([day, time]) => (
                  <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900 capitalize">{day}</span>
                      <span className="ml-2 text-gray-600">{time}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAvailability(day)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Management */}
          <div className="card-mobile">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Pricing</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newPricingItem}
                  onChange={(e) => setNewPricingItem(e.target.value)}
                  placeholder="Service (e.g., Suit Alteration)"
                  className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                />
                <input
                  type="text"
                  value={newPricingPrice}
                  onChange={(e) => setNewPricingPrice(e.target.value)}
                  placeholder="Price (e.g., $50-100)"
                  className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                />
                <button
                  type="button"
                  onClick={handleAddPricing}
                  className="btn-mobile bg-blue-600 text-white hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {Object.entries(formData.pricing).map(([item, price]) => (
                  <div key={item} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{item}</span>
                      <span className="ml-2 text-gray-600">{price}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePricing(item)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-mobile border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isLoading}
              className="btn-mobile bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Location Selection Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 safe-top safe-bottom">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto scroll-smooth-mobile">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Update Shop Location</h2>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 touch-manipulation"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                  <p className="text-mobile text-gray-600">
                    Click on the map to select your shop location, or use your current location.
                  </p>
                  <button
                    onClick={handleUseCurrentLocation}
                    className="btn-mobile bg-green-600 text-white hover:bg-green-700"
                  >
                    Use Current Location
                  </button>
                </div>

                <div className="h-64 sm:h-96 rounded-lg overflow-hidden border">
                  <MapView
                    tailors={selectedLocation ? [{
                      id: 0,
                      shop_name: 'Selected Location',
                      location_lat: selectedLocation.lat,
                      location_lng: selectedLocation.lng,
                      rating: 0,
                      total_reviews: 0,
                      bio: '',
                      skills: [],
                      portfolio_photos: [],
                      store_picture: null,
                      availability: {},
                      pricing: {},
                      address: '',
                      is_verified: false,
                      user: { id: 0, username: '', email: '', name: '', phone: '', location_lat: null, location_lng: null, profile_photo: null, is_tailor: false, created_at: '' },
                      created_at: '',
                    }] : []}
                    center={selectedLocation || { lat: 40.7128, lng: -74.0060 }}
                    zoom={15}
                    onLocationSelect={handleLocationSelect}
                  />
                </div>

                {selectedLocation && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Selected Location</h3>
                    <p className="text-sm text-gray-600">
                      Latitude: {selectedLocation.lat.toFixed(6)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Longitude: {selectedLocation.lng.toFixed(6)}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => setShowLocationModal(false)}
                    className="btn-mobile border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateLocation}
                    disabled={!selectedLocation || updateLocationMutation.isLoading}
                    className="btn-mobile bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateLocationMutation.isLoading ? 'Updating...' : 'Update Location'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TailorProfile;
