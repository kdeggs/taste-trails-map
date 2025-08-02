import { MapPin, Star, Calendar, Camera } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface CheckInDetailsDialogProps {
  checkIn: {
    id: string
    visited_at: string
    notes?: string
    rating?: number
    images?: string[]
    restaurants: {
      id: string
      name: string
      address: string
      image_url?: string
      cuisine_type?: string
    }
    profiles: {
      id: string
      display_name?: string
      avatar_url?: string
    }
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CheckInDetailsDialog({ checkIn, open, onOpenChange }: CheckInDetailsDialogProps) {
  if (!checkIn) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Check-in Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Restaurant Header */}
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {checkIn.restaurants?.image_url ? (
                <img
                  src={checkIn.restaurants.image_url}
                  alt={checkIn.restaurants?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <MapPin className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate">
                {checkIn.restaurants?.name}
              </h3>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">{checkIn.restaurants?.address}</span>
              </div>
              {checkIn.restaurants?.cuisine_type && (
                <Badge variant="secondary" className="mt-2">
                  {checkIn.restaurants.cuisine_type}
                </Badge>
              )}
            </div>
          </div>

          {/* Visit Information */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="font-medium">{formatDate(checkIn.visited_at)}</span>
                <span className="text-muted-foreground ml-2">at {formatTime(checkIn.visited_at)}</span>
              </div>
            </div>

            {/* Rating */}
            {checkIn.rating && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Rating:</span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= checkIn.rating!
                          ? 'fill-secondary text-secondary'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                  <span className="text-sm font-semibold ml-1">{checkIn.rating}/5</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {checkIn.notes && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Notes</h4>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm leading-relaxed">{checkIn.notes}</p>
              </div>
            </div>
          )}

          {/* Photos */}
          {checkIn.images && checkIn.images.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Camera className="h-4 w-4" />
                <h4 className="text-sm font-medium">
                  Photos ({checkIn.images.length})
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {checkIn.images.map((imageUrl, index) => (
                  <div key={index} className="relative">
                    <img
                      src={imageUrl}
                      alt={`Check-in photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visited by */}
          <div className="pt-4 border-t">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Visited by</span>
              <span className="font-medium text-foreground">
                {checkIn.profiles?.display_name || 'You'}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}