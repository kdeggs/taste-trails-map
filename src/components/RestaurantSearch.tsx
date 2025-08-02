import { useState } from "react"
import { Search, MapPin, Star, DollarSign, Plus, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Restaurant {
  google_place_id: string
  name: string
  address: string
  latitude?: number
  longitude?: number
  rating?: number
  price_level?: number
  image_url?: string
  cuisine_type?: string
}

interface RestaurantSearchProps {
  onSelectRestaurant: (restaurant: Restaurant) => void
  onAddToList?: (restaurant: Restaurant) => void
}

export function RestaurantSearch({ onSelectRestaurant, onAddToList }: RestaurantSearchProps) {
  const [query, setQuery] = useState("")
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const searchRestaurants = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('search-restaurants', {
        body: { query: query.trim() }
      })

      if (error) throw error

      setRestaurants(data.restaurants || [])
      
      if (data.restaurants?.length === 0) {
        toast({
          title: "No restaurants found",
          description: "Try a different search term or location.",
        })
      }
    } catch (error) {
      console.error('Search error:', error)
      toast({
        title: "Search failed",
        description: "Unable to search restaurants. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchRestaurants()
    }
  }

  const formatPriceLevel = (level?: number) => {
    if (!level) return null
    return '$'.repeat(level)
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search restaurants..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={searchRestaurants} disabled={loading || !query.trim()}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      <div className="grid gap-4">
        {restaurants.map((restaurant) => (
          <Card key={restaurant.google_place_id} className="hover:bg-accent/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {restaurant.image_url && (
                  <img
                    src={restaurant.image_url}
                    alt={restaurant.name}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg truncate">{restaurant.name}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {restaurant.rating && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          {restaurant.rating.toFixed(1)}
                        </Badge>
                      )}
                      {restaurant.price_level && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatPriceLevel(restaurant.price_level)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {restaurant.address && (
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{restaurant.address}</span>
                    </div>
                  )}
                  
                  {restaurant.cuisine_type && (
                    <Badge variant="outline" className="mt-2 capitalize">
                      {restaurant.cuisine_type.replace('_', ' ')}
                    </Badge>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      onClick={() => onSelectRestaurant(restaurant)}
                      className="flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Check In
                    </Button>
                    {onAddToList && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onAddToList(restaurant)}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add to List
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}