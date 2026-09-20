import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsRenderer, Polyline } from '@react-google-maps/api';

// Warm Editorial Theme styling for Google Maps matching the TravelIQ look
const warmMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#F7F5EF" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#F7F5EF" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#66736F" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#263238" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#66736F" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#EEF2ED" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#173F3A" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#FFFFFF" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#E3DED2" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#66736F" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#FFFFFF" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#E3DED2" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#E3DED2" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#173F3A" }],
  },
];

const defaultCoords = { lat: 20.5937, lng: 78.9629 }; // Center of India

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '380px',
  borderRadius: '12px'
};

const mapOptions = {
  styles: warmMapStyle,
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true
};

export default function GoogleMapComponent({ source, dest, liveLocation, onRouteCalculated }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [map, setMap] = useState(null);
  const [directions, setDirections] = useState(null);
  const [directionsError, setDirectionsError] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  
  // Geodesic fallback representation states
  const [isFallbackRoute, setIsFallbackRoute] = useState(false);
  const [fallbackData, setFallbackData] = useState(null);

  // Parse coordinates robustly
  const sCoord = useMemo(() => {
    if (!source?.latitude || !source?.longitude) return null;
    const lat = parseFloat(source.latitude);
    const lng = parseFloat(source.longitude);
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0 || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      console.warn('[GoogleMap Debug] Rejected invalid Source coords:', source?.station_code, lat, lng);
      return null;
    }
    return { lat, lng };
  }, [source]);

  const dCoord = useMemo(() => {
    if (!dest?.latitude || !dest?.longitude) return null;
    const lat = parseFloat(dest.latitude);
    const lng = parseFloat(dest.longitude);
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0 || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      console.warn('[GoogleMap Debug] Rejected invalid Dest coords:', dest?.station_code, lat, lng);
      return null;
    }
    return { lat, lng };
  }, [dest]);

  const liveCoord = useMemo(() => {
    if (!liveLocation || !Array.isArray(liveLocation)) return null;
    const lat = parseFloat(liveLocation[0]);
    const lng = parseFloat(liveLocation[1]);
    return !isNaN(lat) && !isNaN(lng) ? { lat, lng } : null;
  }, [liveLocation]);

  // Console logging selected entities
  useEffect(() => {
    if (source) {
      console.log('[GoogleMap Debug] Selected Source Station:', source.station_name, `(${source.station_code})`, 'Coords:', sCoord);
    }
    if (dest) {
      console.log('[GoogleMap Debug] Selected Destination Station:', dest.station_name, `(${dest.station_code})`, 'Coords:', dCoord);
    }
  }, [source, dest, sCoord, dCoord]);

  // Helper function to calculate a straight/geodesic fallback route with rich statistics
  const calculateFallbackRoute = useCallback((origin, destination) => {
    if (!origin || !destination) return;
    const R = 6371; // km
    const lat1 = origin.lat;
    const lon1 = origin.lng;
    const lat2 = destination.lat;
    const lon2 = destination.lng;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Express train typical speed in India is around 68 km/h
    const durationHrs = distanceKm / 68;
    const formattedDistance = `${Math.round(distanceKm)} km`;
    const hours = Math.floor(durationHrs);
    const mins = Math.round((durationHrs - hours) * 60);
    const formattedDuration = `${hours}h ${mins}m`;

    console.log('[GoogleMap Debug] Geodesic fallback route calculated:', {
      distance: formattedDistance,
      duration: formattedDuration
    });

    setFallbackData({
      distance: formattedDistance,
      duration: formattedDuration
    });
    setIsFallbackRoute(true);

    if (onRouteCalculated) {
      onRouteCalculated({
        distance: formattedDistance,
        duration: formattedDuration
      });
    }
  }, [onRouteCalculated]);

  // Query DirectionsService to calculate transit paths with polyline
  useEffect(() => {
    if (!isLoaded || !sCoord || !dCoord) {
      setDirections(null);
      setDirectionsError(null);
      setIsFallbackRoute(false);
      setFallbackData(null);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    
    console.log('[GoogleMap Debug] Querying Directions API:', {
      origin: sCoord,
      destination: dCoord,
      mode: 'TRANSIT'
    });

    // First, try transit directions (ideal for train/rail)
    directionsService.route(
      {
        origin: sCoord,
        destination: dCoord,
        travelMode: window.google.maps.TravelMode.TRANSIT
      },
      (result, status) => {
        console.log('[GoogleMap Debug] Transit Directions API Status:', status);
        if (status === window.google.maps.DirectionsStatus.OK) {
          console.log('[GoogleMap Debug] Directions calculated successfully (TRANSIT).', result);
          setDirections(result);
          setDirectionsError(null);
          setIsFallbackRoute(false);
          setFallbackData(null);
          
          if (onRouteCalculated) {
            const leg = result.routes[0].legs[0];
            onRouteCalculated({
              distance: leg.distance.text,
              duration: leg.duration.text
            });
          }
        } else {
          console.warn('[GoogleMap Debug] Transit directions failed (status:', status, '). Falling back to DRIVING travel mode...');
          
          // Fallback to Driving directions
          directionsService.route(
            {
              origin: sCoord,
              destination: dCoord,
              travelMode: window.google.maps.TravelMode.DRIVING
            },
            (fallbackResult, fallbackStatus) => {
              console.log('[GoogleMap Debug] Driving Fallback API Status:', fallbackStatus);
              if (fallbackStatus === window.google.maps.DirectionsStatus.OK) {
                console.log('[GoogleMap Debug] Directions calculated successfully (DRIVING fallback).', fallbackResult);
                setDirections(fallbackResult);
                setDirectionsError(null);
                setIsFallbackRoute(false);
                setFallbackData(null);
                
                if (onRouteCalculated) {
                  const leg = fallbackResult.routes[0].legs[0];
                  onRouteCalculated({
                    distance: leg.distance.text,
                    duration: leg.duration.text
                  });
                }
              } else {
                console.error('[GoogleMap Debug] Directions fallback request failed (status:', fallbackStatus, ')');
                setDirectionsError('Route not available between selected stations. Rendering direct path.');
                setDirections(null);
                calculateFallbackRoute(sCoord, dCoord);
              }
            }
          );
        }
      }
    );
  }, [isLoaded, sCoord, dCoord, onRouteCalculated, calculateFallbackRoute]);

  // Center & fit map bounds to source and destination coordinates when loaded/updated
  useEffect(() => {
    if (map && (sCoord || dCoord)) {
      const bounds = new window.google.maps.LatLngBounds();
      if (sCoord) bounds.extend(sCoord);
      if (dCoord) bounds.extend(dCoord);

      if (sCoord && dCoord) {
        console.log('[GoogleMap Debug] Fitting map viewport bounds to Source & Destination markers.');
        map.fitBounds(bounds);
        // Avoid zooming in too far on close coordinates
        const listener = window.google.maps.event.addListener(map, 'idle', () => {
          if (map.getZoom() > 8) map.setZoom(6);
          window.google.maps.event.removeListener(listener);
        });
      } else if (sCoord) {
        console.log('[GoogleMap Debug] Panning map viewport to Source marker.');
        map.panTo(sCoord);
        map.setZoom(6);
      } else if (dCoord) {
        console.log('[GoogleMap Debug] Panning map viewport to Destination marker.');
        map.panTo(dCoord);
        map.setZoom(6);
      }
    }
  }, [map, sCoord, dCoord]);

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (loadError) {
    return (
      <div className="w-full h-full min-h-[380px] bg-[#F7F5EF] dark:bg-[#12201D] rounded-xl flex items-center justify-center p-6 text-center border border-[#B94A48] dark:border-[#B94A48]">
        <div className="space-y-2">
          <p className="font-bold text-base text-[#B94A48]">⚠️ Google Maps Load Error</p>
          <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] max-w-sm">Failed to connect to Google Maps servers. Check that your VITE_GOOGLE_MAPS_API_KEY environment variable is configured correctly.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full min-h-[380px] bg-[#F7F5EF] dark:bg-[#12201D] rounded-xl flex items-center justify-center text-[#66736F] dark:text-[#A3B0AB] font-medium border border-[#E3DED2] dark:border-[#2A403A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#173F3A] dark:border-[#EEF2ED] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF]">Loading Map...</span>
        </div>
      </div>
    );
  }

  // Determine standard center
  const activeCenter = sCoord || defaultCoords;

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden shadow-[0_4px_16px_rgba(23,63,58,0.06)] border border-[#E3DED2] dark:border-[#2A403A]">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={activeCenter}
        zoom={5}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* Render polyline route path */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true, // We draw custom Markers A & B to support InfoWindows
              polylineOptions: {
                strokeColor: '#D96C4F', // Terracotta polyline
                strokeWeight: 4,
                strokeOpacity: 0.85
              }
            }}
          />
        )}

        {/* Render fallback geodesic styled line if Directions API was restricted/failed */}
        {isFallbackRoute && sCoord && dCoord && (
          <Polyline
            path={[sCoord, dCoord]}
            options={{
              strokeColor: '#D96C4F', // Terracotta
              strokeWeight: 4,
              strokeOpacity: 0.8,
              geodesic: true,
              icons: [
                {
                  icon: {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: 1,
                    scale: 3,
                    strokeColor: '#D96C4F'
                  },
                  offset: '0',
                  repeat: '15px'
                }
              ]
            }}
          />
        )}

        {/* Custom Source Marker A */}
        {sCoord && (
          <Marker
            position={sCoord}
            label={{
              text: 'A',
              color: '#FFFFFF',
              fontWeight: 'bold'
            }}
            title={`Origin: ${source?.station_name}`}
            onClick={() => setSelectedMarker({ type: 'source', coord: sCoord, data: source })}
          />
        )}

        {/* Custom Destination Marker B */}
        {dCoord && (
          <Marker
            position={dCoord}
            label={{
              text: 'B',
              color: '#FFFFFF',
              fontWeight: 'bold'
            }}
            title={`Destination: ${dest?.station_name}`}
            onClick={() => setSelectedMarker({ type: 'dest', coord: dCoord, data: dest })}
          />
        )}

        {/* Live current location pulse marker */}
        {liveCoord && (
          <Marker
            position={liveCoord}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: '#B94A48', // Red pulse marker for current location
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 1.5
            }}
            title="Your Current Location"
          />
        )}

        {/* Marker Information Windows */}
        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.coord}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-3 text-[#263238] max-w-[220px]">
              <h4 className="font-bold text-base leading-snug">{selectedMarker.data?.station_name || 'Station'}</h4>
              <p className="text-xs text-[#D96C4F] font-bold font-mono uppercase mt-0.5">Code: {selectedMarker.data?.station_code || 'N/A'}</p>
              <div className="border-t border-[#E3DED2] my-2" />
              <p className="text-sm text-[#66736F] font-medium">City: <span className="text-[#263238] font-semibold">{selectedMarker.data?.city || 'India'}</span></p>
              <p className="text-sm text-[#66736F] font-medium">State: <span className="text-[#263238] font-semibold">{selectedMarker.data?.state || 'India'}</span></p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Floating Directions Info overlay if calculated or computed via geodesic fallback */}
      {((directions && !directionsError) || (isFallbackRoute && fallbackData)) && (
        <div className="absolute bottom-4 right-4 z-10 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] px-4 py-3 rounded-xl flex flex-col gap-1 shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
          <span className="text-[10px] font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-widest">
            {isFallbackRoute ? 'Estimated Path (Direct)' : 'Calculated Route'}
          </span>
          <div className="flex items-center gap-4 text-sm font-bold text-[#263238] dark:text-[#F7F5EF] mt-0.5">
            <div>
              Distance:{' '}
              <span className="text-[#173F3A] dark:text-[#EEF2ED] font-mono">
                {isFallbackRoute ? fallbackData.distance : directions.routes[0].legs[0].distance.text}
              </span>
            </div>
            <div className="w-px h-3 bg-[#E3DED2] dark:bg-[#2A403A]" />
            <div>
              Duration:{' '}
              <span className="text-[#173F3A] dark:text-[#EEF2ED] font-mono">
                {isFallbackRoute ? fallbackData.duration : directions.routes[0].legs[0].duration.text}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Routing error notification */}
      {directionsError && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#D96C4F] dark:border-[#D96C4F] px-4 py-3 rounded-xl flex items-center justify-between text-sm text-[#D96C4F] font-bold shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
          <span>⚠️ {directionsError}</span>
          <button onClick={() => setDirectionsError(null)} className="text-[#D96C4F] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] px-2 py-0.5 rounded-lg font-mono transition-colors">✕</button>
        </div>
      )}
    </div>
  );
}
