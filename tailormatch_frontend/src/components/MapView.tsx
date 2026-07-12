import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { TailorProfile } from '../types';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, createTailorIcon, createUserIcon, createTailorPopupContent } from '../utils/maps';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface MapViewProps {
  tailors: TailorProfile[];
  onTailorSelect?: (tailor: TailorProfile) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  showUserLocation?: boolean;
  userLocation?: { lat: number; lng: number };
}

// Component to handle map center updates
const MapCenterUpdater: React.FC<{ center: { lat: number; lng: number }; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
  }, [map, center.lat, center.lng, zoom]);
  
  return null;
};

// Component to handle map clicks for location selection
const MapClickHandler: React.FC<{ onLocationSelect?: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!onLocationSelect) return;
    
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    };
    
    map.on('click', handleMapClick);
    
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onLocationSelect]);
  
  return null;
};

const MapView: React.FC<MapViewProps> = ({
  tailors,
  onTailorSelect,
  onLocationSelect,
  center,
  zoom = 12,
  className = 'h-96 w-full',
  showUserLocation = false,
  userLocation
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Set up global function for tailor selection
    (window as any).selectTailor = (tailorId: string) => {
      const tailor = tailors.find(t => t.id.toString() === tailorId);
      if (tailor && onTailorSelect) {
        onTailorSelect(tailor);
      }
    };

    setIsLoaded(true);
  }, [tailors, onTailorSelect]);

  const mapCenter = center || DEFAULT_MAP_CENTER;

  return (
    <div className={className}>
      {isLoaded ? (
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng] as [number, number]}
          zoom={zoom}
          className="w-full h-full rounded-lg shadow-lg"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Update map center when props change */}
          <MapCenterUpdater center={mapCenter} zoom={zoom} />
          
          {/* Handle map clicks for location selection */}
          <MapClickHandler onLocationSelect={onLocationSelect} />
          
          {/* User location marker */}
          {showUserLocation && userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng] as [number, number]}
              icon={createUserIcon()}
            >
              <Popup>
                <div className="text-center">
                  <strong>Your Location</strong>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Tailor markers */}
          {tailors.map((tailor) => {
            if (!tailor.location_lat || !tailor.location_lng) return null;
            
            return (
              <Marker
                key={tailor.id}
                position={[tailor.location_lat, tailor.location_lng] as [number, number]}
                icon={createTailorIcon()}
                eventHandlers={{
                  click: () => {
                    onTailorSelect?.(tailor);
                  }
                }}
              >
                <Popup>
                  <div dangerouslySetInnerHTML={{ 
                    __html: createTailorPopupContent(tailor) 
                  }} />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
