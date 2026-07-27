import { useEffect, useRef, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Truck, Store, MapPin, Navigation } from 'lucide-react';

interface ShopLocationMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  type?: 'fish_market' | 'vegetable_shop' | 'grocery_store' | 'general';
  coverageRadiusKm?: number;
}

interface DeliveryDriverMarker {
  driverId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  status?: string;
}

interface CustomerDropMarker {
  address: string;
  lat: number;
  lng: number;
}

interface InteractiveMapProps {
  mode: 'customer_discovery' | 'live_order_tracking' | 'vendor_coverage' | 'delivery_partner_route';
  userLocation?: { lat: number; lng: number };
  shops?: ShopLocationMarker[];
  customerDrop?: CustomerDropMarker;
  driverLocation?: DeliveryDriverMarker;
  vendorLocation?: ShopLocationMarker;
  selectedShopId?: string;
  onSelectShop?: (shopId: string) => void;
  height?: string;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

function RouteDisplay({ origin, destination }: {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map) return;
    polylinesRef.current.forEach(p => p.setMap(null));

    routesLib.Route.computeRoutes({
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    }).then(({ routes }) => {
      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach(p => {
          p.setOptions({
            strokeColor: '#10b981',
            strokeWeight: 4,
            strokeOpacity: 0.8,
          });
          p.setMap(map);
        });
        polylinesRef.current = newPolylines;
      }
    });

    return () => polylinesRef.current.forEach(p => p.setMap(null));
  }, [routesLib, map, origin, destination]);

  return null;
}

function VendorCoverageCircle({ center, radiusKm }: { center: google.maps.LatLngLiteral; radiusKm: number }) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);
  const mapsLib = useMapsLibrary('core');

  useEffect(() => {
    if (!map || !mapsLib) return;

    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        map,
        center,
        radius: radiusKm * 1000,
        fillColor: '#818cf8',
        fillOpacity: 0.15,
        strokeColor: '#6366f1',
        strokeWeight: 1,
      });
    } else {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radiusKm * 1000);
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
    };
  }, [map, mapsLib, center, radiusKm]);

  return null;
}

function BoundsFitter({ bounds }: { bounds: google.maps.LatLngLiteral[] }) {
  const map = useMap();
  const mapsLib = useMapsLibrary('core');

  useEffect(() => {
    if (!map || !mapsLib || bounds.length === 0) return;
    const latLngBounds = new google.maps.LatLngBounds();
    bounds.forEach(b => latLngBounds.extend(b));
    map.fitBounds(latLngBounds, { top: 40, right: 40, bottom: 40, left: 40 });
  }, [map, mapsLib, bounds]);

  return null;
}


export const InteractiveMap = ({
  mode,
  userLocation = { lat: 12.9716, lng: 77.5946 }, // Default Bangalore center
  shops = [],
  customerDrop,
  driverLocation,
  vendorLocation,
  selectedShopId,
  onSelectShop,
  height = '350px',
}: InteractiveMapProps) => {

  const bounds: google.maps.LatLngLiteral[] = [];
  if (userLocation && mode === 'customer_discovery') bounds.push(userLocation);
  if (mode === 'customer_discovery') shops.forEach(s => bounds.push({ lat: s.lat, lng: s.lng }));
  if (vendorLocation) bounds.push({ lat: vendorLocation.lat, lng: vendorLocation.lng });
  if (driverLocation) bounds.push({ lat: driverLocation.lat, lng: driverLocation.lng });
  if (customerDrop) bounds.push({ lat: customerDrop.lat, lng: customerDrop.lng });

  if (!hasValidKey) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 z-0 flex flex-col items-center justify-center text-center p-6" style={{ height }}>
        <h2 className="text-lg font-bold text-slate-800">Google Maps API Key Required</h2>
        <p className="text-sm text-slate-600 mt-2">
          <strong>Step 1:</strong> <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener" className="text-blue-600 underline">Get an API Key</a>
        </p>
        <p className="text-sm text-slate-600 mt-2">
          <strong>Step 2:</strong> Add your key as a secret in AI Studio:
        </p>
        <ul className="text-xs text-left text-slate-500 mt-2 list-disc list-inside">
          <li>Open <strong>Settings</strong> (⚙️ gear icon, top-right)</li>
          <li>Select <strong>Secrets</strong></li>
          <li>Type <code>GOOGLE_MAPS_PLATFORM_KEY</code> as the secret name</li>
          <li>Paste your API key and press Enter</li>
        </ul>
      </div>
    );
  }

  const createPinHtml = (bgColor: string, iconHtml: string, label?: string) => {
    return `
      <div style="
        background-color: ${bgColor};
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 3px solid white;
        position: relative;
      ">
        ${iconHtml}
        ${label ? `<span style="position: absolute; bottom: -24px; white-space: nowrap; background: #0f172a; color: #38bdf8; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; border: 1px solid #334155; transform: translateX(-50%); left: 50%; z-index: 10;">${label}</span>` : ''}
      </div>
    `;
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 z-0" style={{ height }}>
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={userLocation}
          defaultZoom={13}
          mapId="ARBEEZ_FRESH_MAP"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          gestureHandling="greedy"
          disableDefaultUI={true}
          zoomControl={true}
        >
          {bounds.length > 0 && <BoundsFitter bounds={bounds} />}

          {/* CUSTOMER DISCOVERY MODE */}
          {mode === 'customer_discovery' && (
            <>
              <AdvancedMarker position={userLocation}>
                <div dangerouslySetInnerHTML={{ __html: createPinHtml('#10b981', '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', 'You') }} />
              </AdvancedMarker>
              
              {shops.map(shop => {
                let pinColor = '#6366f1';
                if (shop.type === 'fish_market') pinColor = '#0284c7';
                if (shop.type === 'vegetable_shop') pinColor = '#16a34a';

                return (
                  <AdvancedMarker 
                    key={shop.id} 
                    position={{ lat: shop.lat, lng: shop.lng }}
                    onClick={() => onSelectShop?.(shop.id)}
                    zIndex={selectedShopId === shop.id ? 100 : 1}
                  >
                    <div dangerouslySetInnerHTML={{ __html: createPinHtml(pinColor, '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M10 12h4"/></svg>', shop.name) }} />
                  </AdvancedMarker>
                );
              })}
            </>
          )}

          {/* TRACKING MODES */}
          {(mode === 'live_order_tracking' || mode === 'delivery_partner_route') && (
            <>
              {vendorLocation && (
                <AdvancedMarker position={{ lat: vendorLocation.lat, lng: vendorLocation.lng }}>
                  <div dangerouslySetInnerHTML={{ __html: createPinHtml('#4f46e5', '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/></svg>', 'Shop') }} />
                </AdvancedMarker>
              )}
              {customerDrop && (
                <AdvancedMarker position={{ lat: customerDrop.lat, lng: customerDrop.lng }}>
                  <div dangerouslySetInnerHTML={{ __html: createPinHtml('#10b981', '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>', 'Drop') }} />
                </AdvancedMarker>
              )}
              {driverLocation && (
                <AdvancedMarker position={{ lat: driverLocation.lat, lng: driverLocation.lng }}>
                  <div dangerouslySetInnerHTML={{ __html: createPinHtml('#f59e0b', '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>', `Driver`) }} />
                </AdvancedMarker>
              )}

              {/* Route Display - From Vendor to Customer */}
              {vendorLocation && customerDrop && (
                <RouteDisplay 
                  origin={{ lat: vendorLocation.lat, lng: vendorLocation.lng }} 
                  destination={{ lat: customerDrop.lat, lng: customerDrop.lng }} 
                />
              )}
            </>
          )}

          {/* VENDOR COVERAGE MODE */}
          {mode === 'vendor_coverage' && vendorLocation && (
            <>
              <AdvancedMarker position={{ lat: vendorLocation.lat, lng: vendorLocation.lng }}>
                <div dangerouslySetInnerHTML={{ __html: createPinHtml('#4f46e5', '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/></svg>', vendorLocation.name) }} />
              </AdvancedMarker>
              <VendorCoverageCircle center={{ lat: vendorLocation.lat, lng: vendorLocation.lng }} radiusKm={vendorLocation.coverageRadiusKm || 15} />
            </>
          )}

        </Map>
      </APIProvider>
    </div>
  );
};
