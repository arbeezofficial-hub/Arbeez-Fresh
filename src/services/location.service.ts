import { db } from '../lib/firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { CustomerLocation, LiveLocation, Shop } from '../types';

/**
 * Calculates Haversine distance between two sets of coordinates in kilometers.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Estimates delivery time in minutes based on distance.
 */
export function estimateDeliveryTime(distanceKm: number): number {
  const baseMins = 15;
  const minsPerKm = 3.5;
  return Math.max(15, Math.round(baseMins + distanceKm * minsPerKm));
}

/**
 * Checks if movement between two coordinates exceeds a threshold in meters.
 */
export function isSignificantMovement(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  minMeters: number = 100
): boolean {
  const distKm = haversineDistance(lat1, lng1, lat2, lng2);
  return distKm * 1000 >= minMeters;
}

/**
 * Requests browser location permission and retrieves current coordinates.
 */
export async function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  });
}

/**
 * Reverse geocodes coordinates to fetch city, district, state, country, pin code and full address.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<CustomerLocation> {
  try {
    const apiKey =
      process.env.GOOGLE_MAPS_PLATFORM_KEY ||
      (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
      (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
      '';

    if (apiKey && apiKey !== 'YOUR_API_KEY') {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const address = result.formatted_address;
          
          let city = 'Bangalore';
          let district = 'Bangalore Urban';
          let state = 'Karnataka';
          let country = 'India';
          let pinCode = '560038';

          result.address_components.forEach((component: any) => {
            if (component.types.includes('locality')) {
              city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_3')) {
              district = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              state = component.long_name;
            }
            if (component.types.includes('country')) {
              country = component.long_name;
            }
            if (component.types.includes('postal_code')) {
              pinCode = component.long_name;
            }
          });

          return {
            lat,
            lng,
            address,
            city,
            district,
            state,
            country,
            pinCode,
            updatedAt: Date.now(),
          };
        }
      }
    }

    // Fallback to nominatim if API key fails or is missing
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      
      const city = addr.city || addr.town || addr.village || addr.suburb || 'Bangalore';
      const district = addr.county || addr.state_district || addr.suburb || city;
      const state = addr.state || 'Karnataka';
      const country = addr.country || 'India';
      const pinCode = addr.postcode || '560038';
      const formattedAddress = data.display_name || `${city}, ${state} ${pinCode}`;

      return {
        lat,
        lng,
        address: formattedAddress,
        city,
        district,
        state,
        country,
        pinCode,
        updatedAt: Date.now(),
      };
    }
  } catch (err) {
    console.warn('Reverse geocoding fallback triggered:', err);
  }

  // Default fallback if reverse geocode service is unavailable
  return {
    lat,
    lng,
    address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
    city: 'Bangalore',
    district: 'Bangalore Urban',
    state: 'Karnataka',
    country: 'India',
    pinCode: '560038',
    updatedAt: Date.now(),
  };
}

/**
 * Filters vendors by maximum delivery radius and sorts by distance.
 */
export function filterAndSortShopsByDistance(
  shops: Shop[],
  userLat: number,
  userLng: number
): (Shop & { distanceKm: number; estimatedMins: number })[] {
  return shops
    .map((shop) => {
      const shopLat = shop.location?.lat || 12.9716;
      const shopLng = shop.location?.lng || 77.5946;
      const dist = haversineDistance(userLat, userLng, shopLat, shopLng);
      const estTime = estimateDeliveryTime(dist);
      return {
        ...shop,
        distanceKm: dist,
        estimatedMins: estTime,
      };
    })
    .filter((shop) => {
      const maxRadius = shop.maxDeliveryDistance || 20; // default 20km radius
      return shop.distanceKm <= maxRadius;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Categorizes shops into Fish Markets, Vegetable Shops, and Grocery Stores.
 */
export function classifyShopType(shop: Shop): 'fish_market' | 'vegetable_shop' | 'grocery_store' {
  const name = (shop.name || '').toLowerCase();
  const desc = (shop.description || '').toLowerCase();
  const cats = shop.categories || [];

  if (name.includes('fish') || name.includes('seafood') || desc.includes('fish') || cats.includes('cat_fish')) {
    return 'fish_market';
  }
  if (name.includes('veg') || name.includes('farm') || desc.includes('vegetable') || cats.includes('cat_veg')) {
    return 'vegetable_shop';
  }
  return 'grocery_store';
}

/**
 * Delivery Partner Live Location Tracking Controller
 */
class LiveTrackingService {
  private watchId: number | null = null;
  private currentOrderId: string | null = null;
  private currentDriverId: string | null = null;
  private lastPosition: { lat: number; lng: number } | null = null;

  startLiveTracking(
    orderId: string,
    driverId: string,
    onPositionUpdate?: (loc: LiveLocation) => void
  ) {
    if (this.watchId !== null && this.currentOrderId === orderId) {
      return; // Already tracking this order
    }

    this.stopLiveTracking(); // Clear any existing tracking session

    this.currentOrderId = orderId;
    this.currentDriverId = driverId;

    if (!navigator.geolocation) {
      console.warn('Geolocation not supported for live tracking');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, speed, heading } = pos.coords;

        // Battery Optimization: Only update Firestore if moved > 5 meters or 10 seconds elapsed
        if (
          this.lastPosition &&
          !isSignificantMovement(
            this.lastPosition.lat,
            this.lastPosition.lng,
            lat,
            lng,
            5
          )
        ) {
          return;
        }

        this.lastPosition = { lat, lng };

        const liveLoc: LiveLocation = {
          orderId,
          driverId,
          lat,
          lng,
          speed: speed ? Number((speed * 3.6).toFixed(1)) : 0, // convert m/s to km/h
          heading: heading ? Math.round(heading) : 0,
          status: 'out_for_delivery',
          lastUpdated: Date.now(),
          updatedAt: Date.now(),
        };

        try {
          // Store live location update in Firestore collection `liveLocations/{orderId}`
          await setDoc(doc(db, 'liveLocations', orderId), liveLoc, { merge: true });
          if (onPositionUpdate) onPositionUpdate(liveLoc);
        } catch (err) {
          console.error('Error updating live location in Firestore:', err);
        }
      },
      (err) => {
        console.warn('Live location watch error:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      }
    );
  }

  async stopLiveTracking(orderId?: string) {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    const targetOrder = orderId || this.currentOrderId;
    if (targetOrder) {
      try {
        // Mark status as completed in liveLocations
        await updateDoc(doc(db, 'liveLocations', targetOrder), {
          status: 'completed',
          updatedAt: Date.now(),
        }).catch(() => {});
      } catch (err) {
        // Ignore error if document was removed
      }
    }

    this.currentOrderId = null;
    this.currentDriverId = null;
    this.lastPosition = null;
  }
}

export const liveTrackingController = new LiveTrackingService();
