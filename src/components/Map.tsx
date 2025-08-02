import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Home } from 'lucide-react';

interface MapProps {
  userId?: string;
}

interface MapLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'checkin' | 'list';
  address?: string;
  rating?: number;
  listName?: string;
  listColor?: string;
}

const DEFAULT_CENTER: [number, number] = [-74.006, 40.7128]; // NYC
const DEFAULT_ZOOM = 12;

const Map: React.FC<MapProps> = ({ userId }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (userId) {
      loadMapData();
    }
  }, [userId]);

  const loadMapData = async () => {
    try {
      // Get check-ins with restaurant data
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select(`
          id,
          rating,
          restaurants(id, name, address, latitude, longitude)
        `)
        .eq('user_id', userId)
        .not('restaurants.latitude', 'is', null)
        .not('restaurants.longitude', 'is', null);

      // Get restaurants from lists
      const { data: listItems } = await supabase
        .from('restaurant_list_items')
        .select(`
          restaurants(id, name, address, latitude, longitude),
          restaurant_lists(name, color_theme, user_id)
        `)
        .eq('restaurant_lists.user_id', userId)
        .not('restaurants.latitude', 'is', null)
        .not('restaurants.longitude', 'is', null);

      const mapLocations: MapLocation[] = [];

      // Add check-ins
      checkIns?.forEach(checkIn => {
        if (checkIn.restaurants) {
          mapLocations.push({
            id: `checkin-${checkIn.id}`,
            name: checkIn.restaurants.name,
            latitude: Number(checkIn.restaurants.latitude),
            longitude: Number(checkIn.restaurants.longitude),
            type: 'checkin',
            address: checkIn.restaurants.address,
            rating: checkIn.rating
          });
        }
      });

      // Add list items (avoid duplicates)
      listItems?.forEach(item => {
        if (item.restaurants && item.restaurant_lists) {
          const existing = mapLocations.find(loc => 
            loc.name === item.restaurants.name && 
            loc.latitude === Number(item.restaurants.latitude) && 
            loc.longitude === Number(item.restaurants.longitude)
          );
          
          if (!existing) {
            mapLocations.push({
              id: `list-${item.restaurants.id}`,
              name: item.restaurants.name,
              latitude: Number(item.restaurants.latitude),
              longitude: Number(item.restaurants.longitude),
              type: 'list',
              address: item.restaurants.address,
              listName: item.restaurant_lists.name,
              listColor: item.restaurant_lists.color_theme
            });
          }
        }
      });

      setLocations(mapLocations);
    } catch (error) {
      console.error('Error loading map data:', error);
    }
  };

  const initializeMap = async () => {
    if (!mapContainer.current || map.current) return;
    
    try {
      // Get Mapbox token from our edge function
      const { data: tokenData, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error || !tokenData?.token) {
        console.error('Failed to get Mapbox token:', error);
        return;
      }

      mapboxgl.accessToken = tokenData.token;
    
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add home button to recenter map
      const homeButton = document.createElement('button');
      homeButton.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
      homeButton.innerHTML = `
        <button 
          class="mapboxgl-ctrl-icon hover:bg-secondary/10 transition-colors" 
          type="button" 
          title="Reset to default view"
          aria-label="Reset map to default view"
        >
          <div style="
            width: 20px; 
            height: 20px; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            font-size: 14px;
          ">🏠</div>
        </button>
      `;
      
      homeButton.addEventListener('click', () => {
        map.current?.easeTo({
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          duration: 1000
        });
      });
      
      map.current.addControl({
        onAdd: () => homeButton,
        onRemove: () => homeButton.remove()
      }, 'top-left');
      
      // Set map as ready
      setMapReady(true);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  useEffect(() => {
    initializeMap();
    
    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || locations.length === 0 || !mapReady) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add markers for each location
    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(location => {
      // Create marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer flex items-center justify-center text-white text-xs font-bold';
      
      if (location.type === 'checkin') {
        markerEl.style.backgroundColor = '#ff6b9d';
        markerEl.innerHTML = '✓';
      } else {
        markerEl.style.backgroundColor = location.listColor || '#6366f1';
        markerEl.innerHTML = '📍';
      }

      // Create popup content
      const popupContent = `
        <div class="p-2">
          <h3 class="font-semibold text-sm">${location.name}</h3>
          ${location.address ? `<p class="text-xs text-gray-600 mt-1">${location.address}</p>` : ''}
          ${location.rating ? `<p class="text-xs mt-1">⭐ ${location.rating}</p>` : ''}
          ${location.listName ? `<p class="text-xs mt-1">📋 ${location.listName}</p>` : ''}
          <p class="text-xs mt-1 font-medium">${location.type === 'checkin' ? 'Check-in' : 'From List'}</p>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(popupContent);

      // Add marker to map
      new mapboxgl.Marker(markerEl)
        .setLngLat([location.longitude, location.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      // Extend bounds
      bounds.extend([location.longitude, location.latitude]);
    });

    // Fit map to markers with appropriate zoom
    if (!bounds.isEmpty()) {
      if (locations.length === 1) {
        // For single location, use a moderate zoom level instead of fitBounds
        map.current.setCenter([locations[0].longitude, locations[0].latitude]);
        map.current.setZoom(14); // Zoomed out a bit more for single pins
      } else {
        // For multiple locations, fit bounds with padding
        map.current.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [locations, mapReady]);

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden bg-muted">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default Map;