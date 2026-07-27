import { create } from 'zustand';

interface LocationState {
  address: string;
  lat: number;
  lng: number;
  city?: string;
  district?: string;
  state?: string;
  pinCode?: string;
  isDetecting: boolean;
  permissionGranted: boolean;
  setLocation: (lat: number, lng: number, address: string, city?: string, pinCode?: string) => void;
  detectCurrentLocation: () => Promise<void>;
}

// Default location: Bangalore City Center
const DEFAULT_LAT = 12.9716;
const DEFAULT_LNG = 77.5946;
const DEFAULT_ADDRESS = 'Indiranagar, Bangalore, KA';

export const useLocationStore = create<LocationState>((set, get) => ({
  address: DEFAULT_ADDRESS,
  lat: DEFAULT_LAT,
  lng: DEFAULT_LNG,
  city: 'Bangalore',
  pinCode: '560038',
  isDetecting: false,
  permissionGranted: false,

  setLocation: (lat, lng, address, city, pinCode) => set({ lat, lng, address, city, pinCode, permissionGranted: true }),

  detectCurrentLocation: async () => {
    set({ isDetecting: true });
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let addressName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)} - Nearby`;
          let city = 'Bangalore';
          let pinCode = '560038';

          try {
            // Reverse geocoding attempt via OpenStreetMap Nominatim
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            if (res.ok) {
              const data = await res.json();
              addressName = data.display_name?.split(',').slice(0, 3).join(',') || addressName;
              city = data.address?.city || data.address?.town || data.address?.suburb || 'Bangalore';
              pinCode = data.address?.postcode || '560038';
            }
          } catch (e) {
            console.warn('Geocoding fallback used:', e);
          }
          set({
            lat: latitude,
            lng: longitude,
            address: addressName,
            city,
            pinCode,
            isDetecting: false,
            permissionGranted: true,
          });
        },
        (error) => {
          console.warn('Geolocation denied or failed, using default:', error);
          set({
            lat: DEFAULT_LAT,
            lng: DEFAULT_LNG,
            address: DEFAULT_ADDRESS,
            city: 'Bangalore',
            pinCode: '560038',
            isDetecting: false,
            permissionGranted: false,
          });
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      set({ isDetecting: false });
    }
  },
}));

/**
 * Calculates straight-line Haversine distance in kilometers between two GPS coordinates.
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
