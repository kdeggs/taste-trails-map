import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation functions
function validateSearchQuery(query: string): { isValid: boolean; sanitized: string; error?: string } {
  if (!query || typeof query !== 'string') {
    return { isValid: false, sanitized: '', error: 'Query is required' };
  }

  const trimmed = query.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, sanitized: '', error: 'Query cannot be empty' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, sanitized: '', error: 'Query too long (max 100 characters)' };
  }

  // Remove potentially dangerous characters but keep basic ones for restaurant names
  const sanitized = trimmed.replace(/[<>\"'&]/g, '');
  
  if (sanitized.length === 0) {
    return { isValid: false, sanitized: '', error: 'Query contains invalid characters' };
  }

  return { isValid: true, sanitized };
}

function validateLocation(location: any): { isValid: boolean; error?: string } {
  if (!location) {
    return { isValid: true }; // Location is optional
  }

  if (typeof location !== 'object' || !location.lat || !location.lng) {
    return { isValid: false, error: 'Invalid location format' };
  }

  const lat = Number(location.lat);
  const lng = Number(location.lng);

  if (isNaN(lat) || isNaN(lng)) {
    return { isValid: false, error: 'Location coordinates must be numbers' };
  }

  if (lat < -90 || lat > 90) {
    return { isValid: false, error: 'Latitude must be between -90 and 90' };
  }

  if (lng < -180 || lng > 180) {
    return { isValid: false, error: 'Longitude must be between -180 and 180' };
  }

  return { isValid: true };
}

function createErrorResponse(message: string, status: number = 400): Response {
  console.error('API Error:', message);
  return new Response(
    JSON.stringify({ error: 'Invalid request. Please check your input and try again.' }),
    { 
      status,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const body = await req.json()
    const { query, location } = body
    
    // Validate inputs
    const queryValidation = validateSearchQuery(query)
    if (!queryValidation.isValid) {
      return createErrorResponse(queryValidation.error || 'Invalid query', 400)
    }
    
    const locationValidation = validateLocation(location)
    if (!locationValidation.isValid) {
      return createErrorResponse(locationValidation.error || 'Invalid location', 400)
    }
    
    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!googleApiKey) {
      console.error('Google Places API key not configured')
      return createErrorResponse('Service configuration error', 500)
    }

    console.log('Searching for restaurants:', { 
      query: queryValidation.sanitized, 
      hasLocation: !!location 
    })

    // Search for restaurants using Google Places API with sanitized input
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    searchUrl.searchParams.set('query', `${queryValidation.sanitized} restaurant`)
    if (location) {
      searchUrl.searchParams.set('location', `${location.lat},${location.lng}`)
      searchUrl.searchParams.set('radius', '10000')
    }
    searchUrl.searchParams.set('type', 'restaurant')
    searchUrl.searchParams.set('key', googleApiKey)

    const response = await fetch(searchUrl.toString())
    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`)
    }

    // Process and format the results
    const restaurants = data.results?.map((place: any) => ({
      google_place_id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      latitude: place.geometry?.location?.lat,
      longitude: place.geometry?.location?.lng,
      rating: place.rating,
      price_level: place.price_level,
      image_url: place.photos?.[0] ? 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${googleApiKey}` 
        : null,
      cuisine_type: place.types?.find((type: string) => 
        ['restaurant', 'food', 'meal_takeaway', 'meal_delivery'].includes(type)
      ) || 'restaurant'
    })) || []

    console.log('Found restaurants:', restaurants.length)

    return new Response(
      JSON.stringify({ restaurants }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error searching restaurants:', error)
    return createErrorResponse('An error occurred while searching for restaurants', 500)
  }
})