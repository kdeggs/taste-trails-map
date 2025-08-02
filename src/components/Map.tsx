import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

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

const Map: React.FC<MapProps> = ({ userId }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [locations, setLocations] = useState<MapLocation[]>([]);

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

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    const mapboxToken = 'pk.eyJ1Ijoia2Q4MzAiLCJhIjoiY21kdXNwM2RwMWwzMjJtcHZ1dnFrNHpoMSJ9.6TZl8vMPqq-Wl7VLhh8a7g';

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-74.006, 40.7128], // NYC default
      zoom: 12
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || locations.length === 0) return;

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

    // Fit map to markers
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [locations]);

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden bg-muted">
      <div className="absolute inset-0 flex items-center justify-center bg-muted/80 text-muted-foreground">
        <div className="text-center p-8">
          <p className="text-lg font-medium mb-2">🗺️ Map Coming Soon!</p>
          <p className="text-sm mb-4">Add your Mapbox API key to see your restaurant locations</p>
          <a 
            href="https://mapbox.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm"
          >
            Get free Mapbox token →
          </a>
        </div>
      </div>
    </div>
  );
};

export default Map;