import { useState, useEffect } from "react"
import { Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { CuisineCategories } from "./CuisineCategories"
import { DiscoverFilters } from "./DiscoverFilters"
import { RestaurantHeroCard } from "./RestaurantHeroCard"

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

interface EnhancedRestaurantSearchProps {
  onSelectRestaurant: (restaurant: Restaurant) => void
  onAddToList?: (restaurant: Restaurant) => void
}

export function EnhancedRestaurantSearch({ onSelectRestaurant, onAddToList }: EnhancedRestaurantSearchProps) {
  const [query, setQuery] = useState("")
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [maxPrice, setMaxPrice] = useState(4)
  const [minRating, setMinRating] = useState(0)
  const [maxDistance, setMaxDistance] = useState(15) // in miles
  const [showFilters, setShowFilters] = useState(false)
  const { toast } = useToast()

  const searchRestaurants = async (searchQuery?: string, category?: string) => {
    const queryToUse = searchQuery ?? query.trim()
    const categoryToUse = category ?? selectedCategory
    
    if (!queryToUse && !categoryToUse) return

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('search-restaurants', {
        body: { 
          query: queryToUse || undefined,
          category: categoryToUse || undefined,
          maxPrice,
          minRating,
          maxDistance
        }
      })

      if (error) throw error

      setRestaurants(data.restaurants || [])
      
      if (data.restaurants?.length === 0) {
        toast({
          title: "No restaurants found",
          description: queryToUse ? "Try a different search term." : "No restaurants found for this cuisine type.",
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
      handleSearch()
    }
  }

  const handleSearch = () => {
    if (!query.trim()) return
    // When searching, clear cuisine filter to search across all cuisines
    setSelectedCategory("")
    searchRestaurants(query.trim(), "")
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    // When selecting a cuisine, clear search query and browse that cuisine
    if (category) {
      setQuery("")
      searchRestaurants("", category)
    } else {
      // If clearing category, also clear results
      setRestaurants([])
    }
  }

  const filteredRestaurants = restaurants.filter(restaurant => {
    if (restaurant.rating && restaurant.rating < minRating) return false
    if (restaurant.price_level && restaurant.price_level > maxPrice) return false
    return true
  })

  const hasActiveFilters = selectedCategory || minRating > 0 || maxPrice < 4 || maxDistance < 15

  const clearFilters = () => {
    setSelectedCategory("")
    setMaxPrice(4)
    setMinRating(0)
    setMaxDistance(15)
  }

  // Auto-search when price/rating/distance filters change (but not cuisine)
  useEffect(() => {
    if (restaurants.length > 0) {
      const timeoutId = setTimeout(() => {
        if (query.trim()) {
          searchRestaurants(query.trim(), "")
        } else if (selectedCategory) {
          searchRestaurants("", selectedCategory)
        }
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [maxPrice, minRating, maxDistance])

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search restaurants, cuisine, or location..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 h-12 text-lg"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading || !query.trim()} size="lg">
            {loading ? "Searching..." : "Search"}
          </Button>
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" size="lg" className="relative">
                <Filter className="h-4 w-4" />
                {hasActiveFilters && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  Filters
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <DiscoverFilters
                  maxPrice={maxPrice}
                  onMaxPriceChange={setMaxPrice}
                  minRating={minRating}
                  onMinRatingChange={setMinRating}
                  maxDistance={maxDistance}
                  onMaxDistanceChange={setMaxDistance}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Cuisine Categories */}
        <CuisineCategories
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Active filters:</span>
            {selectedCategory && <span className="capitalize">{selectedCategory}</span>}
            {minRating > 0 && <span>{minRating}+ stars</span>}
            {maxPrice < 4 && <span>Up to {'$'.repeat(maxPrice)}</span>}
            {maxDistance < 15 && <span>Within {maxDistance} miles</span>}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-1">
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Results Grid */}
      {!loading && filteredRestaurants.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRestaurants.map((restaurant) => (
            <RestaurantHeroCard
              key={restaurant.google_place_id}
              restaurant={restaurant}
              onSelectRestaurant={onSelectRestaurant}
              onAddToList={onAddToList}
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && query && filteredRestaurants.length === 0 && restaurants.length > 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">No restaurants match your filters</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search criteria</p>
          <Button onClick={clearFilters} variant="outline">
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}