import { useState } from "react"
import { MapPin, Star, DollarSign, Plus, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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

interface RestaurantHeroCardProps {
  restaurant: Restaurant
  onSelectRestaurant: (restaurant: Restaurant) => void
  onAddToList?: (restaurant: Restaurant) => void
}

export function RestaurantHeroCard({ restaurant, onSelectRestaurant, onAddToList }: RestaurantHeroCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Mock multiple images for carousel (in real app, these would come from the restaurant data)
  const images = restaurant.image_url 
    ? [restaurant.image_url, restaurant.image_url, restaurant.image_url] 
    : []

  const formatPriceLevel = (level?: number) => {
    if (!level) return null
    return '$'.repeat(level)
  }

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="relative">
        {/* Image Carousel */}
        {images.length > 0 && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={images[currentImageIndex]}
              alt={restaurant.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Carousel Controls */}
            {images.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm h-8 w-8"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm h-8 w-8"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                {/* Image Indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        index === currentImageIndex 
                          ? "bg-white" 
                          : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
            
            {/* Rating Badge Overlay */}
            {restaurant.rating && (
              <Badge className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm text-foreground flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                {restaurant.rating.toFixed(1)}
              </Badge>
            )}
          </div>
        )}

        {/* Fallback when no image */}
        {images.length === 0 && (
          <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <span className="text-2xl">🍽️</span>
              </div>
              <p className="text-sm text-muted-foreground">No image available</p>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Restaurant Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg leading-tight">{restaurant.name}</h3>
            {restaurant.price_level && (
              <Badge variant="outline" className="flex items-center gap-1 flex-shrink-0">
                <DollarSign className="h-3 w-3" />
                {formatPriceLevel(restaurant.price_level)}
              </Badge>
            )}
          </div>
          
          {restaurant.address && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{restaurant.address}</span>
            </div>
          )}
          
          {restaurant.cuisine_type && (
            <Badge variant="secondary" className="capitalize w-fit">
              {restaurant.cuisine_type.replace('_', ' ')}
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            onClick={() => onSelectRestaurant(restaurant)}
            className="flex items-center gap-1 flex-1"
          >
            <Check className="h-3 w-3" />
            Check In
          </Button>
          {onAddToList && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onAddToList(restaurant)}
              className="flex items-center gap-1 flex-1"
            >
              <Plus className="h-3 w-3" />
              Add to List
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}