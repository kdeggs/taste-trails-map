import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, DollarSign, MapPin } from "lucide-react"

interface DiscoverFiltersProps {
  priceRange: [number, number]
  onPriceRangeChange: (range: [number, number]) => void
  minRating: number
  onMinRatingChange: (rating: number) => void
  maxDistance: number
  onMaxDistanceChange: (distance: number) => void
}

export function DiscoverFilters({
  priceRange,
  onPriceRangeChange,
  minRating,
  onMinRatingChange,
  maxDistance,
  onMaxDistanceChange,
}: DiscoverFiltersProps) {
  const formatPriceLevel = (level: number) => {
    return '$'.repeat(level)
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Range */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Price Range</span>
            </div>
            <Badge variant="outline">
              {formatPriceLevel(priceRange[0])} - {formatPriceLevel(priceRange[1])}
            </Badge>
          </div>
          <Slider
            value={priceRange}
            onValueChange={(value) => onPriceRangeChange([value[0], value[1]])}
            max={4}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$</span>
            <span>$$$$</span>
          </div>
        </div>

        {/* Rating */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Min Rating</span>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" />
              {minRating.toFixed(1)}+
            </Badge>
          </div>
          <Slider
            value={[minRating]}
            onValueChange={(value) => onMinRatingChange(value[0])}
            max={5}
            min={0}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Any</span>
            <span>5★</span>
          </div>
        </div>

        {/* Distance */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Distance</span>
            </div>
            <Badge variant="outline">
              {maxDistance === 50 ? "50+ km" : `${maxDistance} km`}
            </Badge>
          </div>
          <Slider
            value={[maxDistance]}
            onValueChange={(value) => onMaxDistanceChange(value[0])}
            max={50}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1km</span>
            <span>50km+</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}