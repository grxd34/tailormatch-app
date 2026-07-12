// Free OpenStreetMap + Leaflet utility functions
// No API key required! 100% free forever!

import L from 'leaflet';

export const DEFAULT_MAP_CENTER = {
  lat: 40.7128,
  lng: -74.0060
};

export const DEFAULT_MAP_ZOOM = 12;

// Create custom tailor marker icon
export const createTailorIcon = () => {
  return L.divIcon({
    className: 'custom-tailor-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: #0ea5e9;
        border: 2px solid #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        T
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Create custom user location marker icon
export const createUserIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: #10B981;
        border: 2px solid #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

// Create popup content for tailor markers
export const createTailorPopupContent = (tailor: any) => {
  return `
    <div style="padding: 12px; max-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
      <h3 style="font-weight: 600; color: #111827; font-size: 14px; margin: 0 0 4px 0;">${tailor.shop_name}</h3>
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0; line-height: 1.4;">${tailor.bio}</p>
      <div style="margin: 8px 0;">
        <span style="
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 12px;
          background: #dcfce7;
          color: #166534;
          font-size: 11px;
          font-weight: 500;
        ">
          ⭐ ${tailor.rating.toFixed(1)} (${tailor.total_reviews} reviews)
        </span>
      </div>
      <div style="margin: 4px 0; color: #6b7280; font-size: 11px;">
        ${tailor.distance ? `${tailor.distance.toFixed(1)} km away` : ''}
      </div>
      <div style="margin: 4px 0; color: #6b7280; font-size: 11px;">
        📍 ${tailor.address}
      </div>
      <div style="margin-top: 8px;">
        <button onclick="window.selectTailor && window.selectTailor('${tailor.id}')" style="
          background: #2563eb;
          color: white;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          transition: background-color 0.2s;
        " onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
          Select This Tailor
        </button>
      </div>
    </div>
  `;
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Get user's current location
export const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};
