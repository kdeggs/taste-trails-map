import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { query, location } = await req.json()
    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')

    if (!googleApiKey) {
      throw new Error('Google Places API key not configured')
    }

    console.log('Searching for restaurants:', { query, location })

    // Search for restaurants using Google Places API
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    searchUrl.searchParams.set('query', `${query} restaurant`)
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})