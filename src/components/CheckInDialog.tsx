import { useState, useEffect } from "react"
import { MapPin, Star, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Restaurant {
  id?: string
  google_place_id?: string
  name: string
  address: string
  latitude?: number
  longitude?: number
  rating?: number
  price_level?: number
  image_url?: string
  cuisine_type?: string
}

interface CheckInDialogProps {
  restaurant: Restaurant | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCheckInComplete: () => void
  editingCheckIn?: {
    id: string
    notes?: string
    rating?: number
    visited_at: string
  } | null
}

export function CheckInDialog({ restaurant, open, onOpenChange, onCheckInComplete, editingCheckIn }: CheckInDialogProps) {
  const [notes, setNotes] = useState("")
  const [rating, setRating] = useState<number | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Reset form when dialog opens/closes or editingCheckIn changes
  useEffect(() => {
    if (open && editingCheckIn) {
      setNotes(editingCheckIn.notes || "")
      setRating(editingCheckIn.rating || null)
      setPhotos([])
    } else if (open && !editingCheckIn) {
      setNotes("")
      setRating(null)
      setPhotos([])
    }
  }, [open, editingCheckIn])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPhotos(prev => [...prev, ...files].slice(0, 5)) // Max 5 photos
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const uploadPhotos = async (restaurantId: string): Promise<string[]> => {
    const uploadedUrls: string[] = []
    
    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${restaurantId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('check-in-photos')
        .upload(filePath, photo)

      if (uploadError) {
        console.error('Photo upload error:', uploadError)
        continue
      }

      const { data } = supabase.storage
        .from('check-in-photos')
        .getPublicUrl(filePath)

      uploadedUrls.push(data.publicUrl)
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurant) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // First, ensure restaurant exists in our database
      let restaurantId = restaurant.id

      if (!restaurantId) {
        // Check if restaurant already exists
        const { data: existingRestaurant } = await supabase
          .from('restaurants')
          .select('id')
          .eq('name', restaurant.name)
          .eq('address', restaurant.address)
          .maybeSingle()

        if (existingRestaurant) {
          restaurantId = existingRestaurant.id
        } else {
          // Create new restaurant
          const { data: newRestaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .insert({
              name: restaurant.name,
              address: restaurant.address,
              latitude: restaurant.latitude,
              longitude: restaurant.longitude,
              cuisine_type: restaurant.cuisine_type,
              image_url: restaurant.image_url,
              price_range: restaurant.price_level
            })
            .select('id')
            .single()

          if (restaurantError) throw restaurantError
          restaurantId = newRestaurant.id
        }
      }

      // Upload photos if any
      const photoUrls = photos.length > 0 ? await uploadPhotos(restaurantId) : null

      if (editingCheckIn) {
        // Update existing check-in
        const { error: updateError } = await supabase
          .from('check_ins')
          .update({
            notes: notes.trim() || null,
            rating,
            ...(photoUrls && { images: photoUrls })
          })
          .eq('id', editingCheckIn.id)

        if (updateError) throw updateError
      } else {
        // Create new check-in
        const { error: checkInError } = await supabase
          .from('check_ins')
          .insert({
            user_id: user.id,
            restaurant_id: restaurantId,
            notes: notes.trim() || null,
            rating,
            images: photoUrls
          })

        if (checkInError) throw checkInError
      }

      toast({
        title: editingCheckIn ? "Check-in updated!" : "Check-in complete!",
        description: editingCheckIn 
          ? `Your visit to ${restaurant.name} has been updated.`
          : `You've checked in to ${restaurant.name}.`,
      })

      // Reset form
      setNotes("")
      setRating(null)
      setPhotos([])
      onOpenChange(false)
      onCheckInComplete()
    } catch (error) {
      console.error('Check-in error:', error)
      toast({
        title: "Check-in failed",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!restaurant) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingCheckIn ? `Edit ${restaurant.name} Check-in` : `Check in to ${restaurant.name}`}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{restaurant.address}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(rating === star ? null : star)}
                    className="p-1"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        rating && star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How was your experience?"
                rows={3}
              />
            </div>

            <div>
              <Label>Photos (optional)</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                  disabled={photos.length >= 5}
                />
                <label
                  htmlFor="photo-upload"
                  className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary/10 transition-colors ${
                    photos.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">
                    {photos.length >= 5 ? 'Maximum 5 photos' : 'Add photos'}
                  </span>
                </label>

                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (editingCheckIn ? "Updating..." : "Checking in...") : (editingCheckIn ? "Update Check-in" : "Check In")}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}